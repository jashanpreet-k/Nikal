import { z } from 'zod';
import { createTool } from '@mastra/core/tools';
import { Conditions, Coordinates, localDayStart, type Hour } from '../domain.js';
import { HttpClient, type HttpSource } from '../http.js';

const Readings = z.array(z.number().finite().nullable());
export const WeatherResponse = z.object({
  hourly: z.object({ time: z.array(z.number()), temperature_2m: Readings, precipitation_probability: Readings, uv_index: Readings }),
  daily: z.object({ time: z.array(z.number()), sunrise: Readings, sunset: Readings }),
});
export const AirResponse = z.object({ hourly: z.object({ time: z.array(z.number()), us_aqi: Readings, pm2_5: Readings }) });
type WeatherResponse = z.infer<typeof WeatherResponse>;
type AirResponse = z.infer<typeof AirResponse>;
function day(time: number): string { return new Date(time + 19800000).toISOString().slice(0, 10); }
function reading(values: (number | null)[], index: number): number | null { return values[index] ?? null; }

export function joinConditions(weather: WeatherResponse, air: AirResponse, now: number): Hour[] {
  // Unix seconds are UTC instants, independent of API array order and host timezone.
  const airByTime = new Map(air.hourly.time.map((time, index) => [time, index]));
  const sunByDay = new Map(weather.daily.time.map((time, index) => [day(time * 1000), index]));
  return weather.hourly.time.flatMap((time, index) => {
    const instant = time * 1000;
    if (instant < now || instant >= localDayStart(now) + 2 * 86400000) return [];
    const airIndex = airByTime.get(time);
    const sunIndex = sunByDay.get(day(instant));
    return [{
      id: String(time), time: instant,
      temperature: reading(weather.hourly.temperature_2m, index),
      rain: reading(weather.hourly.precipitation_probability, index), uv: reading(weather.hourly.uv_index, index),
      aqi: airIndex === undefined ? null : reading(air.hourly.us_aqi, airIndex),
      pm25: airIndex === undefined ? null : reading(air.hourly.pm2_5, airIndex),
      sunrise: sunIndex === undefined ? null : (weather.daily.sunrise[sunIndex] ?? null) === null ? null : weather.daily.sunrise[sunIndex]! * 1000,
      sunset: sunIndex === undefined ? null : (weather.daily.sunset[sunIndex] ?? null) === null ? null : weather.daily.sunset[sunIndex]! * 1000,
    }];
  }).sort((a, b) => a.time - b.time);
}

export async function fetchConditions(start: z.infer<typeof Coordinates>, now = Date.now(), http = new HttpClient()): Promise<Conditions> {
  const common = { latitude: String(start.lat), longitude: String(start.lon), timezone: 'Asia/Kolkata', timeformat: 'unixtime', forecast_days: '2' };
  const weatherURL = new URL('https://api.open-meteo.com/v1/forecast');
  weatherURL.search = new URLSearchParams({ ...common, hourly: 'temperature_2m,precipitation_probability,uv_index', daily: 'sunrise,sunset' }).toString();
  const airURL = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
  airURL.search = new URLSearchParams({ ...common, hourly: 'us_aqi,pm2_5' }).toString();
  try {
    let weatherSource: HttpSource | undefined, airSource: HttpSource | undefined;
    const [weather, air] = await Promise.all([
      http.json('Open-Meteo forecast', weatherURL.toString(), { ttl: 15 * 60000, cacheKey: `weather:${day(now)}:${weatherURL}`, report: source => { weatherSource = source; }, validate: value => WeatherResponse.parse(value) }),
      http.json('Open-Meteo air quality', airURL.toString(), { ttl: 15 * 60000, cacheKey: `air:${day(now)}:${airURL}`, report: source => { airSource = source; }, validate: value => AirResponse.parse(value) }),
    ]);
    const hours = joinConditions(weather, air, now);
    const missing = hours.some(hour => [hour.temperature, hour.rain, hour.uv, hour.aqi, hour.pm25, hour.sunrise, hour.sunset].includes(null));
    return { hours, fetchedAt: Date.now(), warnings: missing ? ['Incomplete forecast hours are excluded.'] : [], error: null, sources: { weather: weatherSource!, air: airSource! } };
  } catch (error) {
    return { hours: [], fetchedAt: Date.now(), warnings: [], error: error instanceof Error ? error.message : 'Forecast unavailable' };
  }
}

export const conditionsTool = createTool({
  id: 'fetch-conditions', description: 'Retrieve modeled hourly weather and air quality through tomorrow in IST. Try remaining daylight today, then explicitly labeled tomorrow. Missing forecast prevents recommendation.',
  inputSchema: Coordinates.extend({ now: z.number().optional() }), outputSchema: Conditions,
  execute: async ({ lat, lon, now }) => fetchConditions({ lat, lon }, now),
});
