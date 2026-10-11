---
title: "Nikal: A local AI agent that remembers your comfort—and tells you to go outside"
published: true
tags: devchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05).*

In Gwalior, “go outside” needs a time attached.

A forecast retrieved on 11 October at 3:17 PM IST shows why. At 4 PM it gave 32.6°C and a forecast US AQI of 108. At 5 PM it gave 31.5°C and an AQI of 120. The afternoon cooled as the air got worse.

With limits of 32°C and AQI 100, neither hour passed. Nikal's card for that run said: “Nothing suitable left today. Tomorrow 7:00 AM IST (12 Oct) looks best.” That is a forecast-based suggestion, not a confirmed outing.

## What I Built

Nikal means “go out” in Hindi. It is a small TypeScript CLI that checks Gwalior's hourly heat, air quality, rain, UV and daylight against comfort limits I have saved. A local Qwen 2.5 7B model, running through Ollama, then picks one hour and one mapped walking place from what passed, and an optional SerpApi search looks for outdoor events. It prints one card and exits; if nothing passes today it checks tomorrow, and if neither day qualifies it says so without relaxing the limits.

## Demo

![Terminal recording of five actual Nikal CLI runs: synthetic fixture inference and memory, followed by an unkeyed live run](https://raw.githubusercontent.com/jashanpreet-k/Nikal/main/docs/images/nikal-demo.gif)

*Recorded on 11 October 2026 at 3:43 PM IST with [VHS](https://github.com/charmbracelet/vhs). Inference waits were shortened; outputs come from actual CLI runs. Frames are hidden during model and network waits; the output is unedited. [Watch the same recording as a video on YouTube](https://youtu.be/Up5b_2EGtwo).*

### Persistent memory: 5 PM to 7 AM

**Synthetic forecast and places, real local Qwen inference.** Each command below runs in a separate CLI process against the same isolated demo profile. The cards label the fixture `OFFLINE FIXTURE · synthetic data`.

| Command | Recorded result |
| --- | --- |
| `nikal --fixture` with defaults | Qwen selects **5 PM**, the hour with the lowest forecast AQI. |
| `nikal chat "I dislike heat above 30°C and prefer mornings."` | Persists `maxTemp: 32 → 30` and `period: "any" → "morning"`. |
| `nikal prefs show` | A new process retrieves **30°C + morning** from Mastra working memory. |
| `nikal --fixture` again | Same synthetic facts, new process: Qwen now selects **7 AM**. |

The forecast did not change between the first command and the last. Only what Nikal remembered did.

![Terminal frame from the recording: chat saves preferences in the isolated demo profile and a new process reads them back](https://raw.githubusercontent.com/jashanpreet-k/Nikal/main/docs/images/terminal-2-memory.png)

*An actual terminal frame from the recording. The fixture facts are synthetic; the model inference, tool call and SQLite persistence are real.*

### The separate live segment

The recording ends with one live run from approximate Gwalior city-centre coordinates, with live Open-Meteo conditions and live Overpass places. It recommends **12 October, 7 AM IST: 25°C and forecast US AQI 93**.

![Terminal frame from the unkeyed live segment: live weather, AQI and Overpass places; SerpApi search skipped](https://raw.githubusercontent.com/jashanpreet-k/Nikal/main/docs/images/terminal-4-live.png)

**This segment ran without a SerpApi key.** It shows no search results. The keyed evidence further down comes from a different, earlier run.

### Outdoor trial

I have not completed an outdoor trial yet.

## Code

[GitHub: jashanpreet-k/Nikal](https://github.com/jashanpreet-k/Nikal), MIT-licensed.

The latest `npm run check`, on 11 October at 6:50 PM IST, passed type-checking, the build and 122 tests. The tests use mocked or synthetic model and API responses. The real runs are kept apart in the [verification report](https://github.com/jashanpreet-k/Nikal/blob/main/docs/VERIFICATION.md), the [curated evidence excerpt](https://github.com/jashanpreet-k/Nikal/blob/main/docs/EVIDENCE_EXCERPT.md) and the recording source [`scripts/demo.tape`](https://github.com/jashanpreet-k/Nikal/blob/main/scripts/demo.tape).

Built on 10–11 October 2026. Solo: @jashanpreet_kaur_917e774f, with AI coding assistance; no human teammates.

### Try it

You need Node 22.13 or newer. The four commands below need nothing else: no Ollama, no API key, and no network once the install has finished.

```zsh
git clone https://github.com/jashanpreet-k/Nikal.git
cd Nikal
npm ci && npm run build && npm link
nikal --fixture --no-model
```

That prints a card from an invented forecast with the model switched off. For the real thing, install [Ollama](https://ollama.com/), run `ollama pull qwen2.5:7b`, and then:

| Type this | What it does |
| --- | --- |
| `nikal doctor` | Checks that the local model answers. |
| `nikal --fixture` | The invented forecast again, with local Qwen choosing. |
| `nikal` | The live card: Gwalior's forecast and mapped places. |
| `nikal chat "I dislike heat above 30°C and prefer mornings."` | Saves preferences from plain words. |
| `nikal prefs set --radius 1.5` | Only suggests places within 1.5 km. |
| `nikal prefs show` | Shows what it remembers. `nikal prefs reset` restores the defaults. |
| `nikal --help` | Lists every command and limit. |

Tested on macOS with Node 24; other systems are untested. Preferences are stored on your own machine, in `~/.nikal`.

## How I Built It

### What Mastra does here

I wanted a small local model to make the choice without being trusted with any fact.

- **Tools.** Weather, places and events are each a `createTool` with Zod input and output schemas, so a malformed API response is rejected before it reaches the card.
- **Parallel workflow with a join.** `fetchConditions → [findPlaces ‖ findEvents] → joinRetrieval → agentDecides → formatCard`. Retrieval always runs in code. Places and events fail independently: in recorded takes where every map server failed, the card still gave a time.
- **Local agent.** Qwen sees only the hours and places that passed my limits and returns IDs and a reason code. Nikal validates them, allows one repair, then labels a deterministic fallback. Numbers and links on the card come from retrieved data.
- **Persistent memory.** Preferences live in resource-scoped Mastra working memory on LibSQL, a local SQLite file. The first workflow step reads them before anything is fetched, so a saved limit changes which hours reach the model.
- **Staged preference writes.** The chat tool only stages a validated patch. Nikal commits it after generation succeeds, then prints the persisted old and new values, not the model's reply.

![Actual Mastra Studio capture of the completed Nikal workflow using synthetic fixture facts](https://raw.githubusercontent.com/jashanpreet-k/Nikal/main/docs/images/studio-workflow-graph.png)

*Studio capture of a synthetic fixture run with real local inference: six workflow steps, including the parallel retrieval branches and their join. `agentDecides` took 2.52 seconds. [Open the full Studio screenshot](https://raw.githubusercontent.com/jashanpreet-k/Nikal/main/docs/images/studio-workflow-run.png).*

### What broke

**Overpass.** Five consecutive recording takes had all three public map mirrors fail. The primary server was measured responding in 5.7 to 8.4 seconds against an 8-second timeout, so the timeout became 15 seconds before the kept take. The failures also exposed a card bug: warnings shared a 350-character cap, and one card ended with “event search skippe”. Each warning now gets its own line.

**SerpApi.** The `google_events` engine no longer accepts new requests, so Nikal uses SerpApi's Google Search engine. My first parser read only Google's optional events box and ignored organic results. The corrected one reads both, and treats every result as a lead until its source page corroborates a dated event.

### Two improvements made after the recording

On a rollover to tomorrow, the card now adds one line saying why today's remaining hourly slots failed. From a synthetic test: “No remaining daylight hourly slot passes today: forecast AQI at 5 PM is 110, above your limit of 100.” It is derived from that run's own forecast hours and saved limits.

In an interactive terminal, Nikal also shows a short progress note while it works and prints the answer line in bold. The card's text is unchanged.

Both are covered by automated tests on synthetic readings and the offline fixture, with no new live or real-model run. The recording above predates both and shows neither.

### Keyed SerpApi evidence, separate from the GIF

An [earlier keyed workflow](https://github.com/jashanpreet-k/Nikal/blob/main/docs/EVIDENCE_EXCERPT.md#separate-recorded-live-workflow--06-livetxt) returned **three unconfirmed leads, zero corroborated events, and no model-selected lead**. Its search response was fetched on 11 October at 12:25 AM IST for `outdoor events walks runs street markets in Gwalior this week`.

A [later offline inspection](https://github.com/jashanpreet-k/Nikal/blob/main/docs/SERPAPI_EVIDENCE.md#why-no-lead-verifies-offline-investigation-on-11-october-2026-321338-pm-ist) of that stored response, with no new search, found no events box and these leads: a [Facebook topic page](https://www.facebook.com/fb-answers/outdoor-activities-in-gwalior/?locale=ur_PK), a [run organiser's archive](https://www.goheritagerun.com/tag/gwalior/) and an [Instagram reel](https://www.instagram.com/reel/DYo9rMDs7ns/). The reel's snippet contained dates, but a snippet is not a dated, matching event on a source page, so the card said “No verified event found.”

### Limitations

- Forecast AQI is modeled, and forecasts change between runs. The limits are comfort filters, not medical guarantees.
- Choices are hourly slots in daylight, at least 30 minutes before sunset.
- Distances are straight-line. A mapped place does not establish access, opening hours or safety.
- An event counts only with matching, dated `Event` data on its source page, and “this week” ends on Sunday night. No recorded event has been corroborated.
- Qwen 2.5 7B is the only model verified here.

## Why Does Open Innovation Matter?

Open weights make the local part possible: Qwen 2.5 7B runs on my laptop, so the prompt that holds my preferences stays there. Published weights are not open-source software; Mastra, the AI SDK, Ollama and Nikal are.

Open data makes the card checkable. The park on the card is [an OpenStreetMap entry anyone can open](https://www.openstreetmap.org/way/1561235682), and Nikal's [selection validation](https://github.com/jashanpreet-k/Nikal/blob/main/src/recommendation.ts) is open to review.

Model inference and preference memory stay on the laptop. Retrieval is external: Open-Meteo and Overpass receive coordinates, SerpApi receives a city-level query, and source sites receive page requests. Paid model/API charges were ₹0 within free-tier limits, excluding hardware, electricity and network costs.

## Prize Categories

**Best Use of Mastra — $100 USD (primary).** Tools, a parallel workflow with a join, a local agent and persistent working memory form the core of Nikal. The recorded synthetic-facts demonstration shows a chat-saved preference changing the recommendation from 5 PM to 7 AM across separate processes.

**Best Use of SerpApi — $100 USD (secondary).** Google Search supplies source-linked leads for Nikal's separate corroboration step. The earlier keyed workflow returned **three unconfirmed leads, zero corroborated events and no model-selected lead**. The unkeyed GIF supplies no SerpApi evidence.

Credits: [Mastra](https://mastra.ai/), [AI SDK](https://ai-sdk.dev/), [Ollama](https://ollama.com/), [Qwen](https://github.com/QwenLM/Qwen2.5), [Open-Meteo](https://open-meteo.com/) and [CAMS](https://atmosphere.copernicus.eu/), © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) and [Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API), [SerpApi](https://serpapi.com/search-api), and [VHS](https://github.com/charmbracelet/vhs).
