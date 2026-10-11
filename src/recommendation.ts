import { Decision, displayTime, localDayStart, localHour, type Events, type Hour, type Place, type Preferences } from './domain.js';
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

const READINGS = [['temperature', 'temperature'], ['rain', 'rain chance'], ['uv', 'UV index'], ['aqi', 'AQI'], ['pm25', 'PM2.5'], ['sunrise', 'sunrise'], ['sunset', 'sunset']] as const;
const LIMITS = [['temperature', 'maxTemp', 'temperature', '°C'], ['rain', 'maxRain', 'rain chance', '%'], ['uv', 'maxUv', 'UV index', ''], ['aqi', 'maxAqi', 'forecast AQI', '']] as const;
const slot = (hour: Hour) => displayTime(hour.time).replace(':00', '');
const list = (items: string[]) => items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
const range = (hours: Hour[]) => `${hours.length} slots from ${slot(hours[0]!)} to ${slot(hours.at(-1)!)}`;
const when = (hours: Hour[]) => hours.length <= 3 ? `at ${list(hours.map(slot))}` : `in ${range(hours)}`;

// One card line for a tomorrow rollover: why no remaining hourly slot passed today.
// Mirrors candidates() rule for rule over the same hours, preferences and clock, without
// changing it. A missing reading is reported as missing, never as a limit being exceeded.
export function explainTodayRejection(hours: Hour[], preferences: Preferences, now: number): string | null {
  const p = preferences, tomorrow = localDayStart(now) + 86400000;
  const remaining = hours.filter(hour => hour.time >= now && hour.time < tomorrow).sort((a, b) => a.time - b.time);
  // Hourly slots outside daylight are never candidates, whatever their readings say.
  const slots = remaining.filter(hour => hour.sunrise === null || hour.sunset === null || (hour.time >= hour.sunrise && hour.time + 30 * 60000 <= hour.sunset));
  if (!slots.length) {
    const sunset = remaining.find(hour => hour.sunset !== null)?.sunset;
    return `No hourly slot remains today before the daylight cutoff${sunset == null ? '' : `, 30 minutes before the ${displayTime(sunset)} sunset`}.`;
  }
  const reasons = new Map<string, { hours: Hour[]; text: (hours: Hour[]) => string }>();
  for (const hour of slots) {
    let rejected = false;
    const reject = (key: string, text: (hours: Hour[]) => string) => {
      rejected = true;
      const reason = reasons.get(key) ?? { hours: [], text };
      reason.hours.push(hour); reasons.set(key, reason);
    };
    const missing = READINGS.filter(([field]) => hour[field] === null).map(([, label]) => label);
    if (missing.length) reject(`missing:${missing.join()}`, at => `${missing.length === 1 ? `the ${missing[0]} reading is` : `${list(missing)} readings are`} missing ${when(at)}`);
    for (const [field, max, label, unit] of LIMITS) {
      const value = hour[field], limit = `${p[max]}${unit}`;
      if (value === null || value <= p[max]) continue;
      reject(field, at => {
        const shown = (item: Hour) => `${item[field]}${unit}`;
        if (at.length === 1) return `${label} at ${slot(at[0]!)} is ${shown(at[0]!)}, above your limit of ${limit}`;
        if (at.length <= 3) return `${label} is above your limit of ${limit} at ${list(at.map(item => `${slot(item)} (${shown(item)})`))}`;
        const values = at.map(item => item[field]!);
        return `${label} is above your limit of ${limit} in ${range(at)} (${Math.min(...values)}${unit} to ${Math.max(...values)}${unit})`;
      });
    }
    const { temperature, rain, uv, aqi, pm25 } = hour;
    if ((rain !== null && (rain < 0 || rain > 100)) || (aqi !== null && aqi < 0) || (pm25 !== null && pm25 < 0) || (uv !== null && uv < 0) || (temperature !== null && (temperature < -90 || temperature > 60))) {
      reject('implausible', at => `the forecast has an implausible reading ${when(at)}`);
    }
    const clock = localHour(hour.time);
    if (p.period !== 'any' && !(p.period === 'morning' ? clock >= 5 && clock < 12 : clock >= 16 && clock < 20)) {
      reject('period', at => `${at.length <= 3 ? list(at.map(slot)) : range(at)} ${at.length === 1 ? 'is' : 'are'} outside your ${p.period} preference`);
    }
    // candidates() would accept this slot, so there is no truthful rejection to report.
    if (!rejected) return null;
  }
  const clauses = [...reasons.values()].sort((a, b) => b.hours.length - a.hours.length).map(reason => reason.text(reason.hours));
  return `No remaining daylight hourly slot passes today: ${clauses.join('; ')}.`;
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
