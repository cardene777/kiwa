# Perf Suite — astro

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| renderAstroPage | 0.05ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +1709%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invokeEndpoint | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +3899%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderAstroPage | 0.44ms | 10ms | PASS |
| invokeEndpoint | 0.11ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderAstroPage | -27544 B | 2800 B | 102400 B | yes | PASS |
| invokeEndpoint | -8160 B | 44 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderAstroPage

# Perf Report — renderAstroPage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.05ms |
| p99 | 0.25ms |
| mean | 0.02ms |
| stdev | 0.06ms |
| min | 0.01ms |
| max | 0.81ms |
| total | 4.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +5.32% |
| p95 | 0.05ms | 0.03ms | +0.02ms | +70.30% |
| p99 | 0.25ms | 0.07ms | +0.17ms | +234.18% |
| mean | 0.02ms | 0.02ms | +0.01ms | +46.35% |
| min | 0.01ms | 0.01ms | +0.00ms | +4.02% |
| max | 0.81ms | 0.11ms | +0.71ms | +663.84% |
| total | 4.71ms | 3.22ms | +1.49ms | +46.35% |

### invokeEndpoint

# Perf Report — invokeEndpoint.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 1.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +0.99% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -19.30% |
| p99 | 0.02ms | 0.02ms | -0.01ms | -27.09% |
| mean | 0.01ms | 0.01ms | -0.00ms | -4.39% |
| min | 0.01ms | 0.01ms | +0.00ms | +1.04% |
| max | 0.03ms | 0.07ms | -0.04ms | -56.82% |
| total | 1.82ms | 1.91ms | -0.08ms | -4.39% |

