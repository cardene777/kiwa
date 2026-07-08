# kiwa quality reports

This directory hosts per-provider quality reports emitted by `@kiwa/quality-metrics`. Each report captures a snapshot of the 5-axis score (coverage / test count / fidelity / perf p95 / mutation kill) at a given version and shows whether the release gate SSOT (`docs/quality/release-gate.md`) was passed.

## Files

- `<package>-<version>.md` — human-readable report (5-axis summary + release gate verdict + trend diff + notes)
- `<package>-<version>.json` — machine-readable snapshot for downstream tooling
- `<package>-fidelity-<timestamp>.json` — behavioural fidelity snapshots emitted by dogfood app runs (v1.11-2 onward)

## Emit path

Reports are written when a provider's PR includes the harness. Manual emit for a provider without an automated hook:

```ts
import { emitJson, emitMarkdown } from '@kiwa/quality-metrics';
import { writeFileSync } from 'node:fs';

const md = emitMarkdown({ report, verdict });
writeFileSync(`docs/quality-reports/${report.provider}-${report.version}.md`, md);
writeFileSync(`docs/quality-reports/${report.provider}-${report.version}.json`, emitJson(report));
```

## Fidelity snapshots (v1.11-2+)

`docs/quality-reports/<provider>-fidelity-<isoDate>.json` files are emitted by the dogfood app harnesses (`examples/dogfood-*-poc/`) whenever they run in both `KIWA_MODE=real` and `KIWA_MODE=mock`. Each snapshot records:

- ops under test
- mock adapter trace
- real adapter trace
- behavioural divergences (mock ok vs real ok differ)
- resulting `FidelityMetric.behavioralDivergences` count

Consumers of the release gate can compute rolling averages of the fidelity ratio across snapshots.
