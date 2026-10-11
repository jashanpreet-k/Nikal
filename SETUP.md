# Exact setup — macOS, zsh, Node 24

Detected on 10 October 2026: Darwin/macOS, zsh, Node `v24.14.0`, npm `11.9.0`, Ollama client `0.34.4`; the existing Ollama service was reachable outside the execution sandbox. Initially it had `llama3:latest`, which is **not** the requested `llama3.1:8b`. Those are historical development observations; use the public repository below for a new installation.

## Clone the repository and check versions

```zsh
git clone https://github.com/jashanpreet-k/Nikal.git
cd Nikal
node --version
npm --version
ollama --version
```

Node is already suitable. For a new laptop with `nvm` already installed:

```zsh
nvm install 24.14.0
nvm use 24.14.0
```

Ollama is already installed here; no reinstall is needed. On a fresh Mac use the [official installer](https://ollama.com/download/mac), or, if Homebrew is already installed:

```zsh
brew install ollama
```

If a service is already listening on port 11434, don't start a competing server. For a stopped service, run this in its own terminal:

```zsh
OLLAMA_NO_CLOUD=1 ollama serve
```

For an app-managed existing server, restart it with cloud features disabled using the [official FAQ's server setting](https://docs.ollama.com/faq#how-do-i-disable-ollama-cloud-features). Merely putting `OLLAMA_NO_CLOUD=1` in Nikal's `.env` does not change an already running Ollama service. Nikal additionally restricts loopback endpoints/model names and checks that Ollama reports a local model file before inference.

```zsh
ollama pull qwen2.5:7b
# Optional alternative, about 4.9 GB and a different model license:
# ollama pull llama3.1:8b
```

## Initialize and install Nikal

The project has already been initialized in this workspace: `package.json`, pinned dependencies, `src/mastra/index.ts`, an agent, tools, Memory/LibSQL and a committed workflow are supplied. No cloud-oriented generator or interactive `npm create mastra` scaffold is required. Reproduce the installed dependency graph with the included lockfile:

```zsh
npm ci
cp .env.example .env           # first setup only; preserve an existing .env
NIKAL_SKIP_DOTENV=1 npm run check
npm link
nikal --fixture --no-model
nikal doctor
nikal doctor --tools
nikal doctor --events          # fresh optional query, or SKIP with no configured key
nikal
```

The initial dependency installation executed here was the following equivalent of the shipped `package.json` (installation itself used `npm install --ignore-scripts`):

```zsh
npm install --save-exact @mastra/core@1.75.0 @mastra/memory@1.36.0 @mastra/libsql@1.25.1 @ai-sdk/openai-compatible@3.0.67 dotenv@17.3.1 zod@4.6.5
npm install --save-dev --save-exact mastra@1.33.0 typescript@5.9.3 tsx@4.23.15 @types/node@24.19.2
```

Prefer `npm ci` on the delivered project to retain the tested graph. The exact version/peer compatibility checks are recorded in [docs/DOCS_CHECK.md](docs/DOCS_CHECK.md). `npm link` is local installation, not npm publication. Until this particular package is published, don't use bare `npx nikal`.

## Configure private information yourself

Preserve your existing `.env` and saved settings. Open it yourself in a local editor, fill the `SERPAPI_KEY` entry privately and save; no key needs to be sent in chat or entered in a recorded command. Run from the project directory so the app can load it. Events are optional. Weather, places and local inference work without that key, subject to service availability.

`nikal doctor --events` makes one fresh SerpApi Google search query with no retries and bypasses Nikal's cached search results. SerpApi's own server caching remains allowed. It prints PASS/FAIL without the key and reports the count from the optional `events_results` module. PASS verifies search connectivity, not source-page corroboration; a normal live run separately checks up to three source pages and includes the source URL for every confirmed event. Without a key it prints SKIP and makes no query.

The former `engine=google_events` is [officially deprecated and no longer accepts requests](https://serpapi.com/google-events-api). The documented replacement is `engine=google`, preserving `q`, city-only `location`, `gl=in`, `hl=en` and the environment key. Its request omits `htichips=date:week`, which belonged to the retired engine. The default query still asks for this week; corroboration independently enforces actual source dates within the current IST week. No `tbs`, `tbm`, coordinates or additional requests are added. The six-hour cache now includes the engine so old-engine responses cannot satisfy the corrected request. A successful Google response without `events_results` is accepted. Relevant `organic_results` can supply unconfirmed leads: cleaned title/snippet must mention Gwalior and the existing outdoor-activity terms, the cleaned title must be nonempty and the URL must pass the same public HTTPS policy. Malformed or unrelated items are skipped individually. Event-module leads take priority; organic leads fill the same three-source limit after deduplication. Snippets/search dates never establish an event: only the unchanged source JSON-LD checks can corroborate one. The card retains its explicit unconfirmed labels and corroborated-event priority. Zero valid leads now produces a distinct no-relevant-leads warning.

Failures now report only `HTTP <status>` (or `HTTP unavailable` if no response was received) and one fixed category: **authentication**, **quota**, **invalid parameters**, **network/timeout**, or **malformed response**. Requests, headers, credentials and provider messages are never printed. HTTP 401/403 map to authentication, 429 to quota and 400 to invalid parameters, consistent with [SerpApi's status documentation](https://serpapi.com/api-status-and-error-codes). The network/timeout category also covers HTTP 5xx service failures; the status distinguishes these from a connection failure. Malformed JSON/schema and unknown API-error messages map to malformed response. Error text in an HTTP 200 payload is inspected only internally for a bounded category; its original message is discarded. PASS/FAIL/SKIP, one-query behavior and exit codes are unchanged.

After rotating your key privately in your SerpApi account, rerun from macOS/zsh with hidden input. This skips `.env`, isolates storage and keeps the new key out of shell history and command arguments:

```zsh
# Run from the cloned Nikal directory.
(
  set +x +v
  export NIKAL_SKIP_DOTENV=1
  export NIKAL_DATA_DIR="$(mktemp -d /tmp/nikal-events-diagnostic.XXXXXX)"
  read -rs 'SERPAPI_KEY?New rotated SerpApi key (hidden): '
  printf '\n'
  [[ -n "${SERPAPI_KEY//[[:space:]]/}" ]] || exit 1
  export SERPAPI_KEY
  node dist/cli.js doctor --events
)
```

The subshell discards this temporary environment key when it exits. Share only the sanitized status/category if diagnosis is needed; do not share the key or provider response. This is a private rerun procedure. Recorded search success and earlier authentication failures are documented separately in the verification report; a new run must establish its own outcome.

Optional lead choice uses a URL-derived stable ID: normal model output may include one `leadId`, or null/omit it for none. Unknown IDs use the existing single repair and subsequent fallback; arbitrary titles, links, dates and readings remain rejected. A validated local-AI card displays only that retrieved lead (or none), explicitly unconfirmed and separate from its time/place/weather cue. Fallback and comfort-only cards still show up to two retrieved links. Corroborated events keep priority; no lead candidates are offered when one exists. Tools remain disabled for normal generation. Mocked tests cover non-null lead choice and repair. Recorded real-model live runs selected null; an actual non-null choice remains unverified.

Corroborated events retain their source and `verified <time>` label and take priority. Otherwise, validated local-AI output shows one selected unconfirmed lead or none; deterministic/comfort-only output can show up to two unconfirmed links. Titles and HTTPS sources come from retrieval data. These display checks do not establish authenticity, availability, admission or destination safety.

All automated and environment-only verification uses `NIKAL_SKIP_DOTENV=1`, preventing `.env` access. Earlier environment-only runs skipped for no key; later recorded keyed search succeeded. A separate live workflow retained three unconfirmed leads, zero corroborated events and null lead selection. Use a privately configured process-environment key for this mode; never paste it into chat.

Optional `NIKAL_EVENT_QUERY` changes the city-level search text. Blank/unset retains `outdoor events walks runs street markets in Gwalior this week`. Use general activity terms: for example, `NIKAL_EVENT_QUERY='outdoor walks and park events in Gwalior this week'`. The limit is **120 Unicode characters (code points)** after trimming; control/formatting characters, including newlines, are rejected before trimming. Invalid input fails clearly without echoing the value. The `location=Gwalior, Madhya Pradesh, India` parameter remains fixed. No saved coordinates, preference intent or other memory is inserted. A changed query has its own six-hour, IST-date-partitioned cache, with no API key in the cache key. A cache hit makes zero SerpApi requests; a miss makes at most one, with no retries. [docs/SERPAPI_EVIDENCE.md](docs/SERPAPI_EVIDENCE.md) contains distinct recorded runs, with unknown fields left blank.

Save your actual start latitude/longitude with real decimal values:

```zsh
nikal prefs set --lat YOUR_LATITUDE --lon YOUR_LONGITUDE
nikal prefs set --max-temp 30 --period morning
nikal prefs show
```

Until then, Nikal explicitly labels its approximate Gwalior city-centre coordinates. Stable local data defaults to `~/.nikal`, so preferences survive a new shell or a different working directory. `.env` is loaded from the current working directory; either run inside the project or export its settings in the shell. You can avoid global linking with `node dist/cli.js`.

## Optional transactional preference chat

`nikal chat "<message>"` is a one-shot local-model command; each invocation is a new process. Empty or whitespace-only messages fail before model invocation. It uses a separate agent with only `readPreferences` and `savePreferences`, never retrieval tools or the shared recommendation agent's tools. It applies the same loopback/model-file guards and generation deadline. **Actual local Qwen chat called `savePreferences`, committed 30°C/morning, and a separate process retrieved them.** Automated failure scenarios additionally use mocked generation and genuine SQLite. Small-model tool-call reliability can vary; use `nikal prefs set` for deterministic preference updates.

To repeat the check with isolated memory and inspect your own result:

```zsh
(
  export NIKAL_SKIP_DOTENV=1 NIKAL_LAT='' NIKAL_LON=''
  export NIKAL_DATA_DIR="$(mktemp -d /tmp/nikal-setup-chat.XXXXXX)"
  export OLLAMA_MODEL=qwen2.5:7b OLLAMA_BASE_URL=http://localhost:11434/v1
  nikal prefs show
  nikal chat "Set maximum temperature to 30°C and prefer mornings"
  nikal prefs show
)
```

The save tool accepts a strict patch of `maxTemp`, `maxAqi`, `maxUv`, `maxRain`, `preferredPeriod`, `radiusKm` and `intent`, with existing ranges unchanged. `preferredPeriod` maps to stored `period`; coordinates and other unknown fields are rejected. Its response says **staged, not saved**. Multiple calls merge into one run-local patch; omitted fields never receive defaults. Generation memory is read-only. Only successful generation permits a single validated merge/save; error, timeout, abort or persist-time validation failure discards the patch. The CLI prints actual persisted values `old → new`, or **No preferences changed.**, and never prints model prose as a save acknowledgement. A failed run also exits nonzero with a diagnostic. The verification report separates that real-model result from mocked-generation tests and the synthetic-facts recommendation demo.

## Tomorrow, place resilience and isolated demos

Nikal evaluates all remaining daylight today, then the full next IST day only if today has no qualifying window. The horizon can exceed the original 12 hours, even for a late-today recommendation. Tomorrow uses the same saved heat/AQI/rain/UV and period filters and is explicitly labeled on the card. Failed or incomplete forecasts never become invented readings.

After conditions/preferences load, Mastra's supported `.parallel` runs the place and event branches. An explicit `joinRetrieval` merges their keyed outputs into the original context before decision-making. Expected failures degrade the affected branch, retaining the other; forecast failure skips both. Six step nodes implement five domain stages plus this join. Parallel failure behavior is tested with mocks; recorded live workflow retrieval is separate evidence. No speedup measurement is claimed.

Places use the primary Overpass endpoint, then `overpass.private.coffee` and `maps.mail.ru`: one 15-second attempt each, with 250/500 ms failover backoff. A successful response is saved locally with its fetch date. A matching cache is fresh for 24 hours; if it has expired, Nikal tries all mirrors before reusing it with an outdated-data warning. Every cached-place card prints its original fetch date.

If all mirrors fail and no usable cache exists, [data/curated-places.json](data/curated-places.json) is the explicitly labeled curated fallback. It is intentionally empty. Add only parks/gardens you have verified yourself, following the file's `_comment`: `id` (`curated/your-slug`), `name`, `kind` (`park` or `garden`), `lat`, `lon`, a public HTTPS `source`, and `verifiedAt` (`YYYY-MM-DD`). Dates must be valid and not in the future; entries outside the saved radius are excluded. An empty list means places unavailable.

To run the existing deterministic persistence demo without reading `.env`:

```zsh
NIKAL_SKIP_DOTENV=1 npm run demo:memory
```

For a real model card and live retrieval without touching personal memory, use separate directories:

```zsh
(
  export NIKAL_SKIP_DOTENV=1 NIKAL_LAT='' NIKAL_LON=''
  export NIKAL_DATA_DIR="$(mktemp -d /tmp/nikal-setup-ai.XXXXXX)"
  export OLLAMA_MODEL=qwen2.5:7b OLLAMA_BASE_URL=http://localhost:11434/v1
  nikal doctor
  nikal --fixture
)
(
  export NIKAL_SKIP_DOTENV=1 NIKAL_LAT='' NIKAL_LON=''
  export NIKAL_DATA_DIR="$(mktemp -d /tmp/nikal-setup-live.XXXXXX)"
  nikal --no-model
)
```

Both use explicitly labeled development coordinates. The first uses synthetic facts with actual local inference; the second uses real API retrieval with inference disabled. A second run in the same directory can use newly cached API data. See [docs/DEMO.md](docs/DEMO.md) for the recording sequence.

## Verified results and remaining submission material

The latest **11 October 2026** gate passed type-checking, build and **106 tests**, zero failures/skips, with `NIKAL_SKIP_DOTENV=1`. Automated model/API cases use mocks or synthetic facts; memory uses actual isolated SQLite.

Actual local Qwen chat called the save tool and committed **30°C + morning**, retrieved by a separate CLI process. The recorded real-model fixture demo selected **5 PM → 7 AM** across those saved preferences; its weather and places are synthetic. Reviewed live demo logs separately record first-attempt local AI, live weather/AQI/Overpass and three live unconfirmed search leads, with zero corroborated events and null lead selection. Earlier failed mirrors, no-key skips and HTTP 401 remain separate historical evidence in [docs/VERIFICATION.md](docs/VERIFICATION.md).

The [DEV submission](https://dev.to/jashanpreet_kaur_917e774f/nikal-in-gwalior-go-outside-needs-a-time-attached-4gpf) and [GitHub repository](https://github.com/jashanpreet-k/Nikal) are public. npm remains unpublished; use `npm link` or `node dist/cli.js`. A terminal recording, terminal screenshots and a Mastra Studio screenshot are in `docs/images/`. An actual outdoor trial and photo remain outstanding. Personal coordinates are optional; all demonstrated retrieval uses clearly labeled development city-centre coordinates and isolated memory.
