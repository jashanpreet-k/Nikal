import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Mastra } from '@mastra/core/mastra';
import { Preferences, type Context, type Hour } from '../src/domain.js';
import { candidates, explainTodayRejection, fallback, selectDay } from '../src/recommendation.js';
import { formatCard } from '../src/card.js';
import { createPreferenceMemory } from '../src/memory.js';
import { createNikalAgent } from '../src/agent.js';
import { createNikalWorkflow } from '../src/workflow.js';
import { conditionsTool } from '../src/tools/conditions.js';
import { placesTool } from '../src/tools/places.js';
import { eventsTool } from '../src/tools/events.js';

// Every reading here is synthetic. No API, model or saved profile is used except where a
// test says it runs the real Mastra workflow with mocked retrieval and an isolated SQLite file.
const instant = (day: number, clock: string) => Date.parse(`2026-10-${day}T${clock}:00+05:30`);
const hour = (day: number, clock: string, readings: Partial<Hour> = {}): Hour => ({
  id: `${day}-${clock}`, time: instant(day, clock), temperature: 29, aqi: 60, uv: 1, rain: 0, pm25: 10,
  sunrise: instant(day, '06:15'), sunset: instant(day, '17:52'), ...readings,
});
const tomorrow = [hour(11, '07:00'), hour(11, '08:00', { temperature: 27.5 })];
const HEAD = 'No remaining daylight hourly slot passes today: ';
// The unchanged deterministic fallback prefers the 27.5°C slot at 8 AM over 29°C at 7 AM.
const ROLLOVER = 'Nothing suitable left today. Tomorrow 8:00 AM IST (11 Oct) looks best.';

function card(hours: Hour[], now: number, preferences = Preferences.parse({})) {
  const window = selectDay(hours, preferences, now);
  const context: Context = { fixture: false, noModel: true, now, preferences, start: { lat: 26.2183, lon: 78.1828 }, locationLabel: 'Development coordinates',
    conditions: { hours, fetchedAt: now, warnings: [], error: null }, places: { places: [], warnings: [] }, ...window,
    decision: window.candidates.length ? fallback(window.candidates, []) : null, mode: window.candidates.length ? 'deterministic-fallback' : 'no-window' };
  return { window, context, lines: formatCard(context).split('\n') };
}
const explained = (lines: string[]) => lines.filter(line => line.startsWith('No remaining daylight hourly slot') || line.startsWith('No hourly slot remains'));

test('AQI rejection names the hour, its forecast value and the saved limit', () => {
  const now = instant(10, '16:30');
  const hours = [hour(10, '17:00', { aqi: 110 }), hour(10, '18:00', { aqi: 125 }), ...tomorrow];
  const expected = `${HEAD}forecast AQI at 5 PM is 110, above your limit of 100.`;
  assert.equal(explainTodayRejection(hours, Preferences.parse({}), now), expected);
  const { window, lines } = card(hours, now);
  assert.equal(window.recommendationDay, 'tomorrow');
  assert.deepEqual(explained(lines), [expected]);
  // The reason sits directly above the rollover line, away from tomorrow's own readings.
  assert.equal(lines.indexOf(expected) + 1, lines.indexOf(ROLLOVER));
  // 6 PM is past the daylight cutoff, so its reading is not offered as the reason.
  assert(!expected.includes('6 PM') && !expected.includes('125'));
  assert.equal(explainTodayRejection([hour(10, '17:00', { aqi: 90 }), ...tomorrow], Preferences.parse({ maxAqi: 80 }), now),
    `${HEAD}forecast AQI at 5 PM is 90, above your limit of 80.`);
});

test('another comfort threshold: temperature, UV index and rain chance use the saved limits', () => {
  const defaults = Preferences.parse({});
  assert.equal(explainTodayRejection([hour(10, '16:00', { temperature: 34.5 }), ...tomorrow], defaults, instant(10, '15:30')),
    `${HEAD}temperature at 4 PM is 34.5°C, above your limit of 32°C.`);
  assert.equal(explainTodayRejection([hour(10, '16:00', { temperature: 31 }), ...tomorrow], Preferences.parse({ maxTemp: 30 }), instant(10, '15:30')),
    `${HEAD}temperature at 4 PM is 31°C, above your limit of 30°C.`);
  assert.equal(explainTodayRejection([hour(10, '11:00', { uv: 7 }), ...tomorrow], defaults, instant(10, '10:30')),
    `${HEAD}UV index at 11 AM is 7, above your limit of 5.`);
  const rainy = [hour(10, '15:00', { rain: 60 }), ...tomorrow];
  assert.equal(explainTodayRejection(rainy, defaults, instant(10, '14:30')), `${HEAD}rain chance at 3 PM is 60%, above your limit of 30%.`);
  assert.deepEqual(explained(card(rainy, instant(10, '14:30')).lines), [`${HEAD}rain chance at 3 PM is 60%, above your limit of 30%.`]);
});

test('mixed reasons across hours are attributed hour by hour, never to every slot', () => {
  const defaults = Preferences.parse({});
  const afternoon = [hour(10, '16:00', { temperature: 32.6, aqi: 108 }), hour(10, '17:00', { temperature: 31.5, aqi: 120 }), hour(10, '18:00', { aqi: 125 }), ...tomorrow];
  const line = explainTodayRejection(afternoon, defaults, instant(10, '15:17'))!;
  assert.equal(line, `${HEAD}forecast AQI is above your limit of 100 at 4 PM (108) and 5 PM (120); temperature at 4 PM is 32.6°C, above your limit of 32°C.`);
  assert(!line.split('; ')[1]!.includes('5 PM'));
  assert.deepEqual(explained(card(afternoon, instant(10, '15:17')).lines), [line]);

  // Many slots collapse to a count and a span; a second reason keeps its own hours.
  const day = Array.from({ length: 11 }, (_, index) => hour(10, `${String(7 + index).padStart(2, '0')}:00`, { aqi: 150 + index, uv: index === 5 || index === 6 ? 6 : 1 }));
  assert.equal(explainTodayRejection([...day, ...tomorrow], defaults, instant(10, '06:30')),
    `${HEAD}forecast AQI is above your limit of 100 in 11 slots from 7 AM to 5 PM (150 to 160); UV index is above your limit of 5 at 12 PM (6) and 1 PM (6).`);

  // A saved period preference is a reason of its own and is reported beside a threshold.
  const mornings = Preferences.parse({ period: 'morning' });
  assert.equal(explainTodayRejection([hour(10, '16:00'), hour(10, '17:00'), ...tomorrow], mornings, instant(10, '15:00')),
    `${HEAD}4 PM and 5 PM are outside your morning preference.`);
  assert.equal(explainTodayRejection([hour(10, '16:00'), hour(10, '17:00', { aqi: 120 }), ...tomorrow], mornings, instant(10, '15:00')),
    `${HEAD}4 PM and 5 PM are outside your morning preference; forecast AQI at 5 PM is 120, above your limit of 100.`);
});

test('missing readings are described as missing, with no invented value or limit comparison', () => {
  const defaults = Preferences.parse({}), now = instant(10, '16:30');
  const gaps = [hour(10, '17:00', { aqi: null, pm25: null }), ...tomorrow];
  const line = explainTodayRejection(gaps, defaults, now)!;
  assert.equal(line, `${HEAD}AQI and PM2.5 readings are missing at 5 PM.`);
  assert(!/above your limit|null|NaN|undefined|\b0\b/.test(line));
  assert.deepEqual(explained(card(gaps, now).lines), [line]);
  assert.equal(explainTodayRejection([hour(10, '17:00', { temperature: null }), ...tomorrow], defaults, now), `${HEAD}the temperature reading is missing at 5 PM.`);
  // Without a sunset the daylight rule cannot be applied, so the slot is reported, not dropped.
  assert.equal(explainTodayRejection([hour(10, '17:00', { sunset: null }), ...tomorrow], defaults, now), `${HEAD}the sunset reading is missing at 5 PM.`);
  assert.equal(explainTodayRejection([hour(10, '16:00', { aqi: 108 }), hour(10, '17:00', { aqi: null }), ...tomorrow], defaults, instant(10, '15:30')),
    `${HEAD}forecast AQI at 4 PM is 108, above your limit of 100; the AQI reading is missing at 5 PM.`);
});

test('no remaining daylight hourly slot is stated as such, about slots rather than minutes', () => {
  const defaults = Preferences.parse({});
  const evening = [hour(10, '18:00'), hour(10, '19:00'), ...tomorrow];
  const cutoff = 'No hourly slot remains today before the daylight cutoff, 30 minutes before the 5:52 PM sunset.';
  // 5:40 PM is still before sunset; the line is about hourly slots, and none is left.
  assert.equal(explainTodayRejection(evening, defaults, instant(10, '17:40')), cutoff);
  const { window, lines } = card(evening, instant(10, '17:40'));
  assert.equal(window.recommendationDay, 'tomorrow');
  assert.deepEqual(explained(lines), [cutoff]);
  // A 5 PM slot with under 30 minutes of daylight left is past the cutoff too.
  assert.equal(explainTodayRejection([hour(10, '17:00', { sunset: instant(10, '17:20') }), ...tomorrow], defaults, instant(10, '16:30')),
    'No hourly slot remains today before the daylight cutoff, 30 minutes before the 5:20 PM sunset.');
  // Late at night no forecast hour is left today, so no sunset is quoted either.
  assert.equal(explainTodayRejection(tomorrow, defaults, instant(10, '23:30')), 'No hourly slot remains today before the daylight cutoff.');
});

test('no explanation when a slot passes today, on forecast failure, or with no window at all', () => {
  const defaults = Preferences.parse({}), now = instant(10, '15:30');
  const hours = [hour(10, '16:00', { aqi: 110 }), hour(10, '17:00'), ...tomorrow];
  assert.equal(explainTodayRejection(hours, defaults, now), null);
  const today = card(hours, now);
  assert.equal(today.window.recommendationDay, 'today');
  assert.deepEqual(explained(today.lines), []);
  assert(today.lines.includes('Go at 5:00 PM IST (10 Oct).'));

  const none = card([hour(10, '17:00', { aqi: 110 }), hour(11, '07:00', { aqi: 140 })], instant(10, '16:30'));
  assert.equal(none.context.mode, 'no-window');
  assert.deepEqual(explained(none.lines), []);
  assert(none.lines.includes('No suitable daylight window today or tomorrow.'));

  const failed = formatCard({ ...none.context, mode: 'unavailable', conditions: { hours: [], fetchedAt: now, warnings: [], error: 'Open-Meteo forecast: HTTP 503' } }).split('\n');
  assert.deepEqual(explained(failed), []);
  assert(failed.includes('Forecast unavailable. No recommendation made.'));
  for (const lines of [today.lines, none.lines, failed]) assert.equal(lines.at(-1), 'Close this tab. Go outside.');
});

test('real Mastra workflow with mocked retrieval: tomorrow recommendation and its facts are unchanged', async t => {
  // Mocked retrieval, no model, isolated SQLite. Not a live or real-model run.
  const preferences = createPreferenceMemory(mkdtempSync(join(tmpdir(), 'nikal-today-rejection-')));
  try {
    const now = instant(10, '15:17');
    t.mock.method(Date, 'now', () => now);
    const hours = [hour(10, '16:00', { temperature: 32.6, aqi: 108 }), hour(10, '17:00', { temperature: 31.5, aqi: 120 }), hour(10, '18:00', { aqi: 125 }), ...tomorrow];
    const replaceExecution = (tool: { execute?: unknown }, implementation: () => Promise<unknown>) => {
      const original = tool.execute; tool.execute = implementation;
      t.after(() => { tool.execute = original; });
    };
    replaceExecution(conditionsTool, async () => ({ hours, fetchedAt: now, warnings: [], error: null }));
    replaceExecution(placesTool, async () => ({ places: [], warnings: [], provenance: 'unavailable' }));
    replaceExecution(eventsTool, async () => ({ events: [], leads: [], warnings: [], searchProvenance: 'skipped' }));
    const agent = createNikalAgent(preferences);
    const workflow = createNikalWorkflow(preferences, agent);
    const mastra = new Mastra({ workflows: { workflow }, agents: { agent }, storage: preferences.storage, logger: false });
    const result = await (await mastra.getWorkflow('workflow').createRun()).start({ inputData: { fixture: false, noModel: true } });
    assert.equal(result.status, 'success');
    if (result.status !== 'success') throw new Error('Mocked rollover workflow failed');
    const { context, card: text } = result.result;

    // The decision still comes from the unchanged selection and fallback over tomorrow's hours.
    const expected = selectDay(hours, Preferences.parse({}), now);
    assert.equal(context.recommendationDay, 'tomorrow');
    assert.deepEqual(context.candidates?.map(item => item.id), expected.candidates.map(item => item.id));
    assert.deepEqual(context.candidates?.map(item => item.id), ['11-07:00', '11-08:00']);
    assert.deepEqual(context.decision, fallback(expected.candidates, []));
    assert.equal(context.mode, 'deterministic-fallback');
    assert.deepEqual(context.preferences, Preferences.parse({}));

    const lines = text.split('\n');
    const why = `${HEAD}forecast AQI is above your limit of 100 at 4 PM (108) and 5 PM (120); temperature at 4 PM is 32.6°C, above your limit of 32°C.`;
    assert.deepEqual(explained(lines), [why]);
    const at = lines.indexOf(why);
    assert.deepEqual(lines.slice(at + 1, at + 4), [ROLLOVER, 'Forecast US AQI 60 · 27.5°C · sunset 5:52 PM.', 'Rain 0% · UV 1 · PM2.5 10 µg/m³.']);
    assert.equal(lines[0], 'NIKAL — Your cue to step outside');
    assert.equal(lines.at(-1), 'Close this tab. Go outside.');
    assert.equal(text.split('NIKAL —').length, 2);
    // Apart from that one line, the card is exactly what the same facts render without it.
    assert.deepEqual(lines.filter(line => line !== why), formatCard({ ...context, conditions: undefined }).split('\n'));
  } finally { await preferences.close(); }
});

test('explanation agrees with the unchanged candidates() filter for every synthetic slot', () => {
  const now = instant(10, '04:30'), end = instant(11, '00:00');
  let accepted = 0, rejected = 0;
  for (const clock of ['05:00', '07:00', '12:00', '17:00', '18:00'])
  for (const temperature of [null, 20, 32, 32.1, 61])
  for (const aqi of [null, 50, 100, 101, -1])
  for (const uv of [null, 1, 5.1])
  for (const rain of [null, 0, 31, 101])
  for (const pm25 of [null, 10, -1])
  for (const period of ['any', 'morning', 'evening'] as const) {
    const slot = hour(10, clock, { temperature, aqi, uv, rain, pm25 });
    const preferences = Preferences.parse({ period });
    const eligible = candidates([slot], preferences, now, end).length === 1;
    const line = explainTodayRejection([slot], preferences, now);
    // An eligible slot has no rejection to report; an ineligible one always gets a stated reason.
    if (eligible) { accepted++; assert.equal(line, null); }
    else { rejected++; assert.equal(typeof line, 'string'); assert(!/null|NaN|undefined/.test(line!)); }
  }
  assert(accepted > 0 && rejected > accepted);
});
