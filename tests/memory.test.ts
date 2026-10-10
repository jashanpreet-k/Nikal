import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('genuine Mastra working memory survives separate CLI processes and changes the workflow', () => {
  const directory = mkdtempSync(join(tmpdir(), 'nikal-process-test-'));
  const env = { ...process.env, NIKAL_DATA_DIR: directory, NIKAL_LAT: '', NIKAL_LON: '' };
  const run = (...args: string[]) => JSON.parse(execFileSync(process.execPath, ['dist/cli.js', ...args, '--json'], { env, encoding: 'utf8' }));
  const before = run('--fixture', '--no-model');
  run('prefs', 'set', '--radius', '1.5', '--intent', 'A quiet garden');
  run('prefs', 'set', '--max-temp', '30', '--period', 'morning');
  const preferences = run('prefs', 'show');
  assert.equal(preferences.maxTemp, 30);
  assert.equal(preferences.period, 'morning');
  assert.equal(preferences.radiusKm, 1.5); // patch must not reset unrelated saved fields
  assert.equal(preferences.intent, 'A quiet garden');
  const after = run('--fixture', '--no-model');
  assert.notEqual(before.context.decision.timeId, after.context.decision.timeId);
  assert.match(after.card, /Remembered: ≤30°C · morning · 1.5 km/);
  assert.match(after.card, /OFFLINE FIXTURE/);
  assert.match(after.card, /Deterministic fallback/);
  assert(after.card.endsWith('Close this tab. Go outside.'));
  const invalid = execFileSync(process.execPath, ['dist/cli.js', 'prefs', 'show', '--json'], { env, encoding: 'utf8' });
  assert.throws(() => execFileSync(process.execPath, ['dist/cli.js', 'prefs', 'set', '--max-temp', 'oops'], { env, encoding: 'utf8', stdio: 'pipe' }));
  assert.equal(execFileSync(process.execPath, ['dist/cli.js', 'prefs', 'show', '--json'], { env, encoding: 'utf8' }), invalid);
  run('prefs', 'set', '--lat', '26.22', '--lon', '78.18');
  assert.deepEqual(run('prefs', 'show').start, { lat: 26.22, lon: 78.18 });
  run('prefs', 'reset');
  assert.equal(run('prefs', 'show').start, null);
});
