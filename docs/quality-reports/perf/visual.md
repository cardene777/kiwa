# Perf Suite — visual

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| comparePngBuffersIdentical | 2.76ms | 50ms | PASS | regressed — gate 無効 (regressionGate=false) |
| comparePngBuffersFullDiff | 11.13ms | 200ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| comparePngBuffersIdentical | 3.04ms | 100ms | PASS |
| comparePngBuffersFullDiff | 33.34ms | 400ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| comparePngBuffersIdentical | 17248 B | 811644 B | 8388608 B | yes | PASS |
| comparePngBuffersFullDiff | 34448 B | 2042162 B | 16777216 B | yes | PASS |

## Detailed serial reports

### comparePngBuffersIdentical

# Perf Report — comparePngBuffersIdentical.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.89ms |
| p95 | 2.76ms |
| p99 | 3.05ms |
| mean | 1.24ms |
| stdev | 0.76ms |
| min | 0.47ms |
| max | 3.15ms |
| total | 37.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.89ms | 0.67ms | +0.23ms | +33.86% |
| p95 | 2.76ms | 1.61ms | +1.15ms | +71.46% |
| p99 | 3.05ms | 1.96ms | +1.09ms | +55.43% |
| mean | 1.24ms | 0.79ms | +0.45ms | +56.16% |
| min | 0.47ms | 0.30ms | +0.18ms | +60.54% |
| max | 3.15ms | 2.00ms | +1.15ms | +57.59% |
| total | 37.16ms | 58.70ms | -21.54ms | -36.69% |

### comparePngBuffersFullDiff

# Perf Report — comparePngBuffersFullDiff.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 8.76ms |
| p95 | 11.13ms |
| p99 | 12.83ms |
| mean | 9.07ms |
| stdev | 1.43ms |
| min | 6.89ms |
| max | 13.42ms |
| total | 272.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 8.76ms | 6.16ms | +2.60ms | +42.28% |
| p95 | 11.13ms | 7.75ms | +3.38ms | +43.58% |
| p99 | 12.83ms | 8.10ms | +4.73ms | +58.32% |
| mean | 9.07ms | 6.22ms | +2.84ms | +45.68% |
| min | 6.89ms | 5.05ms | +1.84ms | +36.37% |
| max | 13.42ms | 8.12ms | +5.30ms | +65.23% |
| total | 272.04ms | 460.62ms | -188.58ms | -40.94% |

