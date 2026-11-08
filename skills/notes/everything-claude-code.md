# Notes from everything-claude-code (our own words)

Source: github.com/worldflowai/everything-claude-code (fork of github.com/affaan-m/everything-claude-code).
Mostly aimed at software teams (TDD, code review agents). The parts that help this studio:

1. **Continuous learning.** At the end of a session, turn what was learned into reusable rules (error fixes, user corrections, workarounds). We already do this in LEARNINGS.md; also fold repeated lessons into kit/ code or skills/ours so they stop costing tokens.
2. **Compact at task boundaries, not mid-task.** Big context = expensive turns. Finish a phase (research, build, render), write its result to a file in the repo, then the next phase reads the file instead of the chat history.
3. **Checkpoints and verification loops.** Each phase ends with a cheap automatic check (script exits 0, file exists, loudness in range, contact sheet) before moving on, instead of Claude eyeballing everything.
4. **Small model for small jobs.** Use a lighter model or a script for mechanical work (renaming, job files, log reading); keep deep reasoning for scripts and visuals.
5. **Keep tool output short.** Never dump huge listings or logs into the chat: filter, tail, or write a summary file and read that.
