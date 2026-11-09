How It Really Works - local studio

1. Double-click "1-SETUP (run once).bat". Approve the Windows prompts (installers). Takes ~10-20 min.
2. Double-click "2-START RUNNER (keep open).bat" whenever Claude works. Leave the window open.
4. Moving to another PC or Claude account: double-click "4-MAKE PORTABLE COPY.bat". It makes a slim copy
   (no Python envs, no render frames, ~1 GB or less) next to this folder. Copy that one, not this one.
3. To watch a render: double-click "3-VIEW PROGRESS.bat" (frame, speed, time left, latest image; refreshes every 2 s).
   Claude drops job files in "jobs"; the runner only accepts: pull, npm, three, speedtest, render, encode, hdri, still, tools (installs Blender, faster-whisper, Kokoro, Chatterbox, HyperFrames), words (word timings), blender (Blender render), make (a whole video in one job), selfupdate (new runner from GitHub).
Folders: studio = the GitHub repo, out = renders and videos, logs = what happened.
Keep the laptop plugged in; close heavy apps; no mining during renders.
