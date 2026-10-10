# Paste-ready technical context for Claude

Copy the text below into Claude. This describes the implementation already built; it is context, not an instruction to rebuild it.

---

We have built **Nikal — Your cue to step outside** in `/Users/jashanpreetkaur/Desktop/Nikal`. Please understand the existing project, its technical design, verified results and aim from this context. Do not assume unverified integrations succeeded or that we have already published a submission.

## 1. What we built and what we are targeting

Nikal means “go out” in Hindi. The human problem is: **Should I step outside today in Gwalior, given the heat, air quality and daylight? What nearby green space could I consider?** The app gives one short terminal card, then stops. It ends with “Close this tab. Go outside.” The screen should be the shortest part of the experience.

This is a TypeScript CLI, with optional Mastra Studio for inspecting the workflow. There is no big frontend, hosted inference service, route planner or deployment. It retrieves forecast weather/AQI, mapped parks/gardens/paths, and optionally source-corroborated outdoor events. It remembers comfort preferences locally and uses a local model to choose among eligible candidates.

Our primary award target is **Best Use of Mastra — $100 USD** in the **DEV Hacktoberfest Open-Source AI Challenge, Week 1: Touch Grass**. Agents, tools, five domain stages plus an explicit parallel-output join, and persistent working memory are implemented. Optional transactional preference chat is implemented and mock-tested, not real-model verified. The original secondary target was **Best Use of SerpApi — $100 USD**, but we will include that category in the submission only after an actual keyed live run succeeds. The current DEV draft lists Mastra only.

The official deadline is **11 October 2026, 11:59 PM PDT**, equivalent to **12 October 2026, 12:29 PM IST**. Writing quality carries the most judging weight, followed by relevance, creativity and technical execution; partner technology is also assessed for its category. These are targets, not claims that we have won. The official source is [the challenge page](https://dev.to/challenges/hacktoberfest-week1-2026-10-05), checked on 10 October. A submission can win once per challenge even if eligible for multiple categories.

## 2. Runtime, dependencies and build

The tested environment is macOS/zsh with **Node 24.14.0**. The package requires Node **≥22.13.0**. Dependencies are pinned, with the existing `package-lock.json` retained:

| Package | Pinned version | Role |
| --- | --- | --- |
| `@mastra/core` | 1.75.0 | Agent, tools, workflow and application registry |
| `@mastra/memory` | 1.36.0 | Resource-scoped structured working memory |
| `@mastra/libsql` | 1.25.1 | Local SQLite-backed Mastra storage |
| `@ai-sdk/openai-compatible` | 3.0.67 | AI SDK model provider for Ollama's `/v1` interface |
| `zod` | 4.6.5 | Runtime schemas and validation |
| `dotenv` | 17.3.1 | Optional quiet local configuration loading |
| `mastra` | 1.33.0 | Development CLI and optional Studio |
| `typescript` | 5.9.3 | Compiler |
| `tsx` | 4.23.15 | Running TypeScript development/test files |
| `@types/node` | 24.19.2 | Node typings |

The package is ESM (`"type": "module"`). TypeScript targets `ES2022`, uses `NodeNext` module/module resolution, `strict`, and `noUncheckedIndexedAccess`. Source imports use `.js` extensions for compiled Node ESM. The build emits `dist/` with source maps; tests are excluded from the production build.

`package.json` registers the `nikal` executable at `dist/cli.js`, which has a Node shebang. `npm link` has already worked locally. `node dist/cli.js` is equivalent without global linking. Bare `npx nikal` is not an installation promise: the package has not been published.

Scripts:

- `npm run typecheck`: `tsc --noEmit` over source and tests.
- `npm run build`: `tsc -p tsconfig.build.json` over source.
- `npm test`: `node --import tsx --test tests/*.test.ts` using Node's test runner.
- `npm run check`: typecheck, build, then all tests.
- `npm run dev`: run the TypeScript CLI directly.
- `npm run demo`: compiled synthetic deterministic fixture.
- `npm run demo:memory`: isolated, separate-process memory demonstration.
- `npm run studio`: local Mastra development server with telemetry disabled.

## 3. File layout and responsibilities

- `src/cli.ts`: parses commands with Node `parseArgs`, selects preferences/doctor/workflow execution, prints the card or JSON, and closes SQLite storage in `finally`.
- `src/config.ts`: environment configuration, exact local model/endpoint restrictions, labeled development coordinates, stable memory IDs and telemetry settings.
- `src/domain.ts`: Zod schemas, data types, IST calendar helpers and terminal text sanitization.
- `src/app.ts`: creates memory, agent and workflow, then registers them in a `Mastra` instance with shared storage, disabled logger and loopback server configuration.
- `src/memory.ts`: genuine Mastra Memory reads/validated updates backed by LibSQL.
- `src/agent.ts`: agent instructions, local AI SDK provider, local-model-file probe and sanitized failure classifications.
- `src/tools/conditions.ts`: Open-Meteo retrieval and timestamp/day-aware joins.
- `src/tools/places.ts`: Overpass query/parser, mirror failover, dated cache and user-curated fallback.
- `src/tools/events.ts`: SerpApi search, bounded source retrieval and conservative JSON-LD event corroboration.
- `src/http.ts`: validated HTTP requests, bounded retries/timeouts, atomic caches and source provenance.
- `src/recommendation.ts`: hard candidate filtering, today/tomorrow selection, grounded decision validation and deterministic fallback.
- `src/leads.ts`: bounded, display-validated unconfirmed lead candidates with stable SHA-256 IDs derived from canonical source URLs; shared by validation, prompting and rendering.
- `src/workflow.ts`: five committed Mastra steps and bounded model repair.
- `src/card.ts`: one compact card rendered from validated facts and explicit provenance.
- `src/doctor.ts`: actual local generation/tool-call probes and optional one-query event diagnostic.
- `src/chat.ts`: separate two-tool agent, strict run-local patch staging, bounded generation and commit/discard orchestration; prints persisted diffs instead of model prose.
- `src/fixtures.ts`: explicitly synthetic test facts and fixed fixture clock.
- `src/mastra/index.ts`: optional Studio entry point.
- `data/curated-places.json`: valid JSON, explanatory `_comment`, initially empty `places` array.
- `tests/`: focused recommendation, rollover, source, cache, workflow, memory, model-guard and doctor tests.
- `README.md`, `SETUP.md`, `docs/DEMO.md`, `docs/VERIFICATION.md`, `docs/DOCS_CHECK.md`, `docs/DEV_POST_DRAFT.md`: setup, recording, evidence, reference checks and unpublished submission draft.

## 4. Domain schemas and data contracts

Runtime boundaries use Zod, rather than relying only on TypeScript types. Core objects are:

- `Preferences`: maximum temperature/AQI/UV/rain, preferred period, radius, nullable start coordinates and a short intent string.
- `Hour`: stable ID, epoch-millisecond time, nullable temperature/rain/UV/AQI/PM2.5/sunrise/sunset.
- `Conditions`: hours, fetch time, warnings, nullable retrieval error, and separate weather/air cache metadata.
- `Place`: OSM/curated ID, cleaned name, park/garden/path kind, coordinates, straight-line distance and source URL.
- `Places`: candidates, warnings, provenance (`live`, `cache`, `curated`, `fixture`, `unavailable`) and optional original fetch time.
- `Event`: cleaned title, explicit start date, location, HTTPS source, verification time and optional cached-verification flag.
- `Events`: corroborated events, unconfirmed leads, warnings and search provenance.
- `Decision`: a **strict** object containing `timeId`, nullable `placeId`, an allowed reason code and optional nullable `leadId`; no model-authored facts or prose fields.
- `Context`: run flags, current time, preferences, start/location label, retrieved facts, passing candidates, decision, mode, model attempts and `recommendationDay`.
- `CardOutput`: `{ card, context }`; `--json` exposes this same result.

Modes distinguish `local-ai`, `deterministic-fallback`, `no-window` and `unavailable`. Invalid input or corrupt saved memory fails clearly; it must not silently loosen preferences.

## 5. Real Mastra orchestration

The actual workflow is:

`fetchConditions → parallel(findPlaces, findEvents) → joinRetrieval → agentDecides → formatCard`

It is constructed with `createStep`, chained with `createWorkflow(...).then(...)` and the installed 1.75.0 `.parallel([...])`, then finalized with `.commit()`. The CLI creates a workflow run, calls `.start({ inputData })`, checks `result.status`, and prints its result. There are six step nodes: five domain stages and the explicit join. No speedup has been measured or claimed.

1. `fetchConditions` loads persisted preferences **before retrieval**, resolves coordinates and uses the actual current time or fixed fixture clock. It fetches conditions or returns labeled synthetic conditions.
2. `findPlaces` invokes the places tool, or synthetic fixture data, in parallel with events. Necessary forecast failure skips retrieval; expected HTTP/timeout/malformed failures produce unavailable places.
3. `findEvents` invokes the event tool, or synthetic fixture data. Expected failures produce a typed degraded event result; events are optional and never required for a walking-time cue.
4. `joinRetrieval` accepts `{ findPlaces: Context, findEvents: Context }`, keeps the original conditions/preferences/run flags/time/start label and places from the first branch, and attaches events from the second. Its output is the downstream `Context` schema. Unexpected programming errors may propagate.
5. `agentDecides` filters eligible hours, chooses today or tomorrow, skips inference if no hour passes, otherwise invokes the local agent unless `--no-model` was requested. It validates the result and allows at most one repair.
6. `formatCard` renders the factual, provenance-labeled card and retains context for inspection.

Retrieval uses actual `createTool` tools with input/output schemas. Workflow invocation calls `.execute(input, { observe: noopObserve })` as required by the pinned Mastra API. Normal retrieval is orchestrated deterministically, so it does not depend on a small model repeatedly deciding which tool to call.

The agent also exposes a read-preferences tool and the retrieval tools for direct Studio exploration. Direct Studio chat is exploratory; the final recommendation validator belongs to the workflow. Tool-call compatibility and normal JSON selection are separately tested.

## 6. Persistent memory across independent processes

Preferences use `Memory` from `@mastra/memory` and `LibSQLStore` from `@mastra/libsql`, at `file:<dataDir>/memory.db`.

- Stable resource ID: `nikal-local-user`.
- Stable thread ID: `nikal-outdoor-cue`.
- Working memory: enabled, **resource-scoped**, structured with the `Preferences` schema.
- Reads: `getWorkingMemory({ threadId, resourceId })`, JSON decode and schema validation.
- Saves: read previous preferences, merge the requested patch, validate the complete result, then `updateWorkingMemory(...)` with JSON.
- Thread/storage initialization is awaited once per application instance; storage closes after CLI execution.
- Generation uses the same resource/thread with `readOnly: true`.
- Context history is bounded to four messages; semantic recall is disabled. No remote embeddings or observational-memory model is configured.

Default preferences are **32°C**, **US AQI 100**, **UV 5**, **rain probability 30%**, **any period**, **3 km radius**, no personal start and a short comfortable green-space-walk intent. Validated ranges are temperature 5–45°C, AQI 0–150, UV 0–12, rain 0–100%, radius 0.1–3 km and intent at most 300 characters.

`nikal prefs set --max-temp 30 --period morning` updates genuine working memory. A new CLI process retrieves it before fetching/filtering. Radius, intent and other previously saved fields remain unless explicitly changed. The normal recommendation model never modifies this memory.

Optional `nikal chat "<message>"` uses a separate local agent with only `readPreferences` and `savePreferences`; it has no retrieval tools and does not mutate the recommendation agent. Empty/whitespace input is rejected before model invocation. The strict patch permits only `maxTemp`, `maxAqi`, `maxUv`, `maxRain`, `preferredPeriod`, `radiusKm` and `intent`; `preferredPeriod` maps to stored `period`. Existing bounds remain, coordinates/unknown fields are rejected, and defaults are removed before making fields optional so omitted fields cannot reset preferences.

The save tool responds **“Preferences staged, not saved.”** Its run-local patch merges multiple calls with the last supplied value winning. Generation uses read-only memory, only these two active tools, at most five steps, temperature zero, 250 output tokens, zero SDK retries and the existing local-file/provider guards. Generation has the configured deadline; an abort race also handles a generator ignoring cancellation. Error/abort/timeout closes and clears staging. Full generation output errors, tripwires and abort/error/suspended finish reasons are checked before persistence. After successful generation, one existing validated `memory.save(patch)` call performs the full merge; persist-time validation failure saves nothing. Only actual persisted old/new values are printed, JSON-quoted to avoid terminal controls. No tool call, failure or no changed values prints **“No preferences changed.”** Model prose is never printed as proof of saving. This command is mock-tested with real SQLite but **real-model chat has not been run**; small-model tool calling can vary.

Default storage is `~/.nikal`; `NIKAL_DATA_DIR` or `--data-dir` selects an isolated profile. All verification/recording profiles are separate from the user's ordinary saved preferences. No real profile was reset for the demo.

## 7. Coordinates, weather, AQI and the extended horizon

Coordinate precedence is **saved start → configured environment start → development city centre**. Both latitude and longitude must be supplied together and pass WGS84 bounds. Development coordinates are **26.2183, 78.1828**, explicitly labeled approximate Gwalior city centre, **not the user's home**.

The weather request goes to Open-Meteo `/v1/forecast` for hourly `temperature_2m`, `precipitation_probability`, `uv_index`, and daily `sunrise,sunset`. Air quality comes from `/v1/air-quality` for `us_aqi,pm2_5`. Both use `timezone=Asia/Kolkata`, `timeformat=unixtime`, `forecast_days=2` and the selected coordinates.

The APIs return Unix **seconds**; internal times are **milliseconds**. Air readings are indexed by exact UTC timestamp and joined to weather by that timestamp, never by array position. Sunrise/sunset are indexed by each hour's IST calendar day. Missing values remain `null` and exclude the hour; they are never interpreted as zero.

Future hourly facts are retained through the end of tomorrow's IST day. IST is a fixed UTC+05:30 offset with no DST. Calendar boundaries use that offset; display uses `Intl.DateTimeFormat` with `Asia/Kolkata`, independently of the laptop timezone.

Eligible hours must be future, have all required readings, obey saved maximums and basic physical-range checks, occur after sunrise, and leave at least **30 minutes before sunset**. PM2.5 must exist and be nonnegative; the saved air threshold is US AQI. Preferred periods are hard filters: morning is 5:00–11:59 AM; evening is 4:00–7:59 PM. Intent helps the model select among passing choices.

The workflow tries **all remaining today** first. Only if that passing set is empty does it try **the complete next IST day** with the same saved preferences. A better tomorrow does not replace an eligible today. This explicitly extends the original 12-hour horizon: late today and tomorrow can be more than 12 hours away. The older pure `candidates` helper retains its 12-hour default for isolated callers/tests; the workflow's `selectDay` supplies explicit calendar bounds.

Tomorrow's card says **“Nothing suitable left today. Tomorrow … looks best.”** It must not describe tomorrow as a next-12-hours result. If both days lack passing hours, no model runs and the card says no suitable daylight window today or tomorrow. A required forecast failure results in unavailable conditions instead of invented readings.

Weather/air caches last 15 minutes and are keyed by coordinates/request and IST date, preventing a yesterday-to-today rollover from reusing a response without the new tomorrow. Weather and air requests run concurrently; each has a 12-second timeout, at most two attempts, and short retry backoff. Expired forecast data is not used as a fallback. Source metadata distinguishes live from cached weather and AQI.

AQI is a **modeled forecast**, not a real-time street sensor. Comfort filters are configurable preferences, not medical or safety guarantees.

## 8. Local inference and grounded selection

Ollama **0.34.4** was detected. The exact **`qwen2.5:7b`** model was downloaded and SHA-256 verified, approximately 4.7 GB. We did not substitute an unrelated installed model. Optional `llama3.1:8b` is allowed by configuration but has not been downloaded/tested here.

The AI SDK `createOpenAICompatible` provider connects to `http://localhost:11434/v1`; its installed model interface reports `specificationVersion: v4`, and actual Mastra execution has verified compatibility.

Configuration allows only loopback HTTP with `/v1`, no credentials/query/fragment, and the two exact local model names. A custom provider fetch enforces the configured origin and `/v1/` route and rejects redirects. Before inference, `/api/show` must confirm a local model file; remote-host/model metadata is rejected. There is no hosted inference fallback. `OLLAMA_NO_CLOUD=1` belongs on the Ollama **server process**; putting it in Nikal's environment cannot reconfigure an already-running server.

Normal selection uses JSON mode, `temperature: 0`, `maxOutputTokens: 250`, zero SDK retries, one generation step and disabled model tool calls. The inference timeout defaults to **90 seconds**, configurable from 1–300 seconds. The pre-inference local-file probe is separately capped at six seconds. The original and repair generation share one inference abort deadline.

The prompt contains all passing hour candidates, all bounded in-radius place candidates, saved preferences/intent, corroborated event facts and a separately named `unconfirmedLeads` list. Up to three display-validated leads have stable URL-derived IDs; retrieved text is explicitly untrusted data, never instructions. A lead establishes no date, schedule, availability or confirmed event and cannot supply or override weather/time/place facts. No unconfirmed candidates are offered when a corroborated event has card priority. Each candidate includes valid factual explanation codes. The model chooses a genuine tradeoff; it is not just paraphrasing a deterministic best answer.

Its strict response shape is (the `leadId` field may be omitted for no selection):

`{ "timeId": "<supplied ID>", "placeId": "<supplied ID or null>", "reason": "<allowed code>", "leadId": "<supplied unconfirmed ID or null>" }`

The application checks strict shape, candidate membership, radius and the reason:

- `cooler`: lowest temperature in the passing hour set.
- `cleaner-air`: lowest AQI in that set.
- `closer`: nearest supplied place.
- `morning` / `evening`: factual local period.
- `green-space`: selected park/garden, not a path.
- `balanced`: a passing comfort-filter choice.

`placeId: null` is valid only when no places exist. Generated prose cannot introduce readings, locations, sources or distances because the final card obtains those directly from tool facts.

Malformed JSON, invented IDs or an ungrounded reason get **at most one repair** with bounded feedback. A second rejected output falls back. Network/model-generation failure falls back directly. A successful repair is labeled; no fallback is counted as successful inference.

The deterministic fallback minimizes **AQI + 2 × temperature + rain probability**, ties toward earlier hours, and chooses the nearest park/garden ahead of paths. It is a transparent heuristic, not a learned or medical score. `--no-model` uses it explicitly. No passing hours means no decision, not a relaxed threshold.

`NIKAL_DEBUG=1` can print limited **untrusted pre-validation model output** and diagnostics to stderr. Those are not validated recommendations and should remain out of public recordings containing personal context.

## 9. Overpass resilience and truthful place provenance

Overpass QL searches `nwr` parks/gardens and walking ways (`footway`, `path`, `pedestrian`) within the saved radius, uses `[timeout:5]`, and returns `out center tags`. Distance is Haversine distance from the start to a node or mapped way/relation centre, not walking distance.

There are exactly three bounded mirror attempts, one per endpoint:

1. `https://overpass-api.de/api/interpreter`
2. `https://overpass.private.coffee/api/interpreter`
3. `https://maps.mail.ru/osm/tools/overpass/api/interpreter`

Each has an eight-second client timeout, zero hidden per-host retries, and 250/500 ms failover delays. Requests are POST form data with the application's User-Agent.

The parser validates the payload and rejects a `remark` indicating incomplete results. It excludes invalid coordinates, explicit `access=private/no` or `foot=private/no`, out-of-radius entries and certain unsuitable path tags. Names are cleaned; OSM IDs become source links. Deduplication uses name/approximate point; candidates are capped at 12, with parks/gardens retained ahead of potentially crowding path segments. Missing tags do not prove public access or opening hours.

Successful validated **raw** responses are saved with the real `fetchedAt` time under `<dataDir>/cache/places/<sha256(start,radiusKm)>.json`. Raw data is revalidated and parsed on reuse. Writes use a temporary UUID file and atomic rename; private directories use mode 0700 and cache files 0600. A cache-save failure warns but does not discard valid live results.

- Matching cache younger than 24 hours: reuse immediately and label **“Places from cache, fetched <date>”** in IST.
- Expired matching cache: attempt all mirrors first, then reuse it only if all fail; preserve the original fetch date and warn it may be outdated.
- No usable cache: load only the user's curated list.
- Invalid/future-dated/corrupt cache, different coordinates/radius, or an empty/invalid curated list: no invented recovery.

`data/curated-places.json` is valid JSON with `_comment` and **`"places": []`**. It contains no sample or claimed real destinations. User-added entries require `id` in `curated/slug` format, `name`, `kind` (`park` or `garden`), WGS84 `lat`/`lon`, HTTPS `source`, and a real nonfuture `verifiedAt` date (`YYYY-MM-DD`). They must be personally verified; distance is recomputed and the saved radius still applies. The card labels this path **“curated fallback”**.

When all mirrors fail with no usable cache/list, the card says **places unavailable**. An honest time cue can still be given without naming a destination.

## 10. SerpApi search and event-source corroboration

The application obtains `SERPAPI_KEY` from configuration/environment. Empty or whitespace-only keys cause an explicit skip with zero calls; forecast planning continues. We never request that the user paste a key into chat.

At most one Google search request uses `engine=google`, default query `outdoor events walks runs street markets in Gwalior this week`, fixed city `location=Gwalior, Madhya Pradesh, India`, `gl=in` and `hl=en`. A later official-documentation check found that `google_events` is deprecated and rejects new requests; SerpApi directs callers to the optional `events_results` module on the Google Search API. The migration removes the legacy `htichips=date:week`; it adds no general search-date filter, because actual event dates remain enforced during source corroboration. The parser now also reads `organic_results`: individually validated title/link/snippet fields must pass cleaned Gwalior/outdoor relevance, nonempty-title and existing public HTTPS checks to become unconfirmed leads. Structured event-module leads take priority; relevant organic leads fill the same deduplicated three-source cap. Search snippets/dates never establish an event or date; source corroboration remains unchanged. Zero qualifying leads yields a distinct no-relevant-leads warning. Optional `NIKAL_EVENT_QUERY` changes only the query text: maximum 120 Unicode code points after trimming, with controls/formatting characters rejected before trimming. Blank/unset uses the default. Invalid configuration fails clearly without echoing the value; query text cannot remove the fixed location parameter. No saved home coordinates, preference intent or other memory is inserted. Search has a 15-second timeout, no retries/pagination and a six-hour local cache keyed by engine, query, city and IST date, never the API key; old-engine caches cannot satisfy the corrected request. Cache hits/missing keys/skipped retrieval make zero searches. Returned API errors, quota/HTTP failures and malformed responses degrade gracefully with sanitized status/category output. The user reported an actual prior HTTP 400, then a live response with empty events/leads and a misleading corroboration warning. Those are user-reported runs; the organic parser correction has only mocked regression evidence here, with no new keyed run in this agent environment.

Search results are **leads**, never confirmed events by themselves. At most three lead source pages are checked. Every displayed corroborated event retains an HTTPS source and its actual `verified <time>` label. It takes priority over leads. If no event is corroborated, a validated local-AI decision may choose one lead by stable ID or none; title/source come only from retrieval. The card explicitly leaves date, availability and status unconfirmed, separate from the time/place cue. Invented IDs enter the same one-repair/fallback path; fallback never inherits a failed model lead selection. On fallback or comfort-only cards, up to two retrieved leads appear as **“Unconfirmed lead (check the source before going): …”** with terminal-sanitized titles and links meeting the HTTPS/no-credentials/public-host display policy. That policy establishes neither source trustworthiness, event authenticity, availability, admission nor destination safety.

Source retrieval rejects credentials, non-HTTPS, IP-literal/internal hostnames and nonstandard ports. DNS must resolve to public IPv4; that address is pinned for the HTTPS request. Redirects are refused. DNS is capped at five seconds, page retrieval at eight seconds and HTML at one MiB.

The verifier inspects at most 12 JSON-LD scripts with bounded nested traversal (depth eight, arrays capped at 100). A source `Event` must corroborate the lead title (at least 60% of substantive words), include an outdoor-activity title, locate it in Gwalior, have an explicit valid date/time with timezone or date-only value, and fall between the current time/date and the end of this IST calendar week. Canceled/postponed/online events are rejected. Ambiguous dates, snippet-only facts and many JS-only/prose pages cannot be verified.

Source verification, including unsuccessful results, is cached for one hour and rechecked against event start/week boundaries. Cached search and cached source verification are separately labeled. Corroboration does not prove availability, admission, public access or safety, and an event's time is not automatically the recommended walking hour.

`nikal doctor --events` bypasses **Nikal's local search cache**, makes exactly one HTTP query when a key exists and prints sanitized PASS/FAIL. SerpApi's own server caching is not forcibly disabled. PASS proves successful search response, **not source-page verification**. No key prints SKIP and makes no query. Failures exit nonzero and never print the key, request URL or API error body.

## 11. Privacy, storage and attribution

The accurate privacy claim is: **model inference/prompts and persistent preference memory stay local**. Live retrieval is not offline or wholly private. Open-Meteo receives coordinates; Overpass receives coordinates/radius; SerpApi receives the city query, API key and request metadata; event sites receive source-page requests. External services also see standard network/IP metadata.

There are no remote embeddings or hosted-model fallbacks. Mastra logging is disabled, no remote observability exporter is configured, and `MASTRA_TELEMETRY_DISABLED=1` / `DO_NOT_TRACK=1` are set. This is not a blanket assertion about every external service's telemetry.

The application normally supports quietly loading local `.env`. For automated verification and private-safe recordings, **`NIKAL_SKIP_DOTENV=1` prevents opening that file**, using process configuration only. The continuation did not read `.env` or actual key values. Do not infer whether the user's `.env` contains a key from a skipped environment-only check.

Private `.env`, `.nikal`, SQLite, caches, logs and `node_modules` are ignored/excluded from the npm package. The safe `.env.example`, compiled runtime, curated JSON, docs, demo script, README/setup and license are included. No package has been published.

Nikal source is MIT licensed; dependencies and model weights retain their own licenses. Credit Mastra, AI SDK, Ollama, Qwen, Open-Meteo/CAMS, OpenStreetMap contributors/Overpass and SerpApi. Qwen2.5 7B weights use Apache-2.0; the optional Llama tag has its own Community License. “No paid model API calls” does not mean hardware/electricity/network cost nothing. Open-Meteo's free service has noncommercial-use terms and SerpApi has account/quota requirements.

## 12. What actually passed, versus mocks and limitations

Use `docs/VERIFICATION.md` as the dated evidence source. The newest continuation on **10 October 2026** passed the complete check after each task: 47 tests after lead display, 51 after query configuration, 58 after parallel retrieval and 72 after chat; an additional genuine-saved-memory/search privacy regression brought the total to **73 passing tests**, with typecheck/build and zero failures/skips. The original 41-test coverage still passes. New API/model responses are mocks; Mastra workflow and SQLite are genuine. No live keyed SerpApi, real-model chat, fresh Ollama inference or live retrieval was run in this continuation. `docs/SERPAPI_EVIDENCE.md` is an empty template, not recorded evidence. Do not infer real-model chat compatibility from previous JSON or single-tool doctor results.

The earlier actual-model/API checks are **10 October 2026, about 9:44 PM IST**, after rollover/resilience but before parallel/chat:

- Strict TypeScript check, production build and **41 tests passed**, zero failures/skips. Tests mock external payloads/model responses where appropriate; the cross-process memory test uses genuine SQLite with synthetic deterministic facts.
- A local npm packaging dry run passed with 44 files, including the empty curated JSON and this handoff prompt, excluding private `.env`, databases, `.nikal` artifacts and `node_modules`. Its build passed; nothing was published.
- Actual loopback `nikal doctor` passed local model-file verification and Ollama → AI SDK → Mastra JSON generation.
- Actual `nikal --fixture --json` passed **validated local Qwen selection**, `mode: local-ai`, `modelAttempts: 1`: **5 PM + Demo Quiet Garden**, `cleaner-air`. Fixture clock is **10 October 2026, 6:30 AM IST**. Readings and “Demo” places are synthetic; the inference itself is real.
- Separate `nikal --no-model --json` with a fresh isolated profile and labeled development coordinates fetched **HTTP 200 weather and air**, retained **26 future joined hours**, and found **four passing tomorrow candidates**.
- That live retrieval chose **11 October, 7 AM IST: 23.9°C, modeled US AQI 70**, with **`deterministic-fallback`, zero model attempts**. It proves live retrieval and rollover, not AI inference.
- Primary Overpass returned **504**, private.coffee timed out at eight seconds, maps.mail.ru returned **504**. No matching cache existed and curated data was empty: **zero places, unavailable provenance**. Mirror/cache/curated recovery paths passed mocked tests; they are not claimed as current live retrieval successes.
- `nikal doctor --events` printed **SKIP** because the verification process environment had no key. `.env` was not opened. No live keyed SerpApi search or actual Gwalior event source has succeeded here.
- The card received a punctuation-only adjustment after that actual network run; the full suite passed again. Reformatting saved data is not an additional live API test.

Earlier **actual local-model memory evidence**, recorded separately at approximately 5:46 PM IST on 10 October:

1. Fresh defaults, new CLI process: **5 PM + Demo Quiet Garden**, `cleaner-air`.
2. Independent preference process saved **30°C + morning**; a separate `prefs show` retrieved both values with unrelated fields preserved.
3. New recommendation process: **7 AM + Demo Green Park**, `green-space`.

Both recommendations were `local-ai`, one attempt, over synthetic fixture data. This was genuine separate-process persistent Mastra memory and genuine local inference. It was not live weather and was not repeated in the newest checks. An unchanged future recommendation can be valid if it meets both preference profiles; inspect persisted values and candidate filters before alleging memory failure.

The separate `demo:memory` script passed **5 PM → 30°C/morning saved → 8 AM**, using actual SQLite across separate processes but explicitly synthetic **deterministic** output. Do not confuse its 8 AM result with the historical model's 7 AM choice.

Previous actual tool-call doctor and local Studio checks passed, but were not rerun in the latest continuation. Earlier Overpass retrieval once returned real mapped parks; that is historical evidence, not current mirror recovery or a user-verified curated list. Llama compatibility remains untested.

Historical dependency audit reported 14 affected entries (nine moderate/five high) in the full graph and seven moderate, zero high/critical in runtime dependencies. These are earlier audit results, not a fresh audit claim. No compatible upstream fix was available then; no disruptive `audit fix --force` downgrade was applied. Dependencies have not changed in this continuation.

## 13. Recording commands and remaining evidence

For a short demo, first show genuine local compatibility, then the isolated model-and-memory fixture, then a separate live retrieval. `npm link` already worked; use `node dist/cli.js` instead of `nikal` if needed.

```zsh
cd /Users/jashanpreetkaur/Desktop/Nikal
NIKAL_SKIP_DOTENV=1 npm run check

(
  export NIKAL_SKIP_DOTENV=1
  export NIKAL_DATA_DIR="$(mktemp -d /tmp/nikal-demo-ai.XXXXXX)"
  export NIKAL_LAT='' NIKAL_LON=''
  export OLLAMA_MODEL=qwen2.5:7b
  export OLLAMA_BASE_URL=http://localhost:11434/v1
  nikal doctor
  nikal --fixture
  nikal prefs set --max-temp 30 --period morning
  nikal prefs show
  nikal --fixture
)

(
  export NIKAL_SKIP_DOTENV=1
  export NIKAL_DATA_DIR="$(mktemp -d /tmp/nikal-demo-live.XXXXXX)"
  export NIKAL_LAT='' NIKAL_LON=''
  nikal --no-model
)
```

Each CLI command is a new process. Temporary directories isolate both memory and caches. The subshell keeps ordinary shell settings intact. These commands skip `.env`; a process-environment SerpApi key, if independently configured, can still be used internally. Do not display secrets in the recording.

For optional keyed verification, the user should edit the existing workspace `.env` privately, preserve its other settings, set `SERPAPI_KEY`, save, then run **`nikal doctor --events`** themselves from the project directory without `NIKAL_SKIP_DOTENV=1`. A regular live `nikal` run subsequently checks source pages. Never paste a key into chat or put a literal key into shared commands.

The remaining user-owned submission items are a public repository link, real recording link, actual outdoor photo and honest outdoor experience, and actual teammate DEV handles (or an honest solo attribution). Personally verified curated entries are optional recovery evidence during Overpass outages. Fresh mapped-place success still depends on public mirror availability. Optional SerpApi prize inclusion depends on real keyed evidence; a diagnostic PASS alone does not verify an event.

Optional real-model chat remains a user-run compatibility check: follow the isolated profile commands in README/SETUP, show persisted `prefs show` before and after, and record the actual result before claiming success. The SerpApi evidence template must stay empty until a real keyed run supplies its date/query/doctor result/lead count/corroboration count/notes.

The DEV draft already follows the official headings: What I Built, Demo, Code, How I Built It, Why Does Open Innovation Matter?, optional My Agent Session, and Prize Categories. It has explicit Limitations, required tags `devchallenge, hf26challenge`, correct privacy wording and all real-experience/link placeholders. README has an empty “Commits after the deadline” note section. Nothing has been published and git history has not been altered.

## 14. Constraints for discussing or continuing this project

Preserve the existing working implementation, pinned dependencies and the user's saved preferences. Keep demo memory isolated. Read README and the latest verification report before making claims. Never invent places, events, readings, outcomes or an outdoor experience; label every fixture, cache, curated recovery and deterministic fallback. Never call fallback a successful model run. Never claim live SerpApi evidence until it actually exists.

Do not read/print/commit private `.env` or real keys. Do not add hosted models, a big UI, unrelated dependencies, publishing steps, git-history changes or AI co-author lines. The aim is a small, credible Touch Grass demo and an evidence-based write-up explaining why Mastra and local open-weight inference materially help this human problem.
