# Perf Suite — i18n-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.08ms | 0.13ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| locale_switch_batch (5 setLocale + translate) | 0.04ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| missing_key_error_handling (5 missing translations) | 0.0034ms | 0.0070ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0098ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.41ms | 200ms | PASS |
| locale_switch_batch (5 setLocale + translate) | 0.16ms | 200ms | PASS |
| missing_key_error_handling (5 missing translations) | 0.02ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 1256 B | 0 B | 102400 B | yes | PASS |
| locale_switch_batch (5 setLocale + translate) | -4864 B | 0 B | 102400 B | yes | PASS |
| missing_key_error_handling (5 missing translations) | 6784 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 3664 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 5848 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### translation_workflow (10 translate across 4 providers)

# Perf Report — translation_workflow (10 translate across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.08ms |
| p50 | 0.08ms |
| p95 | 0.13ms |
| p99 | 0.17ms |
| mean | 0.10ms |
| stdev | 0.02ms |
| min | 0.08ms |
| max | 0.18ms |
| total | 1.92ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.08ms | 0.08ms | -0.0023ms | -2.75% |
| p50 | 0.08ms | 0.09ms | -0.0035ms | -4.01% |
| p95 | 0.13ms | 0.20ms | -0.07ms | -34.81% |
| p99 | 0.17ms | 0.28ms | -0.11ms | -38.72% |
| mean | 0.10ms | 0.11ms | -0.01ms | -11.22% |
| min | 0.08ms | 0.08ms | -0.0044ms | -5.32% |
| max | 0.18ms | 0.30ms | -0.12ms | -39.35% |
| total | 1.92ms | 2.16ms | -0.24ms | -11.22% |

### locale_switch_batch (5 setLocale + translate)

# Perf Report — locale_switch_batch (5 setLocale + translate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.0023ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.00076ms | -1.90% |
| p50 | 0.04ms | 0.04ms | -0.00075ms | -1.84% |
| p95 | 0.04ms | 0.05ms | -0.01ms | -22.02% |
| p99 | 0.05ms | 0.06ms | -0.01ms | -22.08% |
| mean | 0.04ms | 0.04ms | -0.0026ms | -6.02% |
| min | 0.04ms | 0.04ms | -0.0017ms | -4.26% |
| max | 0.05ms | 0.06ms | -0.01ms | -22.10% |
| total | 0.81ms | 0.86ms | -0.05ms | -6.02% |

### missing_key_error_handling (5 missing translations)

# Perf Report — missing_key_error_handling (5 missing translations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0034ms |
| p50 | 0.0035ms |
| p95 | 0.0070ms |
| p99 | 0.0091ms |
| mean | 0.0041ms |
| stdev | 0.0015ms |
| min | 0.0033ms |
| max | 0.0096ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0039ms | -0.00050ms | -12.81% |
| p50 | 0.0035ms | 0.0040ms | -0.00046ms | -11.53% |
| p95 | 0.0070ms | 0.0066ms | +0.00040ms | +6.10% |
| p99 | 0.0091ms | 0.01ms | -0.0024ms | -20.59% |
| mean | 0.0041ms | 0.0047ms | -0.00057ms | -12.18% |
| min | 0.0033ms | 0.0038ms | -0.00046ms | -12.08% |
| max | 0.0096ms | 0.01ms | -0.0030ms | -24.09% |
| total | 0.08ms | 0.09ms | -0.01ms | -12.18% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0038ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0020ms | -6.60% |
| p50 | 0.03ms | 0.03ms | +0.000042ms | +0.13% |
| p95 | 0.04ms | 0.07ms | -0.03ms | -46.20% |
| p99 | 0.04ms | 0.08ms | -0.04ms | -51.36% |
| mean | 0.03ms | 0.04ms | -0.0052ms | -13.65% |
| min | 0.03ms | 0.03ms | -0.0027ms | -9.09% |
| max | 0.04ms | 0.09ms | -0.05ms | -52.36% |
| total | 0.66ms | 0.76ms | -0.10ms | -13.65% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0098ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0029ms |
| min | 0.0097ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0098ms | 0.0099ms | -0.000046ms | -0.47% |
| p50 | 0.01ms | 0.01ms | -0.00027ms | -2.60% |
| p95 | 0.01ms | 0.01ms | -0.00040ms | -3.31% |
| p99 | 0.02ms | 0.01ms | +0.0080ms | +62.94% |
| mean | 0.01ms | 0.01ms | +0.00023ms | +2.19% |
| min | 0.0097ms | 0.0098ms | -0.000042ms | -0.43% |
| max | 0.02ms | 0.01ms | +0.01ms | +78.64% |
| total | 0.22ms | 0.21ms | +0.0047ms | +2.19% |

