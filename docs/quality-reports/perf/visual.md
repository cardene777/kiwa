# Perf Suite — visual

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| comparePngBuffersIdentical | 0.80ms | 50ms | PASS | improved — gate 対象外 (PNG の復号と比較が実行ごとに大きく動く (#1718)) |
| comparePngBuffersFullDiff | 10.22ms | 200ms | PASS | regressed — gate 対象外 (PNG の復号と比較が実行ごとに大きく動く (#1718)) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| comparePngBuffersIdentical | 1.85ms | 100ms | PASS |
| comparePngBuffersFullDiff | 29.47ms | 400ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| comparePngBuffersIdentical | 18328 B | 2499105 B | 8388608 B | yes | PASS |
| comparePngBuffersFullDiff | 38760 B | 14721818 B | 16777216 B | yes | PASS |

## Detailed serial reports

### comparePngBuffersIdentical

# Perf Report — comparePngBuffersIdentical.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.44ms |
| p95 | 0.80ms |
| p99 | 0.83ms |
| mean | 0.49ms |
| stdev | 0.14ms |
| min | 0.34ms |
| max | 0.83ms |
| total | 14.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.44ms | 0.67ms | -0.23ms | -33.98% |
| p95 | 0.80ms | 1.61ms | -0.81ms | -50.47% |
| p99 | 0.83ms | 1.96ms | -1.13ms | -57.72% |
| mean | 0.49ms | 0.79ms | -0.30ms | -37.85% |
| min | 0.34ms | 0.30ms | +0.04ms | +13.71% |
| max | 0.83ms | 2.00ms | -1.17ms | -58.27% |
| total | 14.79ms | 58.70ms | -43.91ms | -74.80% |

### comparePngBuffersFullDiff

# Perf Report — comparePngBuffersFullDiff.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 7.33ms |
| p95 | 10.22ms |
| p99 | 14.90ms |
| mean | 7.77ms |
| stdev | 1.87ms |
| min | 6.12ms |
| max | 16.39ms |
| total | 233.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 7.33ms | 6.16ms | +1.17ms | +19.04% |
| p95 | 10.22ms | 7.75ms | +2.47ms | +31.92% |
| p99 | 14.90ms | 8.10ms | +6.79ms | +83.82% |
| mean | 7.77ms | 6.22ms | +1.55ms | +24.84% |
| min | 6.12ms | 5.05ms | +1.07ms | +21.11% |
| max | 16.39ms | 8.12ms | +8.27ms | +101.76% |
| total | 233.12ms | 460.62ms | -227.50ms | -49.39% |

