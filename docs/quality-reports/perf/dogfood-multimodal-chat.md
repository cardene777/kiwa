# Perf Suite — dogfood-multimodal-chat

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| describeImage | 9.13ms | 30ms | PASS | n/a (baseline seeded) |
| streamDescribeImage | 16.34ms | 50ms | PASS | n/a (baseline seeded) |
| compareImages | 9.23ms | 40ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| describeImage | 9.21ms | 60ms | PASS |
| streamDescribeImage | 17.52ms | 100ms | PASS |
| compareImages | 9.55ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| describeImage | 2072632 B | 0 B | 102400 B | PASS |
| streamDescribeImage | 3032408 B | 0 B | 102400 B | PASS |
| compareImages | -432048 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### describeImage

# Perf Report — describeImage.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p50 | 9.07ms |
| p95 | 9.13ms |
| p99 | 9.17ms |
| mean | 8.97ms |
| stdev | 0.31ms |
| min | 7.94ms |
| max | 9.17ms |
| total | 538.16ms |

### streamDescribeImage

# Perf Report — streamDescribeImage.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p50 | 16.15ms |
| p95 | 16.34ms |
| p99 | 18.19ms |
| mean | 15.98ms |
| stdev | 0.64ms |
| min | 13.86ms |
| max | 18.19ms |
| total | 958.84ms |

### compareImages

# Perf Report — compareImages.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p50 | 9.09ms |
| p95 | 9.23ms |
| p99 | 11.55ms |
| mean | 9.03ms |
| stdev | 0.48ms |
| min | 7.60ms |
| max | 11.55ms |
| total | 541.72ms |

