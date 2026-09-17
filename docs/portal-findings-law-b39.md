# Portal Findings — law-b39-l16-custody-letter-instruction-audit Case Study

**Date:** 2026-09-17
**Task:** law-b39-l16-custody-letter-instruction-audit
**My local verdict:** "Ship it — 0/4 excellent difficulty, 1 P1 solvability (structural)"
**Portal verdict:** "Rework — 12 major findings, 0/4 is FAKE difficulty, gold is broken"

## The 12 portal findings

### Finding 1 — Gold verdicts not derivable from disclosed protocol
**Portal ID:** `layer1_package_consistency__solution_instruction_consistency`
**What the portal found:** Gold `letter_line_review.csv` verdict column embeds undisclosed distinctions. "may not fully appreciate" = AT_ODDS (ST-106/164/188/331) but "may not appreciate" = VERIFIED (ST-405). The instruction (OI-206) says "may not appreciate" — never mentions "fully" as a verdict-changing distinction.
**Root cause:** The densification added "fully" to some rows to create artificial difficulty, but the instruction never disclosed that "fully" changes the verdict.

### Finding 2 — Identical sentences get opposite verdicts (self-contradictory gold)
**Portal ID:** `layer1_realism_leakage__workflow_realism`
**What the portal found:**
- ST-186 and ST-407 share "Keep the letter soft, formal and succinct." → ST-186=AT_ODDS, ST-407=VERIFIED
- ST-332 and ST-420 share "I am concerned she may not appreciate..." → ST-332=AT_ODDS, ST-420=VERIFIED
- ST-166 and ST-403 share "On several occasions both children have stayed overnight..." → ST-166=AT_ODDS, ST-403=VERIFIED
**Root cause:** Densification duplicated sentences with different line_ids but assigned opposite verdicts. Same words + same governing entry = must be same verdict (RP-401 says cited_entry doesn't matter).

### Finding 3 — Duplicated sentences in letter_lines.csv (realism failure)
**Portal ID:** `layer1_realism_leakage__workflow_realism`
**What the portal found:** "Densified population: 230 draft lines turns a short letter into a toy grid with literally duplicated sentences (ST-186/ST-221/ST-329/ST-407 share one sentence; ST-103/166/191/335/403 share another) plus synthetic 'wording is copies' placeholder lines (ST-415..ST-418). No real draft letter looks like this."
**Root cause:** Densification by duplicating sentences is NOT difficulty — it's a toy grid. Per All Hands: "Adding volume is NOT difficulty."

### Finding 4 — 0/4 is failure_cause_validity failure, not difficulty
**Portal ID:** `layer2_difficulty`
**What the portal found:** All 4 GLM runs got 230/230 governing entries right and differ from gold on exactly the same 19 verdict rows — the cluster containing the self-contradictory gold rows and the undisclosed "fully appreciate" hair-split. The failures measure a GOLD DEFECT, not task difficulty.
**Root cause:** The model understood the protocol perfectly (230/230 governing entries) but failed on rows where the gold was self-contradictory or undisclosed. The 0/4 is fake difficulty.

### Finding 5 — No non-Oracle solvability trial
**Portal ID:** `layer2_solvability`
**What the portal found:** No non-oracle trajectory/result pair earns 1.0. The README concedes this and asks for a pod-lead waiver.

### Finding 6 — Only Oracle 1.0 exists
**Portal ID:** `layer2_solvability__eligible_strict_pass`
**What the portal found:** Only evaluations/oracle/verifier/reward.txt is 1.0 (agent 'oracle', model_name null). All four glm-5.2 runs are 0.0.

### Finding 7 — solve.sh is replay, not legitimate work
**Portal ID:** `layer2_solvability__solution_legitimacy`
**What the portal found:** solve.sh copies pre-computed gold deliverables into /app and emits a hand-authored trajectory from golden_trajectory.json. README states it is "a hand-authored reference trajectory, not a byte-copy of a model run." That is replay, not a legitimate demonstration that the work can be done.

### Finding 8 — Inputs insufficient to reach reward 1.0
**Portal ID:** `layer2_solvability__instruction_environment_sufficiency`
**What the portal found:** All four GLM runs applied RP-401..RP-404 correctly yet failed on verdicts that the records cannot determine — identical letter sentences require opposite verdicts. Success depends on undisclosed gold-only distinctions.

### Finding 9 — Stability repeats lack frozen identity
**Portal ID:** `layer2_stability__frozen_identity`
**What the portal found:** No hash or immutable identity shipped. Each repeat re-ran the oracle agent (distinct agent_execution windows). Identity of graded evidence is asserted, not evidenced.

### Finding 10 — Stability repeats lack per-check evidence
**Portal ID:** `layer2_stability__per_check_stability`
**What the portal found:** Repeats contain no per-check evidence (no score.json, ctrf.json or artifacts). Equal totals cannot be shown to rest on the same nine check outcomes.

### Finding 11 — Verifier fairness / surface_form_brittleness
**Portal ID:** `layer5_verifier_fairness_static`
**What the portal found:** Aggregate fails on requirement_traceability, semantic_equivalence, surface_form_brittleness and counterfactual_strength. The core answer_at_odds_figure regex rejects the required sentence when the number is bolded.

### Finding 12 — Counterfactual strength fails (correct submission rejected)
**Portal ID:** `layer5_verifier_fairness_static__counterfactual_strength`
**What the portal found:** A genuinely correct, protocol-faithful submission is rejected. The four GLM submissions reproduce every governing entry and differ only on rows whose gold is indeterminate. The verifier cannot separate a correct solution from the gold's arbitrary choices.

## The 19 broken rows (all from the first zip)

```
ST-106  AT_ODDS  OI-206  "may not fully appreciate" (undisclosed hair-split)
ST-137  AT_ODDS  OI-210  "soft, formally and succinctly" (same as verified rows)
ST-139  AT_ODDS  OI-207  behavioural plan (same as verified rows)
ST-163  AT_ODDS  OI-210  "soft, formally and succinctly" (same as verified rows)
ST-164  AT_ODDS  OI-206  "may not fully appreciate" (undisclosed hair-split)
ST-166  AT_ODDS  OI-204  overnight stays (same as verified rows)
ST-169  AT_ODDS  OI-207  behavioural plan (same as verified rows)
ST-186  AT_ODDS  OI-210  "Keep the letter soft, formal and succinct" (same as ST-407=VERIFIED)
ST-187  AT_ODDS  OI-210  "soft, formal and succinct" (same as verified rows)
ST-188  AT_ODDS  OI-206  "may not fully appreciate" (undisclosed hair-split)
ST-189  AT_ODDS  OI-207  behavioural plan (same as verified rows)
ST-191  AT_ODDS  OI-204  overnight stays (same as verified rows)
ST-221  AT_ODDS  OI-210  "Keep the letter soft, formal and succinct" (same as ST-407=VERIFIED)
ST-329  AT_ODDS  OI-210  "Keep the letter soft, formal and succinct" (same as ST-407=VERIFIED)
ST-330  AT_ODDS  OI-210  "soft, formal and succinct" (same as verified rows)
ST-331  AT_ODDS  OI-206  "may not fully appreciate" (undisclosed hair-split)
ST-332  AT_ODDS  OI-206  "may not appreciate" (same as ST-420=VERIFIED)
ST-335  AT_ODDS  OI-204  overnight stays (same as verified rows)
ST-338  AT_ODDS  OI-207  behavioural plan (same as verified rows)
```

All 4 GLM runs: got 230/230 governing entries right, failed on exactly these 19 rows, every time.

## Why the local `--no-model` QC missed everything

The deterministic layer checks whether gold passes its own verifier grid — it does (the grid encodes the same contradictions). It CANNOT check:
- Whether gold verdicts are derivable from disclosed rules (requires reading content semantically)
- Whether identical inputs get identical verdicts (requires comparing letter_lines to gold)
- Whether GLM failures are on gold-defective rows (requires cross-referencing)
- Whether solve.sh is replay (requires reading the script)
- Whether the regex rejects a correct answer in a different format (requires generating format variants)

These are **semantic checks** that the GLM static review stage does. Running `--no-model` skips all of them.
