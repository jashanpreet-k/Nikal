# Nikal: one-page macOS recording kit

Target **90–120 seconds after editing**. This kit runs existing functionality; actual recommendations may differ. Preserve every original recording in the private, Git-ignored `demo-recordings/` directory.

## Prepare with recording off

From this existing working copy, where `scripts/record-demo.zsh` is present, enlarge terminal text and run:

```zsh
NIKAL_SKIP_DOTENV=1 zsh scripts/record-demo.zsh
```

The script is currently untracked; a fresh public clone does not include it. This docs-only pass leaves it untouched and outside the proposed documentation commit. The existing script isolates memory, blanks coordinate overrides, skips dotenv, uses Qwen2.5:7b and disables tracing. Enter the key only at its hidden prompt before capture. The script checks `doctor --events`: FAIL or missing-key SKIP stops the demo. PASS proves search connectivity, not an event. Never record key entry, personal coordinates or unrelated desktop content.

At the first-scene prompt, press **Cmd+Shift+5 → Record Selected Portion**. Select only the readable terminal region; choose **Options → Save to → Other Location → demo-recordings/**. Start recording, then press Enter. Advance only after the output is readable. At the final stop prompt, stop from the menu bar before pressing Enter to finish.

## Scene order and narration

1. **Model list:** point to local `qwen2.5:7b` in Ollama.
2. **Defaults:** synthetic fixture facts, actual local inference. Read the actual time and mode.
3. **Chat:** request 30°C/mornings; show the printed persisted changes, not a model's claim.
4. **New process:** `prefs show` demonstrates persistent Mastra working memory.
5. **Fixture again:** describe the actual change, or honestly explain no change. The recorded example was 5 PM → 7 AM; no result is forced.
6. **Live card and summary:** read weather/AQI, places/search provenance, model attempts, lead/event counts and selected ID. Preserve cache, unavailable and fallback labels. Null means no lead selected; an unconfirmed lead is not a scheduled event.

Close with: “Inference and preference memory stay local. Retrieval APIs receive their required coordinates or city query. Close this tab. Go outside.” The city centre is development data, not a home or nationwide test. Compare past outputs in [EVIDENCE_EXCERPT.md](EVIDENCE_EXCERPT.md); do not present those as today's run.

## Trim only measured idle waits

FFmpeg and FFprobe are installed. No video file was found under `demo-recordings/` in this pass, so no duration or cut points are supplied. Run these yourself against your actual recording, replace placeholders using its real timing, and choose a new output name under `demo-recordings/`:

```zsh
NIKAL_SKIP_DOTENV=1 ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 '<IN>'
NIKAL_SKIP_DOTENV=1 ffmpeg -n -i '<IN>' -ss '<START>' -to '<END>' -c:v libx264 -c:a aac '<OUT>'
```

Retain readable output sections; remove only idle waits. If waits are cut, add the visible caption **“Inference waits shortened; outputs are from actual runs.”** The installed FFmpeg lacks `drawtext`; these trim commands do not add captions. Use an already available editor for that step. Do not install software or claim unmeasured inference times.

## Images still owed

Take real screenshots of the live card, isolated `prefs show`, and the Mastra Studio workflow graph. For Studio, from the repository use an isolated profile and select `nikalWorkflow`:

```zsh
NIKAL_SKIP_DOTENV=1 NIKAL_DATA_DIR="$PWD/demo-recordings/studio-profile" NIKAL_LAT='' NIKAL_LON='' npm run studio
```

Stop Studio after capture. Fallback images in `docs/images/` render unchanged recorded outputs with explicit source/date footers; they are **not screenshots**. The publishable draft embeds the labelled renders using public repository URLs. Add real media later only when actually captured. No video has been created, edited or uploaded in this pass.
