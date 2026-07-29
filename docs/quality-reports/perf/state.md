# Perf Suite — state

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| createStore | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +23083%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| dispatch | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +70210%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| selectState | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +149209%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createStore | 0.01ms | 10ms | PASS |
| dispatch | 0.01ms | 10ms | PASS |
| selectState | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createStore | 672 B | -46600 B | 102400 B | yes | PASS |
| dispatch | 248 B | 0 B | 102400 B | yes | PASS |
| selectState | -14680 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createStore

# Perf Report — createStore.serial

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
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -60.97% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -38.60% |
| mean | 0.00ms | 0.00ms | -0.00ms | -20.52% |
| min | 0.00ms | 0.00ms | +0.00ms | +33.20% |
| max | 0.01ms | 0.01ms | -0.01ms | -44.67% |
| total | 0.10ms | 0.13ms | -0.03ms | -20.52% |

### dispatch

# Perf Report — dispatch.serial

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
| max | 0.03ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +6.19% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +14.86% |
| mean | 0.00ms | 0.00ms | +0.00ms | +20.49% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.01ms | +0.02ms | +171.95% |
| total | 0.15ms | 0.12ms | +0.02ms | +20.49% |

### selectState

# Perf Report — selectState.serial

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
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -24.78% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +156.09% |
| mean | 0.00ms | 0.00ms | +0.00ms | +17.91% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +57.42% |
| total | 0.07ms | 0.06ms | +0.01ms | +17.91% |

