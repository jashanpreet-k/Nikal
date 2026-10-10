import { createHash } from 'node:crypto';
import { clean, type Events } from './domain.js';
import { sourceURL } from './tools/events.js';

export function unconfirmedLeadCandidates(events: Events | undefined) {
  const candidates: { id: string; title: string; source: string }[] = [];
  // Preserve corroborated-event card priority. Those events are separate facts,
  // not candidates for an optional unconfirmed-link selection.
  if (!events || events.events.length) return candidates;
  const seen = new Set<string>();
  for (const lead of events.leads) {
    if (candidates.length >= 3) break;
    const title = clean(lead.title, 140);
    if (!title) continue;
    try {
      const source = sourceURL(lead.source).toString();
      if (seen.has(source)) continue;
      seen.add(source);
      // Derived from the canonical retrieval URL, stable across ordering/cache
      // and title changes. Never trust a provider/model-supplied identifier.
      candidates.push({ id: `lead/${createHash('sha256').update(source).digest('hex')}`, title, source });
    } catch { /* Existing public HTTPS display policy still applies. */ }
  }
  return candidates;
}
