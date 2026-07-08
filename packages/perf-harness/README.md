# @kiwa/perf-harness

Generic performance harness for kiwa packages and dogfood apps. It measures p50/p95/p99 latency, persists baselines, detects regressions, and feeds perf data into `@kiwa/quality-metrics`.

## Single measure

```ts
import { measure } from '@kiwa/perf-harness';

const result = await measure({
  name: 'reply',
  iterations: 100,
  warmup: 5,
  fn: async () => {
    await adapter.reply({ userMessage: 'Say hi.' });
  },
});
```

## Baseline compare

```ts
import {
  defaultBaselinePath,
  detectRegression,
  loadBaseline,
  measure,
  saveBaseline,
} from '@kiwa/perf-harness';

const path = defaultBaselinePath('dogfood-anthropic-chatbot');
const current = await measure({ name: 'reply', iterations: 100, warmup: 5, fn });
const baseline = await loadBaseline(path);

if (baseline) {
  const regression = detectRegression({ current, baseline, threshold: 0.2 });
  console.log(regression.verdict);
}

await saveBaseline(path, current);
```

## Release-gate integration

```ts
import { evaluatePerfGate, measure } from '@kiwa/perf-harness';

const result = await measure({ name: 'evaluateReleaseGate', iterations: 100, warmup: 5, fn });
const gate = evaluatePerfGate({
  result,
  thresholds: { p95Ms: 100 },
});

console.log(gate.verdict.passed, gate.breaches);
```
