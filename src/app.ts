import { Mastra } from '@mastra/core/mastra';
import { createPreferenceMemory } from './memory.js';
import { createNikalAgent } from './agent.js';
import { createNikalWorkflow } from './workflow.js';

export function createApp() {
  const preferences = createPreferenceMemory();
  const nikalAgent = createNikalAgent(preferences);
  const nikalWorkflow = createNikalWorkflow(preferences, nikalAgent);
  const mastra = new Mastra({ agents: { nikalAgent }, workflows: { nikalWorkflow }, storage: preferences.storage, logger: false, server: { host: '127.0.0.1' } });
  return { mastra, preferences };
}
