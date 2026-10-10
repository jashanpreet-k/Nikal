import test from 'node:test';
import assert from 'node:assert/strict';
import { configuration } from '../src/config.js';
import { probeLocalModel } from '../src/agent.js';

test('local-only configuration refuses remote endpoints, credentials and cloud model names', () => {
  const oldURL = process.env.OLLAMA_BASE_URL, oldModel = process.env.OLLAMA_MODEL;
  try {
    for (const url of ['https://api.openai.com/v1', 'http://example.org/v1', 'http://u:p@localhost:11434/v1', 'http://localhost:11434/v1?key=1']) {
      process.env.OLLAMA_BASE_URL = url;
      assert.throws(configuration, /loopback/);
    }
    process.env.OLLAMA_BASE_URL = 'http://127.0.0.1:11434/v1';
    process.env.OLLAMA_MODEL = 'qwen2.5:7b-cloud';
    assert.throws(configuration, /local/);
    process.env.OLLAMA_MODEL = 'qwen2.5:7b';
    assert.equal(configuration().baseURL, 'http://127.0.0.1:11434/v1');
  } finally {
    if (oldURL === undefined) delete process.env.OLLAMA_BASE_URL; else process.env.OLLAMA_BASE_URL = oldURL;
    if (oldModel === undefined) delete process.env.OLLAMA_MODEL; else process.env.OLLAMA_MODEL = oldModel;
  }
});

test('a loopback Ollama service cannot silently substitute a remote model', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ remote_host: 'cloud.example.org', modelfile: 'FROM remote' });
    await assert.rejects(probeLocalModel, /remote inference refused/);
    globalThis.fetch = async () => Response.json({ capabilities: ['completion'] });
    await assert.rejects(probeLocalModel, /local model file/);
    globalThis.fetch = async () => Response.json({ modelfile: 'FROM /local/model.gguf', capabilities: ['completion', 'tools'] });
    assert.deepEqual(await probeLocalModel(), { capabilities: ['completion', 'tools'] });
  } finally { globalThis.fetch = original; }
});
