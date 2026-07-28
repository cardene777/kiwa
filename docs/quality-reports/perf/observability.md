# Perf Suite — observability

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| collectRunHistory | 0.03ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +1496%) 以上の悪化が必要) |
| detectFlaky | 0.05ms | 5ms | PASS | stable (差 0.03ms が下限 0.5ms 未満で判定を保留) |
| checkThresholds | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +74605%) 以上の悪化が必要) |
| renderDashboard | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +7634%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| collectRunHistory | 0.22ms | 10ms | PASS |
| detectFlaky | 0.44ms | 10ms | PASS |
| checkThresholds | 0.01ms | 10ms | PASS |
| renderDashboard | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| collectRunHistory | 4688 B | 0 B | 102400 B | yes | PASS |
| detectFlaky | -15048 B | 0 B | 102400 B | yes | PASS |
| checkThresholds | 2560 B | 0 B | 102400 B | yes | PASS |
| renderDashboard | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### collectRunHistory

# Perf Report — collectRunHistory.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.26ms |
| total | 4.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -0.12% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +2.28% |
| p99 | 0.05ms | 0.05ms | -0.01ms | -14.33% |
| mean | 0.02ms | 0.02ms | -0.00ms | -0.71% |
| min | 0.01ms | 0.01ms | +0.00ms | +2.87% |
| max | 0.26ms | 0.31ms | -0.04ms | -14.61% |
| total | 4.17ms | 4.20ms | -0.03ms | -0.71% |

### detectFlaky

# Perf Report — detectFlaky.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.05ms |
| p99 | 0.11ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.00ms |
| max | 0.14ms |
| total | 2.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +7.25% |
| p95 | 0.05ms | 0.02ms | +0.03ms | +200.74% |
| p99 | 0.11ms | 0.03ms | +0.08ms | +293.30% |
| mean | 0.01ms | 0.01ms | +0.01ms | +78.59% |
| min | 0.00ms | 0.01ms | -0.00ms | -5.00% |
| max | 0.14ms | 0.04ms | +0.11ms | +278.86% |
| total | 2.90ms | 1.62ms | +1.28ms | +78.59% |

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
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -0.16% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -53.28% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.79% |
| min | 0.00ms | 0.00ms | +0.00ms | +12.61% |
| max | 0.01ms | 0.01ms | -0.00ms | -1.11% |
| total | 0.11ms | 0.11ms | -0.00ms | -3.79% |

### renderDashboard

# Perf Report — renderDashboard.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.12% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -2.76% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +28.19% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.76% |
| min | 0.00ms | 0.00ms | +0.00ms | +4.80% |
| max | 0.02ms | 0.02ms | +0.00ms | +3.19% |
| total | 0.65ms | 0.63ms | +0.02ms | +3.76% |

