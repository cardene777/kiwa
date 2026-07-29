# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.45ms | 30ms | PASS | stable (差 0.48ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.33ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +106%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 2.89ms | 60ms | PASS |
| setupComponentEnvRender | 1.14ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | -63432 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | -81376 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p50 | 0.23ms |
| p95 | 0.45ms |
| p99 | 0.54ms |
| mean | 0.26ms |
| stdev | 0.08ms |
| min | 0.18ms |
| max | 0.55ms |
| total | 12.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.23ms | 0.26ms | -0.03ms | -13.10% |
| p95 | 0.45ms | 0.93ms | -0.48ms | -51.69% |
| p99 | 0.54ms | 1.44ms | -0.90ms | -62.28% |
| mean | 0.26ms | 0.39ms | -0.13ms | -32.70% |
| min | 0.18ms | 0.20ms | -0.03ms | -12.93% |
| max | 0.55ms | 1.74ms | -1.19ms | -68.32% |
| total | 12.96ms | 19.26ms | -6.30ms | -32.70% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p50 | 0.16ms |
| p95 | 0.33ms |
| p99 | 0.71ms |
| mean | 0.20ms |
| stdev | 0.12ms |
| min | 0.13ms |
| max | 0.90ms |
| total | 10.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.16ms | 0.18ms | -0.02ms | -9.56% |
| p95 | 0.33ms | 0.47ms | -0.14ms | -29.30% |
| p99 | 0.71ms | 0.66ms | +0.05ms | +7.40% |
| mean | 0.20ms | 0.22ms | -0.02ms | -7.61% |
| min | 0.13ms | 0.16ms | -0.03ms | -20.46% |
| max | 0.90ms | 0.73ms | +0.17ms | +22.82% |
| total | 10.01ms | 10.83ms | -0.82ms | -7.61% |

