# @kiwa-lab/lean

Compile a state machine's transition table to Lean 4, and let Lean check it.

```bash
pnpm add -D @kiwa-lab/lean
```

## What it does

You write the table once. `generateLeanSpec` turns it into a Lean 4 file where
the table is a total function, and `verifyLeanSpec` runs the Lean toolchain over
it.

```ts
import { generateLeanSpec, verifyLeanSpec } from '@kiwa-lab/lean';

const spec = {
  moduleName: 'SessionOrchestrator',
  namespace: 'Session',
  states: ['init', 'authed', 'expired'],
  events: ['auth-succeeded', 'session-expired', 'timeout'],
  unspecified: 'invalid',
  initial: 'init',
  terminal: ['expired'],
  transitions: [
    { from: 'init', event: 'auth-succeeded', to: 'authed' },
    { from: 'init', event: 'timeout', to: 'expired' },
    { from: 'authed', event: 'session-expired', to: 'expired' },
    { from: 'authed', event: 'timeout', to: 'expired' },
  ],
} as const;

const out = generateLeanSpec(spec);
const result = verifyLeanSpec([out]);

result.status; // 'ok' | 'verification-failed' | 'lean-not-installed' | 'skipped-by-env'
```

## A rejection is not a self-loop

An event that arrives in a state where it means nothing is a bug. An event that
arrives and correctly changes nothing is not. The generated Lean keeps them
apart, because a machine that treats them the same cannot report the first one.

```lean
inductive Step where
  | to : State → Step
  | invalid : Step

def dispatch : State → Event → Step
  | .Init,   .AuthSucceeded  => .to .Authed
  | .Init,   .SessionExpired => .invalid
  ...
```

`{ from: 'active', event: 'query', to: 'active' }` is a decision. Leaving a cell
out is not, so by default `generateLeanSpec` refuses to run and names the cells
nobody decided about. Pass `unspecified: 'invalid'` to reject every unmentioned
cell, once, out loud.

## Lean checks the table, not a theorem about it

The generated `dispatch` lists every `(state, event)` cell and has no catch-all.
Lean refuses a non-exhaustive match, so completeness is checked by the compiler
rather than asserted by a theorem. Delete a line and Lean tells you which cell
you deleted:

```
error: missing cases:
State.Authed, Event.Timeout
```

The theorems that *are* emitted say things a reader could get wrong, and fail to
compile when the table contradicts them:

```lean
/-- expired is terminal: no event leads anywhere from it. -/
theorem expired_absorbing : ∀ e, dispatch .Expired e = .invalid := by
  intro e; cases e <;> rfl

/-- init can leave, and this event does it. -/
theorem init_can_leave : ∃ e, escapes .Init e = true :=
  ⟨.AuthSucceeded, rfl⟩
```

## A sink is not a terminal state

A state whose only accepted events loop back to itself is not terminal — it
answers events — and nothing ever leaves it. A job that reaches `dlq` and accepts
`dlq-inspected` stays in `dlq` forever.

Asking merely whether a state has a valid event would call that a way out. So the
generated `escapes` asks whether an event moves the machine somewhere *else*, and
a sink gets the theorem that says nothing does:

```lean
theorem dlq_no_escape : ∀ e, escapes .Dlq e = false := by
  intro e; cases e <;> rfl
```

`meta.sinkStates` lists them, because a sink is usually either intended and worth
naming, or an accident worth fixing.

## Reachability, when you name the initial state

Pass `initial` and every other state gets a theorem carrying a shortest path of
events that reaches it, which Lean checks by computation:

```lean
theorem authed_reachable : steps .Init [.AuthSucceeded] = .to .Authed := rfl
```

A state with no such path cannot be given one. Generation stops and names it: a
state nothing reaches exists only in the type.

Pass `terminal` to state which states you believe are terminal, and the generator
checks the belief against the table. Declaring one that has a way out, or leaving
out one that has none, stops generation. Both mean the table and the author
disagree, and the table is not always the one that is wrong.

## Verification is optional, and a skip is never a pass

`verifyLeanSpec` needs a Lean toolchain on `PATH`. Without one it returns
`lean-not-installed` rather than throwing, so a contributor who has not installed
Lean is not blocked. It never returns `ok` for a check it did not run.

| status | meaning |
|---|---|
| `ok` | every spec elaborated |
| `verification-failed` | Lean rejected one; `diagnostics` carries what it said |
| `lean-not-installed` | no toolchain on `PATH` |
| `skipped-by-env` | `opts.skip` or `KIWA_LEAN_SKIP_VERIFY=1` |

To install a toolchain:

```bash
brew install elan-init
elan toolchain install leanprover/lean4:v4.15.0
```

## Which Lean

The generated source is checked against **v4.12.0, v4.15.0, v4.23.0 and v4.31.0**.
All four accept a complete table and reject the same broken ones: a missing cell,
a false absorbing theorem, a false reachability witness.

They do not word their complaints the same way — `missing cases` became `Missing
cases` in v4.23, and `tactic 'rfl' failed` became ``Tactic `rfl` failed``. Match
loosely if you read the diagnostics, or match on the terms Lean echoes, which
stay put.

By default `verifyLeanSpec` uses whatever Lean the machine has, since pinning one
makes a contributor who already has a working toolchain fetch a second to reach
the same verdict. Pass `leanToolchain` when a run has to be reproducible down to
the compiler, and it writes the `lean-toolchain` that `elan` reads. A checked-in
Lake project pins by default, because a repository should.

To run the version matrix yourself:

```bash
elan toolchain install leanprover/lean4:v4.31.0
KIWA_LEAN_TOOLCHAINS=v4.15.0,v4.31.0 pnpm test
```

## Does the code agree with the spec?

Proving things about a table says nothing about the program that was supposed to
implement it. `checkConformance` asks the implementation what it does with every
cell and reports where the two disagree.

```ts
import { checkConformance, formatConformance } from '@kiwa-lab/lean';

const report = checkConformance(spec, (state, event) => {
  const next = dispatch({ session: { ...start(), state }, event });
  return refused(next) ? { kind: 'rejected' } : { kind: 'to', state: next.state };
});

if (!report.ok) throw new Error(formatConformance(spec, report));
```

It knows nothing about how your code is written: you say what it means for your
implementation to refuse an event, since only you know whether that is a throw, a
returned error, or an untouched state and a log line.

Four ways to disagree, and each is reported per cell:

| kind | meaning |
|---|---|
| `different-target` | both accept, and they land in different states |
| `impl-rejects` | the spec names a target; the code refused the event |
| `impl-accepts` | the spec refuses the event; the code took it somewhere |
| `unknown-state` | the code landed outside the machine's state space |

`impl-accepts` is the half a test written from the happy path never reaches: the
machine takes an event the spec calls impossible.

## Does the Lean file hold the table you wrote?

The theorems cannot answer that. They are derived from the same table the
generator emitted, so a cell rendered to the wrong target produces a file that
compiles, whose theorems all prove, and whose table is wrong. Lean's
exhaustiveness checker catches a cell that was *dropped*; nothing catches one that
was *moved*.

`checkLeanTable` makes Lean print the table it computes, and compares it with the
spec:

```ts
const report = checkLeanTable(spec);
// { status: 'ok', ok: true, checked: 40, disagreements: [] }
```

A disagreement names the cell and both answers:

```
authed + timeout: the spec says expired, the generated Lean says authed
```

`status` is `lean-not-installed` when there is no toolchain, and `ok` is false —
a check that did not run has established nothing. Pass `source` to check a Lean
file you have on disk rather than one generated on the spot.

With `checkConformance` this closes the triangle: the spec, the code, and the
proof all hold one table.

## API

| Export | Purpose |
|---|---|
| `generateLeanSpec(spec)` | table → Lean 4 source, plus `meta` (cell counts, terminal states, sinks, reachability paths) |
| `generateLakeProject(config)` | a Lake package whose `lake build` actually builds the specs put in it |
| `verifyLeanSpec(specs, opts?)` | run Lean over generated specs |
| `checkConformance(spec, observe)` | walk every cell, comparing the spec with an implementation |
| `checkLeanTable(spec, opts?)` | make Lean print its table, comparing it with the spec |
| `extractLeanTable(source, spec, opts?)` | read the table out of a Lean source |
| `formatConformance(spec, report)` | render a report as one failure message |
| `isInvalid(transition)` | narrow a `Transition` to its rejecting form |

Check the Lake project into a repository when you want `lake build` to check the
specs alongside the rest of the code. Its library is a `@[default_target]` and
globs the spec directory, because a Lake library that is neither will report
`Build completed successfully` having compiled nothing.

`verifyLeanSpec` does not need it. It writes the specs into one scratch file and
calls `lean` once, since a generated spec imports nothing and Lean takes one file
at a time. Its diagnostics name the spec a failure came from, not the scratch
file:

```
KiwaSpecs/JobOrchestrator.lean:30:2: error: missing cases:
State.Dlq, Event.RetryScheduled
```

Two specs may not share a `moduleName`. They would land on one path, and the
first would be reported as verified having never been read.

See [`CHANGELOG.md`](./CHANGELOG.md) for the 0.3.0 breaking changes and why they
were breaking.

## License

UNLICENSED. Part of [kiwa](https://github.com/cardene777/kiwa).
