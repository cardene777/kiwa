# Perf Suite — fresh

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeFreshHandler | 0.18ms | 5ms | PASS | stable (差 0.16ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| mountIsland | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +21785%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeFreshHandler | 0.35ms | 10ms | PASS |
| mountIsland | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeFreshHandler | 12752 B | -222 B | 102400 B | yes | PASS |
| mountIsland | -90688 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeFreshHandler

# Perf Report — invokeFreshHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.18ms |
| p99 | 1.23ms |
| mean | 0.05ms |
| stdev | 0.21ms |
| min | 0.01ms |
| max | 1.91ms |
| total | 10.98ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +3.54% |
| p95 | 0.18ms | 0.03ms | +0.16ms | +574.07% |
| p99 | 1.23ms | 0.11ms | +1.11ms | +967.59% |
| mean | 0.05ms | 0.02ms | +0.04ms | +256.08% |
| min | 0.01ms | 0.01ms | -0.00ms | -0.96% |
| max | 1.91ms | 0.39ms | +1.52ms | +387.80% |
| total | 10.98ms | 3.08ms | +7.90ms | +256.08% |

### mountIsland

# Perf Report — mountIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -14.63% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -10.35% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -3.71% |
| mean | 0.00ms | 0.00ms | -0.00ms | -8.74% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.00ms | +20.83% |
| total | 0.35ms | 0.39ms | -0.03ms | -8.74% |

