import test from 'node:test';
import assert from 'node:assert/strict';
import { Preferences } from '../src/domain.js';
import { CITY_CENTRE } from '../src/config.js';
import { fixtureConditions, fixturePlaces, FIXTURE_NOW } from '../src/fixtures.js';
import { candidates, fallback, validateDecision } from '../src/recommendation.js';
import { distanceKm, findPlaces, parsePlaces } from '../src/tools/places.js';
import { HttpClient } from '../src/http.js';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('heat and period preferences change the candidate set and fallback time', () => {
  const defaults = Preferences.parse({});
  const before = candidates(fixtureConditions().hours, defaults, FIXTURE_NOW);
  const prefs = Preferences.parse({ maxTemp: 30, period: 'morning' });
  const after = candidates(fixtureConditions().hours, prefs, FIXTURE_NOW);
  assert.equal(before.length, 3);
  assert.equal(after.length, 2);
  assert.notEqual(fallback(before, []).timeId, fallback(after, []).timeId);
  assert.equal(candidates(fixtureConditions().hours, Preferences.parse({ maxTemp: 20 }), FIXTURE_NOW).length, 0);
});

test('candidate validation rejects invented IDs, numbers and misleading explanation codes', () => {
  const prefs = Preferences.parse({});
  const times = candidates(fixtureConditions().hours, prefs, FIXTURE_NOW);
  const places = fixturePlaces(CITY_CENTRE, prefs).places;
  assert.throws(() => validateDecision({ timeId: 'invented', placeId: places[0]!.id, reason: 'balanced' }, times, places, prefs));
  assert.throws(() => validateDecision({ timeId: times[0]!.id, placeId: 'invented', reason: 'balanced' }, times, places, prefs));
  assert.throws(() => validateDecision({ ...fallback(times, places), aqi: 10 }, times, places, prefs));
  assert.throws(() => validateDecision({ timeId: times.at(-1)!.id, placeId: places[0]!.id, reason: 'cooler' }, times, places, prefs));
  assert.throws(() => validateDecision({ timeId: times[0]!.id, placeId: null, reason: 'balanced' }, times, places, prefs));
  assert.equal(validateDecision({ timeId: times[0]!.id, placeId: places[1]!.id, reason: 'cooler' }, times, places, prefs).placeId, places[1]!.id);
});

test('OSM filters private access and radius while preserving straight-line distances', () => {
  const data = { elements: [
    { type: 'node', id: 1, lat: CITY_CENTRE.lat, lon: CITY_CENTRE.lon, tags: { leisure: 'park', name: 'Park' } },
    { type: 'way', id: 2, center: CITY_CENTRE, tags: { leisure: 'garden', access: 'private' } },
    { type: 'node', id: 3, lat: 28, lon: 79, tags: { leisure: 'park' } },
  ] };
  const result = parsePlaces(data, CITY_CENTRE, 3);
  assert.equal(result.places.length, 1);
  assert.equal(result.places[0]!.distanceKm, 0);
  assert.equal(distanceKm(CITY_CENTRE, CITY_CENTRE), 0);
  assert.throws(() => parsePlaces({ ...data, remark: 'timeout' }, CITY_CENTRE, 3));
});

test('Overpass failure tries two alternates then degrades gracefully', async () => {
  const endpoints: string[] = [];
  const http = new HttpClient(mkdtempSync(join(tmpdir(), 'nikal-overpass-test-')), async input => {
    endpoints.push(String(input)); return new Response('', { status: 504 });
  });
  const result = await findPlaces(CITY_CENTRE, 3, http, { backoff: async () => {} });
  assert.equal(endpoints.length, 3);
  assert.match(endpoints[1]!, /private\.coffee/);
  assert.deepEqual(result.places, []);
  assert.match(result.warnings.join(' '), /HTTP 504/);
});

test('nearby path segments cannot crowd green spaces out of the bounded candidate list', () => {
  const paths = Array.from({ length: 20 }, (_, index) => ({ type: 'way', id: index + 1,
    center: { lat: CITY_CENTRE.lat + index * 0.0001, lon: CITY_CENTRE.lon }, tags: { highway: 'path', name: `Path ${index}` } }));
  const result = parsePlaces({ elements: [...paths, { type: 'node', id: 30, lat: CITY_CENTRE.lat + 0.015, lon: CITY_CENTRE.lon, tags: { leisure: 'park', name: 'Green space' } }] }, CITY_CENTRE, 3);
  assert.equal(result.places[0]!.name, 'Green space');
  assert.equal(result.places.length, 12);
});
