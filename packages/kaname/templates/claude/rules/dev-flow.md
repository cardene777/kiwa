# Development flow

Work moves through four steps. Each one produces something the next one reads,
so a skipped step leaves the following step guessing.

```
spec  ->  implement  ->  verify  ->  ship
```

## 1. spec

Run `/spec`. It asks what you are building and turns the answers into a
specification with an `id`, a `statement`, a `layer`, and a `verifyBy` for every
criterion.

The output is split into two files under the directory named by `specDir`:

- `specFormal.md` for the state machines and pure contracts
- `specRuntime.md` for everything checked by running the system

Criteria that no machine can settle stay in the `human` section, and a reviewer
reads them.

`kaname` refuses a specification whose criteria have no verification target, or
whose formal and runtime layers name the same target. See `spec-layers.md`.

## 2. implement

Write the code. The formal specification is a state machine, so build the
transition table before the behavior around it. When the table changes, the proof
changes with it, and the proof runs before the tests do.

Do not change the spec here to match what the code turned out to be. If the spec
is wrong, go back to step 1, change it there, and say why.

## 3. verify

Run `/verify`. It runs the three gates in order (formal, runtime, human) and
stops at the first one that fails.

A gate that cannot run reports `skipped`, never `passed`. See `verification.md`.

## 4. ship

Run `/ship`. What this does depends on `tracker` in `kaname.config.json`.

| `tracker` | Behavior |
|---|---|
| `none` | Everything stays in local files. No network calls. The default. |
| `github` | Opens an issue and a pull request, and links them to the spec. |
| `linear` | Creates an issue in Linear and mirrors it to a pull request. |

`none` is not a degraded mode. A spec that lives in the repository next to the
code it describes is complete on its own. A tracker only adds a place for other
people to see it.

## Why the order is fixed

Each step narrows what the next one can get wrong.

- A specification with no verification target never reaches `implement`, so
  nobody writes code against a criterion nobody will check.
- An implementation with an incomplete transition table never passes `verify`, so
  a missing case is found by a proof rather than by a user.
- A change with a failing gate never reaches `ship`, so the unverified thing does
  not become the shipped thing.

Skipping a step does not remove the work. It moves the work to the point where it
costs the most, which is after someone depends on the result.
