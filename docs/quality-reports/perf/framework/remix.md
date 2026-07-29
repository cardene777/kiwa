# Perf Suite — remix

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeLoader | 0.01ms | 5ms | PASS | stable (差 0.02ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| invokeAction | 0.00ms | 5ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoader | 0.07ms | 10ms | PASS |
| invokeAction | 0.05ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoader | 57632 B | 0 B | 102400 B | yes | PASS |
| invokeAction | -32056 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeLoader

# Perf Report — invokeLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.05ms |
| total | 1.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +38.88% |
| p95 | 0.01ms | 0.04ms | -0.02ms | -62.00% |
| p99 | 0.03ms | 0.07ms | -0.03ms | -48.59% |
| mean | 0.01ms | 0.01ms | -0.00ms | -37.92% |
| min | 0.00ms | 0.00ms | +0.00ms | +4.28% |
| max | 0.05ms | 0.14ms | -0.09ms | -65.35% |
| total | 1.30ms | 2.09ms | -0.79ms | -37.92% |

### invokeAction

# Perf Report — invokeAction.serial

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
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -36.24% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -30.50% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -35.14% |
| mean | 0.00ms | 0.00ms | -0.00ms | -36.06% |
| min | 0.00ms | 0.00ms | -0.00ms | -36.93% |
| max | 0.02ms | 0.01ms | +0.00ms | +11.01% |
| total | 0.40ms | 0.63ms | -0.23ms | -36.06% |

