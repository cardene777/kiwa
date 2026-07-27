# Perf Suite — visual

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| comparePngBuffersIdentical | 1.66ms | 50ms | PASS | stable |
| comparePngBuffersFullDiff | 8.30ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| comparePngBuffersIdentical | 1.71ms | 100ms | PASS |
| comparePngBuffersFullDiff | 26.44ms | 400ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| comparePngBuffersIdentical | 46784 B | 1244645 B | 8388608 B | yes | PASS |
| comparePngBuffersFullDiff | 30784 B | -10243806 B | 16777216 B | yes | PASS |

## Detailed serial reports

### comparePngBuffersIdentical

# Perf Report — comparePngBuffersIdentical.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.51ms |
| p95 | 1.66ms |
| p99 | 2.16ms |
| mean | 0.67ms |
| stdev | 0.44ms |
| min | 0.36ms |
| max | 2.17ms |
| total | 20.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.51ms | 0.81ms | -0.30ms | -36.77% |
| p95 | 1.66ms | 2.11ms | -0.46ms | -21.58% |
| p99 | 2.16ms | 2.25ms | -0.09ms | -4.05% |
| mean | 0.67ms | 1.04ms | -0.37ms | -35.60% |
| min | 0.36ms | 0.45ms | -0.09ms | -19.14% |
| max | 2.17ms | 2.25ms | -0.08ms | -3.62% |
| total | 20.18ms | 31.34ms | -11.16ms | -35.60% |

### comparePngBuffersFullDiff

# Perf Report — comparePngBuffersFullDiff.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 6.46ms |
| p95 | 8.30ms |
| p99 | 9.33ms |
| mean | 6.68ms |
| stdev | 0.99ms |
| min | 5.31ms |
| max | 9.72ms |
| total | 200.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 6.46ms | 7.15ms | -0.69ms | -9.62% |
| p95 | 8.30ms | 9.25ms | -0.95ms | -10.32% |
| p99 | 9.33ms | 9.53ms | -0.20ms | -2.11% |
| mean | 6.68ms | 7.25ms | -0.58ms | -7.97% |
| min | 5.31ms | 5.41ms | -0.10ms | -1.86% |
| max | 9.72ms | 9.54ms | +0.18ms | +1.84% |
| total | 200.25ms | 217.60ms | -17.35ms | -7.97% |

