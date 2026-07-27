# Perf Suite — visual

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| comparePngBuffersIdentical | 1.40ms | 50ms | PASS | stable |
| comparePngBuffersFullDiff | 9.54ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| comparePngBuffersIdentical | 1.31ms | 100ms | PASS |
| comparePngBuffersFullDiff | 27.61ms | 400ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| comparePngBuffersIdentical | 24864 B | 1859636 B | 8388608 B | yes | PASS |
| comparePngBuffersFullDiff | 23416 B | -28733124 B | 16777216 B | yes | PASS |

## Detailed serial reports

### comparePngBuffersIdentical

# Perf Report — comparePngBuffersIdentical.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.48ms |
| p95 | 1.40ms |
| p99 | 1.82ms |
| mean | 0.63ms |
| stdev | 0.36ms |
| min | 0.36ms |
| max | 1.94ms |
| total | 19.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.48ms | 0.81ms | -0.33ms | -40.22% |
| p95 | 1.40ms | 2.11ms | -0.71ms | -33.62% |
| p99 | 1.82ms | 2.25ms | -0.43ms | -19.16% |
| mean | 0.63ms | 1.04ms | -0.41ms | -39.36% |
| min | 0.36ms | 0.45ms | -0.09ms | -19.06% |
| max | 1.94ms | 2.25ms | -0.31ms | -13.97% |
| total | 19.01ms | 31.34ms | -12.33ms | -39.36% |

### comparePngBuffersFullDiff

# Perf Report — comparePngBuffersFullDiff.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 6.32ms |
| p95 | 9.54ms |
| p99 | 12.09ms |
| mean | 6.81ms |
| stdev | 1.52ms |
| min | 5.38ms |
| max | 12.82ms |
| total | 204.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 6.32ms | 7.15ms | -0.83ms | -11.54% |
| p95 | 9.54ms | 9.25ms | +0.29ms | +3.10% |
| p99 | 12.09ms | 9.53ms | +2.56ms | +26.81% |
| mean | 6.81ms | 7.25ms | -0.44ms | -6.10% |
| min | 5.38ms | 5.41ms | -0.02ms | -0.46% |
| max | 12.82ms | 9.54ms | +3.27ms | +34.32% |
| total | 204.33ms | 217.60ms | -13.27ms | -6.10% |

