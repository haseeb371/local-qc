# Local QC — Harbor Task Quality Control Knowledge Base

**Purpose:** Everything needed to judge a Harbor task zip locally before uploading to the portal — the deep QC algorithm, the 7-layer checklist, the 12-finding case study, and the self-training that prevents missing semantic defects.

**Built from:** A real law-b39-l16-custody-letter-instruction-audit case where the portal's QC found 12 major findings that a local `--no-model` deterministic scan completely missed. This repo captures every lesson.

---

## What's here

```
local-qc/
├── README.md                           This file — overview + how to use
├── QC-SELF-TRAINING.md                 The 12 findings I missed + 7-layer checklist + red flags
├── docs/
│   ├── how-qc-works.md                 Deep analysis of the QC engine algorithm (3 layers, gates, counterexamples)
│   ├── portal-findings-law-b39.md      The 12 portal findings with exact evidence
│   ├── fix-plan-law-b39.md             The fix plan (19 row wording changes + 3 new CL entries)
│   ├── 7-layer-checklist.md            The checklist to run on every zip
│   ├── qc-standards-summary.md         Summary of OBI / Shannon / Non-Connector standards
│   ├── repo-overview.md                The haseeb-pipeline repo structure + what's where
│   ├── all-hands-key-takeaways.md      The Sep 11 All Hands guidance on task hardening
│   └── qc-engine-reference.md          The harbor_shannon_qc.py function map
└── scripts/
    └── judge-zip.md                    How to run the 7-layer judgment on a zip
```

---

## Quick start (on any PC)

```powershell
git clone https://github.com/haseeb371/local-qc.git
cd local-qc
# Read these in order:
# 1. docs/how-qc-works.md        — understand what QC does
# 2. QC-SELF-TRAINING.md          — understand what I missed and why
# 3. docs/7-layer-checklist.md    — run this on every zip
```

## The 5 questions to ask before saying "ship it"

1. **Can a reader with ONLY the instruction + inputs derive every gold verdict?**
   If no → hidden requirement → the task is broken, not hard.

2. **Do identical inputs get identical verdicts?**
   If no → self-contradictory gold → the task is unsolvable.

3. **Are the GLM failures on rows where the gold is broken?**
   If yes → 0/4 is fake difficulty → failure_cause_validity FAIL.

4. **Does solve.sh compute the answer or copy pre-computed gold?**
   If copies → Oracle 1.0 is replay → solvability unproven.

5. **Did I run the model stage of the QC tool?**
   If no → I skipped semantic analysis → I will miss findings.

## The key lesson

**The deterministic QC engine checks whether the gold passes its own grid. It does NOT check whether the grid itself is fair.** A self-contradictory gold passes its own verifier because the verifier encodes the same contradictions. The model stage (or manual semantic analysis) catches this by reading the content and asking "can the disclosed rules produce these verdicts?"

**0/4 is NOT automatically excellent difficulty.** It is excellent ONLY IF every failure is MODEL-attributed. If the model got the governing entries right but the verdicts wrong, and the verdicts the model chose are defensible from the disclosed rules, then the gold is broken, not the model.

**Oracle 1.0 is NOT proof of solvability.** It is proof that the gold matches the verifier. If solve.sh copies pre-computed files, Oracle 1.0 proves nothing about whether the task can be solved by reasoning from the inputs.
