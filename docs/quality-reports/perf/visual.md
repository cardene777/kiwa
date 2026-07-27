# Perf Suite — visual

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| comparePngBuffersIdentical | 1.43ms | 50ms | PASS | stable |
| comparePngBuffersFullDiff | 7.92ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| comparePngBuffersIdentical | 2.13ms | 100ms | PASS |
| comparePngBuffersFullDiff | 27.35ms | 400ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| comparePngBuffersIdentical | 32608 B | 1489787 B | 8388608 B | yes | PASS |
| comparePngBuffersFullDiff | 26472 B | -19651540 B | 16777216 B | yes | PASS |

## Detailed serial reports

### comparePngBuffersIdentical

# Perf Report — comparePngBuffersIdentical.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.54ms |
| p95 | 1.43ms |
| p99 | 1.98ms |
| mean | 0.69ms |
| stdev | 0.39ms |
| min | 0.40ms |
| max | 2.15ms |
| total | 20.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.54ms | 0.81ms | -0.27ms | -33.90% |
| p95 | 1.43ms | 2.11ms | -0.68ms | -32.10% |
| p99 | 1.98ms | 2.25ms | -0.27ms | -11.89% |
| mean | 0.69ms | 1.04ms | -0.35ms | -33.57% |
| min | 0.40ms | 0.45ms | -0.05ms | -11.59% |
| max | 2.15ms | 2.25ms | -0.10ms | -4.40% |
| total | 20.82ms | 31.34ms | -10.52ms | -33.57% |

### comparePngBuffersFullDiff

# Perf Report — comparePngBuffersFullDiff.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 6.10ms |
| p95 | 7.92ms |
| p99 | 8.27ms |
| mean | 6.37ms |
| stdev | 0.81ms |
| min | 5.21ms |
| max | 8.37ms |
| total | 191.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 6.10ms | 7.15ms | -1.05ms | -14.65% |
| p95 | 7.92ms | 9.25ms | -1.33ms | -14.42% |
| p99 | 8.27ms | 9.53ms | -1.26ms | -13.24% |
| mean | 6.37ms | 7.25ms | -0.88ms | -12.20% |
| min | 5.21ms | 5.41ms | -0.19ms | -3.59% |
| max | 8.37ms | 9.54ms | -1.17ms | -12.23% |
| total | 191.07ms | 217.60ms | -26.54ms | -12.20% |

