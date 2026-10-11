import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { modelFailure } from '../src/agent.js';

// Error-message tests. They run the compiled CLI on isolated profiles with dotenv disabled.
// No API or model is called: the model cases point Ollama at a closed loopback port.
const profile = () => mkdtempSync(join(tmpdir(), 'nikal-messages-test-'));
const cli = (env: Record<string, string>, ...args: string[]) =>
  spawnSync(process.execPath, ['dist/cli.js', ...args], { env: { ...process.env, NIKAL_SKIP_DOTENV: '1', NIKAL_LAT: '', NIKAL_LON: '', ...env }, encoding: 'utf8' });

// Ask the OS for a free port, then release it: nothing is listening there afterwards.
async function closedPort(): Promise<number> {
  const server = createServer();
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as { port: number };
  await new Promise<void>(resolve => server.close(() => resolve()));
  return port;
}

test('a mistyped preference gets one plain sentence, not raw validation output', () => {
  const env = { NIKAL_DATA_DIR: profile() };
  const cases: [string[], string][] = [
    [['--radius', '5'], '--radius must be at most 3 km.'],
    [['--radius', '0'], '--radius must be at least 0.1 km.'],
    [['--max-temp', '60'], '--max-temp must be at most 45°C.'],
    [['--max-temp', 'oops'], '--max-temp must be a number.'],
    [['--max-rain', '150'], '--max-rain must be at most 100%.'],
    [['--period', 'noon'], '--period must be one of: any, morning, evening.'],
    [['--intent', 'x'.repeat(301)], '--intent must be at most 300 characters.'],
    [['--lat', '95', '--lon', '78'], '--lat must be at most 90.'],
    // Node's argument parser needs the = form for a value that starts with a dash.
    [['--lat', '26', '--lon=-200'], '--lon must be at least -180.'],
  ];
  for (const [flags, sentence] of cases) {
    const result = cli(env, 'prefs', 'set', ...flags);
    assert.equal(result.status, 1, flags.join(' '));
    assert.equal(result.stderr, `Nikal: ${sentence}\n`);
    assert.equal(result.stdout, '');
  }
  // Two problems at once are both named, in the validator's field order.
  assert.equal(cli(env, 'prefs', 'set', '--radius', '5', '--period', 'noon').stderr, 'Nikal: --period must be one of: any, morning, evening. --radius must be at most 3 km.\n');
  // Nothing invalid was saved, and a valid value still is.
  assert.equal(JSON.parse(cli(env, 'prefs', 'show', '--json').stdout).radiusKm, 3);
  const saved = cli(env, 'prefs', 'set', '--radius', '1.5', '--json');
  assert.equal(saved.status, 0); assert.equal(JSON.parse(saved.stdout).radiusKm, 1.5);
});

test('an unreachable Ollama is named as such, and other failures keep their wording', () => {
  const refused = Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } });
  assert.equal(modelFailure(refused), 'Ollama is not reachable; start the Ollama app or run ollama serve, then try again.');
  assert.equal(modelFailure(new TypeError('fetch failed')), modelFailure(refused));
  assert.equal(modelFailure(new Error('something else')), 'Local model unavailable or invalid output; run nikal doctor.');
  assert.equal(modelFailure(new Error('something else'), 'read the guide'), 'Local model unavailable or invalid output; read the guide.');
  assert.equal(modelFailure(new Error('Ollama model check: HTTP 404; run ollama pull qwen2.5:7b')), 'Local model is missing; pull the configured model.');
  assert.equal(modelFailure(new Error('The operation was aborted due to timeout')), 'Ollama timed out; try a longer model timeout or a warmer model.');
  assert.equal(modelFailure(new Error('Model selected an unknown candidate')), 'Local model output failed candidate validation.');
});

test('compiled CLI with no Ollama: doctor says to start it, and the card still prints as a labelled fallback', async () => {
  const env = { NIKAL_DATA_DIR: profile(), OLLAMA_BASE_URL: `http://localhost:${await closedPort()}/v1`, NIKAL_MODEL_TIMEOUT_MS: '5000' };
  const doctor = cli(env, 'doctor');
  assert.equal(doctor.status, 1);
  assert.match(doctor.stdout, /FAIL: Ollama is not reachable; start the Ollama app or run ollama serve, then try again\./);
  assert(!doctor.stdout.includes('run nikal doctor'), 'doctor must not tell the user to run doctor');

  // Offline synthetic fixture: the model step fails over to the deterministic fallback.
  const card = cli(env, '--fixture');
  assert.equal(card.status, 0);
  const lines = card.stdout.trimEnd().split('\n');
  assert.equal(lines[1], 'OFFLINE FIXTURE · synthetic data · Deterministic fallback');
  assert(lines.includes('Ollama is not reachable; start the Ollama app or run ollama serve, then try again.'));
  assert(lines.includes('Go at 5:00 PM IST (10 Oct).'));
  assert.equal(lines.at(-1), 'Close this tab. Go outside.');
});
