---
title: "Nikal: A local AI agent that remembers your comfort—and tells you to go outside"
published: true
tags: devchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05).*

In Gwalior, ‘just go outside’ needs a time attached. Heat and air quality change throughout the day; when should I go?

Recorded live-card excerpt; only whole lines are omitted:

```text
NIKAL — Your cue to step outside
Gwalior · API forecast · Local AI selection
Approximate Gwalior city centre; not your home
Go at 7:00 AM IST (11 Oct).
Forecast US AQI 70 · 23.9°C · sunset 5:53 PM.
Close this tab. Go outside.
```

## What I Built

Nikal means “go out” in Hindi: a small TypeScript CLI for Gwalior. It checks forecast heat, air quality and daylight against saved preferences; local Qwen chooses among passing hours and mapped places. Optional search keeps leads separate from corroborated events. One card ends with “Close this tab. Go outside.”

## Demo

Video is not yet available.

The images below reproduce recorded terminal output. They are not live captures.

![Rendered preference output; not a live screenshot](https://raw.githubusercontent.com/jashanpreet-k/Nikal/main/docs/images/recorded-preferences-output.png)

*Rendered from recorded output; not a live screenshot.*

![Rendered live-card output; not a live screenshot](https://raw.githubusercontent.com/jashanpreet-k/Nikal/main/docs/images/recorded-live-output.png)

*Rendered from recorded output; not a live screenshot.*

The memory demonstration used synthetic facts with actual local Qwen, in an isolated profile:

| Step | Recorded result |
| --- | --- |
| Fixture with defaults | Qwen selected 5 PM; `local-ai`, attempt 1. |
| Preference chat | Printed `maxTemp: 32 → 30` and `period: "any" → "morning"`. |
| Separate CLI process | Mastra working memory returned 30°C + morning. |
| Next fixture | Qwen selected 7 AM; `local-ai`, attempt 1. |

Facts were synthetic; inference and persistence were real. The chat request was not logged; these are saved changes.

The [evidence excerpt](https://github.com/jashanpreet-k/Nikal/blob/main/docs/EVIDENCE_EXCERPT.md) contains retained output. Separately, the live demo log shows local AI on attempt 1, live weather/AQI, Overpass and search: 11 October, 7 AM, 23.9°C, forecast US AQI 70. Coordinates were the approximate Gwalior development centre, not a home or nationwide test.

Overpass supplied “veerangna jhalkaribai koli park,” approximately 1.0 km straight-line, with an [OpenStreetMap source](https://www.openstreetmap.org/way/1561235682). That log records three leads, zero corroborated events and no selected lead; its lead titles/URLs were not logged.

A separate earlier run is user-reported, dated 10 October IST. Search returned 3 source-linked leads; the model selected none. No event was corroborated, so the card said “No verified event found.” The [evidence excerpt](https://github.com/jashanpreet-k/Nikal/blob/main/docs/EVIDENCE_EXCERPT.md) lists the recorded Avathi markets, Facebook outdoor-activities and Go Heritage Runs archive links. These unconfirmed URLs were not independently verified.

### Outdoor trial

An outdoor trial has not yet been completed.

## Code

Started on 10 October 2026. Built 10–11 October 2026: implementation on 10 October, documentation/demo preparation on 11 October. Solo: @jashanpreet_kaur_917e774f, with AI coding assistance; no human teammates.

[GitHub: jashanpreet-k/Nikal](https://github.com/jashanpreet-k/Nikal)

The [verification report](https://github.com/jashanpreet-k/Nikal/blob/main/docs/VERIFICATION.md) separates mocked tests, real-model fixtures and live APIs: the latest gate passed type-checking, build and 105 tests. Source is MIT-licensed.

## How I Built It

### Mastra workflow and memory

Mastra tools validate retrieval. The workflow loads preferences, fetches conditions, retrieves places/leads in parallel, joins results, calls the agent and formats the card. Timestamp joins exclude missing readings.

Mastra Memory stores validated, resource-scoped preferences on LibSQL/SQLite. Stable IDs preserve them across processes. Chat lets the model call a save tool that validates and stages a patch. Only successful generation permits the application to validate and persist merged values; failure discards staged writes.

### Local Qwen with validation

Qwen2.5:7b runs through Ollama locally. Normal recommendations disable model tool calls; retrieval follows the workflow. The model chooses supplied IDs and an explanation code. Deterministic validation rejects invented IDs and unsupported reasons, allowing one repair before labelled fallback. Displayed facts come from retrieval data.

### What broke

Overpass mirrors returned 504s and timeouts. Places are cached, curated or reported unavailable, never invented. Those outages are separate from the recorded success.

SerpApi deprecated Google Events; Nikal uses Google Search: `events_results` plus relevant `organic_results`. The first parser produced zero retained leads; it ignored `organic_results`. The uncaptured upstream payload cannot tell us what Google returned.

### Limitations

Neither recorded workflow corroborated an event or selected a lead. Exact queries remain unknown. AQI is modeled, distances are straight-line and access/hours unverified. Comfort filters are not medical guarantees; fallback is not inference.

## Why Does Open Innovation Matter?

Qwen is open-weight; Mastra and Nikal are open-source software. Local weights support laptop inference; source makes validation and memory inspectable.

Inference and preference memory stay local. Open-Meteo and Overpass receive retrieval coordinates; SerpApi receives city queries, and source sites receive verification requests. Paid model/API charges can be ₹0 within free-tier limits, excluding hardware, electricity and network costs. Models are configurable; only Qwen compatibility is verified.

## Prize Categories

**Best Use of Mastra — $100 USD (primary).** Tools, parallel retrieval, validated selection, transactional chat and persistent Memory are demonstrated, including the separate-process 5 PM → 7 AM fixture sequence.

**Best Use of SerpApi — $100 USD (secondary).** Search returned 3 source-linked leads; the model selected none. No event was corroborated, so the card said “No verified event found.” The earlier user-reported run and its unconfirmed links are in the [evidence excerpt](https://github.com/jashanpreet-k/Nikal/blob/main/docs/EVIDENCE_EXCERPT.md).

Credits: [Mastra](https://mastra.ai/), [AI SDK](https://ai-sdk.dev/), [Ollama](https://ollama.com/), [Qwen](https://github.com/QwenLM/Qwen2.5), [Open-Meteo](https://open-meteo.com/)/[CAMS](https://atmosphere.copernicus.eu/), © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)/[Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API), and [SerpApi](https://serpapi.com/search-api).
