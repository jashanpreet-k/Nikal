import { Decision, localDayStart, localHour, type Events, type Hour, type Place, type Preferences } from './domain.js';
import { unconfirmedLeadCandidates } from './leads.js';

export function candidates(hours: Hour[], preferences: Preferences, now: number, until = now + 12 * 3600000): Hour[] {
  return hours.filter(hour => {
    const p = preferences;
    if (hour.time < now || hour.time > until) return false;
    if ([hour.temperature, hour.rain, hour.uv, hour.aqi, hour.pm25, hour.sunrise, hour.sunset].some(value => value === null)) return false;
    if (hour.temperature! > p.maxTemp || hour.rain! > p.maxRain || hour.uv! > p.maxUv || hour.aqi! > p.maxAqi) return false;
    if (hour.rain! < 0 || hour.rain! > 100 || hour.aqi! < 0 || hour.pm25! < 0 || hour.uv! < 0 || hour.temperature! < -90 || hour.temperature! > 60) return false;
    // Recommend only daylight hours, with at least 30 minutes before sunset.
    if (hour.time < hour.sunrise! || hour.time + 30 * 60000 > hour.sunset!) return false;
    const clock = localHour(hour.time);
    return p.period === 'any' || (p.period === 'morning' ? clock >= 5 && clock < 12 : clock >= 16 && clock < 20);
  });
}

export function selectDay(hours: Hour[], preferences: Preferences, now: number) {
  const tomorrow = localDayStart(now) + 86400000;
  const today = candidates(hours, preferences, now, tomorrow).filter(hour => hour.time < tomorrow);
  if (today.length) return { candidates: today, recommendationDay: 'today' as const };
  // The complete next IST day deliberately extends the old 12-hour horizon.
  const nextDay = tomorrow + 86400000;
  return { candidates: candidates(hours, preferences, tomorrow, nextDay).filter(hour => hour.time < nextDay), recommendationDay: 'tomorrow' as const };
}

export function validateDecision(value: unknown, times: Hour[], places: Place[], preferences: Preferences, events?: Events): Decision {
  const decision = Decision.parse(value);
  const hour = times.find(time => time.id === decision.timeId);
  const place = places.find(place => place.id === decision.placeId);
  if (!hour || (places.length > 0 ? !place : decision.placeId !== null)) throw new Error('Model selected an unknown candidate');
  if (place && place.distanceKm > preferences.radiusKm) throw new Error('Model exceeded the remembered radius');
  if (decision.reason === 'cooler' && hour.temperature !== Math.min(...times.map(time => time.temperature!))) throw new Error('Cooler explanation is not grounded');
  if (decision.reason === 'cleaner-air' && hour.aqi !== Math.min(...times.map(time => time.aqi!))) throw new Error('Air explanation is not grounded');
  if (decision.reason === 'closer' && (!place || place.distanceKm !== Math.min(...places.map(place => place.distanceKm)))) throw new Error('Distance explanation is not grounded');
  if (decision.reason === 'morning' && !(localHour(hour.time) >= 5 && localHour(hour.time) < 12)) throw new Error('Morning explanation is not grounded');
  if (decision.reason === 'evening' && localHour(hour.time) < 16) throw new Error('Evening explanation is not grounded');
  if (decision.reason === 'green-space' && (!place || place.kind === 'path')) throw new Error('Green-space explanation is not grounded');
  if (decision.leadId != null && !unconfirmedLeadCandidates(events).some(lead => lead.id === decision.leadId)) {
    throw new Error('Model selected an unknown candidate lead');
  }
  return decision;
}

export function fallback(times: Hour[], places: Place[]): Decision {
  // Explicit fallback only: favor lower AQI, then heat and rain; paths rank after green spaces.
  const time = [...times].sort((a, b) => (a.aqi! + a.temperature! * 2 + a.rain!) - (b.aqi! + b.temperature! * 2 + b.rain!) || a.time - b.time)[0]!;
  const place = [...places].sort((a, b) => Number(a.kind === 'path') - Number(b.kind === 'path') || a.distanceKm - b.distanceKm)[0];
  return { timeId: time.id, placeId: place?.id ?? null, reason: 'balanced' };
}
