---
title: "Nikal: A local AI agent that remembers your comfort—and tells you to go outside"
published: true
tags: devchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05).*

“Just go outside” is fine advice in a city where the air is the same all day.

In Gwalior it needs a time attached. This was the forecast for the rest of Sunday 11 October, fetched at 3:17 PM:

| Hour | Temperature | Forecast US AQI | Verdict |
| --- | --- | --- | --- |
| 4 PM | 32.6°C | 108 | too hot, air over the limit |
| 5 PM | 31.5°C | 120 | air over the limit |
| 6 PM | 30.1°C | 125 | air over the limit, and past the 5:52 PM sunset |

The afternoon only cools down as the air gets worse. The saved limits were 32°C and AQI 100, so the card said not today:

```text
NIKAL — Your cue to step outside
Gwalior · API forecast · Local AI selection
Remembered: ≤32°C · any · 3 km radius · AQI ≤100
Nothing suitable left today. Tomorrow 7:00 AM IST (12 Oct) looks best.
Forecast US AQI 87 · 25°C · sunset 5:52 PM.
Try veerangna jhalkaribai koli park · approximately 1.0 km straight-line.
Close this tab. Go outside.
```

That is a real card with some whole lines left out. It is also the entire product.

## What I Built

Nikal means “go out” in Hindi. It is a small TypeScript CLI that answers one question for Gwalior: when should I step outside, where could I walk, and is anything happening nearby?

It does five things, in order:

1. Reads my saved comfort limits from local memory: maximum temperature, AQI, UV, rain chance, morning or evening, and walking radius.
2. Fetches the hourly forecast and modeled air quality from Open-Meteo.
3. Finds mapped parks, gardens and footpaths within 3 km from OpenStreetMap.
4. Searches Google through SerpApi for outdoor events in the city this week, when a key is configured.
5. Hands the hours and places that survived my limits to Qwen 2.5 7B, running on my laptop through Ollama, to pick one of each.

Then it prints one card and exits. There is no feed and nothing to scroll. The last line is always “Close this tab. Go outside.”

If nothing passes, it says so. It does not loosen my limits to produce a recommendation.

## Demo

![Terminal recording of five real Nikal runs](https://raw.githubusercontent.com/jashanpreet-k/Nikal/main/docs/images/nikal-demo.gif)

*Recorded on 11 October 2026 at 3:43 PM IST with [VHS](https://github.com/charmbracelet/vhs). Every command really runs. Frames are hidden while a command is working, so model and network waits are cut. The output is unedited.*

The part I most want you to look at is the memory. Each step is a separate CLI process:

| Step | What happens |
| --- | --- |
| 1. `nikal --fixture` on a fresh profile | Qwen picks **5:00 PM**, the hour with the cleanest air. |
| 2. `nikal chat "I dislike heat above 30°C and prefer mornings."` | Prints `maxTemp: 32 → 30` and `period: "any" → "morning"`. |
| 3. `nikal prefs show` | A new process reads both values back from Mastra working memory. |
| 4. `nikal --fixture` again | Same forecast, new process. Qwen now picks **7:00 AM**. |

Steps 1 and 4 use a synthetic forecast, and the card says so: `OFFLINE FIXTURE · synthetic data`. That keeps the before and after comparable. The model call, the tool call and the SQLite memory are real.

![Terminal screenshot: the chat saves two preferences and a new process reads them back](https://raw.githubusercontent.com/jashanpreet-k/Nikal/main/docs/images/terminal-2-memory.png)

Step 5 in the recording is a live run from approximate city-centre coordinates, not my home:

![Terminal screenshot: the live card](https://raw.githubusercontent.com/jashanpreet-k/Nikal/main/docs/images/terminal-4-live.png)

Two things to know about this recording:

- **It ran without a SerpApi key.** Its card says the event search was skipped, so the video shows no search results at all. The SerpApi results I describe further down come from a separate keyed run on 11 October at 12:25 AM IST. That run is in the logs and is not part of this video.
- **It is not the first take.** In five earlier takes that afternoon all three public map servers failed, and the card said `Places unavailable` and still gave a time. This take was recorded after I raised the map-server timeout from 8 to 15 seconds.

### Did I actually go?

Not yet. The card at the top is why: on Sunday afternoon every remaining daylight hour failed the air-quality limit, so Nikal moved the walk to 7:00 AM on Monday 12 October.

I will add the photo, where I ended up, and what the app got wrong here after that walk.

## Code

[GitHub: jashanpreet-k/Nikal](https://github.com/jashanpreet-k/Nikal), MIT-licensed.

`npm run check` type-checks, builds and runs 106 tests. Those tests mock the APIs and the model. The real-model and live-API runs are kept separately in the [evidence excerpt](https://github.com/jashanpreet-k/Nikal/blob/main/docs/EVIDENCE_EXCERPT.md) and the [verification report](https://github.com/jashanpreet-k/Nikal/blob/main/docs/VERIFICATION.md). The recording above is reproducible from [`scripts/demo.tape`](https://github.com/jashanpreet-k/Nikal/blob/main/scripts/demo.tape).

Built on 10–11 October 2026. Solo: @jashanpreet_kaur_917e774f, with AI coding assistance; no human teammates.

## How I Built It

### Why Mastra

I wanted a small local model in the loop without trusting it with anything it could get wrong. Mastra gave me four pieces, and each one has a specific job.

**Tools.** Weather, places and events are each a `createTool` with Zod input and output schemas. A malformed API response fails at the tool boundary and never reaches the card.

**Workflow.** The steps are `fetchConditions → [findPlaces ‖ findEvents] → joinRetrieval → agentDecides → formatCard`. The data steps always run, in code. I did not want a 7B model deciding whether to check the weather. Places and events run in parallel and fail separately, so a dead map server cannot take the forecast down with it.

**Memory.** Preferences live in Mastra working memory, scoped to a resource ID, validated by a Zod schema, and stored in a local SQLite file through LibSQL. The first workflow step reads them before anything is fetched. So “≤30°C, mornings” changes which hours are eligible at all, and the model never sees the rest.

**Agent.** One agent definition serves the workflow and Mastra Studio, where the same tools are available for poking at it directly.

![The Nikal workflow graph in Mastra Studio after a completed run](https://raw.githubusercontent.com/jashanpreet-k/Nikal/main/docs/images/studio-workflow-graph.png)

*Mastra Studio after a fixture run: six steps, with places and events in parallel. `agentDecides` took 2.5 seconds because it is the only step that calls the model. Cropped from the [full Studio screenshot](https://raw.githubusercontent.com/jashanpreet-k/Nikal/main/docs/images/studio-workflow-run.png).*

### A small model on a short leash

Qwen never writes a number. It gets the surviving hours and places with IDs, plus my saved intent (“A short, comfortable walk in a green space.”), and returns four fields:

```json
{ "timeId": "1791631800", "placeId": "fixture/garden", "reason": "cleaner-air", "leadId": null }
```

Nikal then checks that both IDs exist in what was fetched, that the place is inside my radius, and that the reason is true. `cleaner-air` is only accepted if that hour really has the lowest AQI among the candidates.

A wrong answer gets one retry with the error attached. After that the card is labelled `Deterministic fallback`, and it never claims the model chose.

Every temperature, distance and link on the card is copied from the tool results.

The chat command gets the same treatment. Its tool only stages a change. Nikal saves it after the model finishes cleanly, then prints the old and new values from the database instead of the model's reply.

### What broke

**Overpass.** The public OpenStreetMap query servers returned 504s and timeouts on and off across both days. Nikal tries three mirrors once each, then a 24-hour cache, then says `Places unavailable` and still gives the time. While recording, the main server was answering in 5.7 to 8.4 seconds against my 8-second timeout, so I raised it to 15.

**A bug the recording caught.** With all three mirrors down, the warnings were squeezed onto one line and cut at 350 characters, so one card ended a sentence with “event search skippe”. Each warning now gets its own line.

**SerpApi's events engine.** `google_events` no longer accepts new requests. Nikal uses the Google Search engine instead and reads `events_results` when Google shows an events box, then the organic results. My first parser ignored the organic results and found nothing.

**The forecast moves.** Two runs a few minutes apart gave AQI 87 and then 93 for the same 7 AM hour. It is a model forecast, and the card says “Forecast”. It is not a sensor on my street.

### Limits

- **No event has verified yet.** A search result is only a lead. Nikal fetches the page and accepts it only if it carries a dated schema.org `Event` that matches the lead's title, is in Gwalior, and falls in the current week. In a separate keyed run (11 October, 12:25 AM IST; kept in the logs, not shown in the video) Google showed no events box, and the three leads were a Facebook topic page, a run organiser's archive and an Instagram reel for a shopping bazaar. The reel's snippet even had dates in it. Nikal still said “No verified event found”, because a snippet is not a source page. I would rather ship that than a guessed date.
- **“This week” ends on Sunday night.** On a Sunday afternoon almost nothing can qualify. A rolling seven days would be better.
- Distances are straight lines. OpenStreetMap does not prove a park is open, public or safe.
- The limits are comfort filters, not medical advice.
- Qwen 2.5 7B is the only model I have verified.

## Why Does Open Innovation Matter?

Because of what it let me check, and what it lets you check.

**Open weights.** Qwen 2.5 7B is Apache-2.0 and 4.7 GB. It runs on my laptop, so the prompt with my preferences in it goes to `localhost:11434` and nowhere else. Nikal refuses any model endpoint that is not loopback.

**Open-weight is not open-source.** Published weights are not software I can rebuild from source. Mastra, the AI SDK, Ollama and Nikal itself are open-source. I think the difference is worth stating.

**Open data.** The forecast is Open-Meteo and the parks are OpenStreetMap. The park on my card is [a link anyone can open](https://www.openstreetmap.org/way/1561235682), and correct if it is wrong.

**Open code.** The rule that stops the model inventing a temperature is about twenty lines in [`src/recommendation.ts`](https://github.com/jashanpreet-k/Nikal/blob/main/src/recommendation.ts). You do not have to take my word for it.

Two claims I want to keep exact:

- **Privacy.** Model inference and preference memory stay on the laptop. Retrieval does not: Open-Meteo and Overpass receive coordinates, SerpApi receives a city-level query, and event sites receive a page request.
- **Cost.** ₹0 in paid API and model charges within free-tier limits. The laptop, the electricity and the network are not free.

## Prize Categories

**Best Use of Mastra.** Schema-typed tools, a parallel workflow, an agent and resource-scoped working memory, each doing a job the others cannot. The memory is the part that changes the answer: a preference saved through chat moved the pick from 5 PM to 7 AM in a separate process.

**Best Use of SerpApi.** SerpApi's Google Search finds the leads, and Nikal refuses to promote one to an event without a dated source page. The video above ran without a key and shows no search. The evidence is a [separate keyed run kept in the logs](https://github.com/jashanpreet-k/Nikal/blob/main/docs/EVIDENCE_EXCERPT.md#separate-recorded-live-workflow--06-livetxt): three leads, zero verified events, and a model that chose none of them.

Credits: [Mastra](https://mastra.ai/), [AI SDK](https://ai-sdk.dev/), [Ollama](https://ollama.com/), [Qwen](https://github.com/QwenLM/Qwen2.5), [Open-Meteo](https://open-meteo.com/) and [CAMS](https://atmosphere.copernicus.eu/), © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) and [Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API), [SerpApi](https://serpapi.com/search-api), and [VHS](https://github.com/charmbracelet/vhs).
