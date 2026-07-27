# Perf Suite — streaming-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.02ms | 100ms | PASS | stable |
| high_throughput_producer (50 sendBatch record) | 0.03ms | 100ms | PASS | stable |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.06ms | 200ms | PASS |
| high_throughput_producer (50 sendBatch record) | 0.11ms | 200ms | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.03ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | -30424 B | 0 B | 102400 B | yes | PASS |
| high_throughput_producer (50 sendBatch record) | -80 B | 0 B | 102400 B | yes | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 1672 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### event_pipeline (producer + 20 send + admin listTopics)

# Perf Report — event_pipeline (producer + 20 send + admin listTopics).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +17.93% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +18.02% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +27.88% |
| mean | 0.01ms | 0.01ms | +0.00ms | +14.02% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.43% |
| max | 0.02ms | 0.01ms | +0.00ms | +30.33% |
| total | 0.19ms | 0.17ms | +0.02ms | +14.02% |

### high_throughput_producer (50 sendBatch record)

# Perf Report — high_throughput_producer (50 sendBatch record).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +3.11% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -10.23% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -25.67% |
| mean | 0.03ms | 0.02ms | +0.00ms | +2.45% |
| min | 0.02ms | 0.02ms | +0.00ms | +18.03% |
| max | 0.03ms | 0.04ms | -0.01ms | -28.71% |
| total | 0.38ms | 0.37ms | +0.01ms | +2.45% |

### consumer_subscribe_multi_topic (5 topic subscribe)

# Perf Report — consumer_subscribe_multi_topic (5 topic subscribe).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +15.98% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +31.47% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +21.17% |
| mean | 0.01ms | 0.01ms | +0.00ms | +13.06% |
| min | 0.01ms | 0.01ms | +0.00ms | +1.24% |
| max | 0.02ms | 0.02ms | +0.00ms | +19.08% |
| total | 0.16ms | 0.14ms | +0.02ms | +13.06% |

