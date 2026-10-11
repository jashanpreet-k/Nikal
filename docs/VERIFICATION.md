# Verification — 10 October 2026

All verification uses labeled development coordinates or isolated fixture profiles. No actual home location was supplied. Existing personal Nikal preferences were not changed. Temporary execution logs and live caches remain local, outside the packaged artifact.

## Event leads, query, parallel retrieval and transactional chat — 10 October 2026

This continuation added only the requested card leads, city-level query configuration, supported parallel retrieval and optional staged preference-chat command, plus their tests/documentation. All checks used **`NIKAL_SKIP_DOTENV=1`**. Private `.env`/real keys were not read or printed; personal preference storage was not used. No dependencies, hosted models, UI, publication, commits or history changes were added. Earlier evidence below is retained unchanged.

### Executed automated gates

| Completed task | Actual `NIKAL_SKIP_DOTENV=1 npm run check` result |
| --- | --- |
| Unconfirmed event leads | Typecheck + build + 47 tests passed, zero failures/skips. |
| Configurable event query | Typecheck + build + 51 tests passed, zero failures/skips. |
| Parallel place/event retrieval | Typecheck + build + 58 tests passed, zero failures/skips. |
| Transactional preference chat | Typecheck + build + 72 tests passed, zero failures/skips. |
| Additional saved-memory/search privacy regression | Typecheck + build + 73 tests passed, zero failures/skips. |
| Documentation/final gate | Typecheck + build + 73 tests passed, zero failures/skips. |

The original 41-test coverage still passes. All new model/API responses are **mocks or synthetic inputs**. Tests use genuine Mastra workflow execution, Zod validation and LibSQL/SQLite storage in isolated temporary profiles. Empty-chat subprocess tests invoke the compiled CLI but reject before model or database initialization; they are not real-model chat runs.

Lead tests cover leads-only, corroborated-only, both, neither, malformed links and hostile titles. Query tests check the 120-code-point limit and controls, fixed Gwalior location, separate query cache identities, zero HTTP requests on a cache hit, synthetic-key exclusion from cache identity/logs, and exclusion of genuinely saved synthetic coordinates/intent from the request.

Parallel tests use a start barrier to establish that both mocked retrieval branches start before either finishes; no speedup is measured or claimed. They check the explicit keyed-output join, retained preferences/conditions/run flags/time/start label, one-branch and both-branch degradation, malformed payloads and skipping both branches after forecast failure. The graph now contains **five domain stages plus `joinRetrieval`**, six step nodes.

Chat tests cover empty/whitespace input, strict patch ranges/unknown-field rejection, no default insertion, staged-not-saved tool response, commit only after generation succeeds, multiple calls merging, actual persisted old/new output, no-tool/unchanged cases, thrown and reported generation failures, timeout/abort, a generation ignoring abort, the configured generation deadline, persist-time full validation failure and unchanged recommendation-agent tools. Generation uses read-only memory and only the two chat tools; only the application invokes the final validated save.

The first chat gate caught missing test callback type annotations. After fixing them, a test incorrectly expected invalid tool input to throw: installed Mastra returns a typed `ValidationError` before execution. The assertion was corrected to verify that returned error, its range/unknown-field message and the empty staged patch. A direct local synthetic tool check confirmed that behavior, without a model call. All required gates then passed before work continued.

Installed API declarations were checked before use: `workflows/workflow.d.ts` exposes `.parallel` with outputs keyed by step; `agent/agent.d.ts` exposes `listTools`/`generate`; `agent/agent.types.d.ts` contains active-tool/abort settings; `stream/base/output.d.ts` includes `error`/`finishReason`/`tripwire`; tool types describe returned input-validation errors; memory types describe `readOnly`. These are checks against the installed pinned release, not guessed API names.

**Live keyed SerpApi and real-model chat were NOT run.** No new Ollama inference, live weather/AQI/Overpass or Studio run is claimed for this continuation. Previous real-model/API evidence below predates these changes. `docs/SERPAPI_EVIDENCE.md` remains an empty template. User checks still needed: an isolated actual local-chat run, optional private-key SerpApi search/source evidence, and the existing repo/video/outdoor-photo/experience/teammate placeholders. Small-model tool-call reliability and public Overpass availability remain limitations.

Gate logs are local under `.nikal/check-event-leads.txt`, `check-event-query.txt`, `check-parallel.txt`, `check-chat.txt` and `check-query-memory.txt`; they are ignored/private execution artifacts.

The final documentation gate is `.nikal/check-event-chat-final.txt`. Read-only document checks confirmed that the entire earlier rollover/resilience report and subsequent evidence remain byte-for-byte unchanged, all six SerpApi template result fields are empty, the curated list is empty, and the README deadline-note section is still empty.

## Latest rollover/resilience verification — 9:44 PM IST

This continuation implemented today/tomorrow rollover, dated place-cache recovery, the empty curated JSON file and `doctor --events`. No dependencies were added, no personal preference profile was used, no Git history was altered, and nothing was published. **`.env` and API keys were not opened or printed.** All checks used `NIKAL_SKIP_DOTENV=1`; key availability here refers only to the process environment, not the unread `.env` file.

### Automated gates and mocked inputs

`NIKAL_SKIP_DOTENV=1 npm run check` passed strict type-checking, build and **41 tests**, with zero failures/skips. Counts include parent tests and subtests. New coverage checks evening rollover beyond 12 hours, morning keeping today's candidates, saved heat/period limits, complete tomorrow timestamp joins, missing readings, and integrated Mastra step/schema/memory/card behavior using mocked retrieval and clocks.

After the documentation updates, `NIKAL_SKIP_DOTENV=1 npm pack --dry-run --json --cache .nikal/npm-cache` passed, including its production build. Its 44-file manifest includes the empty curated JSON and detailed technical handoff prompt; no `.env`, SQLite, `.nikal` artifacts or `node_modules` were included. The safe `.env.example` is included intentionally. This was a dry run, not publication.

Place tests use synthetic responses to check both alternate recovery paths, bounded backoff, fresh dated cache, expired matching cache after all mirrors fail, coordinate-specific isolation, corrupt cache, empty/malformed curated input and a synthetic verified list in a temporary test file. The delivered `data/curated-places.json` remains empty. These tests do not establish successful live mirror/cache/curated recovery.

Event tests use synthetic keys/payloads: environment loading with dotenv disabled, missing-key skip, one fresh query despite a populated cache, quota/HTTP/malformed failures without key leakage, mandatory source URLs, and cache labels. They do not count as live SerpApi evidence. SQLite persistence checks use genuine Mastra local storage.

An initial suite failed an old no-window wording assertion; it was updated to today/tomorrow. A subsequent type check rejected the test helper for Mastra's optional `Tool.execute`; the test replacements now restore the optional method explicitly. The final full suite passed, including a rerun after a small card punctuation adjustment.

### Real local model and live APIs

The requested CLI sequence used `--json` on recommendations to retain inspectable validated context. All commands used a fresh isolated profile under `.nikal/rollover-verification-dp87Fl/`, blank coordinate overrides, loopback Qwen and dotenv loading disabled.

| Actual command | Actual result |
| --- | --- |
| `nikal doctor` | PASS in about 5.8 seconds: local `qwen2.5:7b` confirmed; Ollama → AI SDK → Mastra returned valid JSON. |
| `nikal --fixture --json` | PASS in about 8.6 seconds: `local-ai`, one attempt, today 5 PM + **Demo Quiet Garden (synthetic)**, `cleaner-air`, fixture 31°C/US AQI 45. Real inference over synthetic facts. |
| `nikal --no-model --json` | Fresh Open-Meteo weather/AQI HTTP 200. **Tomorrow, 11 October, 7 AM IST**, 23.9°C, modeled US AQI 70, PM2.5 26.6 µg/m³, UV 0.5, rain 0%, sunset 5:53 PM. Explicit deterministic fallback, zero model attempts. |
| `nikal doctor --events` | **SKIP**: no `SERPAPI_KEY` in the process environment. Zero live event queries; no keyed search/source verification claimed. |

The live run began at **9:44:56 PM IST on 10 October**, at **26.2183, 78.1828, approximate Gwalior city centre, not a home**. It retained 26 joined hours through tomorrow and found four passing tomorrow candidates. The card explicitly said **Tomorrow**. The full tomorrow horizon can exceed the old 12 hours; this particular 7 AM choice was about nine hours ahead. The beyond-12-hour case is covered separately with mocked clocks.

Fresh place retrieval failed: primary **HTTP 504** after about 7.8 seconds; Private.coffee **8-second timeout**; VK Maps **HTTP 504** after about 2.2 seconds. There were three attempts, one per mirror, with 250/500 ms failover pauses. No matching cache existed in the fresh profile and the shipped curated list was empty, so the result was **zero places**, `provenance: unavailable`. No cached or invented park was inserted. Earlier successful mapped-place evidence below is historical.

The first sandboxed doctor attempt could not reach loopback Ollama. The same private-safe verification script was then allowed network access and produced the results above. That environment failure is separate from the successful real-model check. After these runs the card received a punctuation-only adjustment; the full suite passed again. Reformatting saved context is not counted as a new live API run.

Actual stdout, redacted host/path/status traces and summaries remain local under `.nikal/rollover-verification-dp87Fl/`; full gate output is `.nikal/check-rollover.txt`. Private execution artifacts are excluded from packaging. Historical actual-model **5 PM → 7 AM** cross-process memory evidence below was not repeated or relabeled as live weather in this continuation.

Remaining user-owned evidence: optional keyed event search/source verification; repository/video links; actual outdoor photo/experience; teammate DEV handles; and personally verified curated entries if desired. Public mirror availability is still an external limitation. The DEV draft lists only **Best Use of Mastra**, because no live keyed SerpApi run succeeded.

## Earlier demo-readiness rerun — 5:46 PM IST

This continuation inspected the existing implementation and previous report, without recreating the project, reinstalling dependencies, resetting preferences or rebuilding the compiled CLI. No runtime code fix was required. Documentation now uses fresh isolated demo directories, clears coordinate overrides for recordings and preserves existing `.env` settings.

Ollama **0.34.4** was reachable and `qwen2.5:7b` was already available (4.7 GB). The existing compiled CLI passed both `nikal doctor` (actual JSON generation through Mastra) and `nikal doctor --tools` (actual model-invoked tool execution). All inference used loopback Ollama; no hosted model was used.

The real-model memory test used a fresh `model-memory` directory and separate CLI processes for each recommendation, preference save and preference read:

| Actual Qwen run over synthetic fixture facts | Persisted profile | Validated result |
| --- | --- | --- |
| Defaults | 32°C, any period, default walk intent | 5 PM, 31°C, US AQI 45; Demo Quiet Garden; `cleaner-air` |
| Save process, then independent `prefs show` process | 30°C, morning; other values preserved | Retrieved `maxTemp: 30`, `period: morning` |
| Restarted recommendation process | Retrieved 30°C, morning | 7 AM, 29°C, US AQI 88; Demo Green Park; `green-space` |

Both recommendations returned **`mode: local-ai`, `modelAttempts: 1`** and visibly labeled **Local AI selection**. No deterministic fallback was counted as inference. The recommendation changed in this run; exact choices can vary. An unchanged recommendation can be valid when a candidate satisfies both preference sets. Stored values and candidate filtering provide independent memory evidence.

The separate existing `npm run demo:memory` script also passed: synthetic deterministic defaults chose **5 PM**, then a new process retrieved **30°C + morning** and chose **8 AM**. This is genuine cross-process Mastra SQLite persistence, but not real inference or live weather.

### Fresh live APIs and diagnosed place failure

A separate fresh profile/cache used **26.2183, 78.1828**, explicitly labeled approximate Gwalior city centre, not a home. The CLI ran with `--no-model` to isolate retrieval from inference. At **5:46:02 PM IST on 10 October 2026**, both Open-Meteo endpoints returned HTTP 200 in about one second. The result contained **12 joined hourly instants**. The first was **6 PM: 30.8°C, modeled US AQI 99, PM2.5 15.7 µg/m³, rain probability 2%, UV 0.05**. Sunset was **5:54:46 PM IST**, before that hour; the next 12-hour window contained no qualifying daylight hour. The unchanged live answer is correctly **“No suitable window in the next 12 hours.”**

Fresh Overpass retrieval failed at both configured servers: **primary HTTP 504; alternate HTTP 500**. Diagnostic requests using the application's identifying User-Agent showed both `/api/status` pages reachable (HTTP 200). The primary query's error body explicitly reported a dispatcher read/index timeout and that the server was probably too busy. The alternate returned a generic Apache internal-server-error page for the same query using both POST and GET; its underlying server fault cannot be diagnosed further from the public response. This is current upstream availability evidence, not a syntax error or successful place retrieval. An initial diagnostic without an identifying User-Agent received 406/429; the production client already supplies its User-Agent, and those diagnostic failures were corrected rather than attributed to the app.

The live card retained **zero places**, displayed the Overpass warning, and never substituted earlier caches or synthetic destinations. Earlier successful mapped-place retrieval below remains historical evidence; a fresh place recording needs the public service to recover. No additional production retries or providers were added.

No `SERPAPI_KEY` was configured, so the live run explicitly skipped event search. Actual keyed search/source verification remains untested. Configure the key privately in the existing workspace `.env`, save and run from the project root; no secret needs to be sent in chat or placed in a recorded command.

### Checks and local evidence

After the verification, **`npm run typecheck` and `npm test` passed: 21 tests, zero failures/skips**. Automated workflow model responses and event-source/API payloads remain mocks/fixtures; they are distinct from the real Ollama and fresh HTTP evidence above. No runtime source changes required a new build. Existing personal `~/.nikal/memory.db` was absent before this run and remained absent afterward; demo data stays isolated.

Actual stdout, fetch status/timing traces, Overpass response bodies and summaries are retained locally under `.nikal/demo-readiness-7rRlWY/`. That directory is ignored and excluded from the package. The fixtures use a fixed **10 October, 6:30 AM IST** clock; their 5 PM/7 AM recommendations are not recommendations for the live recording time.

Remaining demo/submission blockers: fresh Overpass availability for a successful places recording; an optional private SerpApi key and keyed verification if claiming live event integration; a public repository/recording link; and the user's actual outdoor experience/photo. The draft retains those experience placeholders. Nothing was published and no commits were created.

The sections below retain the earlier implementation verification. Where results differ, the latest rerun above describes current service behavior.

## Build and automated checks

`npm run check` passed: strict TypeScript typecheck, compiled CLI build, and **21 passing tests** (including the parent/subtest accounting for three workflow repair/skip scenarios). The tested runtime is Node 24.14.0 on macOS/zsh.

The tests check timestamp joins across IST midnight with reordered air readings; missing/null data; daylight/comfort windows; bounded HTTP failures; malformed payloads; fresh/expired cache behavior; preserved preference patches and genuine cross-process Mastra memory; rejection of invented candidate IDs/numbers/misleading explanations; OSM private-access/radius filtering, alternate-server degradation and green-space candidate retention; source-page event corroboration; city-only SerpApi parameters, bounded caching, missing keys and quota errors; and local-only model guards.

The final workflow regression tests also verify that an invalid “closer” explanation can receive exactly one grounded repair, that two rejected outputs always produce a labeled fallback, and that an empty comfort window calls no model. Their model responses are mocked test inputs; the separate Ollama evidence below is actual local inference.

The initial `tsx --test` command could not create its IPC socket inside the sandbox. The test script was changed to supported `node --import tsx --test`, and the complete suite then passed. This was an execution-environment fix, not a skipped test.

## Independent-process memory evidence

`npm run demo:memory` passed using a fresh isolated database and separate CLI processes:

| Run | Persisted filters | Synthetic result |
| --- | --- | --- |
| First process | 32°C, any period | 5:00 PM; fixture temperature 31°C, modeled AQI 45 |
| Preference process | save 30°C + morning | Mastra resource `nikal-local-user`, thread `nikal-outdoor-cue` |
| New process | retrieves 30°C + morning | 8:00 AM; fixture temperature 30°C, modeled AQI 85 |

Both recommendation cards explicitly say **OFFLINE FIXTURE · synthetic data · Deterministic fallback**. This verifies actual Mastra SQLite persistence and filtering; it is not a live forecast, real destination, or model reasoning demonstration.

The automated test additionally changes radius and intent, then patches heat/period and verifies that those earlier fields persist. Invalid preference input leaves stored memory unchanged; configured coordinates persist across processes too.

## Real Gwalior retrieval

A real network run around **4:47 PM IST on 10 October 2026** used **26.2183, 78.1828, approximate Gwalior city centre, not a home**. Both Open-Meteo forecast and air-quality requests succeeded, producing 12 joined hourly instants. The next 5 PM hour had forecast temperature **32.3°C**, US AQI **95**, and sunset **5:54:46 PM IST**. It exceeded the default 32°C comfort filter. Later hours did not meet the daylight rule.

The application correctly returned **“No suitable window in the next 12 hours.”** It did not fabricate a time or loosen the remembered filter. No model inference was needed for this empty-candidate result. The initial live retrieval was explicitly invoked with `--no-model` while Qwen downloaded.

The primary Overpass instance returned HTTP 504. After implementing the documented alternate public server and bounded total attempts, a second real request succeeded with mapped candidates. That exposed path-segment crowding, which was fixed with a regression test so parks/gardens remain available to the model. Cached raw OSM data is revalidated/ranked by the updated parser.

The final parser returned real mapped parks, including **Phoolbagh at approximately 1.5 km straight-line** from the approximate development centre and **Maharani Laxmi Bai Marg Park at approximately 1.1 km**. These are mapped candidates, not recommendations in a run with no suitable weather window; access/hours/safety remain unverified.

SerpApi was **not called live** because no key was configured. The card said “No verified event found” and explained that search was skipped. Event search, quota degradation and source verification were tested with clearly artificial HTTP/source fixtures. Separately, the actual bounded public HTTPS fetch against `https://schema.org/Event` succeeded with 252,341 characters; this checks transport/DNS pinning, **not a verified Gwalior event**.

## Ollama and model evidence

Ollama client 0.34.4 and an existing service were detected. The previously installed `llama3:latest` was not substituted for the requested model. `ollama pull qwen2.5:7b` was initiated to install the actual requested local model.

During the download, a real `nikal --fixture` run encountered HTTP 404 from the model-file check. The workflow returned **deterministic-fallback**, with “Local model is missing; pull the configured model.” That is actual unavailable-model behavior, not a mocked AI result.

The requested **Qwen2.5:7b download completed successfully**, including Ollama's SHA-256 verification. The installed provider reported `specificationVersion: v4`; actual inference confirmed compatibility with the pinned Mastra release.

`nikal doctor` passed: Ollama → AI SDK → Mastra `generate` returned the expected JSON locally. `nikal doctor --tools` also passed: Mastra observed a real model-invoked `compatibilityProbe` execution with the expected nonce. These are separate, actual network calls to loopback Ollama, not mocked tests. A single passing tool probe does not establish reliable autonomous tool calling. The optional `llama3.1:8b` has not been downloaded or tested here.

The full workflow then ran with **synthetic facts and real Qwen inference**:

| Real-model process | Saved preference profile | Validated model result |
| --- | --- | --- |
| Default | 32°C, any, short comfortable walk | 5 PM + Demo Green Park, `cleaner-air` |
| After saving and restarting | 30°C, morning, quiet garden intent | 7 AM + Demo Quiet Garden, `green-space` |

The second result differs from the deterministic fallback (8 AM + nearest park), demonstrating a meaningful model choice about intent within the passing candidates. Both successful cards say **OFFLINE FIXTURE · synthetic data · Local AI selection**. They are real local inference tests, not live weather or real outings.

An earlier preference run chose a valid morning/garden pair but incorrectly explained the farther garden as `closer`. The validator rejected it and showed the deterministic fallback. This failure was kept as evidence. The prompt was improved to supply valid explanation codes on each candidate; output can receive at most one validation repair within a shared inference deadline. The final preference run passed in **one model attempt** with a grounded `green-space` reason. Regression tests cover successful repair, repeated rejection/fallback, and skipping the model when no suitable window exists; those model responses are explicitly mocked unit-test inputs, not live evidence.

Debugging can print the untrusted raw model output only with `NIKAL_DEBUG=1`; default cards never display it. No automatic cloud model fallback was introduced.

## Optional Studio

`npm run studio` built and started successfully on loopback. Its `/api/agents` registry exposed `nikal-agent`; `/api/workflows` exposed `nikalWorkflow` with all five named steps. The served Studio HTML contained `window.MASTRA_TELEMETRY_DISABLED = '1'`.

The current supported CLI command:

```zsh
node_modules/.bin/mastra api workflow run start nikalWorkflow '{"inputData":{"fixture":true,"noModel":true}}' --url http://127.0.0.1:4111
```

completed with **status `success`**, the complete five-step execution, and the expected labeled offline card. The API CLI wraps the response in `data`. An initial manual `/start` request lacked the required existing run ID; the supported `/start-async` CLI path handled creation/start correctly. No manual HTTP route is needed for normal CLI or Studio use. Studio was stopped after this check.

## Local packaging and installed dependency audit

`npm link` succeeded. The bare `nikal --help` command worked from the Node installation's bin directory. A dry-run pack succeeded using a workspace-local npm cache after the sandbox rejected writes to the user's global npm cache. The package includes compiled runtime files, setup/readme/license, safe `.env.example`, demo script and documentation, and **excludes `.env`, SQLite, live caches and keys**. Nothing was published.

Installed dependency license metadata was inspected: direct Mastra/AI SDK dependencies are Apache-2.0; dotenv is BSD-2-Clause; other runtime packages retain their own permissive licenses. The MIT license applies to Nikal's code, not API data or downloaded weights.

`npm audit` reported **14 affected dependency entries: 9 moderate and 5 high** in the complete graph, including optional Studio development dependencies. `npm audit --omit=dev` reported **7 moderate, no high/critical**, in the runtime graph. Underlying advisories involve `sprintf-js` precision denial of service through `gray-matter`/YAML and `braces` pattern recursion in the Studio development graph. Registry checks returned latest versions `sprintf-js@1.1.3` and `braces@3.0.3`, still within the advisory ranges. No compatible patched version was available at verification time. npm's offered “fix” was an incompatible downgrade of Mastra packages; it was not applied. Nikal does not feed retrieved API content to YAML/frontmatter or glob-pattern parsers, but these upstream advisories remain unresolved. Recheck before broader distribution.

## User-owned submission evidence still needed

- Actual start coordinates, if you want distances relative to your start rather than the clearly labeled approximate centre.
- A private SerpApi key and an actual keyed search recording before claiming live SerpApi evidence.
- A public repository URL, terminal recording/screenshots and real outdoor photo.
- Real departure time/destination/experience and what the app got wrong, replacing explicit DEV draft placeholders.

No DEV publication, npm publication, fabricated outing, or invented live event was performed.

## Actual transactional Qwen chat and environment-only SerpApi check — 10 October 2026, 10:37 PM IST

These results supersede the earlier **not run** status for preference chat only. All commands used `NIKAL_SKIP_DOTENV=1`; `.env` and real keys were not read or printed. A fresh temporary `NIKAL_DATA_DIR` (`nikal-real-chat-mAH0Jt` under the macOS temporary directory), blank coordinate overrides, `OLLAMA_MODEL=qwen2.5:7b` and `OLLAMA_BASE_URL=http://localhost:11434/v1` isolated this run from personal preferences. No features, dependencies, runtime fixes or commits were added.

### Real-model chat — PASSED

The existing compiled CLI was run in separate processes:

| Actual command | Actual result |
| --- | --- |
| `node dist/cli.js prefs show` | Defaults: `maxTemp: 32`, `period: "any"`, AQI 100, UV 5, rain 30%, radius 3 km, null start and default walk intent. |
| `node --import <temporary observer> dist/cli.js chat "Set maximum temperature to 30°C and prefer mornings"` | Exit 0; printed `maxTemp: 32 → 30` and `period: "any" → "morning"`. |
| `node dist/cli.js prefs show` (new process after chat exited) | Retrieved `maxTemp: 30`, `period: "morning"`; all other fields remained at their initial values. |

The temporary observer wrapped the installed `Agent.prototype.generate`, called the original implementation with unchanged arguments, returned its unchanged result and recorded only tool names, successful staging and completion flags. It did not replace generation, tools, persistence or network responses. The actual result contained `finishReason: "stop"`, `error: false`, a `savePreferences` tool call and a matching tool result with `message: "Preferences staged, not saved."`. No `readPreferences` call appeared in the recorded tool list; the application's initial persisted-preference read still ran. This verifies the requested save-tool execution and subsequent application commit, rather than relying on generated prose. The observer JSON remains in the isolated profile as `tool-evidence.jsonl`.

The CLI's normal local-model-file guard and loopback Qwen provider were used. This was actual local inference with genuine Mastra/SQLite persistence, not mocked generation, a fixture recommendation or deterministic fallback. The model's own prose was not printed. An initial standalone model-file probe inside the sandbox failed with `EPERM` to loopback; network-enabled execution of the actual CLI then succeeded. No inference timeout or runtime defect required a fix.

### Live SerpApi — BLOCKED (key unavailable)

A process-environment check printed only `serpApiKeyAvailable: false`, never the value. In the same environment and isolated profile, `node dist/cli.js doctor --events` exited 0 and printed:

```text
SKIP: SERPAPI_KEY absent in environment; no live event query made. Configure it locally, never paste it into chat.
```

No keyed diagnostic, uncached live search or source-page handling was verified in this continuation. No lead/event count is asserted. The private `.env` remains unread and its key availability is unknown. `docs/SERPAPI_EVIDENCE.md` remains an empty template because no successful real keyed run occurred.

No runtime changes were necessary, so the automated suite was not rerun; the preceding 73-test gate remains earlier automated evidence, separate from this actual model run. Only this evidence section was appended to the existing report.

## Keyed-search-first workflow verification — 10 October 2026, 10:40 PM IST

The requested order was a successful real keyed search followed by a model-enabled workflow in isolated memory. With `NIKAL_SKIP_DOTENV=1`, an environment-only presence check again returned `serpApiKeyAvailable: false`; the key value was not printed and `.env` was not opened. A new temporary profile (`nikal-keyed-gate-*`) was used for `node dist/cli.js doctor --events`. It exited 0 with **SKIP: SERPAPI_KEY absent in environment; no live event query made**. SKIP is not a successful keyed diagnostic.

**Real keyed search: BLOCKED. Model-enabled workflow with real SerpApi results: BLOCKED / not run**, because the required first verification could not succeed without the key. There is no new evidence of fresh/cached event retrieval, unconfirmed leads, corroborated events, event data reaching `agentDecides`, card event usage, or workflow `local-ai` versus fallback. The earlier real preference-chat pass is a separate integration and does not establish any of those claims. The SerpApi evidence template remains empty. No code changes, dependencies, commits or additional automated-test claims were made.

Read-only source inspection (not a real run) confirms that `joinRetrieval` attaches the event branch to the context consumed by `agentDecides`. Only `context.events.events` is inserted into the model prompt as `verifiedEvents`; unconfirmed leads are not prompt evidence. The card prioritizes a corroborated event and its verification timestamp, otherwise displays up to two explicitly unconfirmed leads. Those code paths still need the requested actual keyed workflow run to demonstrate their observed behavior.

## Sanitized SerpApi failure diagnostics — 10 October 2026

Inspection found that `doctor --events` swallowed all failure detail and the shared HTTP client discarded the status of JSON/schema/API-message failures, conflating them with transport errors. This explains why the previous generic FAIL could not identify a cause; **the underlying private keyed failure remains unverified until rerun**.

A minimal optional HTTP error sanitizer now preserves the response status for SerpApi alone; other clients retain their existing error behavior. The event diagnostic and workflow event warnings emit only fixed application text with status and an allowlisted category: authentication, quota, invalid parameters, network/timeout or malformed response. Non-2xx error bodies are not read. HTTP 200 error messages are inspected internally after removing the supplied credential/URLs, but no raw provider message, request URL, headers or error cause is exposed. Cache policy, retries, query count, missing-key skip, PASS/FAIL/SKIP and exit codes remain unchanged. The usual 401/403, 429 and 400 classifications were checked against [SerpApi's official status/error documentation](https://serpapi.com/api-status-and-error-codes); 5xx failures use the permitted network/timeout category with their actual status.

Actual `NIKAL_SKIP_DOTENV=1 npm run check` passed strict type-checking, production build and **89 tests**, zero failures/skips. The new 15 subcases plus their parent use **mocked fetches and synthetic credentials**, not live SerpApi. They check HTTP authentication/quota/parameter/server statuses, HTTP 200 API errors, malformed JSON/schema, unknown provider errors, network exceptions and timeouts. Both diagnostic logs and workflow warnings are checked for absence of credentials/provider detail/URLs; every diagnostic makes one mocked request. Existing success, skip, uncached-query and cache tests still pass. The gate log is local at `.nikal/check-serpapi-diagnostics.txt`.

No live keyed request or success is claimed. `.env` was not read; no actual key was printed, no personal preference profile was used, and no dependencies or commits were added. `docs/SERPAPI_EVIDENCE.md` remains empty. SETUP now provides a hidden-input, dotenv-disabled, isolated-profile command for a future private rerun with a newly rotated key.

## Deprecated event engine request correction — 10 October 2026

**User-reported real result:** the private `doctor --events` returned HTTP 400, category invalid parameters. This result was supplied by the user, not executed or independently observed by this agent. No raw provider response was requested or inspected.

The official [Google Events documentation](https://serpapi.com/google-events-api) now explicitly marks `google_events` deprecated and states that it no longer accepts new requests; its documented replacement exposes `events_results` on the [Google Search API](https://serpapi.com/search-api). The earlier documentation check overlooked the deprecation notice while reading the old parameter table. The exact unsupported request setting found is **`engine=google_events`**. The old documentation did support `q`, `location`, `gl`, `hl` and `htichips=date:week`; no invalid city/filter combination was established. This documented engine retirement explains why the existing request needs correction, but the corrected request still requires the user's live rerun to verify success.

The smallest runtime correction changes the engine to `google` and removes `htichips`, a legacy Events filter absent from the Google Search parameter contract. It retains the same bounded query, fixed Gwalior city location, `gl=in`, `hl=en`, 15-second timeout, one request/no retries/no pagination and credential handling. No incompatible `uule`, `lat`, `lon` or alternate search layout is supplied. No `tbs` publication-date filter is substituted for event dates: the default query still asks for this week and source corroboration still requires actual future event dates within the current IST week. The optional `events_results` module continues to supply leads only; all source validation, corroboration and honest card labels remain unchanged. A successful Google response without that module produces zero event leads, not invented events or organic-result promotion.

The six-hour cache now includes `google` in its namespace, keeping query/city/IST-date partitioning and key exclusion while preventing retired-engine responses from satisfying the new request. The doctor still bypasses Nikal's cache and permits SerpApi's own server cache; its PASS text now accurately names Google search and counts only event-module results.

Actual **`NIKAL_SKIP_DOTENV=1 npm run check` passed type-checking, production build and 90 tests**, zero failures/skips. The new regression uses a synthetic fresh legacy cache and mocked fetch: it verifies the exact supported parameter names/values, absence of legacy/incompatible filters and coordinates, one fresh replacement request despite the legacy cache, acceptance of success without an event module, zero-request subsequent cache reuse, zero source fetches/empty leads, and the diagnostic's fresh one-query behavior. Existing source/card, query/privacy/cache and sanitized error tests pass. Local gate output is `.nikal/check-serpapi-engine-fix.txt`.

An environment-only check returned `serpApiKeyAvailable: false`; the key value was not printed and `.env` remains unread. **No live corrected request was made or succeeded in this agent environment.** The SerpApi evidence template remains empty. README, SETUP, documentation checks and the handoff request description now document the official migration. No dependencies, personal preference changes or commits were added. The hidden-input, isolated-profile rerun command is in SETUP.

## Organic-result lead parsing and zero-lead warning — 10 October 2026

**Latest live output supplied by the user, not a new agent-executed run:**

```json
{
  "events": [],
  "leads": [],
  "searchProvenance": "live",
  "warnings": ["Search leads could not be confirmed on dated source pages."]
}
```

This records only the supplied fields, not a raw provider response. The user did not supply the organic/event-module payload, result count, precise run time, doctor outcome or model mode. `live` records Nikal's search-cache provenance; it does not prove that SerpApi's own cache was bypassed. No conclusion about `agentDecides`, `local-ai`/fallback or actual source-fetch success is inferred from these fields.

Inspection confirmed two defects: the Google response schema/extractor handled only `events_results`, discarding `organic_results`; and the warning was selected whenever confirmed events were empty, even when there were no leads to check. Therefore the supplied zero leads cannot establish that Google returned zero qualifying organic results. Zero valid leads can still be correct when no search item passes relevance, nonempty-title and public HTTPS requirements, but the supplied summary alone cannot tell which of these occurred.

The necessary parser correction retains the documented [organic title/link/snippet fields](https://serpapi.com/organic-results) and validates items individually. Cleaned title/snippet must mention Gwalior and match the existing outdoor-activity terms; snippets are only untrusted relevance hints. A cleaned nonempty title and the unchanged public HTTPS/no-credentials policy are required. Structured event-module leads take priority, followed by qualifying organic leads; duplicate source URLs are removed within the existing total of three source checks. Neither result type is assumed to be an event. Search dates/snippets are never used to invent or establish event dates; only the unchanged source-page JSON-LD corroboration can produce a verified event. Corroboration failure retains valid organic leads with the existing explicit unconfirmed card label. Confirmed events still have card priority, and only corroborated events enter the model prompt.

With zero valid leads the warning now says **“No relevant search leads with valid titles and public HTTPS sources found.”** With valid leads but no corroborated event, the original dated-source warning remains appropriate. Query parameters, one-search/no-retry policy, cache identity/expiry, source timeouts/network protections and source/date validation remain unchanged. Cached raw Google responses are revalidated, so an existing response containing organic results can benefit from the parser fix without another request.

Actual **`NIKAL_SKIP_DOTENV=1 npm run check` passed type-checking, build and 94 tests**, zero failures/skips. Four new regression tests use synthetic provider/source payloads and mocked fetches. They cover organic-only retained/sanitized unconfirmed leads and card labels; live-versus-cache provenance with zero additional search/source calls on reuse; corroboration solely from a dated source rather than search dates; undated/unavailable sources retaining leads; rejection of irrelevant/malformed/empty-title/non-public-HTTPS results with the corrected zero-lead warning; and combined module/organic deduplication and the three-source limit. The initial run failed a test assertion matching any `verified ` substring, including “No verified event found”; the assertion was corrected to detect a verification timestamp and the full suite passed. Local gate output is `.nikal/check-serpapi-organic-parser.txt`.

No new live SerpApi, source-page, weather or model run was made or claimed. `.env` was not read; no actual key or raw provider response was printed. Personal preferences were not used, and no dependencies or commits were added. Earlier evidence is retained; current parser descriptions in README, SETUP, DOCS_CHECK and the handoff were corrected. The supplied live output establishes user-reported fresh search provenance with zero displayed leads/events before this fix, not live verification of the new parser.

## User-reported live leads and optional model lead choice — 10 October 2026

**Supplied live evidence, not independently executed by this agent:** the user reported **3 unconfirmed SerpApi leads, 0 corroborated events, 2 displayed source links, `local-ai` on model attempt 1, live weather/AQI, and unavailable Overpass places**. No titles, URLs, readings, recommendation time, coordinates or exact run timestamp were supplied; none are invented here. The report did not specify SerpApi search/source cache provenance, so fresh-versus-cached SerpApi retrieval is not inferred. This run predates the optional lead-choice improvement below: the two displayed links demonstrate the earlier retrieval shortlist, not model-chosen lead selection.

The requested bounded improvement adds optional nullable `leadId` to the otherwise strict decision schema. Omitting it or returning null means no lead selection. Up to three display-validated unconfirmed leads are offered separately as `unconfirmedLeads`, with stable SHA-256 IDs derived from canonical retrieval source URLs; IDs remain stable across ordering/cache/title changes. Corroborated events remain in `verifiedEvents` and keep card priority; when one exists no unconfirmed candidates are offered.

Deterministic validation requires any chosen ID to belong to that supplied list. Model-authored titles, sources, event dates, readings or additional fields remain rejected. Time/place membership, comfort filtering and grounded explanations retain their existing validators; optional lead selection changes none of the retrieved weather/time/place facts. The prompt and agent instructions treat retrieved text as untrusted data, never instructions, and explicitly deny schedule, availability or confirmation claims from unconfirmed leads. Normal generation still uses `activeTools: []`, `toolChoice: none`, one generation step, zero SDK retries and at most one repair sharing the original inference deadline. Repeated invalid lead IDs produce the existing labeled deterministic fallback without retaining a model-chosen lead.

For a validated local-AI decision, the card shows exactly one chosen retrieved title/source under **“Unconfirmed lead (check the source before going)”**, or no lead links if none was selected. It adds **“Event date, availability and status unconfirmed; this link is separate from the time/place cue.”** No event timing is assigned to the walking window. Fallback/comfort-only cards preserve the up-to-two retrieved-link shortlist; corroborated-event rendering remains separate and prioritized.

Actual **`NIKAL_SKIP_DOTENV=1 npm run check` passed type-checking, build and 105 tests**, zero failures/skips. New tests use synthetic retrieval/model responses, genuine Mastra workflows and isolated SQLite memory. They cover stable IDs; valid/invented IDs; null/omitted choice; rejection of multiple choices and model-authored facts; source-only title/link rendering and honest labels; unchanged weather/time/place lines; corroborated-event priority; seven workflow scenarios covering first-attempt choice, bounded successful repair, repeated rejection/fallback, no selection, omitted selection, `--no-model` and a corroborated event. They also assert tools disabled, read-only memory, unchanged retrieved facts/preferences and the shared repair deadline. The first gate failed an old card fixture with three titles sharing one URL; distinct fixture URLs now exercise the two-link limit, while a separate regression explicitly checks deduplication. Local gate output is `.nikal/check-optional-lead-selection.txt`.

**Real-model optional lead selection remains UNVERIFIED pending a fresh live run.** No new live model/API run was performed or claimed in this continuation. `.env` was not read and no actual key was printed; personal preferences were not used. No dependencies or commits were added. Earlier evidence remains unchanged; README, SETUP and the handoff describe the new optional contract. The user-reported `local-ai` result above is separate from these mocked lead-choice checks.

## User-reported live workflow with no lead selected — 10 October 2026

**Supplied by the user, not independently executed or observed by this agent:** the run reported **`local-ai` on attempt 1, three live unconfirmed SerpApi leads, zero corroborated events, `leadId: null`, live weather/AQI, and Overpass unavailable**.

The reported live search provenance distinguishes this retrieval from Nikal's local search cache; it does not establish that SerpApi's own server cache was bypassed or specify source-verification cache provenance. All three leads remain unconfirmed; none is recorded as a scheduled, available or corroborated event. `leadId: null` records the valid no-selection outcome, not a model-selected lead. The supplied output does not include the rendered card, so no displayed-link count or card contents are inferred.

This is user-reported real-model evidence for the optional no-selection path. It does not verify a non-null real-model lead selection or independently demonstrate the full lead list entering the model prompt. No precise run timestamp, titles, URLs, readings, time/place choice or additional results were supplied. Earlier evidence is retained as historical context.

Only this documentation entry was appended. No code changes, new runs or checks were made; `.env` was not read and no key was printed.

## User-reported recording: memory success and SerpApi authentication failure — 10 October 2026

**Recording results supplied by the user, not independently executed or observed by this agent:**

- Real local Qwen selected **5 PM** using synthetic fixture facts.
- Preference chat saved **30°C + morning**; a separate CLI process retrieved those values.
- The subsequent real-model fixture run selected **7 AM**. This records an actual reported preference effect across processes, with synthetic facts and real local inference; it is not a live forecast or deterministic fallback.
- The live segment succeeded for **weather, AQI, Overpass and `local-ai`**.
- **SerpApi failed with HTTP 401, category authentication.** This segment does not establish successful event search or source corroboration.

No model attempt counts, live readings, place names, recommendation time, lead/event counts, cache provenance or precise recording timestamp were supplied for this recording; none are inferred. Earlier successful user-reported search evidence remains unchanged and applies to its own runs. The later authentication failure does not overwrite those historical results or establish that the current rotated key succeeds.

Only this supplied evidence was appended. The memory demonstration was not repeated, and no new model/API run, runtime change, dependency, commit or push was made. `.env`, keys and personal memory were not read. A new live-only recording with a privately entered rotated key remains pending user-supplied output; no successful rerun is claimed.

## User-supplied successful live terminal output — 11 October 2026

The user supplied the completed live card and concise evidence below. This is actual terminal output reported by the user, not a new agent-executed model/API run or a reviewed video recording. The user subsequently clarified that no screen recording had been made.

```json
{"mode":"local-ai","modelAttempts":1,"leadId":null,"searchProvenance":"live","unconfirmedLeads":3,"corroboratedEvents":0,"weather":"live","aqi":"live","placesProvenance":"unavailable"}
```

The card used **approximate Gwalior city centre; not your home**, remembered **≤30°C, morning, 3 km radius, AQI ≤100**, and selected **7:00 AM IST on 11 October** with the explanation **“A morning window fits your preferences.”** It displayed **23.9°C, forecast US AQI 70, PM2.5 26.6 µg/m³, UV 0.5, rain 0%, sunset 5:53 PM**. Weather and AQI were labeled live. This reported run was local AI on its first attempt, not deterministic fallback.

The search returned three unconfirmed leads, no corroborated events and no selected lead (`leadId: null`). The card said **“No verified event found.”** and **“Search leads could not be confirmed on dated source pages.”** Live search provenance excludes Nikal's local search cache for that run; it does not prove that SerpApi's server cache was bypassed or provide source-verification cache provenance. No event date, availability or confirmation is established. The earlier HTTP 401 authentication failure remains separate historical evidence.

All three Overpass mirrors failed: `overpass-api.de` HTTP 504; `overpass.private.coffee` HTTP 500; `maps.mail.ru` network, timeout or invalid response. No usable cache or user-verified curated places existed, so places remained unavailable. Earlier successful mapped-place retrieval is separate evidence, not success in this run. No exact run timestamp, source titles/URLs or non-null real-model lead selection is inferred.

Submission preparation inspected filenames only for recording discovery. No Nikal recording was found in the project or Desktop; the only video candidate was `bug-graveyard-demo.mp4`, whose contents were not opened. FFmpeg and FFprobe are installed. YouTube Studio browser access was denied by the permission check; no authenticated upload, video URL or completed edit is claimed. The DEV draft has the actual GitHub repository link and retains video, outdoor experience/photo and attribution placeholders. No runtime code, dependencies, commits, pushes or DEV publication were changed.

FFmpeg device enumeration listed `Capture screen 0`; no frames were captured and no video was created. An environment-only key-presence check returned false without printing a value or opening `.env`. This establishes available capture tooling, not a completed screen recording or successful new keyed run. Terminal computer control was previously denied by the tool's safety policy; it was not retried or bypassed. Recording a new keyed live segment therefore still requires private key entry and a permitted terminal/recording interaction. No software was installed. The demo guide now marks older claims as historical and describes the current recording/upload status.

## Runnable manual-recording preparation — 11 October 2026

Created `scripts/record-demo.zsh`, using only existing Ollama and compiled Nikal CLI functionality. It requests a hidden key and checks `doctor --events` before the first recording prompt; missing-key SKIP and sanitized failures pause/exit without claiming search success. A unique isolated profile, blank coordinate overrides and `NIKAL_SKIP_DOTENV=1` preserve personal memory and avoid `.env`. Seven scenes include the exact requested preference-chat text, separate CLI processes, actual model-enabled fixture/live calls and concise run evidence. The script never substitutes deterministic preference saving for chat or forces a recommendation change.

Actual checks: `zsh -n scripts/record-demo.zsh` passed; `git diff --check` passed; `git check-ignore` confirmed sample recording, isolated memory and output-log paths under `demo-recordings/` are excluded. That directory was created, with no video files. FFmpeg device listing confirms AVFoundation input support, and FFprobe is present. No screen capture, editing, actual model/API demo run, installation, commit, push or publication occurred. Previous Terminal automation denial was respected; no alternate capture route was used to bypass it. The environment-only key check reported absent without reading a value or opening `.env`.

The script logs sanitized displayed output and relative scene timestamps as editing aids, not video or simulated timings. `docs/DEMO.md` documents manual terminal-region capture, preservation of originals, actual-result narration and the required caption **“Inference waits shortened; outputs are from actual runs.”** A real original recording remains required before any edited 90–120 second video can be produced. Unrelated draft work was preserved, and runtime source/dependencies remain unchanged.

## Recorded demo logs reviewed during documentation sync — 11 October 2026

Read the existing sanitized text outputs in the isolated demo-log set `run-cNelX7M6`; no model or retrieval API was invoked for this review. These are actual recorded CLI outputs, distinct from both automated mocks and earlier user-reported runs. The logs establish terminal results, not a reviewed screen video or upload. Script-relative scene markers do not establish wall-clock execution timestamps; absent dates, queries and source details remain unknown.

### Real-model fixture and persistent memory

- `02-default-fixture.txt`: **local-ai, modelAttempts 1**, synthetic weather/AQI/place/search provenance; **5 PM on the fixed 10 October fixture clock**, 31°C and US AQI 45, Demo Quiet Garden (synthetic).
- `03-chat.txt`: persisted changes **`maxTemp: 32 → 30`** and **`period: "any" → "morning"`**. The existing real-Qwen tool-call observation above separately establishes transactional `savePreferences` execution; this text log records the persisted change output.
- `04-preferences.txt`: a separate CLI process returned actual Mastra working memory with max temperature **30°C**, period **morning**, and other fields preserved (AQI 100, UV 5, rain 30%, radius 3 km, null start, default intent).
- `05-saved-fixture.txt`: **local-ai, modelAttempts 1**, synthetic facts; **7 AM on the same fixture clock**, 29°C and US AQI 88, Demo Green Park (synthetic).

This records an actual real-model **5 PM → chat save → independent-process retrieval → 7 AM** sequence over synthetic facts, not a live forecast, deterministic inference fallback or an outdoor trial.

### Separate keyed diagnostic

`events-diagnostic.txt` records **PASS: One live SerpApi Google search query succeeded (0 event results). Source pages were not verified by this diagnostic.** Its event count refers to the optional event module, not all organic leads. The log does not record the actual query, execution date/time or source corroboration; none is inferred. This diagnostic is not combined with the workflow counts below.

### Separate model-enabled live workflow

`06-live.txt` records approximate Gwalior city centre, not a home, and remembered **≤30°C, morning, 3 km, AQI ≤100**:

```json
{"mode":"local-ai","modelAttempts":1,"weatherProvenance":"live","aqiProvenance":"live","placesProvenance":"live","searchProvenance":"live","leadCount":3,"corroboratedEventCount":0,"selectedLeadId":null}
```

The card selected **11 October, 7 AM IST**, **23.9°C**, forecast **US AQI 70**, PM2.5 **26.6 µg/m³**, rain **0%**, UV **0.5**, sunset **5:53 PM**. Live Overpass supplied **veerangna jhalkaribai koli park**, approximately **1.0 km straight-line**, with source <https://www.openstreetmap.org/way/1561235682>. A mapped candidate does not establish access, opening hours or safety.

Search yielded **three unconfirmed leads, zero corroborated events and no selected lead**. The card said “No verified event found” and “Search leads could not be confirmed on dated source pages.” Live search provenance excludes Nikal's local search cache; source-verification cache provenance and the actual query/source URLs were not captured. This later live Overpass success does not overwrite the earlier unavailable-place run or authentication failure. The 11 October recommendation date is not proof of the log's execution date.

## Documentation-sync quality gate and publication status — 11 October 2026

Actual **`NIKAL_SKIP_DOTENV=1 npm run check` passed** type-checking, production build and **105 tests**, with **105 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo**. The test runner reported about 4.84 seconds for its test phase. Model/API cases in this suite are mocked or synthetic; storage is genuine isolated SQLite. This check is separate from the real-model fixture and live API logs reviewed above. No new retrieval API or Ollama run is claimed.

The DEV post was actually published and its existing post subsequently updated, with title **“Nikal: A local AI agent that remembers your comfort—and tells you to go outside”**, required tags `devchallenge` and `hf26challenge`, and URL:

<https://dev.to/jashanpreet_kaur_917e774f/nikal-in-gwalior-go-outside-needs-a-time-attached-4gpf>

The authenticated browser visibly confirmed the published title and body. The post states “Video walkthrough to follow” and that an outdoor trial has not yet been completed. No duplicate post or npm publication was created. Earlier verification entries are historical and remain unchanged. README/SETUP/current DEV draft now distinguish the real chat/persistence, synthetic-facts model choices, user-reported live runs and reviewed demo logs. SerpApi evidence records separate commands with unknown fields blank. Private `.env`, keys, personal preference memory and raw provider responses were not read or printed.
