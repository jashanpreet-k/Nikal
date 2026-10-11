#!/bin/zsh
# Existing CLI commands only. Run this before starting the screen recorder.
set +x +v
setopt PIPE_FAIL
umask 077

demo_root="${0:A:h:h}"
cd "$demo_root" || exit 1
[[ -f dist/cli.js ]] || { print 'Compiled CLI missing; demo not started.'; exit 1; }
for demo_tool in node ollama; do
  command -v "$demo_tool" >/dev/null || { print "Required tool unavailable: $demo_tool"; exit 1; }
done

mkdir -p demo-recordings || exit 1
demo_output="$(mktemp -d "$demo_root/demo-recordings/run-XXXXXXXX")" || exit 1
export NIKAL_DATA_DIR="$demo_output/profile"
export NIKAL_SKIP_DOTENV=1 NIKAL_LAT='' NIKAL_LON=''
export OLLAMA_MODEL=qwen2.5:7b OLLAMA_BASE_URL=http://localhost:11434/v1
export NIKAL_MODEL_TIMEOUT_MS=90000
unset NIKAL_DEBUG NIKAL_EVENT_QUERY OLLAMA_HOST SERPAPI_KEY
trap 'unset SERPAPI_KEY' EXIT

print 'Keep recording OFF during preparation and private key entry.'
ollama list > "$demo_output/model-preflight.txt" || {
  print 'Local Ollama is unavailable; demo not started.'; exit 1
}
if ! awk '$1 == "qwen2.5:7b" { found=1 } END { exit !found }' "$demo_output/model-preflight.txt"; then
  print 'qwen2.5:7b is not in the local model list; demo not started.'
  exit 1
fi

read -rs 'SERPAPI_KEY?Current rotated SerpApi key (hidden; recording OFF): ' || exit 1
printf '\n'
export SERPAPI_KEY
if [[ -z "${SERPAPI_KEY//[[:space:]]/}" ]]; then
  print 'No key entered. Event search is not ready; no successful search claimed.'
  node dist/cli.js doctor --events | tee "$demo_output/events-diagnostic.txt"
  read -r 'demo_pause?Paused before recording. Press Enter to exit: '
  exit 1
fi
if ! node dist/cli.js doctor --events | tee "$demo_output/events-diagnostic.txt"; then
  print 'Event diagnostic failed; sanitized status/category is above. No recording run started.'
  read -r 'demo_pause?Paused. Rotate/check the key privately; press Enter to exit, then rerun: '
  exit 1
fi

print 'Diagnostic PASS checks search connectivity only, not event corroboration.'
print 'This doctor bypasses and does not populate Nikal search cache; subsequent output reports actual provenance.'
print 'Use large terminal text. Record only the terminal region with Shift-Command-5.'
print "Save the original recording in: $demo_root/demo-recordings/"
read -r 'demo_ready?Start recording manually now, then press Enter for Scene 1: ' || exit 1
clear
demo_zero=$SECONDS
print 'Nikal — actual CLI runs · isolated demo memory'
print 'Synthetic fixture facts are separate from live API results.'

# Scene markers are editing aids, not invented inference durations.
function demo_mark() {
  printf '%s\t%s\n' "$((SECONDS - demo_zero))" "$1" >> "$demo_output/scenes.tsv"
}
function demo_next() {
  read -r 'demo_continue?Read this result, then press Enter for the next scene: '
}
function demo_card() {
  local demo_file="$1"
  shift
  node dist/cli.js "$@" --json | node --input-type=module -e '
    let input = "";
    for await (const chunk of process.stdin) input += chunk;
    if (!input.trim()) {
      console.error("No workflow JSON received; no successful run claimed.");
      process.exit(1);
    }
    const result = JSON.parse(input), c = result.context;
    const sources = c.conditions?.sources;
    console.log(result.card);
    console.log("\nEvidence:", JSON.stringify({
      mode: c.mode ?? "unavailable",
      modelAttempts: c.modelAttempts ?? 0,
      weatherProvenance: c.fixture ? "fixture" : sources ? (sources.weather.fromCache ? "cache" : "live") : "unavailable",
      aqiProvenance: c.fixture ? "fixture" : sources ? (sources.air.fromCache ? "cache" : "live") : "unavailable",
      placesProvenance: c.places?.provenance ?? "unavailable",
      searchProvenance: c.events?.searchProvenance ?? "unavailable",
      leadCount: c.events?.leads.length ?? 0,
      corroboratedEventCount: c.events?.events.length ?? 0,
      selectedLeadId: c.decision?.leadId ?? null
    }));
  ' | tee "$demo_output/$demo_file"
}

demo_mark 'scene-1-start'
print '\n1. Local Ollama model list'
ollama list | tee "$demo_output/01-models.txt"
demo_mark 'scene-1-output-complete'
demo_next || exit 1

demo_mark 'scene-2-start'
print '\n2. Defaults — synthetic fixture facts + actual local Qwen'
demo_card 02-default-fixture.txt --fixture
demo_mark 'scene-2-output-complete'
demo_next || exit 1

demo_mark 'scene-3-start'
print '\n3. Preference chat — actual local Qwen; save only after validation'
node dist/cli.js chat 'I dislike heat above 30°C and prefer mornings.' | tee "$demo_output/03-chat.txt"
demo_mark 'scene-3-output-complete'
demo_next || exit 1

demo_mark 'scene-4-start'
print '\n4. Separate CLI process — read persistent Mastra memory'
node dist/cli.js prefs show | tee "$demo_output/04-preferences.txt"
demo_mark 'scene-4-output-complete'
demo_next || exit 1

demo_mark 'scene-5-start'
print '\n5. New process — synthetic fixture with the actual saved preferences'
demo_card 05-saved-fixture.txt --fixture
demo_mark 'scene-5-output-complete'
print 'Model choices may change or stay the same. Report what these runs actually selected.'
demo_next || exit 1

demo_mark 'scene-6-start'
print '\n6–7. Live APIs + local model — development Gwalior city centre'
demo_card 06-live.txt
demo_mark 'scene-6-output-complete'
print '\nRead the evidence summary: cache/live, fallback/local-ai and unavailable results are literal run outcomes.'
print 'A null selectedLeadId means no lead was selected. Leads are not corroborated events.'
print 'Inference and preferences stay local; retrieval APIs receive coordinates or the city query.'
print 'Close this tab. Go outside.'
read -r 'demo_finish?Stop recording manually now, then press Enter to finish: '
demo_mark 'recording-finished'
unset SERPAPI_KEY
print "Sanitized output logs and scene markers: $demo_output"
print 'No video is created by this script. Keep the original recording; trim idle waits only.'
print 'If editing, add: Inference waits shortened; outputs are from actual runs.'
