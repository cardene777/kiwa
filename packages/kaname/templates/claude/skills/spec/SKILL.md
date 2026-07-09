---
name: spec
description: Turn a feature idea into a verifiable specification. Asks what you are building, assigns every acceptance criterion to one of three layers (formal, runtime, human), names a verification target for each, and writes specFormal.md and specRuntime.md. Use when starting a feature, when an existing spec has drifted from the code, or when acceptance criteria exist but nobody can say where they are checked.
---

# /spec

Turn an idea into a specification where every criterion names the thing that will
check it.

## When to run this

- Starting a feature, before any code exists.
- An existing spec no longer matches the code, and you are deciding which one is
  wrong.
- Acceptance criteria exist, but nobody can say where each one is verified.

## When not to run this

- A one-line fix with no new behavior. There is nothing to specify.
- A refactor that changes no observable behavior. The existing spec still holds,
  and rewriting it invites drift.

## The dialogue

Ask these in order. Stop when you have enough to write a criterion; do not ask
every question if the answer is already on the table.

**1. What is the thing?** One sentence. If it takes two, it is probably two
features and should be two specs.

**2. What states can it be in?** List them. A feature with no states is a pure
function, which is fine, and you skip to question 4.

**3. What events move it between states?** List them. Then, for each state and
event pair, ask what happens. There is no "obviously nothing" cell: either the
event is ignored, or it is an error, and those are different answers.

This grid is the formal specification. It is the only part a proof can check, so
it is worth the tedium of filling it in by hand. A missing cell here becomes an
unreachable state at runtime, and that is the bug class the proof exists to
eliminate.

**4. What must be true after each transition?** These become criteria. For each
one, ask the question that decides its layer:

> What would a failure look like?

- A specific input produces the wrong output, and nothing outside the code is
  involved. That is `formal`.
- A specific sequence of events, against a real database or clock or network,
  goes wrong. That is `runtime`.
- Two reasonable people disagree about whether it is correct. That is `human`.

**5. Where is each one checked?** Name a file. `verifyBy` is a path, not a
description. "Covered by the integration tests" is not an answer; the answer is
`tests/session.test.ts`.

If nobody can name a target, that criterion is not ready. Either write the test
file first, or move the criterion to `human` and accept that a person reads it.

## What to write

Two files under `specDir` (see `kaname.config.json`), in a directory named for
the feature:

```
docs/spec/<feature>/specFormal.md
docs/spec/<feature>/specRuntime.md
```

`specFormal.md` holds the state list, the event list, the full transition table,
and the `formal` criteria. `specRuntime.md` holds the `runtime` criteria and the
`human` criteria, kept in separate sections so a reviewer knows which ones are
theirs.

## What kaname refuses

Run the classifier before you write the files. It rejects a specification for any
of these, and each rejection is a real defect rather than a style complaint:

| Rejection | Why it matters |
|---|---|
| `duplicate-id` | Two criteria with one id means one of them silently disappears from every report. |
| `empty-statement` | A criterion nobody can read is a criterion nobody can check. |
| `empty-verify-by` | This is a wish, not a criterion. |
| `unknown-layer` | Anything outside the three layers has no gate that runs it. |
| `both-layers-touch-same-artifact` | Two layers pointing at one file each assume the other one covered it, so neither does. |

The last one is the reason this tool exists. Fix it by splitting the criterion in
two, with two targets, or by moving the whole thing into one layer.

## Pitfalls

- **Do not fill the transition grid with "n/a".** Every cell is either a
  transition, an ignore, or an error. "n/a" means you have not decided yet, and
  the proof will pass over it.
- **Do not write a criterion you cannot fail.** "The system is reliable" has no
  counterexample, so it belongs in `human` or nowhere.
- **Do not let `human` grow.** It is the layer with no machine behind it. When it
  is more than a handful of items, criteria have leaked out of `formal` and
  `runtime`, and you have a spec that reads well and checks nothing.
- **Do not reuse a test file across layers.** It is the one rejection people try
  to argue with. It is also the one that predicts an unverified criterion.
