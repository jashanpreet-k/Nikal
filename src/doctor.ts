import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { localProvider, modelFailure, probeLocalModel } from './agent.js';
import { configuration } from './config.js';
import { queryEvents, serpApiDiagnostic } from './tools/events.js';
import { HttpClient } from './http.js';

export async function doctorEvents(http = new HttpClient(), key = configuration().serpapiKey, log: (message: string) => void = console.log, now = Date.now()): Promise<boolean | null> {
  if (!key.trim()) {
    log('SKIP: SERPAPI_KEY absent in environment; no live event query made. Configure it locally, never paste it into chat.');
    return null;
  }
  try {
    const { search, source } = await queryEvents(now, http, key, true);
    if (!source || source.fromCache) throw new Error('Live event probe did not perform a fresh request');
    log(`PASS: One live SerpApi Google search query succeeded (${search.events_results?.length ?? 0} event results). Source pages were not verified by this diagnostic.`);
    return true;
  } catch (error) {
    // No URL, key, server body or exception text reaches the terminal.
    log(`FAIL: ${serpApiDiagnostic(error)} No live event verification claimed.`);
    return false;
  }
}

export async function doctor(testTools = false): Promise<boolean> {
  const config = configuration();
  console.log(`Nikal doctor · ${config.model} · ${config.baseURL}`);
  try {
    const show = await probeLocalModel();
    console.log(`Local model file confirmed. Advertised capabilities: ${show.capabilities.join(', ') || 'not reported'}`);
    const probe = new Agent({ id: 'nikal-compatibility', name: 'Compatibility probe',
      instructions: 'Follow the user instruction precisely. Do not invent tool output.', model: localProvider()(config.model),
      tools: testTools ? { compatibilityProbe: createTool({
        id: 'compatibility-probe', description: 'Return the supplied nonce to prove that a tool executed.',
        inputSchema: z.object({ nonce: z.literal('nikal-local-731') }), outputSchema: z.object({ nonce: z.string(), executed: z.boolean() }),
        execute: async ({ nonce }) => ({ nonce, executed: true }),
      }) } : {},
    });
    const response = await probe.generate(testTools ? 'Call compatibilityProbe exactly once with nonce nikal-local-731. Wait for its result, then report it.' : 'Return exactly this JSON object: {"ok":true}', {
      maxSteps: testTools ? 3 : 1, modelSettings: { temperature: 0, maxOutputTokens: 120, maxRetries: 0 }, abortSignal: AbortSignal.timeout(config.modelTimeout),
    });
    if (testTools) {
      const executed = response.toolResults.some(result => result.payload.toolName === 'compatibilityProbe' &&
        (result.payload.result as { executed?: boolean; nonce?: string } | undefined)?.executed === true &&
        (result.payload.result as { nonce?: string } | undefined)?.nonce === 'nikal-local-731');
      console.log(executed ? 'PASS: Mastra executed a real local model tool call.' : 'FAIL: No validated tool execution observed. The default workflow does not need tool calling.');
      return executed;
    }
    const result = z.object({ ok: z.literal(true) }).parse(JSON.parse(response.text));
    console.log(result.ok ? 'PASS: Ollama → AI SDK → Mastra generate returned valid JSON locally.' : 'FAIL');
    return result.ok;
  } catch (error) { console.log(modelFailure(error)); return false; }
}
