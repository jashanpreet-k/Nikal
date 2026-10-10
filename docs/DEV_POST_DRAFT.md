---
title: "Should I step outside? Nikal checks the heat, air and daylight in Gwalior"
published: false
tags: devchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05).*

Should I go outside today, given the heat and air quality? In Gwalior, the answer depends on the hour. I wanted a cue to leave the screen: a comfortable time, a nearby green space when one can be retrieved, and a clear explanation of where the answer came from.

## What I Built

**Nikal — Your cue to step outside.** Nikal means “go out” in Hindi.

It is a small terminal app that checks forecast weather, modeled air quality and daylight against saved comfort preferences. A local model chooses among passing hours and available places. It also has optional city-level event discovery with source corroboration.

If nothing suitable remains today, Nikal checks the complete forecast for tomorrow. The card explicitly says **Tomorrow**; this extends the original 12-hour horizon. If neither day passes the filters, it says so. It ends with **“Close this tab. Go outside.”**

## Demo

**[VIDEO LINK: add the actual terminal recording.]**

The latest real network check started at **9:44 PM IST on 10 October** using explicitly labeled approximate Gwalior city-centre development coordinates. Fresh Open-Meteo weather and AQI requests succeeded. The app found **7 AM IST on 11 October: 23.9°C and modeled US AQI 70**. The card said **Tomorrow** and **Deterministic fallback**, because this retrieval check deliberately used `--no-model`.

All three Overpass mirrors failed. With an empty local place cache and an empty user-curated list, the card reported **places unavailable**. That failure is visible in the recording plan.

For earlier actual AI evidence, `nikal doctor` passed local JSON generation through Mastra and Ollama. The earlier full fixture workflow also passed with a validated **Local AI selection** in one attempt: **5 PM + Demo Quiet Garden**, explained by lower fixture AQI. Its facts and places are explicitly synthetic. These actual model/API checks predate the later parallel/chat changes, which were tested with mocks.

An earlier real-model memory demonstration used separate CLI processes. Defaults selected **5 PM**; saving **30°C + mornings**, then starting a new process, selected **7 AM**. Both were validated local-model results over synthetic facts. The saved values independently appeared in `prefs show`. Exact model choices can vary; an unchanged recommendation can still satisfy updated preferences.

The separate `npm run demo:memory` script is a fully offline persistence demonstration: **5 PM → save 30°C/mornings → 8 AM**. It labels its deterministic fallback and does not count as AI inference or live weather.

**[OUTDOOR PHOTO: add a real photograph with an honest caption.]**

### My real outdoor experience

**[FILL AFTER ACTUAL USE: departure date/time in IST, actual destination, how the conditions felt, and what Nikal got right or wrong. If you waited because of its advice, say so. Do not invent an outing.]**

## Code

**[REPOSITORY LINK: add the public code URL.]**

The repository contains TypeScript source, a pinned lockfile, tests, setup instructions and an MIT license. Private `.env`, SQLite databases and API caches are excluded.

**[TEAMMATE DEV HANDLES: list actual collaborators' @handles; if solo, replace this with your own handle and say so.]**

## How I Built It

Mastra provides the **agents, tools, workflow and persistent memory**. Five domain stages plus an explicit join form the workflow:

`fetchConditions → parallel(findPlaces, findEvents) → joinRetrieval → agentDecides → formatCard`

Retrieval runs deterministically. Open-Meteo weather and air readings are joined by UTC timestamp, with sunrise/sunset matched to the IST date. Missing readings cannot pass the filters. Today is tried first; tomorrow is considered only when today's passing set is empty. Saved heat, AQI, UV, rain, period and radius limits remain in force.

Places/events run in Mastra's supported parallel branches, then an explicit schema-checked join preserves the loaded context. Expected API failures degrade the affected branch; no speedup has been measured or claimed.

Overpass queries parks, gardens and walking paths within the saved radius. Three mirror attempts are bounded. Successful responses receive a local fetch date. A fresh cache can be reused; after every mirror fails, an older matching cache can be used with **“places from cache, fetched …”** on the card. Without a cache, only a personally verified curated JSON list is eligible. The shipped list is empty. Curated output is labeled **curated fallback**.

The agent uses local **Qwen2.5:7b through Ollama** and an OpenAI-compatible AI SDK provider. It receives all passing candidates and remembered intent, then returns candidate IDs and an explanation code. The application validates those IDs and the explanation. Every displayed reading, distance and link comes from tool data. One invalid attempt can receive one repair within the same inference deadline; repeated rejection produces a labeled deterministic fallback.

Preferences use genuine **Mastra Memory backed by LibSQL/SQLite**. Stable resource/thread IDs survive process restarts. The CLI validates updates, and memory is read before retrieval. Generation uses read-only memory. No remote embeddings or background observation model is configured.

An optional one-shot preference-chat command uses a separate agent with only a preference reader and a strict save tool. The tool stages changes, saying “staged, not saved”; the application commits only after successful generation and validation. It prints persisted old/new values instead of model prose. This path has mocked-generation tests with genuine SQLite; **real-model chat has not been run**. The normal recommendation agent cannot change preferences.

SerpApi Google Events searches at city level. Optional query text is bounded to 120 Unicode characters and rejects controls; Gwalior grounding stays fixed and no private memory is inserted. A lead needs a dated, matching source-page JSON-LD `Event` before it appears as a corroborated event, always with its source URL. If none qualifies, up to two links may appear as explicitly unconfirmed leads; their display-policy checks establish neither authenticity nor destination safety. `nikal doctor --events` makes one uncached query when a key exists; a passing query alone does not verify source pages. The earlier diagnostic **skipped** because that process environment had no key. The private `.env` was not inspected, and no live keyed run was performed in the later continuation.

### Limitations

- Public Overpass services can fail. The latest run had two HTTP 504 responses and one timeout; no place was invented. Cache/curated recovery is tested with mocked failures, not claimed as fresh live success.
- Earlier real Ollama generation and fixture agent selection passed. Automated event/API payloads, parallel/chat failures and rollover clocks are mocks or synthetic fixtures. SQLite persistence tests use genuine local storage. Type-checking, build and all **73 tests** passed. Real-model chat remains unverified.
- Deterministic fallback is explicitly labeled. Small-model compatibility does not guarantee autonomous tool reliability; the workflow orchestrates retrieval.
- Live keyed SerpApi search and actual event-source verification remain untested. Search snippets are never confirmed events.
- AQI is modeled, distances are straight-line estimates and access/hours are unverified. Comfort filters are not medical guarantees.

## Why Does Open Innovation Matter?

Inference runs on my laptop with **no paid model API calls**. Model prompts and preference memory remain local. Hardware, electricity and network costs still exist.

Retrieval has a different boundary: **Open-Meteo and Overpass receive coordinates, SerpApi receives the city query and authentication, and event sites receive source-page requests**. A local model does not make live retrieval offline or keep location entirely on the machine. The labeled fixture demonstration can run offline once the model is installed.

The provider is separate from the workflow. Configuration supports local Qwen2.5:7b and an optional Llama 3.1:8b tag. Swapping requires downloading the model, checking its license and running compatibility probes. **Only Qwen has been verified here.** Qwen's open weights use Apache-2.0; Llama has its own Community License. Mastra's framework and Nikal's code are open-source software.

I can inspect the filters, change preferences, review the validator and keep model selection grounded. The useful result is one card giving me a reason to step away.

## My Agent Session

**[OPTIONAL AGENT SESSION LINK: add an actual session link if you choose to share it; otherwise remove this optional section. Review it for private information first.]**

## Prize Categories

- **Best Use of Mastra — $100 USD:** actual agents and tools, a committed workflow with parallel retrieval and explicit join, earlier grounded local-model selection, and working memory persisted across separate CLI processes.

Built with [Mastra](https://mastra.ai/), [Ollama](https://ollama.com/) and [Qwen2.5](https://ollama.com/library/qwen2.5:7b). Weather/AQI: [Open-Meteo](https://open-meteo.com/) and [CAMS](https://atmosphere.copernicus.eu/). Places: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), retrieved through [Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API). Optional event discovery: [SerpApi](https://serpapi.com/google-events-api). Full attribution and limitations are in the README.
