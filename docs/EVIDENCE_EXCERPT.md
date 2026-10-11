# Curated evidence excerpt

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
