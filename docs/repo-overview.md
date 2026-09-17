# Repo Overview — haseeb-pipeline

**GitHub:** https://github.com/muhammady7-netizen/-haseeb-harbor-pipeline
**Owner:** Muhammad Haseeb Younas (`muhammad.y7@turing.com`)
**Active clone (this PC):** `C:\Users\Haseeb Mirza\Documents\Codex\haseeb-pipeline`
**Branch:** `cursor/law-b39-qc-fairness-st138`

## What this repo is for
A multi-session tracker + local PreQC → package → upload → final-QC automation for Shannon Harbor trainer tasks.

## The driver: resume.ps1
| Command | Meaning |
|---|---|
| `doctor` | Check PreQC paths + packs exist |
| `board` | All tasks + status counts |
| `assign --session X --tasks a,b,c` | Lock ≤3 tasks to a chat (max 3 per session) |
| `next --session X` | What to do next |
| `preqc --task ID` | Deterministic PreQC (`--full` for GLM) |
| `package --task ID` | Build zip → `ready_final` |
| `loop --session X --package` | PreQC all session tasks; package if clean |
| `set-status` / `mark-zip` | Portal / zip bookkeeping |

## The full QC workflow
1. Claim task → Tracker sheet
2. Read guides → `docs/`
3. Build/Fix task → `instruction.md`, `verifier.json`, `solution/`, `environment/`
4. Upload to Google Drive → batch folder
5. Generate `review.csv` (14 checks) via Review CSV Generator
6. **PreQC** (Shannon QC Control V2, mandatory) — runs `verifier_defect_lint.py`:
   - D1 prose_regex_grading · D2 root_container · D3 judge_model_wiring · D4 fixture_overwritable · D5 inert_scoring_axis
7. **QC-Oracle-GLM** (~50 min, 3-task limit) — Oracle golden replay + 4× GLM-5.2 difficulty + Harbor Check
8. Fix findings → re-upload → re-run QC
9. Submit to pipeline when clean
10. Report bugs → Harbour QC Parking Lot

## Reading QC results
- Oracle PASS = grading sound
- GLM 0/4 = excellent · 1/4 = good · 2/4 = acceptable · 3/4 = borderline · **4/4 = TOO_EASY → rejected**

## Strict rules
- **Never dismiss Harbor Check / QC findings as "False positive".** Fix the source, repackage, re-upload, re-run.
- **One session drives the browser at a time** (Chrome singleton lock).

## Directory structure
```
haseeb-pipeline/
  resume.ps1              the driver
  registry.json           all tasks, status, history, portal state
  pipeline/               preqc.py, package.py, qc_queue.py, portal_watch.py, registry_io.py
  docs/                   qc-tool-and-workflow, obi-task-quality-standard,
                          non-connector-task-standard, shannon-task-qc-north-star,
                          review-csv-generator-guide, trainer-guidelines, strategy/
  sessions/A..F/          per-chat PROMPT.md + tasks.txt + zips/
  canonical-zips/         ready upload packs
  qc-out/                 PreQC outputs (regenerated)
  task-sources/           task source folders (law-b39/ lives here)
  tmp-pw/                 browser-automation + densify scripts
  tools/, vendor/         helpers + vendored engine
  HANDOFF.md, STRICT-RULES.md, BROWSER-SETUP.md, SESSION-PROFILE-HANDOFF.md,
  CHAT-ACCESS.md, HOW-TO-OTHER-PC.md, TAKE-TO-OTHER-PC.md, sessions.md
```

## Key docs
- `docs/qc-tool-and-workflow.md` — the complete Shannon trainer workflow (6 steps)
- `docs/obi-task-quality-standard.md` — the quality standard (Parts One-Four, defect catalogue)
- `docs/non-connector-task-standard.md` — 15 stages with 202 active rules
- `docs/shannon-task-qc-north-star.md` — the QC reviewer's standard (3 gates, 10 dimensions)
- `docs/review-csv-generator-guide.md` — the 14 review areas
- `docs/trainer-guidelines.md` — setup + workflow per task
- `docs/strategy/all-hands-meeting-notes.md` — Sep 11 All Hands guidance

## The QC tool
- `Downloads/Harbor-Shannon-QC/harbor_shannon_qc.py` — 5,444 lines, the actual QC engine
- `Downloads/Harbor-Shannon-QC/config.json` — reviewer model, endpoint, gate thresholds
- `tools/verifier_defect_lint.py` — the D1-D5 deterministic linter

## The machine config
`machine.json` (gitignored) holds paths:
- `preqc_script`: `C:/Users/Haseeb Mirza/Downloads/Harbor-Shannon-QC/harbor_shannon_qc.py`
- `preqc_config`: `C:/Users/Haseeb Mirza/Downloads/Harbor-Shannon-QC/config.json`
- `v2_trainer_url`: `https://harbor-trainer-s2eobzrxbq-uc.a.run.app/trainer#`
- `api_key_env`: `WANDB_GLM_API_KEY`

## Gate thresholds (from config.json)
- `targetModel`: glm-5.2
- `minDifficultyRuns`: 4
- `maxDifficultyRuns`: 5
- `maxPassRate`: 0.5
- `minStabilityRepeats`: 3
- `recommendedStabilityRepeats`: 5
- `requirePinnedBaseImage`: true
