import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { configuration } from './config.js';

export class HttpError extends Error {
  constructor(public service: string, public status: number) { super(`${service}: HTTP ${status}`); }
}
export type Fetcher = typeof fetch;
export type HttpSource = { fromCache: boolean; fetchedAt: number };
export class HttpClient {
  constructor(readonly directory = join(configuration().dataDir, 'cache'), private fetcher: Fetcher = fetch) {}
  async cached<T>(key: string, ttl: number, load: () => Promise<unknown>, validate: (value: unknown) => T, report?: (fromCache: boolean) => void): Promise<T> {
    const path = join(this.directory, `${createHash('sha256').update(key).digest('hex')}.json`);
    try {
      const cached = JSON.parse(await readFile(path, 'utf8')) as { expires: number; value: unknown };
      if (cached.expires > Date.now()) { const value = validate(cached.value); report?.(true); return value; }
    } catch { /* Cache miss. */ }
    const value = await load();
    const validated = validate(value);
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const temporary = `${path}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify({ expires: Date.now() + ttl, value }), { mode: 0o600 });
    await rename(temporary, path);
    report?.(false);
    return validated;
  }
  async json<T>(service: string, url: string, options: { ttl: number; timeout?: number; retries?: number; init?: RequestInit; cacheKey?: string; skipCache?: boolean; report?: (source: HttpSource) => void; sanitizeError?: (error: unknown, status: number | null) => Error; validate: (data: unknown) => T }): Promise<T> {
    const key = createHash('sha256').update(options.cacheKey || `${url}:${options.init?.body || ''}`).digest('hex');
    const path = join(this.directory, `${key}.json`);
    try {
      const cached = JSON.parse(await readFile(path, 'utf8')) as { expires: number; fetchedAt?: number; value: unknown };
      if (!options.skipCache && cached.expires > Date.now() && Number.isFinite(cached.fetchedAt)) {
        const value = options.validate(cached.value);
        options.report?.({ fromCache: true, fetchedAt: cached.fetchedAt! });
        return value;
      }
    } catch { /* A corrupt or expired cache is a miss; never serve stale forecast. */ }
    const retries = options.retries ?? 1;
    let failure: Error = new Error(`${service}: request failed`);
    for (let attempt = 0; attempt <= retries; attempt++) {
      let status: number | null = null;
      try {
        const response = await this.fetcher(url, {
          ...options.init, redirect: 'error', signal: AbortSignal.timeout(options.timeout ?? 12000),
          headers: { 'User-Agent': 'Nikal/0.1 (local outdoor cue)', ...options.init?.headers },
        });
        status = response.status;
        if (!response.ok) throw new HttpError(service, response.status);
        const value = await response.json() as unknown;
        const validated = options.validate(value);
        const fetchedAt = Date.now();
        if (options.ttl > 0) {
          await mkdir(this.directory, { recursive: true, mode: 0o700 });
          const temporary = `${path}.${randomUUID()}.tmp`;
          await writeFile(temporary, JSON.stringify({ expires: fetchedAt + options.ttl, fetchedAt, value }), { mode: 0o600 });
          await rename(temporary, path);
        }
        options.report?.({ fromCache: false, fetchedAt });
        return validated;
      } catch (error) {
        // Never include URLs (SerpApi keys/coordinates) or server-provided error bodies.
        failure = options.sanitizeError ? options.sanitizeError(error, status)
          : error instanceof HttpError ? error : new Error(`${service}: network, timeout, or invalid response`);
        if (error instanceof HttpError && error.status < 500 && error.status !== 429) break;
        if (attempt < retries) await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }
    throw failure;
  }
}
