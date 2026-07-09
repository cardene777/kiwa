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

/-- init has at least one way out. -/
theorem init_has_exit : ∃ e s, dispatch .Init e = .to s :=
  ⟨.AuthSucceeded, .Authed, rfl⟩
```

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

## API

| Export | Purpose |
|---|---|
| `generateLeanSpec(spec)` | table → Lean 4 source, plus `meta` (cell counts, terminal states) |
| `generateLakeProject(config)` | a minimal Lake package to hold generated specs |
| `verifyLeanSpec(specs, opts?)` | run Lean over generated specs |
| `isInvalid(transition)` | narrow a `Transition` to its rejecting form |

See [`CHANGELOG.md`](./CHANGELOG.md) for the 0.3.0 breaking changes and why they
were breaking.

## License

UNLICENSED. Part of [kiwa](https://github.com/cardene777/kiwa).
