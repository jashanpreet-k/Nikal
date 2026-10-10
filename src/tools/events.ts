import { z } from 'zod';
import { createTool } from '@mastra/core/tools';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request } from 'node:https';
import { CITY, configuration, configuredEventQuery } from '../config.js';
import { Events, Event, clean } from '../domain.js';
import { HttpClient, HttpError, type HttpSource } from '../http.js';

type SerpApiErrorCategory = 'authentication' | 'quota' | 'invalid parameters' | 'network/timeout' | 'malformed response';
class SerpApiFailure extends Error {
  constructor(readonly category: SerpApiErrorCategory, readonly status: number | null = null) {
    super(`SerpApi: HTTP ${status ?? 'unavailable'}; category: ${category}.`);
  }
}

// Preserve only a status and an allowlisted category, never an error cause,
// provider message, URL, headers or credentials. HTTP errors don't read the body.
function sanitizedSerpApiFailure(error: unknown, status: number | null = null): SerpApiFailure {
  if (error instanceof HttpError) status = error.status;
  if (status === 401 || status === 403) return new SerpApiFailure('authentication', status);
  if (status === 402 || status === 429) return new SerpApiFailure('quota', status);
  if (status === 400 || status === 422) return new SerpApiFailure('invalid parameters', status);
  if (status !== null && status >= 500) return new SerpApiFailure('network/timeout', status);
  if (error instanceof SerpApiFailure) return new SerpApiFailure(error.category, status ?? error.status);
  if (error instanceof Error && /^NIKAL_EVENT_QUERY must /.test(error.message)) return new SerpApiFailure('invalid parameters', status);
  if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) return new SerpApiFailure('network/timeout', status);
  return new SerpApiFailure(status !== null || error instanceof z.ZodError ? 'malformed response' : 'network/timeout', status);
}

export function serpApiDiagnostic(error: unknown): string {
  return sanitizedSerpApiFailure(error).message;
}

function providerErrorCategory(message: string, key: string): SerpApiErrorCategory {
  // Inspect a bounded message internally. Remove credentials/URLs first so a
  // echoed key cannot determine the category. Never return the provider text.
  const safe = message.split(key).join('').split(encodeURIComponent(key)).join('').slice(0, 2000)
    .replace(/https?:\/\/\S+/gi, '');
  if (/api[_ -]?key|authenticat|unauthori[sz]ed|access denied/i.test(safe)) return 'authentication';
  if (/quota|credit|searches|rate limit|exhaust|subscription/i.test(safe)) return 'quota';
  if (/parameter|unsupported|missing|invalid|engine|location/i.test(safe)) return 'invalid parameters';
  if (/timeout|timed out|unavailable|internal server/i.test(safe)) return 'network/timeout';
  return 'malformed response';
}

const SearchResponse = z.object({
  error: z.string().optional(),
  search_metadata: z.object({ status: z.string().optional() }).optional(),
  events_results: z.array(z.object({ title: z.string(), link: z.string().optional(),
    ticket_info: z.array(z.object({ link: z.string(), source: z.string().optional() })).optional(),
  })).optional(),
  // Each organic item is validated separately so a malformed item cannot hide
  // other valid leads. Snippets are relevance hints, never event/date evidence.
  organic_results: z.array(z.unknown()).optional(),
});
const OrganicResult = z.object({ title: z.string(), link: z.string(), snippet: z.string().optional() });
const OUTDOOR_ACTIVITY = /\b(outdoor|open.air|walk|walking|run|running|marathon|street market|farmers market|park)\b/i;
export function publicIPv4(address: string): boolean {
  const octets = address.split('.').map(Number);
  const a = octets[0]!, b = octets[1]!;
  return isIP(address) === 4 && !(
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && [0, 168].includes(b)) || (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && [18, 19, 51].includes(b)) || (a === 203 && b === 0)
  );
}
export function sourceURL(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || isIP(url.hostname) || !url.hostname.includes('.') || /(^|\.)(localhost|local|internal|test|invalid)$/.test(url.hostname)) {
    throw new Error('Event source is not a public HTTPS hostname');
  }
  return url;
}

// Search URLs are untrusted. Pin a public DNS result, refuse redirects, and cap response size.
export async function fetchSource(value: string): Promise<string> {
  const url = sourceURL(value);
  const addresses = await Promise.race([
    lookup(url.hostname, { family: 4, all: true }),
    new Promise<never>((_, reject) => { const timer = setTimeout(() => reject(new Error('Source DNS timeout')), 5000); timer.unref(); }),
  ]);
  if (!addresses.length || addresses.some(item => !publicIPv4(item.address))) throw new Error('Event source resolves to a non-public address');
  return new Promise((resolve, reject) => {
    const req = request(url, { agent: false, family: 4, signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Nikal/0.1 event-verification', Accept: 'text/html' },
      lookup: (_host, _options, callback) => callback(null, addresses[0]!.address, 4),
    }, response => {
      if (response.statusCode !== 200 || !response.headers['content-type']?.includes('text/html')) { response.resume(); reject(new Error('Event source unavailable')); return; }
      let size = 0; const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > 1024 * 1024) req.destroy(new Error('Event source too large'));
        else chunks.push(chunk);
      });
      response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      response.on('error', reject);
    });
    req.on('error', reject); req.end();
  });
}

function objects(value: unknown, depth = 0): Record<string, unknown>[] {
  if (depth > 8 || value === null || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.slice(0, 100).flatMap(item => objects(item, depth + 1));
  const object = value as Record<string, unknown>;
  return [object, ...Object.values(object).flatMap(item => objects(item, depth + 1))];
}
function addressText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const object = value as Record<string, unknown>;
  return [object.name, object.streetAddress, object.addressLocality, object.addressRegion, addressText(object.address)].filter(value => typeof value === 'string').join(' ');
}
export function weekEnd(now: number): number {
  const local = new Date(now + 19800000);
  const days = (7 - local.getUTCDay()) % 7;
  local.setUTCDate(local.getUTCDate() + days + 1);
  local.setUTCHours(0, 0, 0, 0);
  return local.getTime() - 19800000;
}
export function verifyEventPage(html: string, source: string, leadTitle: string, now: number): Event | null {
  sourceURL(source);
  const scripts = [...html.matchAll(/<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const today = new Date(now + 19800000).toISOString().slice(0, 10);
  for (const script of scripts.slice(0, 12)) {
    let data: unknown;
    try { data = JSON.parse(script[1]!); } catch { continue; }
    for (const event of objects(data)) {
      const types = Array.isArray(event['@type']) ? event['@type'] : [event['@type']];
      if (!types.some(type => typeof type === 'string' && /(^|\/)Event$/.test(type))) continue;
      if (typeof event.name !== 'string' || typeof event.startDate !== 'string') continue;
      const name = clean(event.name, 140);
      // A source must corroborate the search lead; don't accept unrelated page events.
      const words = clean(leadTitle, 140).toLowerCase().split(/\W+/).filter(word => word.length > 2);
      if (!words.length || words.filter(word => name.toLowerCase().includes(word)).length / words.length < 0.6) continue;
      if (!OUTDOOR_ACTIVITY.test(name)) continue;
      const location = clean(addressText(event.location), 180);
      if (!/\bgwalior\b/i.test(location)) continue;
      if (String(event.eventStatus || '').match(/EventCancelled|EventPostponed/) || String(event.eventAttendanceMode || '').includes('OnlineEventAttendanceMode')) continue;
      const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(event.startDate);
      if (!dateOnly && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(event.startDate)) continue;
      const instant = Date.parse(dateOnly ? `${event.startDate}T00:00:00+05:30` : event.startDate);
      if (!Number.isFinite(instant) || new Date(instant + 19800000).toISOString().slice(0, 10) !== event.startDate.slice(0, 10)) continue;
      if ((dateOnly ? event.startDate < today : instant < now) || instant >= weekEnd(now)) continue;
      return { title: name, startDate: event.startDate, location, source, checkedAt: now };
    }
  }
  return null;
}

export async function queryEvents(now: number, http: HttpClient, key: string, fresh = false, query = configuredEventQuery()) {
  if (!key.trim()) throw new Error('SerpApi key absent');
  query = configuredEventQuery(query);
  // SerpApi deprecated google_events; its documented replacement exposes
  // events_results on ordinary Google searches. htichips belongs to the retired
  // engine. Keep week intent in q and enforce actual event dates on source pages.
  const parameters = { engine: 'google', q: query, location: CITY, gl: 'in', hl: 'en', api_key: key };
  const url = new URL('https://serpapi.com/search.json'); url.search = new URLSearchParams(parameters).toString();
  let source: HttpSource | undefined;
  const search = await http.json('SerpApi', url.toString(), {
      ttl: fresh ? 0 : 6 * 3600000, skipCache: fresh, retries: 0, timeout: 15000,
      report: value => { source = value; },
      sanitizeError: sanitizedSerpApiFailure,
      cacheKey: `events:google:${query}:${CITY}:${new Date(now + 19800000).toISOString().slice(0, 10)}`,
      validate: value => {
        const result = SearchResponse.parse(value);
        if (result.error) throw new SerpApiFailure(providerErrorCategory(result.error, key));
        if (!result.events_results && result.search_metadata?.status !== 'Success') throw new Error('Invalid SerpApi search response');
        return result;
      },
    });
  return { search, source };
}

export async function findEvents(now = Date.now(), http = new HttpClient(), key = configuration().serpapiKey, getPage = fetchSource): Promise<Events> {
  if (!key.trim()) return { events: [], leads: [], searchProvenance: 'skipped', warnings: ['SerpApi key absent; event search skipped.'] };
  try {
    const { search, source } = await queryEvents(now, http, key);
    const leads: Events['leads'] = [];
    const seen = new Set<string>();
    const addLead = (rawTitle: string, link: string | undefined) => {
      if (leads.length >= 3 || !link) return;
      const title = clean(rawTitle, 140);
      if (!title) return;
      try {
        const source = sourceURL(link).toString();
        if (!seen.has(source)) { seen.add(source); leads.push({ title, source }); }
      } catch { /* Link outside display policy; no event corroboration implied. */ }
    };
    // Prefer structured event-module leads, then fill the same three-source cap
    // from relevant organic results. Neither kind is an event without corroboration.
    for (const lead of (search.events_results || []).slice(0, 3)) addLead(lead.title, lead.link || lead.ticket_info?.[0]?.link);
    for (const raw of search.organic_results || []) {
      if (leads.length >= 3) break;
      const result = OrganicResult.safeParse(raw);
      if (!result.success) continue;
      const title = clean(result.data.title, 140);
      const relevance = `${title} ${clean(result.data.snippet, 500)}`;
      if (!/\bgwalior\b/i.test(relevance) || !OUTDOOR_ACTIVITY.test(relevance)) continue;
      addLead(title, result.data.link);
    }
    const events: Event[] = [];
    // At most one SerpApi call and three page fetches. Verified pages cached for one hour.
    for (const lead of leads) {
      try {
        let cachedVerification = false;
        const event = await http.cached(`verified-event:${lead.source}:${todayKey(now)}`, 3600000,
          async () => verifyEventPage(await getPage(lead.source), lead.source, lead.title, now), value => Event.nullable().parse(value), fromCache => { cachedVerification = fromCache; });
        // A cache may outlive an event's start time. Recheck it against this run.
        if (event && (/^\d{4}-\d{2}-\d{2}$/.test(event.startDate) ? event.startDate >= todayKey(now) : Date.parse(event.startDate) >= now) && Date.parse(event.startDate) < weekEnd(now)) events.push({ ...event, cachedVerification });
      } catch { /* Unverifiable sources remain leads, never confirmed events. */ }
    }
    return { events, leads, searchProvenance: source?.fromCache ? 'cache' : 'live', warnings: events.length ? []
      : leads.length ? ['Search leads could not be confirmed on dated source pages.']
        : ['No relevant search leads with valid titles and public HTTPS sources found.'] };
  } catch (error) { return { events: [], leads: [], searchProvenance: 'failed', warnings: [serpApiDiagnostic(error)] }; }
}
function todayKey(now: number) { return new Date(now + 19800000).toISOString().slice(0, 10); }

export const eventsTool = createTool({
  id: 'find-events', description: 'Search city-level Gwalior outdoor events this week with SerpApi, then conservatively verify dated JSON-LD Event records on source pages. Search snippets are only leads.',
  inputSchema: z.object({ now: z.number().optional() }), outputSchema: Events,
  execute: async ({ now }) => findEvents(now),
});
