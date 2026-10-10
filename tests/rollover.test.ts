import test from 'node:test';
import assert from 'node:assert/strict';
import { Preferences, type Hour, type Context } from '../src/domain.js';
import { selectDay, fallback } from '../src/recommendation.js';
import { formatCard } from '../src/card.js';

const instant = (day: number, clock: string) => Date.parse(`2026-10-${day}T${clock}:00+05:30`);
const hour = (day: number, clock: string, temperature = 29, aqi = 60): Hour => ({
  id: `${day}-${clock}`, time: instant(day, clock), temperature, aqi, uv: 1, rain: 0, pm25: 10,
  sunrise: instant(day, '06:15'), sunset: instant(day, '18:00'),
});
const hours = [hour(10, '07:00'), hour(10, '17:00', 31, 40), hour(11, '07:00', 29, 60), hour(11, '08:00', 31, 40), hour(11, '17:00', 31, 30)];

test('evening rollover evaluates tomorrow beyond 12 hours and labels the single card Tomorrow', () => {
  const now = instant(10, '18:30'), preferences = Preferences.parse({});
  const window = selectDay(hours, preferences, now);
  assert.equal(window.recommendationDay, 'tomorrow');
  assert.equal(window.candidates.length, 3);
  assert(window.candidates.every(h => h.time > now + 12 * 3600000));
  const context: Context = { fixture: true, noModel: true, now, preferences, start: { lat: 26.2183, lon: 78.1828 }, locationLabel: 'Development coordinates',
    ...window, decision: fallback(window.candidates, []), mode: 'deterministic-fallback', places: { places: [], warnings: [] } };
  const card = formatCard(context);
  assert.match(card, /Nothing suitable left today\. Tomorrow/);
  assert(!card.includes('next 12 hours'));
  assert.equal(card.split('NIKAL —').length, 2);
});

test('morning run selects today instead of a cleaner tomorrow', () => {
  const window = selectDay(hours, Preferences.parse({}), instant(10, '06:30'));
  assert.equal(window.recommendationDay, 'today');
  assert.deepEqual(window.candidates.map(h => h.id), ['10-07:00', '10-17:00']);
  assert.equal(fallback(window.candidates, []).timeId, '10-17:00');
});

test('tomorrow choice respects saved 30°C and morning constraints', () => {
  const window = selectDay(hours, Preferences.parse({ maxTemp: 30, period: 'morning' }), instant(10, '18:30'));
  assert.equal(window.recommendationDay, 'tomorrow');
  assert.deepEqual(window.candidates.map(h => h.id), ['11-07:00']);
  assert.equal(fallback(window.candidates, []).timeId, '11-07:00');
});

test('missing or uncomfortable tomorrow readings never produce a rollover candidate', () => {
  const window = selectDay([hour(11, '07:00', 35), { ...hour(11, '08:00'), aqi: null }], Preferences.parse({ maxTemp: 30 }), instant(10, '20:00'));
  assert.equal(window.candidates.length, 0);
});

test('a passing late-today hour is retained even if it lies beyond the original 12 hours', () => {
  const window = selectDay(hours, Preferences.parse({ period: 'evening' }), instant(10, '00:15'));
  assert.equal(window.recommendationDay, 'today');
  assert.deepEqual(window.candidates.map(h => h.id), ['10-17:00']);
});
