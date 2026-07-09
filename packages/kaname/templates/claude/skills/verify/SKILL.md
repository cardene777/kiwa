---
name: verify
description: Run the three verification gates against a specification and record the result. Runs the formal gate with Lean, the runtime gate against the test each criterion names, and the human gate against the criteria no machine can settle. Stops at the first failure, and writes .kaname/verified only when every gate has an answer. Use before committing, before opening a pull request, and after any change to a specification.
---

# /verify

Establish that a specification holds, and leave a record saying so.

The record is `.kaname/verified`. The hook in front of `git commit` reads it, so
this skill is what stands between an unverified change and the repository.

## When to run this

- Before `git commit` or `git push`. The gate will otherwise stop you.
- After changing a specification, whether or not the code changed with it.
- After changing code that a criterion names as its verification target.

## When not to run this

- Nothing has changed since the last run. The record still describes the tree.

## The three gates, in order

Stop at the first failure. A later gate run against a system whose earlier gate
failed reports on something nobody has established the shape of, and its verdict
means nothing.

### 1. formal

Check the state machine in each `specFormal.md` with Lean. What it establishes is
totality: every state and event pair has exactly one successor, and no case is
missing.

`lean.verify` in `kaname.config.json` decides what happens when Lean is absent.

| Value | Lean present | Lean absent |
|---|---|---|
| `auto` | run it, report `passed` or `failed` | report `skipped` |
| `always` | run it | report `failed` |
| `never` | report `skipped` | report `skipped` |

A `skipped` gate has established nothing. Report it as `skipped`, never as
`passed`, and never let it stand in for a proof that did not run.

### 2. runtime

For every `runtime` criterion, run the file its `Verify by` names.

A target that does not exist is a failure, not a gap to note and move past. The
criterion claims a file checks it; if that file is absent, the criterion has been
checked by nothing while reading as though it had been.

### 3. human

Collect every `human` criterion and put it in front of a person. Wait for the
answer.

`human` is the layer with no machine behind it, so it is the layer where a claim
of verification costs nothing to make. Do not make it on the reviewer's behalf.

## What to record

When every gate has an answer and none of them failed:

```
mkdir -p .kaname
```

Write one line to `.kaname/verified`, replacing whatever was there:

```
2026-07-09T04:11:52Z formal=passed runtime=passed human=reviewed
```

The timestamp is UTC, in ISO 8601. Each gate reports `passed`, `skipped`, or
`none` — `none` when the specification holds no criteria in that layer, and
`skipped` only under the rule in the table above. The commit gate quotes this
line back when it refuses, so a reader learns what the last run actually
established rather than that one happened.

When any gate fails, write nothing. Say which gate failed and what it was
checking, and stop.

## Pitfalls

- **Do not edit a test until it passes.** A failing test is a disagreement
  between the code and the spec. Find out which one is wrong and change that one.
  Rewriting the assertion destroys the only signal you had. See
  `.claude/rules/verification.md`.
- **Do not write `.kaname/verified` by hand, and do not touch it.** Passing the
  commit gate that way is the same act as editing a test to go green, one level
  up: the record stops describing anything.
- **Do not read `skipped` as `passed`.** The proof that did not run found nothing
  wrong because it looked at nothing.
- **Do not run the gates you expect to pass.** The one you are tempted to skip is
  the one carrying the information.
