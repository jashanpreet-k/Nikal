# Nikal: recording the demo

There are two ways to record. Both run the real CLI; neither fakes output. Actual recommendations can differ from the committed recording, because the forecast, the map servers and a small model all vary.

## 1. Scripted terminal recording (VHS)

[scripts/demo.tape](../scripts/demo.tape) drives five real commands in a headless terminal and writes:

- `docs/images/nikal-demo.gif`, the recording embedded in the README and the DEV post
- `docs/images/terminal-1-default.png` to `terminal-4-live.png`, one screenshot per result
- `demo-recordings/nikal-demo.mp4`, a private, Git-ignored copy

Install [VHS](https://github.com/charmbracelet/vhs) once (`brew install vhs`), then from the repository root, after `npm run build` and `npm link`:

```zsh
NIKAL_DATA_DIR="$(mktemp -d)" NIKAL_LAT= NIKAL_LON= vhs scripts/demo.tape
```

The fresh data directory keeps the demo away from your own saved preferences. Blank coordinates keep the labelled city-centre default, never a home address.

| Scene | Command | Data | Model |
| --- | --- | --- | --- |
| 1 | `nikal --fixture` | synthetic forecast and places | real local Qwen |
| 2 | `nikal chat "I dislike heat above 30°C and prefer mornings."` | none | real local Qwen tool call |
| 3 | `nikal prefs show` | Mastra working memory in SQLite | none |
| 4 | `nikal --fixture` | same synthetic forecast, saved preferences | real local Qwen |
| 5 | `nikal` | live Open-Meteo and Overpass, SerpApi if a key is configured | real local Qwen |

Frames are hidden while each command works, so inference and network waits are cut. Say so wherever the recording is shown: **“Model and network waits are cut; the output is unedited.”** Nothing else is edited.

Scene 5 depends on public Overpass mirrors. When all three are down, the card says `Places unavailable` and still gives a time. That is a real outcome, not a failed recording; re-run later if you want a take with a mapped place.

If `.env` holds a `SERPAPI_KEY`, scene 5 spends one search and shows its leads. Without a key the card says the event search was skipped.

## 2. Manual screen recording with narration

[scripts/record-demo.zsh](../scripts/record-demo.zsh) walks through the same sequence for a narrated capture. Enlarge the terminal text and run it with recording off:

```zsh
NIKAL_SKIP_DOTENV=1 zsh scripts/record-demo.zsh
```

The script isolates memory, blanks coordinate overrides, skips dotenv and uses Qwen2.5:7b. It asks for the SerpApi key at a hidden prompt and checks `doctor --events` first: FAIL or a missing-key SKIP stops the demo. PASS proves search connectivity, not an event. Never record key entry, personal coordinates or unrelated desktop content.

At the first-scene prompt, press **Cmd+Shift+5 → Record Selected Portion**, select only the terminal, and save into `demo-recordings/`. Start recording, then press Enter. Advance only when the output is readable. At the final prompt, stop recording before pressing Enter.

Narration, scene by scene:

1. **Model list:** point to local `qwen2.5:7b` in Ollama.
2. **Defaults:** synthetic fixture facts, real local inference. Read the actual time and mode.
3. **Chat:** ask for 30°C and mornings; show the printed persisted changes, not a model's claim.
4. **New process:** `prefs show` reads persistent Mastra working memory.
5. **Fixture again:** describe the actual change, or honestly explain no change.
6. **Live card and summary:** read weather and AQI, places and search provenance, model attempts, lead and event counts. Keep cache, unavailable and fallback labels. An unconfirmed lead is not a scheduled event.

Close with: “Inference and preference memory stay local. Retrieval APIs receive their required coordinates or city query. Close this tab. Go outside.”

To trim idle waits from a manual recording, measure first and cut only waits:

```zsh
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 '<IN>'
ffmpeg -n -i '<IN>' -ss '<START>' -to '<END>' -c:v libx264 -c:a aac '<OUT>'
```

## Mastra Studio screenshot

`docs/images/studio-workflow-run.png` is a capture of the real Studio page after a fixture run with the local model. To reproduce it, start Studio on an isolated profile:

```zsh
NIKAL_SKIP_DOTENV=1 NIKAL_DATA_DIR="$PWD/demo-recordings/studio-profile" NIKAL_LAT='' NIKAL_LON='' npm run studio
```

Open `http://127.0.0.1:4111/workflows/nikalWorkflow`, tick **Fixture**, press **Run**, and capture the graph. Use the `127.0.0.1` address: the server is bound to loopback, and the page cannot reach it from `localhost`.

## What the images are

| File | What it is |
| --- | --- |
| `nikal-demo.gif`, `terminal-*.png` | Captures of real runs, produced by `scripts/demo.tape` |
| `studio-workflow-run.png` | Capture of the real Mastra Studio page after a completed run |
| `studio-workflow-graph.png` | The graph cropped from that same capture, for legibility at article width |
| `recorded-live-output.png`, `recorded-preferences-output.png` | Older renders of recorded log text with source footers. They are **not** screenshots. |

Still owed, and only the author can supply them: a real outdoor photo and an honest account of the walk.
