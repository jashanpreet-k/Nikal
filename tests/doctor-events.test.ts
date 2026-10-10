import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { doctorEvents } from '../src/doctor.js';
import { queryEvents, findEvents } from '../src/tools/events.js';
import { HttpClient } from '../src/http.js';
import { Event, Preferences } from '../src/domain.js';
import { formatCard } from '../src/card.js';
import { CITY_CENTRE } from '../src/config.js';
import { FIXTURE_NOW } from '../src/fixtures.js';
import { execFileSync } from 'node:child_process';

// Diagnostic network responses and keys in this file are synthetic mocks.
const directory = () => mkdtempSync(join(tmpdir(), 'nikal-events-doctor-'));
test('configuration reads a synthetic SERPAPI_KEY from environment with dotenv disabled', () => {
  const output = execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e',
    'import assert from "node:assert/strict"; import {configuration} from "./src/config.ts"; assert.equal(configuration().serpapiKey, "synthetic-environment-key"); console.log("PASS");'],
    { encoding: 'utf8', env: { ...process.env, NIKAL_SKIP_DOTENV: '1', SERPAPI_KEY: 'synthetic-environment-key' } });
  assert.equal(output.trim(), 'PASS');
});
test('event diagnostic skips with no key and makes no HTTP request', async () => {
  let calls = 0; const messages: string[] = [];
  const http = new HttpClient(directory(), async () => { calls++; throw new Error('No request expected'); });
  assert.equal(await doctorEvents(http, '', message => messages.push(message), FIXTURE_NOW), null);
  assert.equal(calls, 0); assert.match(messages[0]!, /SKIP/);
});

test('event diagnostic bypasses even a fresh search cache and performs exactly one city-only query', async () => {
  let calls = 0; const messages: string[] = [];
  const http = new HttpClient(directory(), async input => {
    calls++; const url = new URL(String(input));
    assert.equal(url.searchParams.get('engine'), 'google');
    assert.match(url.searchParams.get('q')!, /Gwalior/);
    assert.equal(url.searchParams.get('api_key'), 'synthetic-test-key');
    assert(!url.search.includes('latitude')); assert(!url.search.includes('longitude'));
    return Response.json({ search_metadata: { status: 'Success' }, events_results: [] });
  });
  await queryEvents(FIXTURE_NOW, http, 'synthetic-test-key');
  assert.equal(calls, 1);
  assert.equal(await doctorEvents(http, 'synthetic-test-key', message => messages.push(message), FIXTURE_NOW), true);
  assert.equal(calls, 2); assert.match(messages[0]!, /PASS: One live/);
  assert.match(messages[0]!, /Source pages were not verified/);
  assert(!messages.join(' ').includes('synthetic-test-key'));
});

test('event diagnostic fails quota, HTTP and malformed responses without leaking keys or claiming verification', async () => {
  for (const response of [Response.json({ error: 'quota synthetic-test-key' }), new Response('', { status: 429 }), Response.json({})]) {
    const messages: string[] = []; let calls = 0;
    const http = new HttpClient(directory(), async () => { calls++; return response; });
    assert.equal(await doctorEvents(http, 'synthetic-test-key', message => messages.push(message), FIXTURE_NOW), false);
    assert.equal(calls, 1); assert.match(messages[0]!, /^FAIL/); assert(!messages.join(' ').includes('synthetic-test-key'));
  }
});

test('sanitized event diagnostics retain status/category and discard all provider details', async t => {
  // Synthetic errors only. No provider request or real credential is used.
  const secret = 'synthetic-diagnostic-secret';
  const detail = `PRIVATE_PROVIDER_DETAIL https://user:${secret}@example.org/search?api_key=${secret}`;
  const cases: { name: string; category: string; status: number | null; fetch: typeof fetch }[] = [
    ...[401, 403, 402, 429, 400, 422, 503].map(status => ({
      name: `HTTP ${status}`, status,
      category: [401, 403].includes(status) ? 'authentication' : [402, 429].includes(status) ? 'quota'
        : [400, 422].includes(status) ? 'invalid parameters' : 'network/timeout',
      fetch: async () => {
        const response = new Response(null, { status });
        response.json = async () => { throw new Error('Error bodies must not be read'); };
        return response;
      },
    })),
    { name: 'HTTP 200 authentication error', status: 200, category: 'authentication', fetch: async () => Response.json({ error: `Invalid API key. ${detail}` }) },
    { name: 'HTTP 200 quota error', status: 200, category: 'quota', fetch: async () => Response.json({ error: `Quota exhausted. ${detail}` }) },
    { name: 'HTTP 200 parameters error', status: 200, category: 'invalid parameters', fetch: async () => Response.json({ error: `Unsupported engine parameter. ${detail}` }) },
    { name: 'HTTP 200 unknown provider error', status: 200, category: 'malformed response', fetch: async () => Response.json({ error: detail }) },
    { name: 'HTTP 200 malformed JSON', status: 200, category: 'malformed response', fetch: async () => new Response(detail) },
    { name: 'HTTP 200 malformed schema', status: 200, category: 'malformed response', fetch: async () => Response.json({ events_results: detail }) },
    { name: 'network exception', status: null, category: 'network/timeout', fetch: async () => { throw new Error(detail); } },
    { name: 'timeout exception', status: null, category: 'network/timeout', fetch: async () => { throw new DOMException(detail, 'TimeoutError'); } },
  ];
  for (const scenario of cases) await t.test(scenario.name, async () => {
    let calls = 0;
    const http = new HttpClient(directory(), async (...args) => { calls++; return scenario.fetch(...args); });
    const logs: string[] = [];
    assert.equal(await doctorEvents(http, secret, message => logs.push(message), FIXTURE_NOW), false);
    assert.equal(calls, 1);
    assert.equal(logs[0], `FAIL: SerpApi: HTTP ${scenario.status ?? 'unavailable'}; category: ${scenario.category}. No live event verification claimed.`);
    const events = await findEvents(FIXTURE_NOW, http, secret);
    assert.equal(events.searchProvenance, 'failed');
    assert.deepEqual(events.warnings, [`SerpApi: HTTP ${scenario.status ?? 'unavailable'}; category: ${scenario.category}.`]);
    for (const forbidden of [secret, 'PRIVATE_PROVIDER_DETAIL', 'https://', 'api_key=', 'user:']) {
      assert.equal(logs.join(' ').includes(forbidden), false);
      assert.equal(JSON.stringify(events).includes(forbidden), false);
    }
  });
});

test('every displayed corroborated event requires and renders a source URL; cached verification is labeled', async () => {
  const source = 'https://events.example.org/synthetic-walk';
  const data = { '@type': 'Event', name: 'Gwalior Outdoor Walk', startDate: '2026-10-11T07:00:00+05:30', location: { addressLocality: 'Gwalior' } };
  const http = new HttpClient(directory(), async () => Response.json({ events_results: [{ title: data.name, link: source }] }));
  const getPage = async () => `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
  const first = await findEvents(FIXTURE_NOW, http, 'synthetic-test-key', getPage);
  assert.equal(first.events[0]?.source, source); assert.equal(first.events[0]?.cachedVerification, false);
  const cached = await findEvents(FIXTURE_NOW, http, 'synthetic-test-key', getPage);
  assert.equal(cached.events[0]?.cachedVerification, true); assert.equal(cached.searchProvenance, 'cache');
  const card = formatCard({ fixture: false, noModel: true, now: FIXTURE_NOW, preferences: Preferences.parse({}), start: CITY_CENTRE,
    locationLabel: 'Development coordinates', mode: 'no-window', decision: null, events: cached });
  assert(card.includes(source)); assert.match(card, /Event search from cache/); assert.match(card, /Source verification from cache/);
  assert.throws(() => Event.parse({ title: data.name, startDate: data.startDate, location: 'Gwalior', checkedAt: FIXTURE_NOW }));
});
