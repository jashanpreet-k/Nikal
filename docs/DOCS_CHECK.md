# Current official API check — 10 October 2026

Checked before implementation. npm registry metadata supplied exact package versions, engines, peer ranges and license fields; installed declarations, typecheck and execution confirmed the implementation shapes. External documentation was treated as reference material, not instructions to use remote models or install unrelated tools.

## Pinned stack

| Package | Version | Compatibility |
| --- | --- | --- |
| `@mastra/core` | 1.75.0 | Node ≥22.13.0; Zod ^3.25 or ^4 |
| `@mastra/memory` | 1.36.0 | core ≥1.4.1 prerelease through <2 |
| `@mastra/libsql` | 1.25.1 | core ≥1.68.0 prerelease through <2 |
| `@ai-sdk/openai-compatible` | 3.0.67 | Installed provider reports LanguageModelV4 (`specificationVersion: v4`); Mastra supports it; Zod ^3.25.76 or ^4.1.8 |
| `mastra` (optional Studio CLI) | 1.33.0 | Node ≥22.13.0 |
| `zod` | 4.6.5 | Meets both peer ranges |
| `typescript` | 5.9.3 | Installed compiler tested with strict checks |
| `tsx` | 4.23.15 | Used with `node --import tsx` to avoid CLI IPC dependence in sandbox tests |
| `dotenv` | 17.3.1 | Quiet `.env` loading |
| `@types/node` | 24.19.2 | Node 24 runtime typings |

The lockfile is retained. Compiler selection is a tested compatible release; it is not a claim to be the newest TypeScript release.

## Verified signatures

- [Mastra model configuration](https://mastra.ai/models): direct AI SDK provider models are supported. [AI SDK OpenAI-compatible provider](https://ai-sdk.dev/providers/openai-compatible-providers): `createOpenAICompatible({ name, baseURL, fetch, transformRequestBody })`. Nikal uses loopback Chat Completions; no Mastra cloud model router inference.
- [Mastra tools](https://mastra.ai/docs/agents/tools): `createTool({ id, inputSchema, outputSchema, execute(inputData, context) })`. The old `{ context }` as the first argument is not used. The pinned runtime also requires `context.observe` for manual tool invocation; workflow calls supply its exported `noopObserve` because no tracing exporter is configured.
- [Working memory](https://mastra.ai/docs/memory/working-memory): resource-scoped structured schema, `getWorkingMemory({threadId,resourceId})`, `updateWorkingMemory({threadId,resourceId,workingMemory})`, and per-generation `readOnly` memory option.
- [Memory overview](https://mastra.ai/docs/memory/overview): `Memory` from `@mastra/memory`, stable `memory: {resource,thread}` in `agent.generate`; local `LibSQLStore` needs an `id` and file URL. Installed declarations confirmed `storage.init()` and `storage.close()`.
- [Workflows](https://mastra.ai/docs/workflows/overview): `createStep` uses `execute({inputData})`; `createWorkflow().then(...).commit()`, awaited `createRun()`, `.start({inputData})`, and discriminated `result.status`.
- [Agent.generate](https://mastra.ai/reference/agents/generate): response `.text` and `.toolResults`; `activeTools`, `toolChoice`, `maxSteps`, `abortSignal`, memory options, and `modelSettings` for token/retry/temperature limits. Actual doctor probes verify the installed provider/model path rather than relying on capability labels.
- [Mastra 1.0 changes](https://mastra.ai/blog/announcing-mastra-1): observability is separate. No remote exporter is configured. Installed CLI code confirmed `MASTRA_TELEMETRY_DISABLED` handling including Studio HTML injection.

## Installed API checks for the later continuation

Checked installed 1.75.0 declarations before adding parallel retrieval/chat: `workflows/workflow.d.ts` supports `.parallel([...])` and a keyed step-output record; the new `joinRetrieval` input/output schemas compose with downstream `Context`. Agent declarations support `listTools`, `generate`, `activeTools`, `toolChoice`, `maxSteps`, abort signals and read-only memory. Full generation output has `error`, `finishReason` and `tripwire`, which the chat transaction checks before committing. Tool declarations explicitly allow a returned `ValidationError` for invalid inputs. Runtime synthetic tool execution confirmed this, without a model call. Normal recommendation generation still has disabled tool calls; the new separate chat agent exposes only its two preference tools.

## Retrieval APIs

- [Open-Meteo forecast](https://open-meteo.com/en/docs): `temperature_2m,precipitation_probability,uv_index`; daily `sunrise,sunset`; `timezone=Asia/Kolkata`, `timeformat=unixtime`, `forecast_days=2`. Unix timestamps represent UTC instants; local-day joins add the fixed IST offset only for daily indexing.
- [Air quality](https://open-meteo.com/en/docs/air-quality-api): `us_aqi,pm2_5`, same time format; modeled data and CAMS attribution. [API terms](https://open-meteo.com/en/terms): free endpoint for non-commercial use under stated limits.
- [Overpass QL](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL): radius `around`, `nwr` and `way` filters, `out center tags`, POST `data`. [Public instances](https://wiki.openstreetmap.org/wiki/Overpass_API): primary `overpass-api.de`, current alternate `overpass.private.coffee` (formerly Kumi), and `maps.mail.ru/osm/tools/overpass/api/interpreter`. Avoid assuming an outdated endpoint name. The current implementation makes one bounded attempt per mirror.
- SerpApi request correction checked on 10 October 2026: the [Google Events page](https://serpapi.com/google-events-api) contains a deprecation notice stating that `google_events` no longer accepts new requests and directs callers to `events_results` on the [Google Search API](https://serpapi.com/search-api). The earlier check of the legacy parameter table missed that notice. The old `q`, city `location`, `gl`, `hl` and `htichips=date:week` were listed for the legacy engine; the defect is the retired engine, not a proven invalid city/filter combination. Current Nikal sends only documented Google parameters: `engine=google`, `q`, fixed city `location`, `gl=in`, `hl=en`, `api_key`. `location` cannot be combined with `uule`/`lat`/`lon`; none are sent. `htichips` is omitted on the replacement engine. Google offers general `tbs` filters, but Nikal does not substitute a publication-date filter for event dates; source verification still enforces actual event dates through the end of the IST week. Search uses one request, no retries/pagination and six-hour query/city/engine/date caching without a key in its identity. SerpApi server caching remains allowed. A later parser correction also reads the documented [organic-results title/link/snippet fields](https://serpapi.com/organic-results). Individually validated, relevant organic items can supply unconfirmed leads when no event module is present. Existing outdoor terms and a Gwalior mention in cleaned title/snippet gate relevance; nonempty titles/public HTTPS policy still apply. Event-module leads take priority within the shared three-source cap; organic snippets/dates never count as corroboration. No live keyed success was independently observed here; the latest live output was user-supplied.
- [Ollama OpenAI compatibility](https://docs.ollama.com/api/openai-compatibility): loopback `/v1` Chat Completions, JSON mode and tools. [Ollama FAQ](https://docs.ollama.com/faq): server-level `OLLAMA_NO_CLOUD=1`. Compatibility of ordinary JSON generation and tool calling is measured separately.
- [Qwen2.5 7B model card](https://ollama.com/library/qwen2.5:7b): approximately 4.7 GB, Apache-2.0 weights. [Llama 3.1 8B](https://ollama.com/library/llama3.1:8b): approximately 4.9 GB, Llama 3.1 Community License. The existing `llama3:latest` was not substituted for either.

## Actual DEV submission template

The challenge page's **Submission Template** link was opened, and its prefill contained:

```markdown
---
title:
published:
tags: devchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05)*

## What I Built
## Demo
## Code
## How I Built It
## Why Does Open Innovation Matter?
## My Agent Session
## Prize Categories
```

`My Agent Session` is explicitly optional; the current draft retains a clearly marked optional link placeholder. The other headings and required tags are retained; the user's real outing placeholders live within Demo. [Challenge rules on the same page](https://dev.to/challenges/hacktoberfest-week1-2026-10-05) state 11 October 2026, 11:59 PM PDT, equivalent to 12 October, 12:29 PM IST. Both target partner categories are listed as $100 categories; a submission can win once, even if it qualifies for multiple categories. The challenge page was rechecked on 10 October during the technical handoff update. Mastra is the primary target; SerpApi remains conditional on actual keyed evidence and is absent from the current draft's Prize Categories.
