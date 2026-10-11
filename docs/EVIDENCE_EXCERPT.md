# Curated evidence excerpt

Two sets of real output are kept here. The newest is first. Private logs stay Git-ignored; these excerpts are copied from them.

## Agent-executed runs — 11 October 2026, 3:20 PM IST

Run by the coding agent (Claude Code) on the development laptop at the author's request, from 3:20:05 PM to 3:20:56 PM IST. Each command was a separate CLI process against one fresh, isolated profile, with blank coordinate overrides (the labelled city-centre default) and `qwen2.5:7b` through loopback Ollama. The local `.env` held no SerpApi key, so the live card reports that event search was skipped. Cards are reproduced in full. Each `Evidence:` line is a summary printed from that same run's `--json` output.

### Local model checks — `nikal doctor`, `nikal doctor --tools`

```text
Nikal doctor · qwen2.5:7b · http://localhost:11434/v1
Local model file confirmed. Advertised capabilities: completion, tools
PASS: Ollama → AI SDK → Mastra generate returned valid JSON locally.
```

```text
Nikal doctor · qwen2.5:7b · http://localhost:11434/v1
Local model file confirmed. Advertised capabilities: completion, tools
PASS: Mastra executed a real local model tool call.
```

### Defaults — `nikal --fixture`

Synthetic forecast and places, real Qwen selection.

```text
NIKAL — Your cue to step outside
OFFLINE FIXTURE · synthetic data · Local AI selection
Approximate Gwalior city centre; not your home
Remembered: ≤32°C · any · 3 km radius · AQI ≤100
Go at 5:00 PM IST (10 Oct).
Forecast US AQI 45 · 31°C · sunset 6:00 PM.
Rain 5% · UV 1 · PM2.5 10 µg/m³.
Try Demo Quiet Garden (synthetic) · approximately 1.1 km straight-line.
https://example.org/nikal-fixture
Lowest forecast AQI among comfortable hours.
No verified event found.
Offline fixture: no live event search.
Comfort filters, not medical guarantees. OSM access, hours and safety unverified.
Close this tab. Go outside.

Evidence: {"mode":"local-ai","modelAttempts":1,"reason":"cleaner-air","placeId":"fixture/garden","candidateHours":3,"placeCandidates":2,"weatherProvenance":"fixture","aqiProvenance":"fixture","placesProvenance":"fixture","searchProvenance":"fixture","leadCount":0,"corroboratedEventCount":0,"selectedLeadId":null}
```

### Chat — `nikal chat`

```text
$ nikal chat "I dislike heat above 30°C and prefer mornings."
maxTemp: 32 → 30
period: "any" → "morning"
```

### Independent process — `nikal prefs show`

```text
Mastra working memory · resource nikal-local-user · thread nikal-outdoor-cue
{
  "maxTemp": 30,
  "maxAqi": 100,
  "maxUv": 5,
  "maxRain": 30,
  "period": "morning",
  "radiusKm": 3,
  "start": null,
  "intent": "A short, comfortable walk in a green space."
}
```

### Next fixture — `nikal --fixture`

Same synthetic forecast, new process, saved preferences.

```text
NIKAL — Your cue to step outside
OFFLINE FIXTURE · synthetic data · Local AI selection
Approximate Gwalior city centre; not your home
Remembered: ≤30°C · morning · 3 km radius · AQI ≤100
Go at 7:00 AM IST (10 Oct).
Forecast US AQI 88 · 29°C · sunset 6:00 PM.
Rain 5% · UV 1 · PM2.5 25 µg/m³.
Try Demo Green Park (synthetic) · approximately 0.4 km straight-line.
https://example.org/nikal-fixture
Lowest forecast temperature among comfortable hours.
No verified event found.
Offline fixture: no live event search.
Comfort filters, not medical guarantees. OSM access, hours and safety unverified.
Close this tab. Go outside.

Evidence: {"mode":"local-ai","modelAttempts":1,"reason":"cooler","placeId":"fixture/park","candidateHours":2,"placeCandidates":2,"weatherProvenance":"fixture","aqiProvenance":"fixture","placesProvenance":"fixture","searchProvenance":"fixture","leadCount":0,"corroboratedEventCount":0,"selectedLeadId":null}
```

### Live workflow — `nikal`

Live Open-Meteo forecast and air quality, live Overpass places, real Qwen selection. Coordinates are the approximate Gwalior development centre, not a home.

```text
NIKAL — Your cue to step outside
Gwalior · API forecast · Local AI selection
Approximate Gwalior city centre; not your home
Remembered: ≤30°C · morning · 3 km radius · AQI ≤100
Weather: live · AQI: live.
Places: live Overpass response.
Nothing suitable left today. Tomorrow 7:00 AM IST (12 Oct) looks best.
Forecast US AQI 87 · 25°C · sunset 5:52 PM.
Rain 0% · UV 0.5 · PM2.5 28.7 µg/m³.
Try veerangna jhalkaribai koli park · approximately 1.0 km straight-line.
https://www.openstreetmap.org/way/1561235682
Lowest forecast AQI among comfortable hours.
No verified event found.
SerpApi key absent; event search skipped.
Comfort filters, not medical guarantees. OSM access, hours and safety unverified.
Close this tab. Go outside.

Evidence: {"mode":"local-ai","modelAttempts":1,"reason":"cleaner-air","placeId":"way/1561235682","candidateHours":3,"placeCandidates":12,"weatherProvenance":"live","aqiProvenance":"live","placesProvenance":"live","searchProvenance":"skipped","leadCount":0,"corroboratedEventCount":0,"selectedLeadId":null}
```

No hour passed for the rest of 11 October: the forecast US AQI was above the saved limit of 100 from 4 PM onward, so the workflow moved to the next day. Three morning hours passed the saved 30°C and morning filters.

### Recording, screenshots and Studio

**Terminal recording.** `docs/images/nikal-demo.gif` and a private MP4 copy: 49.84 seconds, 1000×540, produced by [scripts/demo.tape](../scripts/demo.tape) with VHS 0.12.1. Recorded on 11 October 2026 from 3:43:38 PM to 3:45:21 PM IST in its own fresh isolated profile. Frames are hidden while each command runs, so model and network waits are cut; the output is unedited. `terminal-1-default.png` to `terminal-4-live.png` are frames from this take.

What its cards show:

- Scene 1, `nikal --fixture`: `Local AI selection`, 5:00 PM, synthetic data.
- Scene 2, `nikal chat`: `maxTemp: 32 → 30` and `period: "any" → "morning"`.
- Scene 4, `nikal --fixture`: `Local AI selection`, 7:00 AM, synthetic data.
- Scene 5, `nikal`: `Local AI selection`; `Weather: live · AQI: live.`; `Places: live Overpass response.`; tomorrow 7:00 AM IST (12 Oct); forecast US AQI 93, 25°C; veerangna jhalkaribai koli park, approximately 1.0 km straight-line; `SerpApi key absent; event search skipped.`

No search ran in this take, so it has no leads and no selected lead. It is separate from every keyed SerpApi run recorded below. The tape prints cards, not JSON, so this take has no `Evidence:` line. No card shows the “repaired” line that marks a second model attempt.

**This was the seventh completed take.** The first was reshot for framing. The next five, from 3:25 PM to 3:41 PM, all had the three Overpass mirrors fail in scene 5, and their cards said `Places unavailable`. The kept take was recorded after the Overpass client timeout was raised from 8 to 15 seconds. The recorder writes to fixed paths, so the earlier takes' media were overwritten.

**Mastra Studio.** `docs/images/studio-workflow-run.png`, 2000×1266, downscaled from a 3000×1900 headless-Chrome capture (`studio-workflow-graph.png` is a 975×1493 crop of the same capture, for legibility) of `http://127.0.0.1:4111/workflows/nikalWorkflow/graph` at 3:33 PM IST, after ticking **Fixture** and pressing **Run**. Studio ran with dotenv disabled on an isolated profile and was stopped afterwards. The run's own result: status `success`, mode `local-ai`, attempt 1, synthetic fixture facts, 5:00 PM with Demo Quiet Garden, reason `cleaner-air`; `agentDecides` took 2.52 seconds.

## Earlier recorded demo logs — `run-cNelX7M6`

Reviewed on 11 October 2026. These excerpts come from the isolated `run-cNelX7M6` displayed-output logs. They are not raw provider responses or a new run. Execution timestamps were not recorded; the fixture clock and recommended day are not execution dates. Private logs remain Git-ignored and are not intended for publication.

## Synthetic facts, real local inference and persistence

The forecast readings and Demo destinations were synthetic. Qwen inference was real, and preferences persisted in genuine Mastra/SQLite memory across separate CLI processes. Fixture excerpts omit only whole irrelevant lines; retained lines below are copied exactly. Chat and preference-read output are reproduced in full.

### Defaults — `02-default-fixture.txt`

```text
NIKAL — Your cue to step outside
OFFLINE FIXTURE · synthetic data · Local AI selection
Remembered: ≤32°C · any · 3 km radius · AQI ≤100
Go at 5:00 PM IST (10 Oct).
Evidence: {"mode":"local-ai","modelAttempts":1,"weatherProvenance":"fixture","aqiProvenance":"fixture","placesProvenance":"fixture","searchProvenance":"fixture","leadCount":0,"corroboratedEventCount":0,"selectedLeadId":null}
```

### Chat — `03-chat.txt`

Exact chat request: message text not recorded in the log. The recording script contains a request, but that is not proof of the message used in this run.

```text
maxTemp: 32 → 30
period: "any" → "morning"
```

### Independent process — `04-preferences.txt`

```text
Mastra working memory · resource nikal-local-user · thread nikal-outdoor-cue
{
  "maxTemp": 30,
  "maxAqi": 100,
  "maxUv": 5,
  "maxRain": 30,
  "period": "morning",
  "radiusKm": 3,
  "start": null,
  "intent": "A short, comfortable walk in a green space."
}
```

### Next fixture — `05-saved-fixture.txt`

```text
NIKAL — Your cue to step outside
OFFLINE FIXTURE · synthetic data · Local AI selection
Remembered: ≤30°C · morning · 3 km radius · AQI ≤100
Go at 7:00 AM IST (10 Oct).
Evidence: {"mode":"local-ai","modelAttempts":1,"weatherProvenance":"fixture","aqiProvenance":"fixture","placesProvenance":"fixture","searchProvenance":"fixture","leadCount":0,"corroboratedEventCount":0,"selectedLeadId":null}
```

## Separate recorded live workflow — `06-live.txt`

The displayed card and its application evidence summary are reproduced in full; no lines are omitted. The coordinates are explicitly the approximate Gwalior development centre, not a home. This run is separate from the earlier user-reported unavailable-Overpass run and earlier HTTP 401.

```text
NIKAL — Your cue to step outside
Gwalior · API forecast · Local AI selection
Approximate Gwalior city centre; not your home
Remembered: ≤30°C · morning · 3 km radius · AQI ≤100
Weather: live · AQI: live.
Places: live Overpass response.
Go at 7:00 AM IST (11 Oct).
Forecast US AQI 70 · 23.9°C · sunset 5:53 PM.
Rain 0% · UV 0.5 · PM2.5 26.6 µg/m³.
Try veerangna jhalkaribai koli park · approximately 1.0 km straight-line.
https://www.openstreetmap.org/way/1561235682
Fits your saved comfort filters.
No verified event found.
Search leads could not be confirmed on dated source pages.
Comfort filters, not medical guarantees. OSM access, hours and safety unverified.
Close this tab. Go outside.

Evidence: {"mode":"local-ai","modelAttempts":1,"weatherProvenance":"live","aqiProvenance":"live","placesProvenance":"live","searchProvenance":"live","leadCount":3,"corroboratedEventCount":0,"selectedLeadId":null}
```

Search returned 3 leads; their titles and URLs are not recorded in the public evidence. The model selected none (`selectedLeadId: null`). No event was corroborated, so the card said "No verified event found."

- Run date:
- Exact search query:
- Lead titles and source URLs:
- Source-verification cache provenance:

Later update, 11 October 2026: the search response cached in that run's isolated profile was replayed offline through Nikal's lead selection. It records the fetch time (11 October, 12:25 AM IST), the default query and the three retained leads. See [the offline investigation](SERPAPI_EVIDENCE.md#why-no-lead-verifies-offline-investigation-on-11-october-2026-321338-pm-ist). The blanks above are kept as originally written.

The undated demo log does not contain lead titles/URLs; the separate user-reported excerpt below does. The run's query override and its relationship to source/build changes have not been confirmed; source/build equality alone could not establish its query. No query is inferred from the default or the forecast date. [Separate SerpApi records](SERPAPI_EVIDENCE.md) retain unknown fields blank; [dated verification](VERIFICATION.md) separates mocks, real-model fixtures and live evidence.

## Separate earlier run — 10 October 2026 IST, user-reported

The user pasted this application's relevant output during preparation; no file was independently inspected and no URL was independently verified. It is a separate older run, not evidence for the missing titles/query/date of `06-live.txt`. Supplied values: mode `local-ai`, modelAttempts `1`, searchProvenance `live`, three leads, zero corroborated events, and decision.leadId `null`.

Search returned 3 source-linked leads; the model selected none. No event was corroborated, so the card said “No verified event found.”

- [Explore the Bustling Markets of Gwalior](https://www.avathi.com/activity/explore-the-bustling-markets-of-gwalior/2278)
- [Outdoor Activities in Gwalior](https://www.facebook.com/fb-answers/outdoor-activities-in-gwalior/?locale=fi_FI)
- [gwalior Archives - Go Heritage Runs - Run, Fun, Travel](https://www.goheritagerun.com/tag/gwalior/)

Recorded warning, copied exactly:

```text
Search leads could not be confirmed on dated source pages.
```

- Run date: 10 October 2026 IST, supplied by the user; exact time unknown.
- Exact search query:
- Weather/AQI/places provenance:
- Source-verification cache provenance:

The titles describe unconfirmed search leads, including general activity/archive pages, not verified upcoming events. The quoted “No verified event found” card wording is separately recorded in the earlier user-supplied live-card evidence in [VERIFICATION.md](VERIFICATION.md); the newly pasted subset contains the warning and application summary, not a full card. No URLs were opened in this pass and no event dates are invented.
