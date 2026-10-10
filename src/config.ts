import { config as dotenv } from 'dotenv';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { Coordinates } from './domain.js';

// Automated/private-safe checks can use only process environment, without opening .env.
if (process.env.NIKAL_SKIP_DOTENV !== '1') dotenv({ quiet: true });
process.env.MASTRA_TELEMETRY_DISABLED = '1';
process.env.DO_NOT_TRACK = '1';
export const CITY = 'Gwalior, Madhya Pradesh, India';
export const CITY_CENTRE = { lat: 26.2183, lon: 78.1828 };
export const RESOURCE = 'nikal-local-user';
export const THREAD = 'nikal-outdoor-cue';
export const DEFAULT_EVENT_QUERY = 'outdoor events walks runs street markets in Gwalior this week';
export const EVENT_QUERY_MAX_LENGTH = 120;

export function configuredEventQuery(value = process.env.NIKAL_EVENT_QUERY): string {
  // Reject raw controls before trimming; never echo a potentially private value.
  if (value !== undefined && /[\p{Cc}\p{Cf}\u2028\u2029]/u.test(value)) {
    throw new Error('NIKAL_EVENT_QUERY must not contain control or formatting characters.');
  }
  const query = value?.trim() || DEFAULT_EVENT_QUERY;
  if ([...query].length > EVENT_QUERY_MAX_LENGTH) throw new Error(`NIKAL_EVENT_QUERY must be at most ${EVENT_QUERY_MAX_LENGTH} Unicode characters.`);
  return query;
}

export function configuration() {
  const eventQuery = configuredEventQuery();
  const lat = process.env.NIKAL_LAT?.trim();
  const lon = process.env.NIKAL_LON?.trim();
  if (Boolean(lat) !== Boolean(lon)) throw new Error('Set both NIKAL_LAT and NIKAL_LON, or leave both empty.');
  const start = lat && lon ? Coordinates.parse({ lat: Number(lat), lon: Number(lon) }) : null;
  const baseURL = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1').replace(/\/$/, '');
  const url = new URL(baseURL);
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.pathname !== '/v1' || url.username || url.password || url.search || url.hash) {
    throw new Error('OLLAMA_BASE_URL must be a loopback http://localhost:<port>/v1 endpoint. Remote inference is disabled.');
  }
  const model = process.env.OLLAMA_MODEL || 'qwen2.5:7b';
  if (!['qwen2.5:7b', 'llama3.1:8b'].includes(model)) throw new Error('Use a local qwen2.5:7b or llama3.1:8b model; cloud model names are disabled.');
  const modelTimeout = Number(process.env.NIKAL_MODEL_TIMEOUT_MS || 90000);
  if (!Number.isFinite(modelTimeout) || modelTimeout < 1000 || modelTimeout > 300000) throw new Error('NIKAL_MODEL_TIMEOUT_MS must be 1000–300000.');
  return { start, baseURL, model, modelTimeout, dataDir: resolve(process.env.NIKAL_DATA_DIR || resolve(homedir(), '.nikal')), serpapiKey: process.env.SERPAPI_KEY?.trim() || '', eventQuery };
}
