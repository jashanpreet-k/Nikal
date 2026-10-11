import { clean, displayDate, displayTime, type Context } from './domain.js';
import { unconfirmedLeadCandidates } from './leads.js';

const explanations = {
  cooler: 'Lowest forecast temperature among comfortable hours.',
  'cleaner-air': 'Lowest forecast AQI among comfortable hours.',
  closer: 'The nearest mapped candidate fits your radius.',
  morning: 'A morning window fits your preferences.',
  evening: 'An evening window fits your preferences.',
  'green-space': 'A mapped green space fits your walk.',
  balanced: 'Fits your saved comfort filters.',
};
export function formatCard(context: Context): string {
  const p = context.preferences;
  const status = context.fixture ? 'OFFLINE FIXTURE · synthetic data' : 'Gwalior · API forecast';
  const mode = context.mode === 'local-ai' ? 'Local AI selection' : context.mode === 'deterministic-fallback' ? 'Deterministic fallback' : 'Comfort check';
  const lines = [`NIKAL — Your cue to step outside`, `${status} · ${mode}`, context.locationLabel,
    `Remembered: ≤${p.maxTemp}°C · ${p.period} · ${p.radiusKm} km radius · AQI ≤${p.maxAqi}`];
  if (context.conditions?.sources) {
    const sources = context.conditions.sources;
    lines.push(`Weather: ${sources.weather.fromCache ? 'cache' : 'live'} · AQI: ${sources.air.fromCache ? 'cache' : 'live'}.`);
  }
  if (context.places?.provenance === 'cache') {
    const date = context.places.fetchedAt;
    if (date === undefined) throw new Error('Cached places require a fetch date');
    const fetched = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
    lines.push(`Places from cache, fetched ${fetched} IST.`);
  } else if (context.places?.provenance === 'curated') lines.push('Places: curated fallback (user-verified list).');
  else if (context.places?.provenance === 'unavailable') lines.push('Places unavailable; no usable cache or curated fallback.');
  else if (context.places?.provenance === 'live') lines.push('Places: live Overpass response.');
  if (context.conditions?.error) {
    lines.push('Forecast unavailable. No recommendation made.', clean(context.conditions.error, 160));
  } else if (!context.decision) {
    lines.push('No suitable daylight window today or tomorrow.', 'Comfort filters include daylight, UV, rain, heat and modeled AQI; incomplete hours are excluded.');
  } else {
    const hour = context.candidates?.find(hour => hour.id === context.decision!.timeId);
    if (!hour) throw new Error('Cannot render an unvalidated time');
    const place = context.places?.places.find(place => place.id === context.decision!.placeId);
    lines.push(context.recommendationDay === 'tomorrow'
      ? `Nothing suitable left today. Tomorrow ${displayTime(hour.time)} IST (${displayDate(hour.time)}) looks best.`
      : `Go at ${displayTime(hour.time)} IST (${displayDate(hour.time)}).`);
    lines.push(`Forecast US AQI ${Math.round(hour.aqi!)} · ${hour.temperature}°C · sunset ${displayTime(hour.sunset!)}.`);
    lines.push(`Rain ${hour.rain}% · UV ${hour.uv} · PM2.5 ${hour.pm25} µg/m³.`);
    if (place) lines.push(`Try ${clean(place.name)} · approximately ${place.distanceKm.toFixed(1)} km straight-line.`, place.source);
    else lines.push('Places unavailable within your radius.');
    lines.push(explanations[context.decision.reason]);
    if (context.mode === 'local-ai' && context.modelAttempts === 2) lines.push('Local model selection repaired and validated.');
  }
  const event = context.events?.events[0];
  if (context.events?.searchProvenance === 'cache') lines.push('Event search from cache.');
  if (event) {
    const checked = new Date(event.checkedAt).toISOString();
    lines.push(`Nearby this week: ${clean(event.title)} · ${event.startDate}`, event.source,
      `${event.cachedVerification ? 'Source verification from cache' : 'Source page checked'}, verified ${checked}. Confirm schedule/access; event timing may differ.`);
  }
  else {
    lines.push('No verified event found.');
    const candidates = unconfirmedLeadCandidates(context.events);
    const leads = context.mode === 'local-ai'
      ? candidates.filter(lead => lead.id === context.decision?.leadId).slice(0, 1)
      : candidates.slice(0, 2);
    for (const lead of leads) lines.push(`Unconfirmed lead (check the source before going): ${lead.title} — ${lead.source}`);
    if (context.mode === 'local-ai' && leads.length) lines.push('Event date, availability and status unconfirmed; this link is separate from the time/place cue.');
  }
  if (context.modelError) lines.push(clean(context.modelError, 150));
  const warnings = [...(context.conditions?.warnings || []), ...(context.places?.warnings || []), ...(context.events?.warnings || [])];
  // One warning per line. A shared character cap used to cut the last warning mid-word.
  lines.push(...warnings.slice(0, 6).map(warning => clean(warning, 160)).filter(Boolean));
  lines.push('Comfort filters, not medical guarantees. OSM access, hours and safety unverified.', 'Close this tab. Go outside.');
  return lines.join('\n');
}
