#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { Coordinates, Preferences, clean, type Preferences as PreferenceType } from './domain.js';
import { highlightAnswer, progressNote, useStyle } from './terminal.js';

const help = `Nikal — Your cue to step outside

  nikal                              Today's daylight, or explicitly Tomorrow
  nikal --fixture                    Synthetic data + real local model
  nikal --fixture --no-model          Fully offline deterministic demo
  nikal --json                       Inspect validated workflow facts
  nikal prefs show                   Read persisted Mastra preferences
  nikal prefs set --max-temp 30 --period morning
  nikal prefs set --radius 1.5 --lat 26.22 --lon 78.18
  nikal prefs set --intent "A quiet garden away from busy paths"
  nikal prefs reset                  Reset this local profile to defaults
  nikal chat "Prefer mornings below 30°C"  One-shot, staged preference tools
  nikal doctor                       Verify real local Mastra generation
  nikal doctor --tools               Probe actual tool-call compatibility
  nikal doctor --events              One fresh SerpApi query; skips with no key

Options: --data-dir /absolute/path, --max-aqi, --max-uv, --max-rain
An interactive terminal shows a brief progress note and a bold answer line;
NO_COLOR=1 turns the bold off. Piped output and --json are never styled.
Times display in Asia/Kolkata. Default coordinates are approximate
Gwalior city centre, not your home. No package has been published.`;

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    help: { type: 'boolean', short: 'h' }, fixture: { type: 'boolean' }, 'no-model': { type: 'boolean' }, json: { type: 'boolean' }, tools: { type: 'boolean' }, events: { type: 'boolean' },
    'data-dir': { type: 'string' }, 'max-temp': { type: 'string' }, 'max-aqi': { type: 'string' }, 'max-uv': { type: 'string' }, 'max-rain': { type: 'string' },
    period: { type: 'string' }, radius: { type: 'string' }, lat: { type: 'string' }, lon: { type: 'string' }, intent: { type: 'string' },
  } });
  if (values.help) { console.log(help); return; }
  if (values['data-dir']) process.env.NIKAL_DATA_DIR = values['data-dir'];
  const preferenceFlags = ['max-temp', 'max-aqi', 'max-uv', 'max-rain', 'period', 'radius', 'lat', 'lon', 'intent'] as const;
  if (positionals[0] !== 'prefs' && preferenceFlags.some(key => values[key] !== undefined)) throw new Error('Save preferences with nikal prefs set; recommendation runs read them from memory.');
  if (positionals[0] === 'doctor') {
    if (positionals.length > 1 || (values.tools && values.events)) throw new Error('Usage: nikal doctor [--tools | --events]');
    const { doctor, doctorEvents } = await import('./doctor.js');
    if ((values.events ? await doctorEvents() : await doctor(values.tools)) === false) process.exitCode = 1;
    return;
  }
  if (values.tools) throw new Error('--tools belongs to nikal doctor.');
  if (values.events) throw new Error('--events belongs to nikal doctor.');
  if (positionals[0] === 'chat') {
    if (positionals.length !== 2) throw new Error('Usage: nikal chat "<message>"');
    const message = positionals[1]!;
    if (!message.trim()) throw new Error('Chat message must not be empty or whitespace-only.');
    if (values.fixture || values['no-model'] || values.json) throw new Error('Chat uses local tool calling; --fixture, --no-model and --json are recommendation options.');
    const { createPreferenceMemory } = await import('./memory.js');
    const { runPreferenceChat, formatChatChanges } = await import('./chat.js');
    const memory = createPreferenceMemory();
    try {
      // Presentation only: a transient note on an interactive stderr while the model works.
      const done = progressNote(process.stderr, 'Asking the local model…');
      let result;
      try { result = await runPreferenceChat(message, memory); } finally { done(); }
      console.log(formatChatChanges(result));
      if (result.error) { console.error(`Nikal chat: ${result.error}`); process.exitCode = 1; }
    } finally { await memory.close(); }
    return;
  }
  if (positionals[0] === 'prefs') {
    if (positionals.length !== 2 || !['show', 'set', 'reset'].includes(positionals[1]!)) throw new Error('Usage: nikal prefs show|set|reset');
    if (values.fixture || values['no-model']) throw new Error('Use a separate --data-dir for fixture preferences.');
    const { createPreferenceMemory } = await import('./memory.js');
    const memory = createPreferenceMemory();
    try {
      let preferences: PreferenceType;
      if (positionals[1] === 'set') {
        const patch: Record<string, unknown> = {};
        for (const [flag, key] of [['max-temp', 'maxTemp'], ['max-aqi', 'maxAqi'], ['max-uv', 'maxUv'], ['max-rain', 'maxRain'], ['radius', 'radiusKm']] as const) {
          if (values[flag] !== undefined) patch[key] = Number(values[flag]);
        }
        if (values.period !== undefined) patch.period = values.period;
        if (values.intent !== undefined) patch.intent = values.intent;
        if (Boolean(values.lat) !== Boolean(values.lon)) throw new Error('Set --lat and --lon together.');
        if (values.lat !== undefined && values.lon !== undefined) patch.start = Coordinates.parse({ lat: Number(values.lat), lon: Number(values.lon) });
        if (!Object.keys(patch).length) throw new Error('Supply at least one preference to save.');
        const validated = Preferences.parse({ ...await memory.read(), ...patch });
        preferences = await memory.save(validated);
      } else if (positionals[1] === 'reset') preferences = await memory.reset();
      else preferences = await memory.read();
      console.log(values.json ? JSON.stringify(preferences, null, 2) : `Mastra working memory · resource nikal-local-user · thread nikal-outdoor-cue\n${JSON.stringify(preferences, null, 2)}`);
    } finally { await memory.close(); }
    return;
  }
  if (positionals.length) throw new Error('Unknown command. Run nikal --help.');
  const { createApp } = await import('./app.js');
  const app = createApp();
  try {
    const run = await app.mastra.getWorkflow('nikalWorkflow').createRun();
    // Presentation only: a transient note on an interactive stderr, erased before the card prints.
    const done = progressNote(process.stderr, 'Checking conditions and choosing a time…');
    let result;
    try { result = await run.start({ inputData: { fixture: Boolean(values.fixture), noModel: Boolean(values['no-model']) } }); } finally { done(); }
    if (result.status !== 'success') throw new Error('Workflow failed; run nikal doctor or inspect local memory.');
    // The card text is unchanged; an interactive stdout gets its answer line in bold.
    console.log(values.json ? JSON.stringify(result.result, null, 2) : highlightAnswer(result.result.card, useStyle(process.stdout)));
    if (result.result.context.mode === 'unavailable') process.exitCode = 1;
  } finally { await app.preferences.close(); }
}
main().catch(error => {
  console.error(`Nikal: ${clean(error instanceof Error ? error.message : 'Unexpected error', 500)}`);
  process.exitCode = 1;
});
