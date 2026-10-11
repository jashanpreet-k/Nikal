---
title: "Nikal: A local AI agent that remembers your comfort—and tells you to go outside"
published: true
tags: devchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05).*

In Gwalior, ‘just go outside’ needs a time attached. Heat and air quality change throughout the day. I built Nikal around a practical question: when could I step outside comfortably, and where could I go?

## What I Built

**Nikal — Your cue to step outside** is a small TypeScript CLI. Nikal means “go out” in Hindi.

It checks forecast weather, air quality and daylight against remembered preferences. A local model chooses among eligible hours and mapped places. Optional search adds outdoor activity leads, without treating every result as a confirmed event.

The goal is one terminal card, then **“Close this tab. Go outside.”**

When nothing suitable remains today, it checks tomorrow and explicitly labels that extended horizon **Tomorrow**. If neither day passes the filters, it says so.

## Demo

Video walkthrough to follow.

The clearest demonstration is remembering a preference between commands. These runs used **synthetic weather/place facts with actual local Qwen inference**, in an isolated profile:

| Step | Actual result |
| --- | --- |
| Run the fixture with defaults | Local Qwen selected **5 PM**. |
| Chat: “I dislike heat above 30°C and prefer mornings.” | Chat saved **30°C + morning** through the staged preference tool. |
| Retrieve preferences in a separate CLI process | Mastra working memory returned **30°C + morning**. |
| Run the fixture again | The next real-model run selected **7 AM**. |

Both recommendations were **local-ai on attempt 1**. The facts were synthetic; inference and persistence were real. The changed answer shows the preferences taking effect across process restarts.

The latest recorded live run used approximate Gwalior city-centre development coordinates. **Weather, AQI, Overpass and search were live**, and Qwen made a validated selection on its first attempt:

```text
Go at 7:00 AM IST (11 Oct).
Forecast US AQI 70 · 23.9°C · sunset 5:53 PM.
```

Overpass supplied “veerangna jhalkaribai koli park,” approximately 1.0 km away in straight-line distance, with an [OpenStreetMap source](https://www.openstreetmap.org/way/1561235682).

SerpApi returned **three unconfirmed leads, zero corroborated events**, and the model selected **none** (`selectedLeadId: null`). The card said “No verified event found.” Live search means Nikal did not use its local search cache.

An outdoor trial has not yet been completed. I will add the actual experience and photo after using Nikal outdoors.

## Code

[GitHub: jashanpreet-k/Nikal](https://github.com/jashanpreet-k/Nikal)

The MIT-licensed repository includes source, tests and setup instructions. Earlier dated checks are in the public [verification report](https://github.com/jashanpreet-k/Nikal/blob/main/docs/VERIFICATION.md).

## How I Built It

Mastra supplies the tools, workflow, agents and persistent Memory. Each piece has a specific job.

The tools validate retrieval inputs and outputs. Weather and AQI are joined by timestamp; missing readings cannot pass the comfort filters. Preferences are loaded before retrieval.

The workflow fetches conditions, retrieves places and event leads in **parallel**, joins their results, then asks the agent to decide and formats the card. Optional search or place failures retain the available forecast facts.

**Qwen2.5:7b runs locally through Ollama.** It chooses supplied IDs and a factual reason. Deterministic validation checks both; displayed readings, names and links come from retrieval data. Invalid output gets at most one repair, then a labeled deterministic fallback. Normal recommendation generation has model tool calls disabled.

Retrieved text is untrusted data. Unconfirmed leads stay separate from corroborated events; an invented lead ID is rejected. A lead cannot change weather, time or place facts, or imply a confirmed schedule.

**Mastra Memory uses LibSQL/SQLite**, with resource-scoped working memory and stable resource/thread IDs. A new process reads the same preferences instead of starting over.

Preference chat stages a validated patch through its save tool. Only successful generation permits the application to validate and commit the merged preferences. Failure or abort discards staged changes. The CLI prints persisted changes, so the model merely saying “saved” is insufficient.

Debugging made the source labels necessary. Overpass mirrors sometimes failed or timed out, so bounded retries and dated caches give honest recovery; an empty curated list yields unavailable places. The latest live run succeeded.

SerpApi's deprecated Google Events engine needed replacing with Google Search. Its parser also needed `organic_results` support. Relevant results now remain unconfirmed leads when dated source corroboration fails; general activity pages do not become upcoming events.

The latest recorded gate passed **type-checking, build and 105 tests**. Automated model/API scenarios use mocks or synthetic facts, with genuine SQLite persistence. The real-model fixture runs and live API results above are separate evidence.

### Limitations

Public APIs can fail. Cached, curated and deterministic output is labeled; fallback never counts as inference. Source corroboration can reject pages without usable dated evidence.

AQI is modeled, distances are straight-line estimates, and place access/hours remain unverified. Comfort filters are not medical guarantees.

## Why Does Open Innovation Matter?

Qwen is **open-weight**; Mastra and Nikal are **open-source software**. Local weights make laptop inference possible, while source access lets me inspect the filters, validation and memory behavior.

Inference and preference memory stay local. Retrieval still sends required coordinates to Open-Meteo/Overpass and city queries to SerpApi; source sites receive verification requests.

Paid model/API charges can be **₹0 within free-tier limits**, excluding hardware, electricity and network costs. The model provider is separate from the workflow, allowing model changes without rebuilding retrieval. Only Qwen has been verified; configured alternatives still need compatibility checks.

## Prize Categories

**Best Use of Mastra — $100 USD.** Demonstrated orchestration combines tools, parallel retrieval, validated local selection, transactional chat and persistent Memory. The separate-process 5 PM → 7 AM demo shows why memory matters.

**Best Use of SerpApi — $100 USD.** Actual city-level search supplied three live leads to the workflow, with source links and conservative corroboration. Zero confirmed events and no selected lead remain explicit.

Credits: [Mastra](https://mastra.ai/), [AI SDK](https://ai-sdk.dev/), [Ollama](https://ollama.com/), [Qwen](https://github.com/QwenLM/Qwen2.5), [Open-Meteo](https://open-meteo.com/)/[CAMS](https://atmosphere.copernicus.eu/), © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)/[Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API), and [SerpApi](https://serpapi.com/search-api).
