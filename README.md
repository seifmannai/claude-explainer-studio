# Claude Explainer Studio

Everything Claude uses to make 3D engineering explainer videos for our YouTube channel: skills, render engine, audio tools, style guide, and lessons learned. Claude updates it after every video so each one is better and cheaper than the last.

| Folder | What it holds |
|---|---|
| `CLAUDE.md` | Rules Claude reads first every session |
| `LEARNINGS.md` | Dated lessons from every video |
| `VENDOR.md` | Every outside skill/repo: source, licence, what it's for |
| `skills/ours/` | Our own skills (tech-explainer-3d, explainer-diagrams, explainer-voice-and-reference) |
| `skills/vendor/` | Open-source skills from other creators, each with its LICENSE |
| `kit/toon-engine/` | Frame-by-frame Three.js renderer, cast/props, sea, audio synth, level-locked mix, finish + QA (from "The Cat Who Sank Three Ships") |
| `styles/` | Channel look (STYLE.md) and reference screenshots |
| `videos/<slug>/` | Script, shot plan, word timings and QA sheet of each video |

## Using it with Claude
Attach this repo to a Claude session and say what video you want. Claude follows CLAUDE.md.

## Videos made
- The Cat Who Sank Three Ships (50 s, vertical cartoon short, Nov 2026)
