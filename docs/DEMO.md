# A short judge demonstration

Aim for 90–120 seconds, allowing for local generation and public-API delays. Keep private coordinates, API keys, `.env` contents and unrelated desktop windows off camera. Do not edit a failure into a claimed success. The latest code is built and verified; no reinstall or model download is needed. Run probes before recording if they make the video too long, and show their actual results.

The current parallel/chat additions passed **73 automated tests**. Real-model chat and live keyed SerpApi were **not** run. The actual model/API results below are earlier evidence, before these additions; a new recording must show its own actual result. For optional chat, use the isolated command sequence in the README and record it before claiming real-model success.

## 1. Show real local inference

```zsh
cd /Users/jashanpreetkaur/Desktop/Nikal
(
  export NIKAL_SKIP_DOTENV=1
  export NIKAL_DATA_DIR="$(mktemp -d /tmp/nikal-recording-ai.XXXXXX)"
  export NIKAL_LAT='' NIKAL_LON=''
  export OLLAMA_MODEL=qwen2.5:7b OLLAMA_BASE_URL=http://localhost:11434/v1
  nikal doctor
  nikal doctor --tools
  nikal --fixture
  nikal prefs set --max-temp 30 --period morning
  nikal prefs show
  nikal --fixture
)
```

The fixture card must say **OFFLINE FIXTURE · synthetic data · Local AI selection** to count as actual local inference over synthetic data. A deterministic fallback is a working fallback, not a successful model test. The tool-call probe is separate from ordinary generation. Each `nikal` command is a new process. The latest checks at **9:44 PM IST on 10 October** passed JSON generation and a default fixture selection of **5 PM + Demo Quiet Garden**, `cleaner-air`, in one attempt. An earlier separate-process model-memory test chose **5 PM**, then **7 AM** after saving 30°C/mornings; that memory result is historical and was not repeated in the latest verification. Exact choices may differ. If the recommendation stays the same, show that `prefs show` retrieved the new values and explain whether the choice still satisfies both profiles.

Fresh directories avoid stale demo preferences; `NIKAL_SKIP_DOTENV=1` prevents opening `.env`, and blank coordinate variables retain the explicit approximate-city-centre label. The subshell keeps these demo settings out of your normal shell. The fixed synthetic clock remains 10 October 2026, 6:30 AM IST, regardless of recording time.

## 2. Show memory survives a restart

```zsh
NIKAL_SKIP_DOTENV=1 npm run demo:memory
```

Point at three facts: Run 1 chooses 5 PM; the command saves 30°C/mornings to **Mastra working memory**; a new CLI process prints the remembered values and chooses 8 AM. This isolated demonstration uses synthetic data and no inference. It separately verifies repeatable persistence/filtering; do not describe this deterministic result as a model result.

## 3. Show actual retrieval

```zsh
(
  export NIKAL_SKIP_DOTENV=1
  export NIKAL_DATA_DIR="$(mktemp -d /tmp/nikal-recording-live.XXXXXX)"
  export NIKAL_LAT='' NIKAL_LON=''
  nikal --no-model
  # Optional, off the short recording: inspect readings and source links.
  nikal --no-model --json
)
```

This uses **26.2183, 78.1828, approximate Gwalior city centre, not a home**, fresh defaults and an initially empty API cache. It is a live-retrieval check with inference explicitly disabled. The optional second run may use the newly populated cache. Nikal first evaluates all remaining daylight today, then the full next IST day if nothing qualifies today. This is deliberately longer than the original 12-hour horizon. Show the actual card even if it reports no suitable window or unavailable places.

The latest run at **9:44:56 PM IST on 10 October** fetched fresh weather/AQI and recommended **tomorrow, 11 October, 7 AM: 23.9°C, US AQI 70, PM2.5 26.6 µg/m³, UV 0.5, rain probability 0%, sunset 5:53 PM**. The card said deterministic fallback because inference was disabled. All three Overpass attempts failed: primary 504, `private.coffee` 8-second timeout, `maps.mail.ru` 504. This new profile had no place cache and the curated file was empty, so it showed zero places. Do not substitute synthetic destinations for this live result.

When available, places come from a dated 24-hour local cache or live Overpass. After all mirrors fail, an expired matching cache can be used with its original fetch date and outdated-data warning. If no usable cache exists, only your own verified entries in `data/curated-places.json` can provide a **curated fallback**. The shipped list is empty. Show the provenance label; do not describe cached or curated places as fresh retrieval. Earlier successful mapped-place evidence is recorded separately in [VERIFICATION.md](VERIFICATION.md).

For optional live events, configure `SERPAPI_KEY` privately in your local editor before recording. A self-run `nikal doctor --events` from the project root, without the skip flag, can use your private `.env`. It makes exactly one fresh query and prints PASS/FAIL; PASS proves the search, not source-page verification. Never put the key in a recorded command or chat. The recording subshells above intentionally skip `.env` and use a key only if it is already configured in the process environment.

The latest environment-only diagnostic printed **SKIP** because no key was present in that process environment; `.env` was not opened. A real keyed query and source-page verification remain untested. A normal live run makes at most one city-level search and checks at most three source pages; a cache hit makes zero search calls. Optional `NIKAL_EVENT_QUERY` is limited to 120 Unicode characters, rejects controls and retains fixed Gwalior grounding. If no source corroborates a dated outdoor event, show **“No verified event found.”** Up to two links may follow as **Unconfirmed lead (check the source before going)**. Their display-policy checks establish neither authenticity nor destination safety; never narrate them as confirmed events. A corroborated event takes priority. Add SerpApi to Prize Categories only after a real keyed query succeeds, and fill the empty evidence template only from that actual run.

Optional Studio was verified during the earlier implementation, but is unnecessary for this small CLI demo. If you use it, give it a separate data directory, select `nikalWorkflow` and run `{"fixture":true,"noModel":false}`. Direct Studio chat does not pass the workflow card validator.

## 4. Actually go out

Use your judgment about current conditions, public access and safety. Record your actual departure time in IST and destination; take a real photo. Write what matched the forecast and what did not. If the app recommended no window, record that honestly and wait rather than treating the challenge as a reason to force a recommendation.

## Before publishing the draft

- Add the public code URL and recording/photo links.
- Replace all outing placeholders with actual experience.
- Add teammate DEV handles where applicable.
- Include actual model-probe results. Include SerpApi prize claims only after a keyed live query succeeds; keep source-verification limitations visible.
- Review every claim against [VERIFICATION.md](VERIFICATION.md).
- Keep required tags `devchallenge` and `hf26challenge`.
- Publish by **11 October evening IST** if possible; official cutoff is **12 October 2026 at 12:29 PM IST**.

No DEV post or npm package is published automatically.
