# Specification layers

Every acceptance criterion belongs to exactly one layer. The layer decides where
the criterion is verified.

| Layer | What belongs here | Verified by |
|---|---|---|
| `formal` | State machines, pure functions, type contracts | Lean 4, at compile time |
| `runtime` | Side effects, integration, performance, storage | Tests you run |
| `human` | Usability, business intent, judgment | A person, at review |

## Choosing a layer

A criterion is `formal` when it can be stated as a total function over a finite
input space. "Every state and event pair produces exactly one next state" is
formal. So is "the parser never returns undefined for a valid input".

A criterion is `runtime` when checking it requires executing the system against
something outside itself: a database, a clock, a network, a file. "The refresh
token is persisted before the response is sent" is runtime.

A criterion is `human` when no machine can settle it. "A first-time user
understands what this screen is asking for" is human. So is "this pricing tier
matches what sales promised".

## When you are unsure

Ask what a failure would look like.

- A counterexample that is a specific input means `formal`.
- A specific sequence of events in a real environment means `runtime`.
- A disagreement between two reasonable people means `human`.

## The rule that matters

**One verification target may not serve two layers.** If `tests/auth.test.ts`
verifies a `runtime` criterion, it cannot also be named as the target of a
`formal` one. Write two criteria with two targets, or move the whole thing into
one layer.

`kaname` rejects a specification that breaks this. The check is called
`both-layers-touch-same-artifact`. It exists because sharing a target is how
"we wrote it down" quietly becomes "nobody checked it": each layer assumes the
other one covered it.

## What a criterion must carry

Every item needs an `id`, a `statement`, a `layer`, and a `verifyBy`. An item
with no `verifyBy` is a wish, not a criterion, and `kaname` refuses it.
