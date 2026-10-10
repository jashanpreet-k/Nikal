import { CITY_CENTRE } from './config.js';
import type { Conditions, Events, Preferences } from './domain.js';
import { distanceKm } from './tools/places.js';

// Entirely synthetic. These are not a historical or current Gwalior forecast.
export const FIXTURE_NOW = Date.parse('2026-10-10T06:30:00+05:30');
export function fixtureConditions(): Conditions {
  const hours = [
    { clock: '07:00', temperature: 29, aqi: 88, uv: 1 },
    { clock: '08:00', temperature: 30, aqi: 85, uv: 2 },
    { clock: '12:00', temperature: 36, aqi: 95, uv: 8 },
    { clock: '17:00', temperature: 31, aqi: 45, uv: 1 },
  ].map(value => {
    const time = Date.parse(`2026-10-10T${value.clock}:00+05:30`);
    return { id: String(time / 1000), time, temperature: value.temperature, aqi: value.aqi, uv: value.uv,
      rain: 5, pm25: value.aqi === 45 ? 10 : 25, sunrise: Date.parse('2026-10-10T06:15:00+05:30'), sunset: Date.parse('2026-10-10T18:00:00+05:30') };
  });
  return { hours, fetchedAt: FIXTURE_NOW, warnings: [], error: null };
}
export function fixturePlaces(start: typeof CITY_CENTRE, preferences: Preferences) {
  const places = [
    { id: 'fixture/park', name: 'Demo Green Park (synthetic)', kind: 'park' as const, lat: 26.222, lon: 78.183 },
    { id: 'fixture/garden', name: 'Demo Quiet Garden (synthetic)', kind: 'garden' as const, lat: 26.226, lon: 78.19 },
  ].map(place => ({ ...place, distanceKm: distanceKm(start, place), source: 'https://example.org/nikal-fixture' }))
    .filter(place => place.distanceKm <= preferences.radiusKm);
  return { places, warnings: [], provenance: 'fixture' as const };
}
export function fixtureEvents(): Events { return { events: [], leads: [], searchProvenance: 'fixture', warnings: ['Offline fixture: no live event search.'] }; }
