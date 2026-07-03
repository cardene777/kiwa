# Perf Suite — dogfood-vercel-ai-rag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| embed | 0.01ms | 20ms | PASS | stable |
| retrieve | 0.01ms | 30ms | PASS | stable |
| answer | 9.18ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| embed | 0.05ms | 40ms | PASS |
| retrieve | 0.09ms | 60ms | PASS |
| answer | 9.36ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| embed | -5521448 B | -33423 B | 102400 B | PASS |
| retrieve | -5007312 B | 0 B | 102400 B | PASS |
| answer | -926528 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### embed

# Perf Report — embed.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -3.09% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -7.11% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -35.34% |
| mean | 0.01ms | 0.01ms | -0.00ms | -6.30% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.03ms | -0.01ms | -35.34% |
| total | 0.22ms | 0.23ms | -0.01ms | -6.30% |

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

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +10.38% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -15.08% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -11.46% |
| mean | 0.01ms | 0.01ms | -0.00ms | -1.50% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.70% |
| max | 0.02ms | 0.02ms | -0.00ms | -11.46% |
| total | 0.32ms | 0.32ms | -0.00ms | -1.50% |

### answer

# Perf Report — answer.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 9.10ms |
| p95 | 9.18ms |
| p99 | 9.20ms |
| mean | 8.99ms |
| stdev | 0.31ms |
| min | 8.00ms |
| max | 9.20ms |
| total | 359.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.10ms | 9.10ms | +0.00ms | +0.01% |
| p95 | 9.18ms | 9.18ms | +0.00ms | +0.01% |
| p99 | 9.20ms | 9.23ms | -0.04ms | -0.39% |
| mean | 8.99ms | 9.00ms | -0.01ms | -0.07% |
| min | 8.00ms | 8.08ms | -0.08ms | -0.95% |
| max | 9.20ms | 9.23ms | -0.04ms | -0.39% |
| total | 359.76ms | 360.01ms | -0.25ms | -0.07% |

