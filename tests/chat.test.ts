import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { noopObserve, isValidationError } from '@mastra/core/tools';
import type { AgentExecutionOptionsBase } from '@mastra/core/agent';
import { createChatSession, ChatPreferencePatch, runPreferenceChat, formatChatChanges } from '../src/chat.js';
import { createPreferenceMemory } from '../src/memory.js';
import { createNikalAgent } from '../src/agent.js';
import type { Preferences } from '../src/domain.js';

const directory = () => mkdtempSync(join(tmpdir(), 'nikal-chat-test-'));
const probe = async () => ({ capabilities: ['tools'] });

test('empty and whitespace-only chat make no probe, model or memory call', async () => {
  let calls = 0;
  const memory = createPreferenceMemory(directory());
  try {
    for (const message of ['', '  \n\t ']) {
      const result = await runPreferenceChat(message, memory, { probe: async () => { calls++; },
        createSession: () => { calls++; throw new Error('No agent should be created'); } });
      assert.match(result.error!, /empty or whitespace-only/); assert.equal(formatChatChanges(result), 'No preferences changed.');
    }
    assert.equal(calls, 0);
  } finally { await memory.close(); }
  for (const message of ['', '   ']) {
    const dir = directory();
    const child = spawnSync(process.execPath, ['dist/cli.js', 'chat', message], { encoding: 'utf8',
      env: { ...process.env, NIKAL_SKIP_DOTENV: '1', NIKAL_DATA_DIR: dir } });
    assert.equal(child.status, 1); assert.match(child.stderr, /empty or whitespace-only/);
    assert.deepEqual(readdirSync(dir), []);
  }
});

test('valid tool patch is staged, not saved, then committed once after successful generation', async t => {
  const memory = createPreferenceMemory(directory());
  try {
    const before = await memory.save({ radiusKm: 1.5, intent: 'Synthetic quiet garden' });
    let saves = 0; const save = memory.save.bind(memory);
    t.mock.method(memory, 'save', async (patch: Partial<Preferences>) => { saves++; return save(patch); });
    const result = await runPreferenceChat('Synthetic preference request', memory, { probe,
      createSession: preferences => {
        const session = createChatSession(preferences);
        t.mock.method(session.agent, 'generate', async (_message: unknown, options: AgentExecutionOptionsBase<unknown>) => {
          assert.deepEqual(options.activeTools, ['readPreferences', 'savePreferences']);
          assert.equal(options.memory?.options?.readOnly, true);
          assert.equal(options.modelSettings?.maxRetries, 0);
          const response = await session.savePreferences.execute!({ maxTemp: 30, preferredPeriod: 'morning' }, { observe: noopObserve });
          assert.deepEqual(response, { message: 'Preferences staged, not saved.' });
          assert.equal(saves, 0); assert.deepEqual(await memory.read(), before);
          return { text: 'Untrusted model claim: saved 12 degrees', finishReason: 'stop' };
        });
        return session;
      } });
    const after = await memory.read();
    assert.equal(saves, 1); assert.equal(result.error, null);
    assert.equal(after.maxTemp, 30); assert.equal(after.period, 'morning');
    assert.equal(after.radiusKm, before.radiusKm); assert.equal(after.intent, before.intent);
    assert.equal(formatChatChanges(result), 'maxTemp: 32 → 30\nperiod: "any" → "morning"');
    for (const change of result.changes) { assert.equal(change.before, before[change.field]); assert.equal(change.after, after[change.field]); }
    assert(!formatChatChanges(result).includes('12 degrees'));
  } finally { await memory.close(); }
});

test('patch schema rejects ranges and unknown fields without applying defaults', async () => {
  assert.deepEqual(ChatPreferencePatch.parse({ maxTemp: 30 }), { maxTemp: 30 });
  for (const patch of [{ maxTemp: 46 }, { maxAqi: 151 }, { maxUv: 13 }, { maxRain: 101 }, { radiusKm: 0 },
    { preferredPeriod: 'night' }, { intent: 'x'.repeat(301) }, { start: { lat: 1, lon: 2 } }, { period: 'morning' }, { unknown: 1 }, {}]) {
    assert.throws(() => ChatPreferencePatch.parse(patch));
  }
  const memory = createPreferenceMemory(directory());
  try {
    const before = await memory.read(); const session = createChatSession(memory);
    const outOfRange = await session.savePreferences.execute!({ maxTemp: 46 }, { observe: noopObserve });
    assert(isValidationError(outOfRange)); assert.match(outOfRange.message, /maxTemp.*45/);
    const unknown = await session.savePreferences.execute!({ maxTemp: 30, start: { lat: 1, lon: 2 } } as never, { observe: noopObserve });
    assert(isValidationError(unknown)); assert.match(unknown.message, /Unrecognized key.*start/);
    assert.deepEqual(await memory.read(), before); assert.deepEqual(session.takePatch(), {});
  } finally { await memory.close(); }
});

test('no tool call or an unchanged staged value produces No preferences changed', async t => {
  for (const stage of [false, true]) {
    const memory = createPreferenceMemory(directory());
    try {
      const before = await memory.read();
      const result = await runPreferenceChat('Synthetic non-change', memory, { probe, createSession: preferences => {
        const session = createChatSession(preferences);
        t.mock.method(session.agent, 'generate', async () => {
          if (stage) await session.savePreferences.execute!({ maxTemp: 32 }, { observe: noopObserve });
          return { text: 'Untrusted claim that preferences changed', finishReason: 'stop' };
        }); return session;
      } });
      assert.equal(result.error, null); assert.equal(formatChatChanges(result), 'No preferences changed.');
      assert.deepEqual(await memory.read(), before);
    } finally { await memory.close(); }
  }
});

test('generation failures, reported errors and aborts discard all staged preferences', async t => {
  for (const failure of ['throw', 'reported-error', 'timeout', 'abort', 'ignore-abort'] as const) {
    await t.test(failure, async subtest => {
      const memory = createPreferenceMemory(directory());
      const controller = new AbortController();
      let session: ReturnType<typeof createChatSession> | undefined;
      try {
        const before = await memory.read(); let saves = 0;
        subtest.mock.method(memory, 'save', async () => { saves++; throw new Error('No persistence expected'); });
        const result = await runPreferenceChat('Synthetic failed request', memory, { probe, signal: controller.signal,
          createSession: preferences => {
            session = createChatSession(preferences);
            subtest.mock.method(session.agent, 'generate', async () => {
              await session!.savePreferences.execute!({ maxTemp: 30 }, { observe: noopObserve });
              if (failure === 'throw') throw new Error('Synthetic generation failed');
              if (failure === 'reported-error') return { text: '', finishReason: 'error', error: new Error('Synthetic provider error') };
              controller.abort(new DOMException('Synthetic cancellation', failure === 'timeout' ? 'TimeoutError' : 'AbortError'));
              if (failure === 'ignore-abort') return new Promise(() => {});
              return { text: 'Untrusted save claim', finishReason: 'stop' };
            }); return session;
          } });
        assert(result.error); assert.equal(formatChatChanges(result), 'No preferences changed.');
        assert.equal(saves, 0); assert.deepEqual(await memory.read(), before);
        assert.deepEqual(session!.takePatch(), {});
        await assert.rejects(() => session!.savePreferences.execute!({ maxTemp: 28 }, { observe: noopObserve }), /staging is closed/);
      } finally { await memory.close(); }
    });
  }
});

test('multiple tool calls merge patches and only the final values are committed', async t => {
  const memory = createPreferenceMemory(directory());
  try {
    const result = await runPreferenceChat('Synthetic merged request', memory, { probe, createSession: preferences => {
      const session = createChatSession(preferences);
      t.mock.method(session.agent, 'generate', async () => {
        await session.savePreferences.execute!({ maxTemp: 28, preferredPeriod: 'morning' }, { observe: noopObserve });
        await session.savePreferences.execute!({ maxTemp: 30, maxUv: 4 }, { observe: noopObserve });
        return { text: '', finishReason: 'stop' };
      }); return session;
    } });
    const after = await memory.read(); assert.equal(result.error, null);
    assert.equal(after.maxTemp, 30); assert.equal(after.period, 'morning'); assert.equal(after.maxUv, 4);
    assert(!formatChatChanges(result).includes('28')); assert(formatChatChanges(result).includes('maxUv: 5 → 4'));
  } finally { await memory.close(); }
});

test('the configured generation deadline discards staged changes even if generation never settles', async t => {
  const previousTimeout = process.env.NIKAL_MODEL_TIMEOUT_MS;
  process.env.NIKAL_MODEL_TIMEOUT_MS = '1000';
  t.after(() => { if (previousTimeout === undefined) delete process.env.NIKAL_MODEL_TIMEOUT_MS; else process.env.NIKAL_MODEL_TIMEOUT_MS = previousTimeout; });
  const memory = createPreferenceMemory(directory());
  try {
    const before = await memory.read();
    const result = await runPreferenceChat('Synthetic deadline request', memory, { probe, createSession: preferences => {
      const session = createChatSession(preferences);
      t.mock.method(session.agent, 'generate', async () => {
        await session.savePreferences.execute!({ maxTemp: 30 }, { observe: noopObserve });
        return new Promise(() => {});
      }); return session;
    } });
    assert.match(result.error!, /timed out/); assert.equal(formatChatChanges(result), 'No preferences changed.');
    assert.deepEqual(await memory.read(), before);
  } finally { await memory.close(); }
});

test('persist-time full validation failure saves nothing and reports no staged values', async t => {
  const memory = createPreferenceMemory(directory());
  try {
    const before = await memory.read(); let writes = 0;
    t.mock.method(memory.memory, 'updateWorkingMemory', async () => { writes++; });
    const result = await runPreferenceChat('Synthetic persistence rejection', memory, { probe, createSession: preferences => {
      const session = createChatSession(preferences);
      t.mock.method(session.agent, 'generate', async () => {
        await session.savePreferences.execute!({ maxTemp: 30 }, { observe: noopObserve });
        t.mock.method(memory, 'read', async () => ({ ...before, radiusKm: 0 }));
        return { text: 'Untrusted save claim', finishReason: 'stop' };
      }); return session;
    } });
    assert.match(result.error!, /validation failed/); assert.equal(writes, 0);
    assert.equal(formatChatChanges(result), 'No preferences changed.');
    t.mock.restoreAll(); assert.deepEqual(await memory.read(), before);
  } finally { await memory.close(); }
});

test('chat has only its two tools and never changes the shared recommendation agent', async () => {
  const memory = createPreferenceMemory(directory());
  try {
    const recommendation = createNikalAgent(memory);
    const before = Object.keys(await recommendation.listTools()).sort();
    const session = createChatSession(memory);
    assert.deepEqual(Object.keys(await session.agent.listTools()).sort(), ['readPreferences', 'savePreferences']);
    assert.deepEqual(Object.keys(await recommendation.listTools()).sort(), before);
    assert.deepEqual(before, ['conditionsTool', 'eventsTool', 'placesTool', 'readPreferences']);
    session.discard();
  } finally { await memory.close(); }
});
