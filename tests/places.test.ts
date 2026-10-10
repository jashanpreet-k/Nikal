import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { HttpClient } from '../src/http.js';
import { findPlaces, OVERPASS_ENDPOINTS } from '../src/tools/places.js';
import { CITY_CENTRE } from '../src/config.js';
import { Preferences, type Context } from '../src/domain.js';
import { formatCard } from '../src/card.js';

// All responses and curated entries here are synthetic test inputs, not real places.
const response = { elements: [{ type: 'node', id: 1, ...CITY_CENTRE, tags: { name: 'Synthetic Test Park', leisure: 'park' } }] };
const now = Date.parse('2026-10-10T18:30:00+05:30');
const backoff = async () => {};
const profile = () => mkdtempSync(join(tmpdir(), 'nikal-places-test-'));
const card = (places: Context['places']) => formatCard({ fixture: false, noModel: true, now, preferences: Preferences.parse({}), start: CITY_CENTRE,
  locationLabel: 'Development coordinates', mode: 'no-window', decision: null, places });

test('live places are dated, cached and the next fresh-cache result is explicitly labeled', async () => {
  const directory = profile(); let calls = 0;
  const http = new HttpClient(directory, async () => { calls++; return Response.json(response); });
  const live = await findPlaces(CITY_CENTRE, 3, http, { now, backoff });
  assert.equal(live.provenance, 'live'); assert.equal(live.fetchedAt, now); assert.equal(calls, 1);
  assert.equal(readdirSync(join(directory, 'places')).length, 1);
  const cached = await findPlaces(CITY_CENTRE, 3, http, { now: now + 1000, backoff });
  assert.equal(cached.provenance, 'cache'); assert.equal(cached.fetchedAt, now); assert.equal(calls, 1);
  assert.match(card(cached), /Places from cache, fetched 10 Oct 2026/);
});

test('each alternate can recover from earlier mirror failures with a bounded backoff budget', async () => {
  for (const successful of [1, 2]) {
    let calls = 0; const pauses: number[] = [];
    const http = new HttpClient(profile(), async (input, init) => {
      assert.equal(String(input), OVERPASS_ENDPOINTS[calls]); assert.equal(init?.method, 'POST'); assert(init?.signal);
      return calls++ === successful ? Response.json(response) : new Response('', { status: 504 });
    });
    const result = await findPlaces(CITY_CENTRE, 3, http, { now, backoff: async ms => { pauses.push(ms); } });
    assert.equal(result.provenance, 'live'); assert.equal(calls, successful + 1);
    assert.deepEqual(pauses, successful === 1 ? [250] : [250, 500]);
  }
});

test('all mirror failures can use an expired matching cache, keeping its original date and warning', async () => {
  const directory = profile();
  await findPlaces(CITY_CENTRE, 3, new HttpClient(directory, async () => Response.json(response)), { now, backoff });
  let calls = 0;
  const unavailable = new HttpClient(directory, async () => { calls++; return new Response('', { status: 500 }); });
  const cached = await findPlaces(CITY_CENTRE, 3, unavailable, { now: now + 2 * 86400000, backoff });
  assert.equal(calls, 3); assert.equal(cached.provenance, 'cache'); assert.equal(cached.fetchedAt, now);
  assert.match(cached.warnings.join(' '), /outdated/); assert.match(card(cached), /Places from cache, fetched/);
  const otherStart = await findPlaces({ lat: 27, lon: 79 }, 3, unavailable, { now: now + 2 * 86400000, backoff });
  assert.equal(otherStart.provenance, 'unavailable'); assert.equal(otherStart.places.length, 0);
});

test('no cache uses only the explicitly supplied user-verified curated file and labels the fallback', async () => {
  const directory = profile(); const curatedFile = join(directory, 'curated.json');
  writeFileSync(curatedFile, JSON.stringify({ _comment: 'Synthetic test fixture only', places: [
    { id: 'curated/test', name: 'Synthetic Curated Park', kind: 'park', ...CITY_CENTRE, source: 'https://example.org/test', verifiedAt: '2026-10-09' },
    { id: 'curated/outside', name: 'Synthetic Distant Park', kind: 'park', lat: 28, lon: 79, source: 'https://example.org/test', verifiedAt: '2026-10-09' },
  ] }));
  const http = new HttpClient(directory, async () => new Response('', { status: 504 }));
  const result = await findPlaces(CITY_CENTRE, 3, http, { now, curatedFile, backoff });
  assert.equal(result.provenance, 'curated'); assert.equal(result.places.length, 1); assert.equal(result.places[0]!.distanceKm, 0);
  assert.match(card(result), /curated fallback/);
});

test('empty or malformed curated input and corrupt cache never invent places', async () => {
  for (const contents of [JSON.stringify({ _comment: 'Empty fixture', places: [] }), '{invalid json', JSON.stringify({ places: [{ name: 'Incomplete' }] })]) {
    const directory = profile(); const curatedFile = join(directory, 'curated.json'); writeFileSync(curatedFile, contents);
    const http = new HttpClient(directory, async () => new Response('', { status: 504 }));
    const result = await findPlaces(CITY_CENTRE, 3, http, { now, curatedFile, backoff });
    assert.equal(result.provenance, 'unavailable'); assert.equal(result.places.length, 0);
    assert.match(card(result), /Places unavailable/);
  }
  const directory = profile(); const live = new HttpClient(directory, async () => Response.json(response));
  await findPlaces(CITY_CENTRE, 3, live, { now, backoff });
  writeFileSync(join(directory, 'places', readdirSync(join(directory, 'places'))[0]!), '{invalid');
  const result = await findPlaces(CITY_CENTRE, 3, new HttpClient(directory, async () => new Response('', { status: 500 })), { now, backoff });
  assert.equal(result.provenance, 'unavailable'); assert.equal(result.places.length, 0);
});
