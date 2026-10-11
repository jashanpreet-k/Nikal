# SerpApi evidence — separate recorded runs

These entries use recorded terminal evidence, not new search requests. Blank fields mean the value was not recorded; the configured default query is not inferred. A diagnostic PASS verifies keyed search connectivity, not source-page corroboration or an event. Live provenance excludes Nikal's local search cache; source-verification cache provenance is recorded only when supplied.

## Recorded diagnostic log — reviewed 11 October 2026

Source: `events-diagnostic.txt` in the isolated demo-log set `run-cNelX7M6`. This was a separate command from the workflow below. Its actual execution date and query were not captured in the sanitized log.

- Date:
- Query used:
- `doctor --events` result: PASS — one live SerpApi Google search query succeeded; 0 event-module results. Source pages were not verified by this diagnostic.
- Number of leads:
- Number corroborated:
- Lead/source URLs:
- Source-verification cache provenance:
- Notes: Zero event-module results does not mean zero organic leads. No workflow counts are assigned to this diagnostic.

## User-supplied live workflow — 11 October 2026

Source: the user's complete terminal card and concise evidence, preserved separately in [VERIFICATION.md](VERIFICATION.md#user-supplied-successful-live-terminal-output--11-october-2026). Not independently executed by the agent.

- Date: 11 October 2026, user-reported; exact execution time not supplied.
- Query used:
- `doctor --events` result:
- Number of leads: 3, explicitly unconfirmed.
- Number corroborated: 0.
- Selected lead ID: null.
- Search provenance: live.
- Lead/source URLs:
- Source-verification cache provenance:
- Notes: Local AI on attempt 1, live weather/AQI, Overpass unavailable. The card said “No verified event found” and that search leads could not be confirmed on dated source pages. No lead was selected and no scheduled/available event is established. The earlier HTTP 401 authentication failure belongs to a different run.

## Reviewed live workflow log — reviewed 11 October 2026

Source: `06-live.txt` from `run-cNelX7M6`, read directly. The execution date/query and event source URLs are absent from the sanitized log; 11 October below is the forecast recommendation date, not an inferred execution timestamp.

- Date:
- Query used:
- `doctor --events` result:
- Number of leads: 3, explicitly unconfirmed.
- Number corroborated: 0.
- Selected lead ID: null.
- Search provenance: live.
- Lead/source URLs:
- Source-verification cache provenance:
- Notes: Local AI on attempt 1; weather, AQI and Overpass provenance all live. Recommendation: 11 October, 7 AM IST, 23.9°C and forecast US AQI 70, using approximate Gwalior city-centre development coordinates. The card said “No verified event found” and that search leads could not be confirmed on dated source pages. This live Overpass success is distinct from the unavailable-place run above. No diagnostic result or unknown query is merged into this workflow record.

Actual event-source corroboration and a non-null real-model lead selection remain unverified. Keys, raw provider payloads and private coordinates are excluded.
