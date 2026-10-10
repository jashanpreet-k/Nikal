import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { CITY, configuredEventQuery, DEFAULT_EVENT_QUERY, EVENT_QUERY_MAX_LENGTH } from '../src/config.js';
import { queryEvents, findEvents } from '../src/tools/events.js';
import { doctorEvents } from '../src/doctor.js';
import { HttpClient } from '../src/http.js';
import { FIXTURE_NOW } from '../src/fixtures.js';
import { createPreferenceMemory } from '../src/memory.js';

// All keys and API responses below are synthetic. No keyed service is called.
test('event query uses its default or trimmed custom environment value', () => {
  assert.equal(configuredEventQuery(''), DEFAULT_EVENT_QUERY);
  assert.equal(configuredEventQuery('  park walks in Gwalior  '), 'park walks in Gwalior');
  const output = execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e',
    'import assert from "node:assert/strict"; import {configuration} from "./src/config.ts"; assert.equal(configuration().eventQuery,"custom city outdoor walks"); console.log("PASS");'],
    { encoding: 'utf8', env: { ...process.env, NIKAL_SKIP_DOTENV: '1', NIKAL_EVENT_QUERY: 'custom city outdoor walks' } });
  assert.equal(output.trim(), 'PASS');
});
test('event query rejects controls and over-length values without echoing them', () => {
  for (const value of ['walk\nprivate-value', '\u001b[2Jwalk', 'walk\t', 'walk\u009b', 'walk\u202e', 'walk\u200b', 'walk\u2028']) {
    assert.throws(() => configuredEventQuery(value), error => error instanceof Error && /NIKAL_EVENT_QUERY/.test(error.message) && !error.message.includes('private-value'));
  }
  assert.throws(() => configuredEventQuery('x'.repeat(EVENT_QUERY_MAX_LENGTH + 1)), /at most 120/);
  assert.equal([...configuredEventQuery('🌳'.repeat(120))].length, 120);
});
test('custom query changes cache identity, keeps city grounding, and cache hit makes zero requests', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'nikal-query-cache-'));
  const seen: URL[] = [];
  const http = new HttpClient(dir, async input => { seen.push(new URL(String(input))); return Response.json({ events_results: [] }); });
  const first = 'outdoor walks in Gwalior';
  const second = 'park events this week';
  await queryEvents(FIXTURE_NOW, http, 'synthetic-key-one', false, first);
  assert.equal(seen.length, 1);
  await queryEvents(FIXTURE_NOW, http, 'synthetic-key-two', false, first);
  assert.equal(seen.length, 1); // Key is not part of cache identity.
  await queryEvents(FIXTURE_NOW, http, 'synthetic-key-one', false, second);
  assert.equal(seen.length, 2);
  assert.deepEqual(seen.map(url => url.searchParams.get('q')), [first, second]);
  for (const url of seen) {
    assert.equal(url.searchParams.get('location'), CITY);
    assert.equal(url.searchParams.get('engine'), 'google');
    assert.equal(url.searchParams.has('htichips'), false);
    assert(!url.searchParams.has('latitude')); assert(!url.searchParams.has('longitude'));
    assert(!url.search.includes('26.2183')); assert(!url.search.includes('78.1828'));
    assert(!url.search.includes('short%2C')); assert(!url.searchParams.has('intent'));
    assert.deepEqual([...url.searchParams.keys()].sort(), ['api_key', 'engine', 'gl', 'hl', 'location', 'q']);
  }
  const date = new Date(FIXTURE_NOW + 19800000).toISOString().slice(0, 10);
  const expected = [first, second].map(query => createHash('sha256').update(`events:google:${query}:${CITY}:${date}`).digest('hex') + '.json').sort();
  assert.deepEqual(readdirSync(dir).sort(), expected);
  for (const file of expected) assert(!readFileSync(join(dir, file), 'utf8').includes('synthetic-key'));
});

test('documented Google replacement excludes retired filters and never reuses old-engine cache', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'nikal-google-events-migration-'));
  const date = new Date(FIXTURE_NOW + 19800000).toISOString().slice(0, 10);
  const oldPath = join(dir, createHash('sha256').update(`events:${DEFAULT_EVENT_QUERY}:${CITY}:${date}`).digest('hex') + '.json');
  writeFileSync(oldPath, JSON.stringify({ expires: Date.now() + 6 * 3600000, fetchedAt: Date.now(),
    value: { events_results: [{ title: 'Synthetic retired-engine lead', link: 'https://events.example.org/old' }] } }));
  let calls = 0, pages = 0;
  const http = new HttpClient(dir, async input => {
    calls++; const params = new URL(String(input)).searchParams;
    assert.deepEqual([...params.keys()].sort(), ['api_key', 'engine', 'gl', 'hl', 'location', 'q']);
    assert.equal(params.get('engine'), 'google');
    assert.equal(params.get('q'), DEFAULT_EVENT_QUERY);
    assert.equal(params.get('location'), CITY);
    assert.equal(params.get('gl'), 'in'); assert.equal(params.get('hl'), 'en');
    for (const omitted of ['htichips', 'tbm', 'tbs', 'uule', 'lat', 'lon', 'start', 'async']) assert.equal(params.has(omitted), false);
    // A successful ordinary Google search need not include an event module.
    return Response.json({ search_metadata: { status: 'Success' }, organic_results: [] });
  });
  const first = await queryEvents(FIXTURE_NOW, http, 'synthetic-migration-key');
  assert.equal(calls, 1); assert.equal(first.source?.fromCache, false);
  assert.equal(first.search.events_results, undefined);
  const cached = await findEvents(FIXTURE_NOW, http, 'synthetic-migration-key', async () => { pages++; return ''; });
  assert.equal(calls, 1); assert.equal(pages, 0);
  assert.equal(cached.searchProvenance, 'cache');
  assert.deepEqual(cached.events, []); assert.deepEqual(cached.leads, []);
  const logs: string[] = [];
  assert.equal(await doctorEvents(http, 'synthetic-migration-key', message => logs.push(message), FIXTURE_NOW), true);
  assert.equal(calls, 2);
  assert.match(logs[0]!, /0 event results/);
});
test('invalid configured query makes no request and diagnostic logs contain no key or raw query', async t => {
  const prior = process.env.NIKAL_EVENT_QUERY;
  t.after(() => { if (prior === undefined) delete process.env.NIKAL_EVENT_QUERY; else process.env.NIKAL_EVENT_QUERY = prior; });
  process.env.NIKAL_EVENT_QUERY = 'invalid\nprivate-query';
  let requests = 0; const logs: string[] = [];
  const http = new HttpClient(mkdtempSync(join(tmpdir(), 'nikal-query-failure-')), async () => { requests++; throw new Error('No request expected'); });
  await assert.rejects(() => queryEvents(FIXTURE_NOW, http, 'synthetic-private-key'), /NIKAL_EVENT_QUERY/);
  assert.equal(await doctorEvents(http, 'synthetic-private-key', message => logs.push(message), FIXTURE_NOW), false);
  assert.equal(requests, 0); assert.match(logs.join(' '), /FAIL/);
  assert(!logs.join(' ').includes('synthetic-private-key')); assert(!logs.join(' ').includes('private-query'));
});

test('city search never inserts coordinates or intent from genuine saved memory', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'nikal-query-memory-'));
  const previousDir = process.env.NIKAL_DATA_DIR, previousQuery = process.env.NIKAL_EVENT_QUERY;
  const custom = 'outdoor park walks this week';
  process.env.NIKAL_DATA_DIR = dir; process.env.NIKAL_EVENT_QUERY = custom;
  t.after(() => {
    if (previousDir === undefined) delete process.env.NIKAL_DATA_DIR; else process.env.NIKAL_DATA_DIR = previousDir;
    if (previousQuery === undefined) delete process.env.NIKAL_EVENT_QUERY; else process.env.NIKAL_EVENT_QUERY = previousQuery;
  });
  const memory = createPreferenceMemory(dir);
  try {
    const saved = await memory.save({ start: { lat: 26.1234, lon: 78.5432 }, intent: 'SYNTHETIC_PRIVATE_INTENT_NOT_FOR_SEARCH' });
    let calls = 0;
    const http = new HttpClient(join(dir, 'cache'), async input => {
      calls++; const url = new URL(String(input));
      assert.equal(url.searchParams.get('q'), custom); assert.equal(url.searchParams.get('location'), CITY);
      const values = [...url.searchParams.values()].join(' ');
      assert(!values.includes(String(saved.start!.lat))); assert(!values.includes(String(saved.start!.lon)));
      assert(!values.includes(saved.intent));
      return Response.json({ events_results: [] });
    });
    const result = await findEvents(FIXTURE_NOW, http, 'synthetic-memory-test-key');
    assert.equal(calls, 1); assert.equal(result.events.length, 0); assert.deepEqual(await memory.read(), saved);
  } finally { await memory.close(); }
});
