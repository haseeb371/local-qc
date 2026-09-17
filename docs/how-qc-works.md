# How QC Works — Deep Algorithm Analysis

The Harbor task QC engine (`harbor_shannon_qc.py`, 5,444 lines) is read-only — it never launches Harbor, an agent, Oracle, E2B, Modal, or a new evaluation. It only reads what's inside the task folder.

## Three layers, one report

```
task folder ──► 1. deterministic audit (pure Python, ~1s)
                  inventories · gates · replay + counterexamples · reward-hacking · packaging · review.csv
                       │  findings + evidence
                       ▼
               2. GLM static review   prompt = task source + verifier digest + layer-1 evidence → JSON (validated)
                       │  model-proposed counterexamples are EXECUTED locally against real predicates
                       ▼
               3. GLM run triage (if evaluations/ exist)  prompt = policies + gold + per-run digests → JSON (validated;
                       │  rewards / counts / scope claims ENFORCED by validators)
                       ▼
               verdict synthesis → verdict.md, qc-report.json, findings.csv, …
```

**Critical design rule:** the model layers can add findings and re-classify runs but **cannot change observed rewards, counts, or scope claims** — those are enforced by validators after every model answer, with one repair pass if the answer drifts. The deterministic layer runs first and its report is written even when the model is unavailable.

---

## Layer 1 — Deterministic Audit

### The comparison engine (`_compare`)
11 comparison operators, all returning `bool | None` (None = not evaluable, never False):
- `equals` / `not_equals` — value equality
- `approx_equals` — `math.isclose(actual, expected, abs_tol, rel_tol)` with defaults of 1e-9
- `contains` / `not_contains` — substring for strings, membership for lists
- `regex_match` / `not_regex_match` — `re.search`
- `in_array` / `not_in_array`
- `greater_than` / `less_than` / `greater_than_equal` / `less_than_equal`

Returns `None` on `TypeError`/`re.error` — a check that can't evaluate is never a silent pass.

### The replay engine (`replay_check` / `replay_all`)
Mirrors `rl_world_verifiers` semantics for **filesystem / csv / md / text / json** sources only. LLM rubric checks return `replayable: False`. Custom filesystem commands return `replayable: False` — they only run inside the container.

### Six built-in counterexamples (the heart of the QC)

All **executed**, not asserted. Each probes a different way a verifier can be unfair:

| Counterexample | What it builds | What a passing check means |
|---|---|---|
| `empty_deliverables` | Every graded file exists but is 0 bytes | A content check that still passes is **vacuous** |
| `headings_only_memo` | Gold CSV/JSON kept; memo has only section headings, no content | Memo checks that pass grade **layout, not substance** |
| `token_stuffed_memo` | Every entity ID + literal token dumped as bare lists | Checks that pass **don't associate an ID with its reason** |
| `duplicated_rows` | Gold CSV with every data row written twice | A grid without a **record-count / whole-file check** accepts it |
| `rotated_grounds` | Gold memo with reasons rotated between ID-led clauses | If grid still scores 1.0, **the "say why" part is ungraded** |
| `float_formatted_csv` | Integer columns with blanks written as `N.0` (pandas nullable-int) | Checks that reject it are **surface-form brittle** |

**Verdict algorithm** for each counterexample:
```
relevant      = checks that pass on gold AND touch the changed file (minus existence checks)
rejecting     = relevant checks that fail on the counterexample
still_passing = relevant checks that still pass
substantive   = still_passing minus negative-comparison / existence / heading checks

verdict:
  not_applicable         — no relevant checks touched it
  exploitable            — NO rejecting checks (the task accepts a wrong answer)
  weak_checks            — token-stuffed still passes substantive checks
  surface_form_brittle   — rejects a CORRECT deliverable (the check is the problem)
  rejected               — the good case: at least one check caught it
```

**Model-proposed counterexamples:** the GLM proposes up to 20; the runner **executes** each against the real predicate. A check that accepts the model's wrong proposal → confirmed coverage-gap. A check that rejects a competent alternative phrasing → confirmed lexical-gap. **Execute, do not assert.**

### Brittleness scan (`scan_regex`)
For each regex predicate, static signals:
- `order_dependent_join` — `a.*b` join that a reversed-token replay would fail
- `independent_lookaheads` — ≥2 `(?=...)` (keyword-set membership, order/coherence ungraded)
- `section_scoped` — `(?!\n##)` or `##[ \t]*` (scoped to section, not content)
- `hardcoded_entity_ids` — literal IDs baked into the pattern
- `iso_date_literal` — a date the prompt never stated
- `exact_row_match` — `^.*$` with ≥4 commas (whole-row string match)
- `single_phrasing` — no alternation, ≥2 literal tokens (rejects synonyms)
- `case_sensitive_prose` — 4+ alpha chars, no `(?i)`

Then `word_order_replay`: takes the first two literal tokens, runs the regex against `"first second"` and `"second first"`. If forward matches but reversed doesn't → `order_dependent: true`.

---

## The gates

### `difficulty_gate`
```
n = number of runs under evaluations/difficulty/rN
lo, hi = 4, 5

PROBLEMS (→ gate FAIL):
  n == 0, not (lo <= n <= hi), malformed result.json, missing trajectory,
  no parseable reward, oracle inside difficulty, provenance differs,
  model ≠ target_model (glm-5.2)

valid = runs NOT infra_discard, have reward, NOT oracle
passes = count of valid runs with strict_pass (reward == exactly 1.0)
rate = passes / len(valid)

if rate > max_pass_rate (0.5): PROBLEM → "task too easy - harden"
if passes == 0: WARNING → "0 strict passes: acceptable only if every failure is genuine model fault"
```

**Strict-pass is exact:** reward must be `== 1.0`, not 0.9999999999999988, not "exit code 0". The gate recomputes from raw reward files — never trusts an upstream field.

### `solvability_gate`
```
eligible(run) = reward == 1.0 AND valid_json AND not oracle AND trajectory_present
                AND agent_name AND model_name AND finished AND not exception_info AND verifier_executed

slot     = solvability_runs (under evaluations/solvability/r1) that are eligible
fallback = difficulty_runs that are eligible (a 1.0 difficulty trial proves solvability)

PROBLEMS:
  no solvability_runs AND no fallback → "no complete reward-1.0 non-Oracle model result"
  solvability run is oracle → "is an Oracle replay"
  solvability run reward != 1.0 → "reward is X, must be 1.0"
  solvability run not eligible → "lacks trajectory/provenance/finished/verifier evidence"
```

### `stability_gate`
```
Layout: evaluations/stability/repeat-NN/ (two digits)
        each folder holds ONLY result.json

counted = repeat-NN folders with valid result.json
n = len(counted)
need >= min_stability_repeats (3), recommended 5

PROBLEMS:
  n == 0, repeat folder without result.json,
  each result.json reward != 1.0, rewards not all equal

WARNINGS (advisory):
  misnamed dirs, stray files, extra entries beyond result.json,
  config differs on non-volatile keys
```

Volatile config keys stripped before comparison: `trial_name`, `job_id`, `trials_dir`, `job_name`, `run_id`, `started_at`, `finished_at`, `created_at`, `timestamp`, anything ending `_at`/`_time`/`_timestamp`.

### `reward_hacking_audit`

| Signal | Severity |
|---|---|
| reward 1.0 but failed checks recorded | P0 |
| reward.txt ≠ result.json reward | P0 |
| oracle replay inside difficulty evidence | P0 |
| identical trajectory.json across runs | P0 |
| same agent session id across runs | P0 |
| reward 1.0 without trajectory/exception | P1 |
| reward 1.0 but no write evidence for deliverables | P1 |
| no grader transcript | P1 |
| trajectory prompt differs from shipped instruction.md | P1 |
| golden trajectory provenance unproven | P2 |

Verdict: `CONFIRMED` (any P0) · `SUSPECT` (any P1) · `OK`.

### `calibration_profile`
```
failed_sets   = set of failed checks per failing run
shared        = intersection of all failed_sets
union         = union of all failed_sets
one_driver    = if len(union) == 1 → single check drives all zeros (red flag)

failure_layer_split:
  infra / pass / token_cap / near_pass / prose_only / summary_json_only / substantive_or_mixed
```

**Ambiguity signal:** when *every* failed run is a near-pass (≥95% green, same rows missed), the report raises `specification-ambiguity` and the run-triage prompt is told to enumerate the policy readings for exactly those rows before calling the failures agent errors.

---

## Layer 2 — GLM Static Review (stage 1)

The model receives: prompt, agent-visible inputs, Dockerfile, every grader source under `tests/`, the reward layer, a complete verifier digest (every check, every predicate verbatim, regex families clustered), gold deliverables (marked not agent-visible), replay + counterexample results, deterministic findings.

It must answer:
- The prompt gate (soundness Q1–4, quality Q5–10)
- The nine Layer 1 hard checks
- Write the prompt-only checklist **before** classifying every check as covered/Missing/Extra/Different
- Judge the whole set
- Brittleness with replays
- Representation contract
- Specification ambiguity
- Coverage depth with counterexamples
- Seven audit dimensions
- `instruction_verifier_consistency`
- Consolidate ≤10 issues (P0/P1/P2, label, owner, blocks)

**The runner executes every proposed counterexample against the real predicate.**

---

## Layer 3 — GLM Run Triage (stage 2, when evaluations/difficulty exist)

Per trial: triage sentence, failure layer (`infra`/`coding`/`deliverable`/`deliverable_format`/`brittle`/`layer1_blocker`/`token_cap`/`ambiguity`/`model_fault`), explicit-vs-derived classification of every failed check, near-pass hard stop, quality label.

Cross-run: which traps fired, calibration, reward-hacking audit, solvability sufficiency, `failure_cause_validity`.

**Two mandatory subchecks** (both must pass or overall verdict is FAIL):
1. `instruction_verifier_consistency`
2. `failure_cause_validity`

**The runner enforces** observed rewards, strict-pass status, counts, and fixed scope claims (`NOT_AN_ORACLE_RUN`, `NOT_CONTROLLED_CROSS_TRIAL`, `NOT_ESTABLISHED`).

---

## The verdict algorithm (`compute_verdicts`)

```
deterministic_verdict = FAIL if any P0/P1 from deterministic source
                      = NEEDS_REVIEW if any P2
                      = PASS otherwise

evidence_verdict = FAIL if any gate failed
                 = NEEDS_REVIEW if any gate has warnings
                 = PASS otherwise

qc_verdict = worst_verdict(all components)  # any P0/P1 → FAIL, any P2 → NEEDS_REVIEW

review_verdict = Reject  if any finding blocks == "reject"
               = Rework  if any blocking finding or qc_verdict == FAIL
               = Pass    otherwise

human_review_required = True if qc_verdict == NEEDS_REVIEW
                           or model didn't run
                           or first_failure_only_evidence (CTRF collapsed)
                           or evaluation_surface_incomplete
```

**Mandatory subchecks cannot be averaged away.**

---

## The verifier defect linter (`verifier_defect_lint.py`)

Five defect families (D1–D5), grounded in a real client audit:

| Check | What it catches | Severity |
|---|---|---|
| D1 prose_regex_grading | Memo graded by reward-hackable regex (length-only, ≥2 lookaheads, `.*` slack, or ≥3 bare-keyword-presence checks) | sev2 |
| D2 root_container | Dockerfile has no non-root USER → agent runs as root | sev1 (advisory alone) |
| D3 judge_model_wiring | `${JUDGE_MODEL}` placeholder with no resolver, or hard-pinned model | sev3/sev2 |
| D4 fixture_overwritable | Verifier reads grading fixture from agent-writable path (`/app/...`) | sev3 |
| D5 inert_scoring_axis | Scoring weight for an axis that can't score (sql>0 but sql_verifiers=[]) | sev2 |

**Currently advisory-only** (`BLOCKING_CHECK_IDS = set()`) — they run and report but don't gate. The team disabled hard gating while calibrating.

---

## The repackaging QC gate (12 C-checks, before client delivery)

From a 120-package corpus: **89 of 120 (74.2%) needed at least one fix after passing upstream QC.**

| Check | Severity | What it catches |
|---|---|---|
| C1 Mutable image reference | BLOCK | FROM/image= with no @sha256: digest |
| C2 Internal infrastructure address | BLOCK | Routable IPv4 in host position |
| C3 Authoring-machine path | BLOCK | /Users/<name>, C:\Users\<name>, /home/<name>/ (allow-list of service accounts) |
| C4 Undeclared connector data provenance | BLOCK | MCP servers, no dataset declared |
| C5 Package identity mismatch | BLOCK | Archive filename, root dir, task.name leaf don't agree |
| C6 Documentation contradicts evidence | BLOCK | review.csv/README/qc_report claim a pass rate that disagrees with rewards==1.0 |
| C7 Missing package documentation | WARN | No README.md at root |
| C8 Non-task artefact | BLOCK | :Zone.Identifier, .DS_Store, .orig, .rej, editor backups |
| C9 Verifier documentation mismatch | WARN | how_justification names wrong file extension |
| C10 Incomplete difficulty battery | BLOCK | Not exactly 4 rewards under difficulty/r1..r4 |
| C11 Difficulty band mismatch | BLOCK | Band recomputed from rewards differs from folder |
| C12 Manifest does not reconcile | BLOCK | Manifest and disk disagree |

**Order of operations:** content fixes first (C1–C4, C6, C7, C9) → identity renames (C5) → re-verify to zero → recompute manifest (C10–C12) → sweep artefacts last (C8).

**The general rule:** *"When a check fires on nearly every package, the check is wrong."*
