# Perf Suite — observability

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| collectRunHistory | 0.15ms | 5ms | PASS | stable (差 0.11ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| detectFlaky | 0.02ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +3124%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| checkThresholds | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +74605%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| renderDashboard | 0.02ms | 5ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| collectRunHistory | 0.32ms | 10ms | PASS |
| detectFlaky | 0.25ms | 10ms | PASS |
| checkThresholds | 0.02ms | 10ms | PASS |
| renderDashboard | 0.21ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| collectRunHistory | 4760 B | -8192 B | 102400 B | yes | PASS |
| detectFlaky | -15040 B | 0 B | 102400 B | yes | PASS |
| checkThresholds | 616 B | 0 B | 102400 B | yes | PASS |
| renderDashboard | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### collectRunHistory

# Perf Report — collectRunHistory.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.15ms |
| p99 | 1.08ms |
| mean | 0.08ms |
| stdev | 0.37ms |
| min | 0.02ms |
| max | 4.47ms |
| total | 16.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +13.34% |
| p95 | 0.15ms | 0.03ms | +0.11ms | +340.14% |
| p99 | 1.08ms | 0.05ms | +1.02ms | +1944.53% |
| mean | 0.08ms | 0.02ms | +0.06ms | +300.58% |
| min | 0.02ms | 0.01ms | +0.00ms | +17.24% |
| max | 4.47ms | 0.31ms | +4.16ms | +1353.00% |
| total | 16.82ms | 4.20ms | +12.62ms | +300.58% |

### detectFlaky

# Perf Report — detectFlaky.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 1.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +8.86% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +4.19% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -18.68% |
| mean | 0.01ms | 0.01ms | +0.00ms | +5.86% |
| min | 0.01ms | 0.01ms | +0.00ms | +7.50% |
| max | 0.03ms | 0.04ms | -0.01ms | -21.92% |
| total | 1.72ms | 1.62ms | +0.10ms | +5.86% |

### checkThresholds

# Perf Report — checkThresholds.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.83% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +11.91% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -52.20% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.75% |
| min | 0.00ms | 0.00ms | +0.00ms | +24.92% |
| max | 0.02ms | 0.01ms | +0.00ms | +37.41% |
| total | 0.12ms | 0.11ms | +0.01ms | +8.75% |

### renderDashboard

# Perf Report — renderDashboard.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.02ms |
| p99 | 5.38ms |
| mean | 0.19ms |
| stdev | 1.49ms |
| min | 0.00ms |
| max | 17.84ms |
| total | 38.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +136.82% |
| p99 | 5.38ms | 0.01ms | +5.36ms | +39830.54% |
| mean | 0.19ms | 0.00ms | +0.19ms | +6024.09% |
| min | 0.00ms | 0.00ms | +0.00ms | +12.11% |
| max | 17.84ms | 0.02ms | +17.82ms | +97658.44% |
| total | 38.37ms | 0.63ms | +37.74ms | +6024.09% |

