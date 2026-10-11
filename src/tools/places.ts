import { z } from 'zod';
import { createTool } from '@mastra/core/tools';
import { Coordinates, Place, Places, clean } from '../domain.js';
import { HttpClient } from '../http.js';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';

// Global-coverage public instances listed in the OpenStreetMap Overpass API wiki.
export const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
] as const;

const OverpassResponse = z.object({ elements: z.array(z.object({
  type: z.enum(['node', 'way', 'relation']), id: z.number(), lat: z.number().optional(), lon: z.number().optional(),
  center: Coordinates.optional().or(z.object({ lat: z.number(), lon: z.number() })),
  tags: z.record(z.string(), z.string()).optional(),
})), remark: z.string().optional() });

export function distanceKm(a: z.infer<typeof Coordinates>, b: z.infer<typeof Coordinates>): number {
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(b.lat - a.lat), dLon = radians(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

export function parsePlaces(raw: unknown, start: z.infer<typeof Coordinates>, radiusKm: number): z.infer<typeof Places> {
  const data = OverpassResponse.parse(raw);
  // A remark can indicate a query timeout with partial data, so don't treat it as complete.
  if (data.remark) throw new Error('Overpass returned an incomplete query');
  const places: Place[] = [];
  for (const item of data.elements) {
    const tags = item.tags || {};
    if (['private', 'no'].includes(tags.access || '') || ['private', 'no'].includes(tags.foot || '')) continue;
    const point = item.center || (item.lat !== undefined && item.lon !== undefined ? { lat: item.lat, lon: item.lon } : null);
    if (!point || !Coordinates.safeParse(point).success) continue;
    const kind = tags.leisure === 'park' ? 'park' : tags.leisure === 'garden' ? 'garden' : ['footway', 'path', 'pedestrian'].includes(tags.highway || '') ? 'path' : null;
    if (!kind) continue;
    if (kind === 'path' && (['motorway', 'trunk'].includes(tags.highway || '') || tags.tunnel === 'yes' || tags.lit === 'no')) continue;
    const distance = distanceKm(start, point);
    if (distance > radiusKm) continue;
    places.push({ id: `${item.type}/${item.id}`, name: clean(tags['name:en'] || tags.name || `Unnamed ${kind}`), kind,
      ...point, distanceKm: distance, source: `https://www.openstreetmap.org/${item.type}/${item.id}` });
  }
  const seen = new Set<string>();
  // A cluster of path segments must not crowd every park/garden out of the model's
  // bounded candidate list. Distance remains exact to the mapped point in each class.
  return { places: places.sort((a, b) => Number(a.kind === 'path') - Number(b.kind === 'path') || a.distanceKm - b.distanceKm).filter(place => {
    const key = `${place.name}:${place.lat.toFixed(3)}:${place.lon.toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, 12), warnings: [] };
}

const CachedPlaces = z.object({ fetchedAt: z.number().finite().positive(), response: OverpassResponse });
const CuratedPlaces = z.object({ places: z.array(Coordinates.extend({
  id: z.string().regex(/^curated\/[a-zA-Z0-9_-]+$/), name: z.string().min(1).max(100), kind: z.enum(['park', 'garden']),
  source: z.url().refine(value => { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password; }),
  verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})) });
type PlaceOptions = { now?: number; curatedFile?: string | URL; backoff?: (ms: number) => Promise<void> };

export async function findPlaces(start: z.infer<typeof Coordinates>, radiusKm: number, http = new HttpClient(), options: PlaceOptions = {}): Promise<z.infer<typeof Places>> {
  Coordinates.parse(start);
  z.number().min(0.1).max(3).parse(radiusKm);
  const now = options.now ?? Date.now();
  const radius = Math.round(radiusKm * 1000);
  const around = `(around:${radius},${start.lat},${start.lon})`;
  const query = `[out:json][timeout:5];(nwr[leisure~"^(park|garden)$"]${around};way[highway~"^(footway|path|pedestrian)$"]${around};);out center tags;`;
  const cacheDir = join(http.directory, 'places');
  const cachePath = join(cacheDir, `${createHash('sha256').update(JSON.stringify({ start, radiusKm })).digest('hex')}.json`);
  let cached: z.infer<typeof CachedPlaces> | undefined;
  try {
    const value = CachedPlaces.parse(JSON.parse(await readFile(cachePath, 'utf8')));
    parsePlaces(value.response, start, radiusKm);
    if (value.fetchedAt <= now) cached = value;
  } catch { /* Missing or corrupt cache cannot produce places. */ }
  const cachedResult = () => ({ ...parsePlaces(cached!.response, start, radiusKm), provenance: 'cache' as const, fetchedAt: cached!.fetchedAt });
  if (cached && now - cached.fetchedAt < 24 * 3600000) return cachedResult();

  const failures: string[] = [];
  const backoff = options.backoff ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  // Three total attempts: one per mirror, with no hidden per-host retries. The client
  // timeout was 8 s until the primary mirror was measured answering HTTP 200 in 5.7–8.4 s.
  for (const [index, endpoint] of OVERPASS_ENDPOINTS.entries()) {
    if (index > 0) await backoff(250 * index);
    try {
      const response = await http.json('OpenStreetMap Overpass', endpoint, {
        ttl: 0, skipCache: true, timeout: 15000, retries: 0,
        init: { method: 'POST', body: new URLSearchParams({ data: query }), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
        validate: value => { parsePlaces(value, start, radiusKm); return OverpassResponse.parse(value); },
      });
      const fetchedAt = options.now ?? Date.now();
      const result = { ...parsePlaces(response, start, radiusKm), provenance: 'live' as const, fetchedAt };
      try {
        await mkdir(cacheDir, { recursive: true, mode: 0o700 });
        const temporary = `${cachePath}.${randomUUID()}.tmp`;
        await writeFile(temporary, JSON.stringify({ fetchedAt, response }), { mode: 0o600 });
        await rename(temporary, cachePath);
      } catch { result.warnings.push('Live places fetched; dated local cache could not be saved.'); }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Places unavailable';
      failures.push(`${new URL(endpoint).hostname}: ${message}`);
    }
  }
  if (cached) return { ...cachedResult(), warnings: ['All Overpass mirrors failed; cached places may be outdated.', ...failures] };
  try {
    const curated = CuratedPlaces.parse(JSON.parse(await readFile(options.curatedFile ?? new URL('../../data/curated-places.json', import.meta.url), 'utf8')));
    const places = curated.places.filter(place => {
      const verified = Date.parse(`${place.verifiedAt}T00:00:00+05:30`);
      return Number.isFinite(verified) && verified <= now && new Date(verified + 19800000).toISOString().slice(0, 10) === place.verifiedAt;
    }).map(({ verifiedAt: _verifiedAt, ...place }) => ({ ...place, name: clean(place.name), distanceKm: distanceKm(start, place) }))
      .filter(place => place.distanceKm <= radiusKm).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 12);
    if (places.length) return { places, provenance: 'curated', warnings: ['Curated fallback: user-verified list; not live Overpass data.', ...failures] };
  } catch { /* Invalid/missing curated input is unavailable, never invented. */ }
  return { places: [], provenance: 'unavailable', warnings: ['Places unavailable: no usable cache or user-verified curated places.', ...failures] };
}

export const placesTool = createTool({
  id: 'find-places', description: 'Find mapped parks, gardens and paths within up to 3 km. Distances are straight-line estimates; access, hours and safety are not verified.',
  inputSchema: Coordinates.extend({ radiusKm: z.number().min(0.1).max(3) }), outputSchema: Places,
  execute: async ({ lat, lon, radiusKm }) => findPlaces({ lat, lon }, radiusKm),
});
