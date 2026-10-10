import { z } from 'zod';

export const Coordinates = z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) });
export const Preferences = z.object({
  maxTemp: z.number().min(5).max(45).default(32),
  maxAqi: z.number().min(0).max(150).default(100),
  maxUv: z.number().min(0).max(12).default(5),
  maxRain: z.number().min(0).max(100).default(30),
  period: z.enum(['any', 'morning', 'evening']).default('any'),
  radiusKm: z.number().min(0.1).max(3).default(3),
  start: Coordinates.nullable().default(null),
  intent: z.string().max(300).default('A short, comfortable walk in a green space.'),
});
export type Preferences = z.infer<typeof Preferences>;
export const Hour = z.object({
  id: z.string(), time: z.number(), temperature: z.number().nullable(),
  rain: z.number().nullable(), uv: z.number().nullable(), aqi: z.number().nullable(),
  pm25: z.number().nullable(), sunrise: z.number().nullable(), sunset: z.number().nullable(),
});
export type Hour = z.infer<typeof Hour>;
export const Conditions = z.object({ hours: z.array(Hour), fetchedAt: z.number(), warnings: z.array(z.string()), error: z.string().nullable(),
  sources: z.object({ weather: z.object({ fromCache: z.boolean(), fetchedAt: z.number() }), air: z.object({ fromCache: z.boolean(), fetchedAt: z.number() }) }).optional(),
});
export type Conditions = z.infer<typeof Conditions>;
export const Place = z.object({ id: z.string(), name: z.string(), kind: z.enum(['park', 'garden', 'path']), lat: z.number(), lon: z.number(), distanceKm: z.number(), source: z.string() });
export type Place = z.infer<typeof Place>;
export const Places = z.object({ places: z.array(Place), warnings: z.array(z.string()),
  provenance: z.enum(['live', 'cache', 'curated', 'fixture', 'unavailable']).optional(), fetchedAt: z.number().optional(),
});
export const Event = z.object({ title: z.string(), startDate: z.string(), location: z.string(), source: z.url().refine(value => new URL(value).protocol === 'https:'), checkedAt: z.number(), cachedVerification: z.boolean().optional() });
export type Event = z.infer<typeof Event>;
export const Events = z.object({ events: z.array(Event), leads: z.array(z.object({ title: z.string(), source: z.string() })), warnings: z.array(z.string()),
  searchProvenance: z.enum(['live', 'cache', 'skipped', 'failed', 'fixture']).optional(),
});
export type Events = z.infer<typeof Events>;
export const Decision = z.object({
  timeId: z.string(), placeId: z.string().nullable(),
  reason: z.enum(['cooler', 'cleaner-air', 'closer', 'morning', 'evening', 'green-space', 'balanced']),
  leadId: z.string().nullable().optional(), // One unconfirmed link, or none; never an event/time/place fact.
}).strict();
export type Decision = z.infer<typeof Decision>;
export const RunInput = z.object({ fixture: z.boolean().default(false), noModel: z.boolean().default(false) });
export const Context = RunInput.extend({
  now: z.number(), preferences: Preferences, start: Coordinates, locationLabel: z.string(),
  conditions: Conditions.optional(), places: Places.optional(), events: Events.optional(),
  candidates: z.array(Hour).optional(), decision: Decision.nullable().optional(),
  mode: z.enum(['local-ai', 'deterministic-fallback', 'no-window', 'unavailable']).optional(),
  modelError: z.string().optional(),
  modelAttempts: z.number().int().min(0).max(2).optional(),
  recommendationDay: z.enum(['today', 'tomorrow']).optional(),
});
export type Context = z.infer<typeof Context>;
export const CardOutput = z.object({ card: z.string(), context: Context });

export function localDayStart(time: number): number {
  const offset = 19800000; // IST has no daylight-saving transition.
  return Math.floor((time + offset) / 86400000) * 86400000 - offset;
}

export function localHour(time: number): number {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', hourCycle: 'h23' }).format(new Date(time)));
}
export function displayTime(time: number): string {
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(time)).toUpperCase();
}
export function displayDate(time: number): string {
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' }).format(new Date(time));
}
// Strip control sequences from untrusted API content before it reaches a terminal.
export function clean(value: unknown, limit = 100): string {
  return String(value ?? '').replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '').replace(/[\x00-\x1f\x7f-\x9f\u202a-\u202e\u2066-\u2069]/g, '').replace(/\s+/g, ' ').trim().slice(0, limit);
}
