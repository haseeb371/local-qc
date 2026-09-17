# QC Standards Summary

## The north star (from obi-task-quality-standard.md)

A benchmark task is an **honest instrument**. A task every model passes, or no model can pass, teaches nothing. Two gates: **Oracle = 1.00** (grading sound) and **pass rate in [0.0, 0.5)** over 5 GLM runs (genuinely hard).

## Part One — The Ask (A1-A6)
- **A1** Real person would actually ask this — realistic, not benchmark-shaped
- **A2** One defensible right answer — not a range of acceptable outputs
- **A3** The prompt gives away nothing the model should find — no stated answers, no field-name leakage, no method spelled out
- **A4** Every decision the model must make is decided by the prompt — boundaries, NULL handling, column choice, scope matching, deliverable form, inclusion rules
- **A5** The deliverable is worth producing — not a trivial answer dressed up
- **A6** Everything the task references actually exists — tables, pages, tickets, channels

## Part Two — The Grading (G1-G7)
- **G1** The primary goal is verified — the main thing the task measures has a verifier
- **G2** Every stated requirement is checked — each artifact, figure, constraint maps to a verifier
- **G3** Nothing unstated is required — no verifier demands something the prompt never asked
- **G4** Verifiers grade the work, not the model's account of it — check the artifact, not the report
- **G5** Verifiers accept every correct route — not narrow-to-golden, no single-tool traps, no synonym gaps
- **G6** The verifier set discriminates — no free points, no denominator gaming
- **G7** Judgment-based checks only where unavoidable — make it json_match or database_state where possible

## Part Three — The Measurement (M1-M6)
- **M1** Oracle scores 1.00, reproducibly — every verifier passes on the known-correct answer
- **M2** The mean sits in band — pass rate in [0.0, 0.5)
- **M3** The spread is tight — write out all 5 rewards; bimodal = coin flip, not difficulty
- **M4** Failures happen for the right reason — MODEL-attributed, not VERIFIER/SPEC/INFRA
- **M5** The verifier profile is stable across runs — same verifiers pass, not just same mean
- **M6** The score is not inflated by free points — check the floor

## Part Four — Hygiene (H1-H4)
- **H1** Prompt and verifiers are in sync with their mirror — root and environment/_app/ agree
- **H2** The answer key does not ship to the model — nothing from solution/ under environment/_app/
- **H3** The package can grade itself — grading engine files travel with the package
- **H4** The reported number came from the submitted package — checksums match

## Defect catalogue (canonical names)

### The ask
- `unrealistic_ask` (A1), `ai_voiced_prompt` (A1), `no_single_answer` (A2), `answer_leakage` (A3), `field_name_leakage` (A3), `method_spelled_out` (A3), `ambiguity_fork` (A4), `under_specification` (A4), `no_client_value` (A5), `phantom_entity` (A6)

### The grading
- `uncovered_primary_goal` (G1), `uncovered_ask` (G2), `unasked_requirement` (G3), `grades_the_account` (G4), `excessive_self_report` (G4), `narrow_to_golden` (G5), `single_tool_trap` (G5), `synonym_gap` (G5), `decoy_inside_tolerance` (G5), `count_only_floor` (G5), `free_point` (G6), `denominator_gaming` (G6), `avoidable_judge` (G7), `invertible_rubric` (G7), `judge_contamination` (G7)

### The measurement
- `non_reproducible_oracle` (M1), `reference_defect` (M1), `out_of_band_high` (M2), `unproven_zero` (M2), `bimodal_spread` (M3), `grading_failure_counted` (M4), `profile_drift` (M5), `inflated_floor` (M6)

### Hygiene
- `mirror_out_of_sync` (H1), `leaked_answer_key` (H2), `missing_engine` (H3), `stale_number` (H4)

## The 17 verifier pitfalls (O1-O17)
O1 numeric format by string compare · O2 float exact equality · O3 unstated rounding · O4 date format · O5 enum case sensitivity · O6 boolean/null representation · O7 currency decoration · O8 row order dependence · O9 column order dependence · O10 JSON key order or value type · O11 encoding and line endings · O12 CSV quoting style · O13 whitespace and trailing newline · O14 prose graded by keyword · O15 unstated tie-break · O16 unstated boundary · O17 extra files or intermediates

## The equivalence suite (E1-E14) — must still pass
Shuffle rows · reorder columns · reorder JSON keys · quote CSV fields · LF→CRLF · add/remove trailing newline · prepend BOM · reformat integers · add trailing decimal zeros · pad fields · change JSON numbers to strings · paraphrase prose · delete unrequired intermediate · add unrelated scratch file

## The breaking suite (B1-B8) — must now fail
Flip one classification · delete one row · append one spurious row · change one summary count · flip boundary-case row · empty every file · delete one deliverable · replace all output with {}

## The non-connector task standard (15 stages)
- **Stage 1** Receive the mined package
- **Stage 2** Fix the boundary (disclosed set = instruction.md + environment/input/)
- **Stage 3** Design the difficulty (sanctioned patterns, not hidden rules)
- **Stage 4** Build the fixture (generated, hash-pinned, no row-per-audited-unit)
- **Stage 5** Write the instruction (natural, disclosed, no leakage)
- **Stage 6** Derive the golden answer (manual, independent)
- **Stage 7** Write the verifier (instruction-driven, traceable)
- **Stage 8** Judge-based checks (only where unavoidable)
- **Stage 9** Build the harness (reward.txt on every path, no hard-coded constants)
- **Stage 10** Set the environment (Dockerfile copies input/ only, base pinned by digest)
- **Stage 11** Prove the task (equivalence suite + breaking suite + state-spoofing)
- **Stage 12** Run and read (classify every non-passing run)
- **Stage 13** Assemble the evidence
- **Stage 14** Write the package files (README, review.csv)
- **Stage 15** Submit

## Pass band (DIF-7)
At most 3 of 4 GLM strict passes; 4/4 is rejected. Frontier pass@1 target 30-50% (20-60% acceptable).

## Key rules
- **DIS-1:** The verifier enforces only what is derivable from the disclosed set (Illegal)
- **DIS-6:** The blind-reader test is run before submission (Blocking)
- **DIF-1:** Difficulty survives full disclosure (Blocking)
- **DIF-6:** Volume, ambiguity, and hair-thin tolerances are not difficulty (Blocking)
- **VER-24:** Ship a discrimination harness that verifies wrong candidates fail for the correct reason
- **HAR-10:** The oracle reproduces exactly 1.0 locally
- **ENV-1:** The Dockerfile copies input/ only
