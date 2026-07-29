# Perf Suite — a11y-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 28.11ms | 44.57ms | 1200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| violation_report_batch (2 dirty runAxe + reportViolations) | 25.27ms | 63.40ms | 900ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| audit_error_handling (3 invalid-context throw + catch) | 18.92ms | 25.45ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 162.88ms | 2400ms | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 127.00ms | 1800ms | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 103.36ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | -299784 B | 0 B | 102400 B | yes | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | -364688 B | 0 B | 102400 B | yes | PASS |
| audit_error_handling (3 invalid-context throw + catch) | -77000 B | 40 B | 102400 B | yes | PASS |

## Detailed serial reports

### audit_workflow (3 fixture runAxe cycle)

# Perf Report — audit_workflow (3 fixture runAxe cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 28.11ms |
| p50 | 32.32ms |
| p95 | 44.57ms |
| p99 | 46.13ms |
| mean | 34.05ms |
| stdev | 5.62ms |
| min | 25.00ms |
| max | 46.52ms |
| total | 680.99ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 28.11ms | 25.70ms | +2.40ms | +9.35% |
| p50 | 32.32ms | 35.32ms | -3.00ms | -8.49% |
| p95 | 44.57ms | 123.96ms | -79.39ms | -64.05% |
| p99 | 46.13ms | 131.12ms | -84.99ms | -64.82% |
| mean | 34.05ms | 54.09ms | -20.04ms | -37.05% |
| min | 25.00ms | 22.21ms | +2.79ms | +12.55% |
| max | 46.52ms | 132.91ms | -86.39ms | -65.00% |
| total | 680.99ms | 1081.80ms | -400.81ms | -37.05% |

### violation_report_batch (2 dirty runAxe + reportViolations)

# Perf Report — violation_report_batch (2 dirty runAxe + reportViolations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 25.27ms |
| p50 | 32.81ms |
| p95 | 63.40ms |
| p99 | 78.13ms |
| mean | 37.99ms |
| stdev | 15.80ms |
| min | 18.96ms |
| max | 81.82ms |
| total | 759.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 25.27ms | 16.57ms | +8.70ms | +52.47% |
| p50 | 32.81ms | 18.35ms | +14.46ms | +78.85% |
| p95 | 63.40ms | 23.78ms | +39.62ms | +166.63% |
| p99 | 78.13ms | 24.53ms | +53.60ms | +218.51% |
| mean | 37.99ms | 19.36ms | +18.63ms | +96.24% |
| min | 18.96ms | 15.86ms | +3.10ms | +19.54% |
| max | 81.82ms | 24.72ms | +57.10ms | +230.99% |
| total | 759.79ms | 387.18ms | +372.61ms | +96.24% |

### audit_error_handling (3 invalid-context throw + catch)

# Perf Report — audit_error_handling (3 invalid-context throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 18.92ms |
| p50 | 23.22ms |
| p95 | 25.45ms |
| p99 | 25.89ms |
| mean | 22.40ms |
| stdev | 2.52ms |
| min | 17.49ms |
| max | 26.00ms |
| total | 448.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 18.92ms | 18.67ms | +0.25ms | +1.37% |
| p50 | 23.22ms | 21.23ms | +1.99ms | +9.35% |
| p95 | 25.45ms | 39.98ms | -14.52ms | -36.33% |
| p99 | 25.89ms | 44.57ms | -18.67ms | -41.90% |
| mean | 22.40ms | 23.64ms | -1.24ms | -5.22% |
| min | 17.49ms | 15.30ms | +2.19ms | +14.30% |
| max | 26.00ms | 45.71ms | -19.71ms | -43.12% |
| total | 448.06ms | 472.76ms | -24.70ms | -5.22% |

