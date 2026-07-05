# Perf Suite — e2e

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| fetchOverLoopback | 0.87ms | 20ms | PASS | regressed |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchOverLoopback | 1.51ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| fetchOverLoopback | 3835912 B | 6016 B | 102400 B | PASS |

## Detailed serial reports

### fetchOverLoopback

# Perf Report — fetchOverLoopback.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.25ms |
| p95 | 0.87ms |
| p99 | 1.10ms |
| mean | 0.38ms |
| stdev | 0.27ms |
| min | 0.16ms |
| max | 1.56ms |
| total | 38.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.25ms | 0.19ms | +0.06ms | +34.17% |
| p95 | 0.87ms | 0.49ms | +0.37ms | +75.70% |
| p99 | 1.10ms | 0.84ms | +0.25ms | +29.88% |
| mean | 0.38ms | 0.24ms | +0.14ms | +58.67% |
| min | 0.16ms | 0.13ms | +0.02ms | +15.56% |
| max | 1.56ms | 0.88ms | +0.68ms | +78.14% |
| total | 38.35ms | 24.17ms | +14.18ms | +58.67% |

