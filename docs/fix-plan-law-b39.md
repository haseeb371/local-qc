# Fix Plan — law-b39-l16-custody-letter-instruction-audit

## The evolution (4 iterations)

### Iteration 1 — Original broken gold (portal found 12 findings)
- 19 rows AT_ODDS but wording matched the governing entry
- "fully appreciate" hair-split (undisclosed)
- Identical sentences with opposite verdicts
- Placeholder text (ST-415..418)
- 0/4 was fake difficulty (model got 230/230 governing entries right)

### Iteration 2 — Wording fix (my plan)
- Changed 19 row wordings to make AT_ODDS reason obvious:
  - Concern rows: dropped "position" limb → OI-206 says "both limbs" → AT_ODDS
  - Tone rows: "firm and direct" → OI-210 says "soft" → AT_ODDS
  - Overnight rows: "home only" → OI-204 says "both places" → AT_ODDS
  - Behavioural plan rows: "confidence only" → OI-207 says "all three" → AT_ODDS
- Fixed regex to accept bold/italic numbers
- **Result: GLM 4/4 — TOO EASY.** The AT_ODDS reason was now visually obvious — no reasoning required.

### Iteration 3 — Reversal CL entries (smart fix)
- Added 3 new clarification entries that REVERSE the original position:
  - CL-307 `tone`: "firm, formal and brief — not soft, not long-winded" (supersedes OI-210)
  - CL-308 `behavioural_plan`: "confidence, stability and peer relations. Stays set back confidence only" (supersedes OI-207)
  - CL-309 `concern`: "only about the position. Do not raise whether she appreciates the violation" (supersedes OI-206)
- The wording still matches the ORIGINAL entry (looks VERIFIED) but the CLARIFICATION prevails (RP-401) → AT_ODDS
- Gold counts: 87/154/49/168 (was 67/124/39/87)
- **Result: pending re-GLM.** The model must now track 9 CL entries and notice 3 reversals.

### Why the reversal strategy is better than the wording fix

| Approach | Why it works | Why it fails |
|---|---|---|
| Wording fix (make difference obvious) | Model sees "firm" vs "soft" → AT_ODDS | Too easy — model just pattern-matches, no reasoning |
| Reversal CL entries (keep wording, reverse the rule) | Model must apply RP-401 (clarification prevails) even when wording matches original | None — genuine reasoning difficulty from DATA |

Per All Hands: "Put difficulty in the DATA, not in rules/instructions."

## The 5 cross-subject mismatch traps (iteration 3)

Rows where the same wording appears under different subjects with different verdicts:

| Row | Subject | Wording | Gov | Verdict | Why AT_ODDS |
|---|---|---|---|---|---|
| ST-543 | request | "Send it by post to counsel's office." | CL-302 | AT_ODDS | CL-302 says "neither child overnight" — wording is about delivery |
| ST-544 | tone | "Do not copy anyone on this letter." | CL-307 | AT_ODDS | CL-307 says "firm, formal, brief" — wording is about copies |
| ST-545 | concern | "A certified copy of the custodial plan is enclosed." | CL-309 | AT_ODDS | CL-309 says "only about the position" — wording is about enclosure |
| ST-546 | delivery | "Dear Counsel," | CL-306 | AT_ODDS | CL-306 says "send by post" — wording is salutation |
| ST-547 | behavioural_plan | "This letter goes to counsel for Ms Corwin — the mother's attorney." | CL-308 | AT_ODDS | CL-308 says "confidence, stability, peer relations" — wording is about addressee |

These are legitimate: the `subject` column determines the governing entry, and the wording doesn't match that subject's position. But the portal may flag "identical wording, different verdict" without checking the subject column.

## Files to update on each iteration

1. `environment/input/letter_lines.csv` — the data rows
2. `environment/input/clarification.md` — the CL entries (if adding/reversing)
3. `environment/input/original_instruction.md` — the OI entries (if expanding)
4. `solution/files/letter_line_review.csv` — gold verdicts
5. `solution/files/results.json` — gold counts
6. `solution/golden_results.json` — same counts
7. `solution/files/answer.md` — the at-odds figure (must match results.json)
8. `tests/verifier.json` — update expected values (at_odds count, row_set)
9. `README.md` — document the difficulty strategy
10. `review.csv` — update all 14 areas

## What NOT to do

- **Don't** change gold verdicts to VERIFIED to make GLM pass → 4/4 = TOO_EASY
- **Don't** add instruction disclosure about hair-splits → patching, not fixing
- **Don't** delete rows → changes all counts
- **Don't** make the AT_ODDS reason visually obvious → model pattern-matches, no reasoning
- **Don't** duplicate sentences with opposite verdicts → self-contradictory gold
- **Don't** add placeholder text ("wording is X") → realism failure
