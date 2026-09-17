# How to Judge a Zip — Step by Step

## Prerequisites
- Python 3.10+
- `harbor_shannon_qc.py` from `Downloads/Harbor-Shannon-QC/`
- `WANDB_GLM_API_KEY` environment variable set
- The zip file to judge

## Step 1 — Extract and inspect
```powershell
$zip = "C:\Users\Haseeb Mirza\Downloads\<task-name>.zip"
$stage = "C:\Users\HASEEB~1\AppData\Local\Temp\opencode\judge"
Expand-Archive -LiteralPath $zip -DestinationPath $stage -Force
$task = Get-ChildItem $stage -Directory | Select-Object -First 1 -ExpandProperty FullName
```

## Step 2 — Run deterministic QC
```powershell
$out = "$stage\qc-out"
python "C:\Users\Haseeb Mirza\Downloads\Harbor-Shannon-QC\harbor_shannon_qc.py" `
  --task $task --output-dir $out --no-model --quiet
```
Read `$out\verdict.md` — the deterministic findings.

## Step 3 — Run the 7-layer manual check

### Layer 1: Self-contradiction
```python
import csv
from collections import defaultdict
lines, gold = {}, {}
# Fill from letter_lines.csv and letter_line_review.csv
# Group by identical wording, compare verdicts
# Any mixed verdicts = CONTRADICTION
```

### Layer 2: Failure cause validity
- Check GLM rewards (r1-r4)
- Check which rows GLM got wrong
- Check if GLM got governing entries right but verdicts wrong
- If failed rows = self-contradictory cluster → fake difficulty

### Layer 3: Surface-form regex
```python
import json, re
v = json.load(open('tests/verifier.json'))
pattern = [c['assertion']['expected'] for c in v['verifiers'] if c['name']=='answer_at_odds_figure'][0]
# Test: plain, bold **, italic *, __, decimal, words, newline
```

### Layer 4: Solvability
- Read solve.sh — does it `cp` pre-computed files or compute?
- Check evaluations/solvability/r1/ exists?

### Layer 5: Stability
- List files in each repeat-NN folder
- Check score.json present? Per-check identical?

### Layer 6: Full QC with model
```powershell
python "harbor_shannon_qc.py" --task $task --output-dir $out
# WITHOUT --no-model — runs GLM static + run triage
```

### Layer 7: Realism
- Read letter_lines wording — duplicates? placeholder text?

## Step 4 — Verdict
Apply the 5 questions:
1. Can a reader derive every gold verdict from disclosed rules?
2. Do identical inputs get identical verdicts?
3. Are GLM failures on gold-defective rows?
4. Does solve.sh compute or copy?
5. Did I run the model stage?

If all 5 pass → ship it. If any fail → fix and re-run.
