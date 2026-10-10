import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCard } from '../src/card.js';
import { CITY_CENTRE } from '../src/config.js';
import { Preferences, type Events } from '../src/domain.js';
import { FIXTURE_NOW } from '../src/fixtures.js';

// Artificial leads and events: this file tests rendering, not live verification.
const lead = { title: 'Synthetic Outdoor Walk', source: 'https://events.example.org/synthetic-walk' };
const event = { ...lead, startDate: '2026-10-11T07:00:00+05:30', location: 'Gwalior', checkedAt: FIXTURE_NOW };
function card(events: Events) {
  return formatCard({ fixture: true, noModel: true, now: FIXTURE_NOW, preferences: Preferences.parse({}),
    start: CITY_CENTRE, locationLabel: 'Development coordinates', mode: 'no-window', decision: null, events });
}
test('leads only: show at most two explicitly unconfirmed links', () => {
  const output = card({ events: [], warnings: [], leads: [lead,
    { ...lead, title: 'Second synthetic lead', source: `${lead.source}/second` },
    { ...lead, title: 'Third synthetic lead', source: `${lead.source}/third` }] });
  assert.equal(output.match(/Unconfirmed lead \(check the source before going\):/g)?.length, 2);
  assert(output.includes(`${lead.title} — ${lead.source}`));
  assert(!output.includes('Third synthetic lead')); assert(!output.includes('Nearby this week:'));
  assert(output.includes('No verified event found.'));
});
test('corroborated event only: source and verified timestamp remain visible', () => {
  const output = card({ events: [event], leads: [], warnings: [] });
  assert(output.includes(`Nearby this week: ${event.title}`)); assert(output.includes(event.source));
  assert(output.includes(`verified ${new Date(FIXTURE_NOW).toISOString()}`));
  assert(!output.includes('Unconfirmed lead')); assert(!output.includes('No verified event found.'));
});
test('both: corroborated event takes priority and unconfirmed leads are omitted', () => {
  const output = card({ events: [event], leads: [{ ...lead, title: 'Unconfirmed synthetic lead' }], warnings: [] });
  assert(output.includes('Nearby this week:')); assert(!output.includes('Unconfirmed synthetic lead'));
});
test('neither: report no verified event without fabricating a lead', () => {
  const output = card({ events: [], leads: [], warnings: [] });
  assert(output.includes('No verified event found.')); assert(!output.includes('Unconfirmed lead'));
});
test('malformed leads and URLs outside the display policy never appear', () => {
  const sources = ['not a URL', 'http://events.example.org/walk', 'https://u:p@example.org/walk',
    'https://127.0.0.1/walk', 'https://localhost/walk', 'https://events.internal/walk'];
  const output = card({ events: [], warnings: [], leads: [...sources.map(source => ({ title: 'Rejected synthetic lead', source })),
    { title: '', source: lead.source }, lead] });
  assert(!output.includes('Rejected synthetic lead'));
  assert.equal(output.match(/Unconfirmed lead \(/g)?.length, 1);
  assert(output.includes(lead.source));
});
test('hostile title is sanitized before terminal display', () => {
  const output = card({ events: [], warnings: [], leads: [{ ...lead, title: '\u001b[2J\nSynthetic\r\u0000 Walk\u202e' }] });
  assert(output.includes('Synthetic Walk —')); assert(!/[\x00-\x1f\x7f-\x9f\u202e]/.test(output.replaceAll('\n', '')));
});
