# Perf Suite — dogfood-vercel-ai-rag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| embed | 0.01ms | 20ms | PASS | n/a (baseline seeded) |
| retrieve | 0.01ms | 30ms | PASS | n/a (baseline seeded) |
| answer | 9.18ms | 100ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| embed | 0.05ms | 40ms | PASS |
| retrieve | 0.09ms | 60ms | PASS |
| answer | 9.36ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| embed | -5591448 B | -5467 B | 102400 B | PASS |
| retrieve | -4977304 B | 0 B | 102400 B | PASS |
| answer | -933584 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### embed

# Perf Report — embed.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.23ms |

### retrieve

# Perf Report — retrieve.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.32ms |

### answer

# Perf Report — answer.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 9.10ms |
| p95 | 9.18ms |
| p99 | 9.23ms |
| mean | 9.00ms |
| stdev | 0.28ms |
| min | 8.08ms |
| max | 9.23ms |
| total | 360.01ms |

