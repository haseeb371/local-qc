# QC Engine Deep Research — Additional Checks Discovered

After re-reading the full 5,444-line `harbor_shannon_qc.py`, focusing on `derive_deterministic_findings`, `review_csv_audit`, `stale_bundle_audit`, `reward_hacking_audit`, and the model prompt builders, here are the additional checks the QC engine runs that I was not doing manually.

## review_csv_audit — the full algorithm

The review.csv audit does far more than check PASS/FIXED_AND_VERIFIED status:

1. **PASS row with change_made filled** → FAIL ("should be FIXED_AND_VERIFIED, or leave change_made blank")
2. **PASS row with "No change required"** → FAIL (leave blank instead)
3. **Issue-ID audit stub on PASS row** → FAIL (e.g. "confirmed issue QC1-1")
4. **FIXED_AND_VERIFIED with empty change_made** → FAIL
5. **FIXED_AND_VERIFIED citing files unchanged from baseline** → FAIL (if --baseline provided)
6. **FIXED_AND_VERIFIED but prose says "still open/unfixed/broken"** → FAIL
7. **Cited path in change_made doesn't exist in package** → WARN (e.g. "cites consistency/requirements.json which does not exist")
8. **Unknown status** → WARN
9. **Open-item phrasing** ("still investigating", "to be determined", "pending review", "needs further analysis", "not yet resolved", "under review") → FAIL
10. **Claim spot-checks against bundle:**
    - Difficulty row: extracts "N/M" pattern → compares to difficulty gate's strict_passes/valid_runs
    - Stability row: extracts "N repeats" → compares to stability gate's repeat count
    - Any row: extracts "N in total" / "all N checks" / "N deterministic" → compares to shipped check_count
    - If claim ≠ bundle → WARN
11. **All rows PASS (no FIXED_AND_VERIFIED)** → FAIL ("does not document any fixes")

**My new check:** Extract every number cited in review.csv and compare to the actual bundle (results.json counts, verifier check count, stability repeat count, difficulty pass rate).

## stale_bundle_audit — the full algorithm

1. **Graded vs shipped grid:** for each run, compares the check names that were graded against the shipped verifier names. If they differ → P1 "stale bundle"
2. **golden_check.json / summary.json count claims:** reads `evaluations/golden_check.json` and `evaluations/summary.json`, extracts `verifiers.total` and `verifiers_graded_per_run`, compares to shipped check_count. Mismatch → P2
3. **golden_check.json trial names:** compares trial names in golden_check.json against actual shipped trial folder names. Missing/extra → P2
4. **README claimed_verifier_counts:** extracts numbers from README and compares to shipped check_count. Mismatch → P2
5. **task_checksum consistency:** all runs should have the same task_checksum. If not → P2
6. **Trajectory prompt drift:** compares the prompt in each run's trajectory.json against the shipped instruction.md. If they differ → "stale evidence after task edit"
7. **Stray verifier.json.* variants:** any `verifier.json.*` files in tests/ → flagged (pre-fairness-edit copies left behind)
8. **Per-trial failure counts from golden_check.json:** if a trial failed ≤5% of checks → near_pass signal → ambiguity flag

**My new check:** Look for golden_check.json, summary.json, stray verifier.json.* variants, and compare README counts to shipped count.

## reward_hacking_audit — the full algorithm (re-confirmed)

Scans every difficulty + solvability run:
- reward 1.0 with failed checks → P0
- reward.txt ≠ result.json reward → P0
- oracle inside difficulty → P0
- identical trajectory.json across runs → P0
- same session_id across runs → P0
- reward 1.0 without trajectory → P1
- reward 1.0 but no write evidence for deliverables → P1
- no grader transcript → P1
- tiny test-stdout.txt (<200 bytes) with no CTRF → P2
- trajectory prompt differs from shipped instruction.md → P1
- golden_trajectory provenance: byte-match against any bundled 1.0 trial → if no match, P2

## derive_deterministic_findings — all P0/P1 checks I must verify

### P0 (blocks: reject)
- task.toml missing/invalid
- Harbor loader rejects directory
- instruction.md missing
- No verifier.json or manifest.json
- Verifier spec not valid JSON
- Dockerfile copies tests/solution/verifier into agent image (golden isolation)
- Root task files differ from environment/_app mirror
- Verifier regex doesn't compile
- Gold deliverables fail shipped checks in local replay (and no bundled Oracle 1.0)
- reward 1.0 but failed checks recorded (reward hacking)
- reward.txt ≠ result.json reward
- Oracle inside difficulty evidence
- Identical trajectory.json across runs
- Same session_id across runs
- Agent and connector gyms share one merged image without isolation

### P1 (blocks: rework)
- Dockerfile base image not pinned by @sha256
- Dockerfile missing
- Hard-coded judge model id
- Gold deliverable byte-identical to input file (answer key shipped)
- Memo regex enforces token order (word_order_replay fails)
- Instruction lists JSON keys no check grades (Missing)
- JSON keys graded that prompt never names (Extra)
- Memo checks require heading the prompt doesn't state
- Checks read deliverable paths the prompt never names
- LLM-judged task with <3 stability repeats
- Difficulty gate fails
- Solvability gate fails
- Stability gate fails
- Stale bundle (runs graded on different grid)
- review.csv worksheet integrity fails
- Bundled GLM/solvability trials not full Harbor copies

## The model prompts — what they check that I must do manually

### Static review (stage 1) — SHANNON_RUBRIC
9 Layer 1 hard checks:
1. JSON types pinned before strict equals
2. Named entities: grader literal must be uniquely identified by the task paragraph
3. Aliases/exact strings must be pinned or both accepted
4. Memo regex may not demand one synonym, token order, or unreachable alternation
5. No hidden process: no trace-only conclusions, tool-call patterns
6. Every instructed deliverable graded; every check has a prompt ask
7. Golden isolation: tests/, answer keys not agent-visible
8. Coding-green/memo-red is not difficulty
9. Structured facts belong on JSON/CSV fields, not prose regex

Plus: prompt gate (soundness Q1-Q4, quality Q5-Q10), 2a checklist from prompt alone, verifier classification (Missing/Extra/Different), brittleness with replays, representation contract, specification ambiguity, coverage depth with counterexamples, 7 audit dimensions, instruction_verifier_consistency.

### Run triage (stage 2) — mandatory subchecks
1. **instruction_verifier_consistency** — does the verifier enforce something the instruction never asked for?
2. **failure_cause_validity** — is every failed rollout used as difficulty evidence agent-owned, not an instruction/verifier/infra defect?

Both must pass or overall verdict is FAIL. Cannot be averaged away.

### The clustered-failure rule (critical)
"When failed runs are near-passes that miss the SAME rows while everything else is right, open the governing policy clauses for exactly those rows and enumerate every defensible reading. If a competent alternative reading yields the agents' values, the failures are a prompt gap, not difficulty."

## New checks I must add to my 7-layer checklist

1. **review.csv count audit:** extract every number cited in review.csv, compare to actual gold/verifier/stability/difficulty
2. **review.csv cited path audit:** every path cited in change_made must exist in the package
3. **golden_check.json/summary.json audit:** if these files exist, their counts must match the shipped verifier
4. **Stray verifier.json.* variants:** check tests/ for verifier.json.* files (pre-fairness-edit copies)
5. **Trajectory prompt drift:** compare the prompt in each run's trajectory to the shipped instruction.md
6. **README count audit:** extract numbers from README and compare to shipped check_count
7. **task_checksum consistency:** all runs must have the same checksum
