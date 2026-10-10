import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Mastra } from '@mastra/core/mastra';
import { createPreferenceMemory } from '../src/memory.js';
import { createNikalAgent } from '../src/agent.js';
import { createNikalWorkflow } from '../src/workflow.js';
import { fixtureConditions, fixturePlaces, FIXTURE_NOW } from '../src/fixtures.js';
import { conditionsTool } from '../src/tools/conditions.js';
import { placesTool } from '../src/tools/places.js';
import { eventsTool } from '../src/tools/events.js';
import { HttpError } from '../src/http.js';

test('Mastra parallel retrieval joins full context and isolates expected branch failures', async t => {
  // Actual workflow/SQLite, with artificial API responses, clock and no model.
  for (const scenario of ['both', 'places-http', 'events-timeout', 'both-fail', 'malformed', 'forecast-fail'] as const) {
    await t.test(scenario, async subtest => {
      const memory = createPreferenceMemory(mkdtempSync(join(tmpdir(), 'nikal-parallel-')));
      try {
        const preferences = await memory.save({ maxTemp: 30, period: 'morning', radiusKm: 1.5,
          intent: 'Private synthetic quiet-walk preference', start: { lat: 26.22, lon: 78.18 } });
        subtest.mock.method(Date, 'now', () => FIXTURE_NOW);
        const conditions = fixtureConditions();
        if (scenario === 'forecast-fail') conditions.error = 'Synthetic forecast unavailable';
        const places = fixturePlaces(preferences.start!, preferences);
        const events = { events: [{ title: 'Synthetic Gwalior Outdoor Walk', startDate: '2026-10-11T07:00:00+05:30',
          location: 'Gwalior', source: 'https://events.example.org/synthetic-walk', checkedAt: FIXTURE_NOW }], leads: [], warnings: [], searchProvenance: 'fixture' };
        const replace = (tool: { execute?: unknown }, implementation: () => Promise<unknown>) => {
          const original = tool.execute; tool.execute = implementation; subtest.after(() => { tool.execute = original; });
        };
        replace(conditionsTool, async () => conditions);
        let started = 0, release!: () => void;
        const bothStarted = new Promise<void>(resolve => { release = resolve; });
        const arrived = async () => {
          started++; if (started === 2) release();
          // Barrier proves overlap without measuring or claiming a speedup.
          await bothStarted;
        };
        replace(placesTool, async () => {
          await arrived();
          if (scenario === 'places-http') throw new HttpError('Overpass', 504);
          if (scenario === 'both-fail') throw new DOMException('Synthetic timeout', 'TimeoutError');
          return scenario === 'malformed' ? {} : places;
        });
        replace(eventsTool, async () => {
          await arrived();
          if (scenario === 'events-timeout') throw new DOMException('Synthetic timeout', 'TimeoutError');
          if (scenario === 'both-fail') throw new HttpError('SerpApi', 429);
          return scenario === 'malformed' ? {} : events;
        });
        const agent = createNikalAgent(memory);
        subtest.mock.method(agent, 'generate', async () => { throw new Error('No model call expected'); });
        const workflow = createNikalWorkflow(memory, agent);
        const mastra = new Mastra({ workflows: { workflow }, agents: { agent }, storage: memory.storage, logger: false });
        const result = await (await mastra.getWorkflow('workflow').createRun()).start({ inputData: { fixture: false, noModel: true } });
        assert.equal(result.status, 'success');
        if (result.status !== 'success') throw new Error('Mocked parallel workflow failed');
        const context = result.result.context;
        assert.deepEqual(context.preferences, preferences); assert.deepEqual(context.conditions, conditions);
        assert.deepEqual(context.start, preferences.start); assert.equal(context.locationLabel, 'Configured start coordinates');
        assert.equal(context.now, FIXTURE_NOW); assert.equal(context.fixture, false); assert.equal(context.noModel, true);
        assert(result.result.card.includes('Close this tab. Go outside.'));
        if (scenario === 'forecast-fail') {
          assert.equal(started, 0); assert.equal(context.mode, 'unavailable'); assert.equal(context.events?.searchProvenance, 'skipped');
          assert.equal(context.places?.provenance, 'unavailable');
        } else {
          assert.equal(started, 2); assert.equal(context.mode, 'deterministic-fallback');
          const placesFail = ['places-http', 'both-fail', 'malformed'].includes(scenario);
          const eventsFail = ['events-timeout', 'both-fail', 'malformed'].includes(scenario);
          assert.equal(context.places?.places.length, placesFail ? 0 : places.places.length);
          assert.equal(context.events?.events.length, eventsFail ? 0 : 1);
          if (placesFail) { assert.equal(context.places?.provenance, 'unavailable'); assert.match(result.result.card, /Places unavailable/); }
          if (eventsFail) { assert.equal(context.events?.searchProvenance, 'failed'); assert.match(result.result.card, /No verified event found/); }
          else assert.match(result.result.card, /Nearby this week: Synthetic Gwalior/);
          assert(context.candidates?.every(hour => hour.temperature! <= 30));
        }
      } finally { await memory.close(); }
    });
  }
});
