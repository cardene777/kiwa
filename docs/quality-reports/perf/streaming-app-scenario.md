# Perf Suite — streaming-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3276%) 以上の悪化が必要) |
| high_throughput_producer (50 sendBatch record) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1689%) 以上の悪化が必要) |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3161%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.05ms | 200ms | PASS |
| high_throughput_producer (50 sendBatch record) | 0.11ms | 200ms | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.02ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | -17840 B | 0 B | 102400 B | yes | PASS |
| high_throughput_producer (50 sendBatch record) | 536 B | 0 B | 102400 B | yes | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 688 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### event_pipeline (producer + 20 send + admin listTopics)

# Perf Report — event_pipeline (producer + 20 send + admin listTopics).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +2.75% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -10.92% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -20.32% |
| mean | 0.01ms | 0.01ms | -0.00ms | -3.37% |
| min | 0.01ms | 0.01ms | +0.00ms | +4.93% |
| max | 0.01ms | 0.02ms | -0.00ms | -22.33% |
| total | 0.17ms | 0.17ms | -0.01ms | -3.37% |

### high_throughput_producer (50 sendBatch record)

# Perf Report — high_throughput_producer (50 sendBatch record).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +1.75% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -1.91% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -7.15% |
| mean | 0.02ms | 0.02ms | -0.00ms | -1.43% |
| min | 0.02ms | 0.02ms | -0.00ms | -0.21% |
| max | 0.03ms | 0.04ms | -0.00ms | -8.23% |
| total | 0.36ms | 0.36ms | -0.01ms | -1.43% |

### consumer_subscribe_multi_topic (5 topic subscribe)

# Perf Report — consumer_subscribe_multi_topic (5 topic subscribe).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +0.43% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -16.36% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -8.15% |
| mean | 0.01ms | 0.01ms | -0.00ms | -4.23% |
| min | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | -0.00ms | -6.21% |
| total | 0.15ms | 0.15ms | -0.01ms | -4.23% |

