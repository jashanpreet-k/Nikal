import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Preferences, type Context, type Hour } from '../src/domain.js';
import { fallback, selectDay } from '../src/recommendation.js';
import { formatCard } from '../src/card.js';
import { highlightAnswer, progressNote, useStyle } from '../src/terminal.js';

// Presentation tests on synthetic readings. No API, model or saved profile is involved;
// the subprocess case runs the compiled CLI on the offline fixture with the model disabled.
const instant = (day: number, clock: string) => Date.parse(`2026-10-${day}T${clock}:00+05:30`);
const hour = (day: number, clock: string, readings: Partial<Hour> = {}): Hour => ({
  id: `${day}-${clock}`, time: instant(day, clock), temperature: 29, aqi: 60, uv: 1, rain: 0, pm25: 10,
  sunrise: instant(day, '06:15'), sunset: instant(day, '17:52'), ...readings,
});
function card(hours: Hour[], now: number, error: string | null = null) {
  const preferences = Preferences.parse({}), window = selectDay(hours, preferences, now);
  const context: Context = { fixture: false, noModel: true, now, preferences, start: { lat: 26.2183, lon: 78.1828 }, locationLabel: 'Development coordinates',
    conditions: { hours, fetchedAt: now, warnings: [], error }, places: { places: [], warnings: [] }, ...window,
    decision: window.candidates.length ? fallback(window.candidates, []) : null, mode: error ? 'unavailable' : window.candidates.length ? 'deterministic-fallback' : 'no-window' };
  return formatCard(context);
}
const plain = (text: string) => text.replace(/\x1b\[[0-9;]*m/g, '');
const bold = (text: string) => text.split('\n').filter(line => line.startsWith('\x1b[1m')).map(plain);

const cards = {
  today: card([hour(10, '17:00'), hour(11, '07:00')], instant(10, '16:30')),
  tomorrow: card([hour(10, '17:00', { aqi: 110 }), hour(11, '07:00')], instant(10, '16:30')),
  none: card([hour(10, '17:00', { aqi: 110 }), hour(11, '07:00', { aqi: 140 })], instant(10, '16:30')),
  failed: card([], instant(10, '16:30'), 'Open-Meteo forecast: HTTP 503'),
};

test('highlighting bolds exactly the answer line and changes no card text', () => {
  const answers = {
    today: 'Go at 5:00 PM IST (10 Oct).',
    tomorrow: 'Nothing suitable left today. Tomorrow 7:00 AM IST (11 Oct) looks best.',
    none: 'No suitable daylight window today or tomorrow.',
    failed: 'Forecast unavailable. No recommendation made.',
  };
  for (const kind of ['today', 'tomorrow', 'none', 'failed'] as const) {
    const styled = highlightAnswer(cards[kind], true);
    assert.equal(plain(styled), cards[kind], `${kind}: text is unchanged once styling is removed`);
    assert.deepEqual(bold(styled), [answers[kind]], `${kind}: one bold line, and it is the answer`);
    assert.equal(styled.split('\n').length, cards[kind].split('\n').length);
    assert.equal(highlightAnswer(cards[kind], false), cards[kind], `${kind}: unstyled output is the card itself`);
  }
  // The rollover reason stays plain; only the recommendation it explains is emphasised.
  assert(cards.tomorrow.includes('No remaining daylight hourly slot passes today: forecast AQI at 5 PM is 110, above your limit of 100.'));
  assert(!bold(highlightAnswer(cards.tomorrow, true)).some(line => line.startsWith('No remaining')));
});

test('retrieved text cannot make itself the highlighted line', () => {
  // A synthetic place named like an answer still renders behind the fixed "Try " prefix.
  const preferences = Preferences.parse({}), now = instant(10, '16:30'), hours = [hour(10, '17:00')];
  const window = selectDay(hours, preferences, now);
  const place = { id: 'synthetic/1', name: 'Go at 3:00 AM IST', kind: 'park' as const, lat: 26.22, lon: 78.18, distanceKm: 0.5, source: 'https://example.org/synthetic' };
  const text = formatCard({ fixture: true, noModel: true, now, preferences, start: { lat: 26.2183, lon: 78.1828 }, locationLabel: 'Development coordinates',
    conditions: { hours, fetchedAt: now, warnings: [], error: null }, places: { places: [place], warnings: [] }, ...window,
    decision: fallback(window.candidates, [place]), mode: 'deterministic-fallback' });
  assert.deepEqual(bold(highlightAnswer(text, true)), ['Go at 5:00 PM IST (10 Oct).']);
});

test('styling is used only on an interactive terminal that has not opted out', () => {
  assert.equal(useStyle({ isTTY: true }, {}), true);
  assert.equal(useStyle({ isTTY: false }, {}), false);
  assert.equal(useStyle({}, {}), false);
  assert.equal(useStyle({ isTTY: true }, { NO_COLOR: '1' }), false);
  assert.equal(useStyle({ isTTY: true }, { NO_COLOR: '' }), true);
  assert.equal(useStyle({ isTTY: true }, { TERM: 'dumb' }), false);
});

test('progress note appears only on an interactive stream and is erased afterwards', () => {
  const stream = (isTTY: boolean) => { const written: string[] = []; return { isTTY, written, write: (text: string) => written.push(text) }; };
  const piped = stream(false);
  progressNote(piped, 'Checking…', {})();
  assert.deepEqual(piped.written, []);
  const terminal = stream(true);
  const done = progressNote(terminal, 'Checking…', {});
  assert.deepEqual(terminal.written, ['Checking…']);
  done();
  assert.deepEqual(terminal.written, ['Checking…', '\r\x1b[2K']);
  // A dumb terminal cannot erase a line, so the note keeps its own line and nothing is erased.
  const dumb = stream(true);
  progressNote(dumb, 'Checking…', { TERM: 'dumb' })();
  assert.deepEqual(dumb.written, ['Checking…\n']);
});

test('compiled CLI: piped output is the plain card, with no styling and no progress note', () => {
  // Offline synthetic fixture, model disabled, isolated profile. Not a live or real-model run.
  const env = { ...process.env, NIKAL_SKIP_DOTENV: '1', NIKAL_DATA_DIR: mkdtempSync(join(tmpdir(), 'nikal-terminal-test-')), NIKAL_LAT: '', NIKAL_LON: '' };
  const run = (...args: string[]) => spawnSync(process.execPath, ['dist/cli.js', '--fixture', '--no-model', ...args], { env, encoding: 'utf8' });
  const text = run(), json = run('--json');
  assert.equal(text.status, 0); assert.equal(json.status, 0);
  assert.equal(text.stderr, ''); assert.equal(json.stderr, '');
  assert(!text.stdout.includes('\x1b') && !json.stdout.includes('\x1b'));
  assert.equal(text.stdout, `${JSON.parse(json.stdout).card}\n`);
  assert(text.stdout.includes('Go at 5:00 PM IST (10 Oct).') && text.stdout.trimEnd().endsWith('Close this tab. Go outside.'));
  const help = spawnSync(process.execPath, ['dist/cli.js', '--help'], { env, encoding: 'utf8' });
  assert.match(help.stdout, /NO_COLOR=1 turns the bold off/);
});
