# Perf Suite — a11y-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 17.66ms | 21.44ms | 1200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| violation_report_batch (2 dirty runAxe + reportViolations) | 18.88ms | 53.28ms | 900ms | 0.00050ms | PASS | stable (p10 +14% (閾値未満)、 p95 +124% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| audit_error_handling (3 invalid-context throw + catch) | 11.66ms | 14.01ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 76.49ms | 2400ms | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 69.48ms | 1800ms | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 52.79ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | -317664 B | 0 B | 102400 B | yes | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | -2136392 B | 0 B | 102400 B | yes | PASS |
| audit_error_handling (3 invalid-context throw + catch) | -120088 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### audit_workflow (3 fixture runAxe cycle)

# Perf Report — audit_workflow (3 fixture runAxe cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 17.66ms |
| p50 | 19.97ms |
| p95 | 21.44ms |
| p99 | 22.32ms |
| mean | 19.76ms |
| stdev | 1.38ms |
| min | 17.00ms |
| max | 22.54ms |
| total | 395.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 17.66ms | 25.70ms | -8.05ms | -31.30% |
| p50 | 19.97ms | 35.32ms | -15.35ms | -43.47% |
| p95 | 21.44ms | 123.96ms | -102.52ms | -82.71% |
| p99 | 22.32ms | 131.12ms | -108.80ms | -82.98% |
| mean | 19.76ms | 54.09ms | -34.33ms | -63.47% |
| min | 17.00ms | 22.21ms | -5.21ms | -23.45% |
| max | 22.54ms | 132.91ms | -110.37ms | -83.04% |
| total | 395.22ms | 1081.80ms | -686.58ms | -63.47% |

### violation_report_batch (2 dirty runAxe + reportViolations)

# Perf Report — violation_report_batch (2 dirty runAxe + reportViolations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 18.88ms |
| p50 | 22.17ms |
| p95 | 53.28ms |
| p99 | 131.52ms |
| mean | 31.06ms |
| stdev | 29.52ms |
| min | 17.80ms |
| max | 151.08ms |
| total | 621.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 18.88ms | 16.57ms | +2.31ms | +13.94% |
| p50 | 22.17ms | 18.35ms | +3.83ms | +20.86% |
| p95 | 53.28ms | 23.78ms | +29.50ms | +124.08% |
| p99 | 131.52ms | 24.53ms | +106.99ms | +436.16% |
| mean | 31.06ms | 19.36ms | +11.70ms | +60.46% |
| min | 17.80ms | 15.86ms | +1.94ms | +12.22% |
| max | 151.08ms | 24.72ms | +126.36ms | +511.21% |
| total | 621.26ms | 387.18ms | +234.07ms | +60.46% |

### audit_error_handling (3 invalid-context throw + catch)

# Perf Report — audit_error_handling (3 invalid-context throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 11.66ms |
| p50 | 12.90ms |
| p95 | 14.01ms |
| p99 | 14.42ms |
| mean | 12.81ms |
| stdev | 0.94ms |
| min | 11.00ms |
| max | 14.52ms |
| total | 256.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 11.66ms | 18.67ms | -7.00ms | -37.52% |
| p50 | 12.90ms | 21.23ms | -8.33ms | -39.24% |
| p95 | 14.01ms | 39.98ms | -25.97ms | -64.96% |
| p99 | 14.42ms | 44.57ms | -30.15ms | -67.65% |
| mean | 12.81ms | 23.64ms | -10.83ms | -45.80% |
| min | 11.00ms | 15.30ms | -4.31ms | -28.14% |
| max | 14.52ms | 45.71ms | -31.20ms | -68.24% |
| total | 256.23ms | 472.76ms | -216.53ms | -45.80% |

