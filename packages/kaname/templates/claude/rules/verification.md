# Verification

A specification is only worth writing if every line of it is checked somewhere.
This file says where.

## Three gates, in order

1. **Formal.** `lean --check` runs against the generated `specFormal.md`. It
   proves the state machine is total: every state and event pair has exactly one
   successor, and no case is missing. A gap here is a proof failure, not a test
   failure, and it surfaces before any code runs.
2. **Runtime.** Your test suite runs against the criteria in `specRuntime.md`.
   Each criterion names the test that covers it, so an uncovered criterion shows
   up as an empty target rather than as silence.
3. **Human.** Whatever is left is read by a person at review time. This layer is
   small on purpose. If it is large, criteria that belong in the first two layers
   have leaked into it.

## When Lean is not installed

`lean.verify` in `kaname.config.json` controls this.

| Value | Behavior |
|---|---|
| `auto` | Run the proof when a Lean toolchain is on `PATH`, skip it otherwise. The default. |
| `always` | Run it, and fail when Lean is missing. Use this once everyone has Lean. |
| `never` | Do not run it, even when Lean is available. |

`auto` means a contributor without Lean is not blocked, and a machine with Lean
still catches the gap. A skipped proof is reported distinctly from a passing one,
so `skipped` never reads as `proven`.

## What "verified" does not mean

A passing proof says the state machine is total. It does not say the machine is
the one you wanted. Totality is a property of the specification, not evidence
that the specification matches the intent behind it. That check lives in the
`human` layer, and no tool removes it.

## Never edit a test to make it pass

When a test fails, the test is a hypothesis about the code and the code is a
hypothesis about the spec. Change whichever one is wrong, and say which one in
the change description. Rewriting the assertion until it goes green destroys the
only signal you had.

If a criterion turns out to be wrong, change the criterion, in the spec, in the
same change. A spec that has drifted from its implementation is worse than no
spec, because it is trusted.
