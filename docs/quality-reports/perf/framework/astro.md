# Perf Suite — astro

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| renderAstroPage | 0.03ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +1709%) 以上の悪化が必要) |
| invokeEndpoint | 0.01ms | 5ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderAstroPage | 0.31ms | 10ms | PASS |
| invokeEndpoint | 0.07ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderAstroPage | 47056 B | 2800 B | 102400 B | yes | PASS |
| invokeEndpoint | -121296 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderAstroPage

# Perf Report — renderAstroPage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 3.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +4.82% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +5.09% |
| p99 | 0.07ms | 0.07ms | -0.01ms | -8.08% |
| mean | 0.02ms | 0.02ms | +0.00ms | +5.05% |
| min | 0.01ms | 0.01ms | -0.00ms | -5.22% |
| max | 0.10ms | 0.11ms | -0.00ms | -3.01% |
| total | 3.38ms | 3.22ms | +0.16ms | +5.05% |

### invokeEndpoint

# Perf Report — invokeEndpoint.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 1.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.00ms | -42.15% |
| p95 | 0.01ms | 0.01ms | -0.01ms | -41.81% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -41.44% |
| mean | 0.01ms | 0.01ms | -0.00ms | -43.21% |
| min | 0.00ms | 0.01ms | -0.00ms | -43.81% |
| max | 0.02ms | 0.07ms | -0.05ms | -69.98% |
| total | 1.08ms | 1.91ms | -0.82ms | -43.21% |

