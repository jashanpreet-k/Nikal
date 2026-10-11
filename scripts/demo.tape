# Nikal demo recording for VHS (https://github.com/charmbracelet/vhs).
#
# Every command below really runs: local Qwen through Ollama, genuine Mastra
# working memory in SQLite, and live APIs in the last scene. Frames are hidden
# while a command runs, so inference and network waits are cut. Outputs are
# unedited, and results can differ from the committed recording.
#
# Run from the repository root after `npm run build` and `npm link`:
#   NIKAL_DATA_DIR="$(mktemp -d)" NIKAL_LAT= NIKAL_LON= vhs scripts/demo.tape
#
# The fresh data directory keeps the demo away from your own saved preferences.
# Blank coordinates keep the labelled city-centre default, never a home address.

Output docs/images/nikal-demo.gif
Output demo-recordings/nikal-demo.mp4

Require nikal
Require ollama

Set Shell zsh
Set FontSize 18
Set Width 1000
Set Height 540
Set Padding 24
Set Framerate 20
Set TypingSpeed 35ms

Hide
Type "setopt interactivecomments && clear"
Enter
Sleep 500ms
Show

Type "# 1. Fresh profile. Synthetic forecast, real local Qwen through Ollama."
Enter
Type "nikal --fixture"
Enter
Sleep 600ms
Hide
Wait+Screen@180s /Go outside\./
Show
Sleep 6s
Screenshot docs/images/terminal-1-default.png
Sleep 500ms

Hide
Type "clear"
Enter
Sleep 300ms
Show

Type "# 2. Say what I like. The chat tool stages a patch; the app saves it."
Enter
Type `nikal chat "I dislike heat above 30°C and prefer mornings."`
Enter
Sleep 600ms
Hide
Wait+Screen@180s /→|No preferences changed/
Show
Sleep 3s

Type "# 3. A new process reads it back from Mastra working memory (SQLite)."
Enter
Type "nikal prefs show"
Enter
Wait+Screen@60s /"intent"/
Sleep 5s
Screenshot docs/images/terminal-2-memory.png
Sleep 500ms

Hide
Type "clear"
Enter
Sleep 300ms
Show

Type "# 4. Same synthetic forecast, new process. Saved preferences change the pick."
Enter
Type "nikal --fixture"
Enter
Sleep 600ms
Hide
Wait+Screen@180s /Go outside\./
Show
Sleep 6s
Screenshot docs/images/terminal-3-remembered.png
Sleep 500ms

Hide
Type "clear"
Enter
Sleep 300ms
Show

Type "# 5. Live forecast and OpenStreetMap places, city-centre coordinates."
Enter
Type "nikal"
Enter
Sleep 600ms
Hide
Wait+Screen@240s /Go outside\./
Show
Sleep 8s
Screenshot docs/images/terminal-4-live.png
Sleep 500ms
