import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { LibSQLStore } from '@mastra/libsql';
import { Memory } from '@mastra/memory';
import { configuration, RESOURCE, THREAD } from './config.js';
import { Preferences } from './domain.js';

export function createPreferenceMemory(dataDir = configuration().dataDir) {
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const storage = new LibSQLStore({ id: 'nikal-sqlite', url: `file:${join(dataDir, 'memory.db')}` });
  const memory = new Memory({ storage, options: {
    lastMessages: 4, semanticRecall: false,
    workingMemory: { enabled: true, scope: 'resource', schema: Preferences },
    // No embeddings, remote observation models, or background inference.
  } });
  let ready: Promise<void> | undefined;
  const init = () => ready ??= (async () => {
    await storage.init();
    if (!await memory.getThreadById({ threadId: THREAD })) {
      await memory.createThread({ threadId: THREAD, resourceId: RESOURCE, title: 'Nikal outdoor cues' });
    }
  })();
  return {
    storage, memory,
    async read(): Promise<Preferences> {
      await init();
      const raw = await memory.getWorkingMemory({ threadId: THREAD, resourceId: RESOURCE });
      if (!raw) return Preferences.parse({});
      // Fail clearly on corrupt memory rather than silently loosening comfort constraints.
      return Preferences.parse(JSON.parse(raw));
    },
    async save(patch: Partial<Preferences>): Promise<Preferences> {
      const preferences = Preferences.parse({ ...await this.read(), ...patch });
      await memory.updateWorkingMemory({ threadId: THREAD, resourceId: RESOURCE, workingMemory: JSON.stringify(preferences) });
      return preferences;
    },
    async reset(): Promise<Preferences> {
      await init();
      const preferences = Preferences.parse({});
      await memory.updateWorkingMemory({ threadId: THREAD, resourceId: RESOURCE, workingMemory: JSON.stringify(preferences) });
      return preferences;
    },
    async close() { await storage.close(); },
  };
}
export type PreferenceMemory = ReturnType<typeof createPreferenceMemory>;
