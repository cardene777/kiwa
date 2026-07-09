# Specifications

One directory per feature. Each holds two files.

```
docs/spec/
└── <feature>/
    ├── specFormal.md     state machine and pure contracts, checked by Lean
    └── specRuntime.md    side effects and human review, checked by tests and people
```

Run `/spec` to create a feature directory. Run `/verify` to check one.

## Why two files

A criterion is verified by a proof, by a test, or by a person. Keeping the first
group in its own file gives the proof a single input, and a criterion that drifts
out of it shows up as a moved line rather than as a comment nobody reads.

The split is enforced. No verification target may appear in both files: two
layers pointing at one test each assume the other one covered it, and neither
does. `kaname` rejects a specification that does this.

## What a criterion looks like

| Field | Meaning |
|---|---|
| `id` | Stable across edits. Reports refer to it. |
| `statement` | What must be true, written so that a failure is imaginable. |
| `layer` | `formal`, `runtime`, or `human`. |
| `verifyBy` | A path to the file that checks it. Not a description. |

An item with no `verifyBy` is a wish. `kaname` will not accept it.
