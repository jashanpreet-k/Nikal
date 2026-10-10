import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Mastra } from '@mastra/core/mastra';
import { createPreferenceMemory } from '../src/memory.js';
import { createNikalAgent } from '../src/agent.js';
import { createNikalWorkflow } from '../src/workflow.js';
import { fixtureConditions } from '../src/fixtures.js';
import { conditionsTool } from '../src/tools/conditions.js';
import { placesTool } from '../src/tools/places.js';
import { eventsTool } from '../src/tools/events.js';

test('workflow unit tests: one repair is bounded, revalidated, and never disguised as unvalidated AI', async t => {
  const originalFetch = globalThis.fetch;
  // These tests mock the model/connection only. They run the real Mastra workflow,
  // SQLite memory, candidate validator and renderer; live evidence is separate.
  globalThis.fetch = async () => Response.json({ modelfile: 'FROM /test-only/model.gguf', capabilities: ['completion'] });
  try {
    for (const scenario of ['repair-success', 'repair-fails', 'no-window'] as const) {
      await t.test(scenario, async subtest => {
        const preferences = createPreferenceMemory(mkdtempSync(join(tmpdir(), 'nikal-workflow-test-')));
        try {
          await preferences.save(scenario === 'no-window' ? { maxTemp: 20 } : { maxTemp: 30, period: 'morning', intent: 'Quiet garden' });
          const agent = createNikalAgent(preferences);
          let calls = 0;
          const timeId = fixtureConditions().hours[0]!.id;
          subtest.mock.method(agent, 'generate', async () => {
            calls++;
            return { text: JSON.stringify({ timeId, placeId: 'fixture/garden', reason: scenario === 'repair-success' && calls === 2 ? 'green-space' : 'closer' }) };
          });
          const workflow = createNikalWorkflow(preferences, agent);
          const mastra = new Mastra({ workflows: { workflow }, agents: { agent }, storage: preferences.storage, logger: false });
          const run = await mastra.getWorkflow('workflow').createRun();
          const result = await run.start({ inputData: { fixture: true, noModel: false } });
          assert.equal(result.status, 'success');
          if (result.status !== 'success') throw new Error('Workflow test did not complete');
          if (scenario === 'repair-success') {
            assert.equal(calls, 2);
            assert.equal(result.result.context.mode, 'local-ai');
            assert.equal(result.result.context.decision?.placeId, 'fixture/garden');
            assert.match(result.result.card, /repaired and validated/);
          } else if (scenario === 'repair-fails') {
            assert.equal(calls, 2);
            assert.equal(result.result.context.mode, 'deterministic-fallback');
            assert.match(result.result.card, /Deterministic fallback/);
            assert(!result.result.card.includes('Local AI selection'));
          } else {
            assert.equal(calls, 0);
            assert.equal(result.result.context.mode, 'no-window');
            assert.match(result.result.card, /No suitable daylight window today or tomorrow/);
          }
        } finally { await preferences.close(); }
      });
    }
  } finally { globalThis.fetch = originalFetch; }
});

test('actual Mastra workflow chooses today or tomorrow using mocked retrieval and saved preferences', async t => {
  // No live APIs or model calls: exercise step schemas, memory, rollover and card together.
  for (const scenario of ['morning', 'evening', 'evening-preferences'] as const) {
    await t.test(scenario, async subtest => {
      const preferences = createPreferenceMemory(mkdtempSync(join(tmpdir(), 'nikal-rollover-workflow-')));
      try {
        if (scenario === 'evening-preferences') await preferences.save({ maxTemp: 30, period: 'morning' });
        const now = Date.parse(`2026-10-10T${scenario === 'morning' ? '06:30' : '19:00'}:00+05:30`);
        subtest.mock.method(Date, 'now', () => now);
        const today = fixtureConditions();
        const tomorrow = today.hours.map(h => ({ ...h, time: h.time + 86400000, id: String(h.time / 1000 + 86400), sunrise: h.sunrise! + 86400000, sunset: h.sunset! + 86400000 }));
        // Tool.execute is optional in Mastra's type; restore each test replacement explicitly.
        const replaceExecution = (tool: { execute?: unknown }, implementation: () => Promise<unknown>) => {
          const original = tool.execute; tool.execute = implementation;
          subtest.after(() => { tool.execute = original; });
        };
        replaceExecution(conditionsTool, async () => ({ ...today, hours: [...today.hours, ...tomorrow] }));
        replaceExecution(placesTool, async () => ({ places: [], warnings: [], provenance: 'unavailable' }));
        replaceExecution(eventsTool, async () => ({ events: [], leads: [], warnings: [], searchProvenance: 'skipped' }));
        const agent = createNikalAgent(preferences);
        const workflow = createNikalWorkflow(preferences, agent);
        const mastra = new Mastra({ workflows: { workflow }, agents: { agent }, storage: preferences.storage, logger: false });
        const result = await (await mastra.getWorkflow('workflow').createRun()).start({ inputData: { fixture: false, noModel: true } });
        assert.equal(result.status, 'success');
        if (result.status !== 'success') throw new Error('Mocked rollover workflow failed');
        const context = result.result.context;
        assert.equal(context.mode, 'deterministic-fallback');
        assert.equal(context.recommendationDay, scenario === 'morning' ? 'today' : 'tomorrow');
        if (scenario !== 'morning') assert.match(result.result.card, /Tomorrow/);
        if (scenario === 'evening-preferences') {
          assert.equal(context.preferences.maxTemp, 30); assert.equal(context.preferences.period, 'morning');
          assert(context.candidates?.every(h => h.temperature! <= 30));
          assert.match(result.result.card, /8:00 AM/);
        }
      } finally { await preferences.close(); }
    });
  }
});
