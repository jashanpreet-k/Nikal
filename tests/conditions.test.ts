import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AirResponse, WeatherResponse, fetchConditions, joinConditions } from '../src/tools/conditions.js';
import { HttpClient } from '../src/http.js';
import { candidates } from '../src/recommendation.js';
import { Preferences, displayTime } from '../src/domain.js';

const now = Date.parse('2026-10-10T23:30:00+05:30');
const at = (iso: string) => Date.parse(iso) / 1000;
const weather = WeatherResponse.parse({
  hourly: { time: [at('2026-10-11T00:00:00+05:30'), at('2026-10-11T07:00:00+05:30')], temperature_2m: [28, 29], precipitation_probability: [5, 10], uv_index: [0, 1] },
  daily: { time: [at('2026-10-10T00:00:00+05:30'), at('2026-10-11T00:00:00+05:30')], sunrise: [at('2026-10-10T06:15:00+05:30'), at('2026-10-11T06:16:00+05:30')], sunset: [at('2026-10-10T18:00:00+05:30'), at('2026-10-11T17:59:00+05:30')] },
});

test('join by UTC timestamp across IST midnight despite reordered air readings', () => {
  const air = AirResponse.parse({ hourly: { time: [...weather.hourly.time].reverse(), us_aqi: [60, 90], pm2_5: [12, 30] } });
  const result = joinConditions(weather, air, now);
  assert.equal(result[0]!.aqi, 90);
  assert.equal(result[1]!.aqi, 60);
  assert.equal(result[1]!.sunset, Date.parse('2026-10-11T17:59:00+05:30'));
  assert.equal(displayTime(result[1]!.time), '7:00 AM');
  assert.deepEqual(candidates(result, Preferences.parse({}), now).map(hour => hour.id), [String(weather.hourly.time[1])]);
});

test('missing/null air readings stay null and cannot pass comfort filters', () => {
  const air = AirResponse.parse({ hourly: { time: [weather.hourly.time[0]], us_aqi: [null], pm2_5: [null] } });
  const result = joinConditions(weather, air, now);
  assert.equal(result[1]!.aqi, null);
  assert.equal(candidates(result, Preferences.parse({}), now).length, 0);
});

test('timestamp join retains the entire tomorrow forecast beyond the old 12-hour horizon', () => {
  const evening = Date.parse('2026-10-10T18:30:00+05:30');
  const air = AirResponse.parse({ hourly: { time: weather.hourly.time, us_aqi: [90, 60], pm2_5: [30, 12] } });
  const result = joinConditions(weather, air, evening);
  assert.equal(result.length, 2);
  assert(result[1]!.time > evening + 12 * 3600000);
  assert.equal(result[1]!.aqi, 60);
});

test('forecast HTTP failure cannot produce weather or candidates, and retries are bounded', async () => {
  let calls = 0;
  const directory = await mkdtemp(join(tmpdir(), 'nikal-http-failure-'));
  const http = new HttpClient(directory, async () => { calls++; return new Response('', { status: 503 }); });
  const result = await fetchConditions({ lat: 26.2183, lon: 78.1828 }, now, http);
  assert.equal(result.hours.length, 0);
  assert.match(result.error!, /HTTP 503/);
  await new Promise(resolve => setTimeout(resolve, 300));
  assert.equal(calls, 4); // two APIs, one retry each
});

test('malformed payloads fail closed instead of becoming zero-valued readings', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'nikal-http-malformed-'));
  const http = new HttpClient(directory, async () => Response.json({ hourly: { temperature_2m: ['warm'] } }));
  const result = await fetchConditions({ lat: 26.2183, lon: 78.1828 }, now, http);
  assert.deepEqual(result.hours, []);
  assert.match(result.error!, /invalid response/);
});

test('fresh cache avoids a second call; expired cache never substitutes for a failure', async () => {
  let calls = 0;
  const directory = await mkdtemp(join(tmpdir(), 'nikal-cache-'));
  const http = new HttpClient(directory, async () => { calls++; return Response.json({ value: 1 }); });
  const options = { ttl: 10000, validate: (value: unknown) => value as { value: number } };
  await http.json('test', 'https://example.org/data', options);
  await http.json('test', 'https://example.org/data', options);
  assert.equal(calls, 1);
  await http.json('test', 'https://example.org/expire', { ...options, ttl: 1 });
  await new Promise(resolve => setTimeout(resolve, 10));
  const uncached = new HttpClient(directory, async () => { throw new Error('https://example.org/?api_key=secret'); });
  await assert.rejects(() => uncached.json('test', 'https://example.org/expire', { ...options, ttl: 0, retries: 0 }), error => {
    assert(!String(error).includes('secret')); return true;
  });
});
