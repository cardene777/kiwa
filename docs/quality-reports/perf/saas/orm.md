# Perf Suite — orm

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| drizzleInsert | 0.05ms | 10ms | PASS | stable (差 0.03ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| drizzleSelectAll | 1.11ms | 20ms | PASS | regressed — gate 無効 (regressionGate=false) |
| drizzleSelectWhere | 0.03ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +1782%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| drizzleInsert | 0.71ms | 20ms | PASS |
| drizzleSelectAll | 11.93ms | 40ms | PASS |
| drizzleSelectWhere | 0.43ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| drizzleInsert | -118448 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectAll | -54120 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectWhere | 10080 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### drizzleInsert

# Perf Report — drizzleInsert.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.05ms |
| p99 | 0.14ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.21ms |
| total | 5.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.00ms | +14.38% |
| p95 | 0.05ms | 0.03ms | +0.03ms | +97.57% |
| p99 | 0.14ms | 0.05ms | +0.09ms | +168.37% |
| mean | 0.03ms | 0.02ms | +0.01ms | +50.21% |
| min | 0.01ms | 0.01ms | +0.00ms | +4.08% |
| max | 0.21ms | 0.10ms | +0.10ms | +102.07% |
| total | 5.21ms | 3.47ms | +1.74ms | +50.21% |

### drizzleSelectAll

# Perf Report — drizzleSelectAll.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.27ms |
| p95 | 1.11ms |
| p99 | 4.43ms |
| mean | 0.46ms |
| stdev | 0.76ms |
| min | 0.26ms |
| max | 5.80ms |
| total | 91.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.27ms | 0.25ms | +0.02ms | +7.98% |
| p95 | 1.11ms | 0.31ms | +0.80ms | +257.21% |
| p99 | 4.43ms | 0.33ms | +4.10ms | +1230.68% |
| mean | 0.46ms | 0.26ms | +0.19ms | +73.59% |
| min | 0.26ms | 0.24ms | +0.02ms | +7.11% |
| max | 5.80ms | 0.56ms | +5.24ms | +939.85% |
| total | 91.34ms | 52.62ms | +38.72ms | +73.59% |

### drizzleSelectWhere

# Perf Report — drizzleSelectWhere.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.14ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.02ms |
| max | 0.41ms |
| total | 4.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +12.12% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -7.12% |
| p99 | 0.14ms | 0.06ms | +0.07ms | +110.81% |
| mean | 0.02ms | 0.02ms | +0.00ms | +16.35% |
| min | 0.02ms | 0.02ms | +0.00ms | +11.54% |
| max | 0.41ms | 0.25ms | +0.16ms | +63.91% |
| total | 4.95ms | 4.25ms | +0.70ms | +16.35% |

