# Perf Suite — streaming-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.02ms | 100ms | PASS | improved |
| high_throughput_producer (50 sendBatch record) | 0.03ms | 100ms | PASS | improved |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.01ms | 100ms | PASS | improved |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.07ms | 200ms | PASS |
| high_throughput_producer (50 sendBatch record) | 0.27ms | 200ms | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.02ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 843080 B | 0 B | 102400 B | PASS |
| high_throughput_producer (50 sendBatch record) | 1170304 B | 0 B | 102400 B | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 247992 B | 0 B | 102400 B | PASS |

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
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.01ms | -56.52% |
| p95 | 0.02ms | 0.03ms | -0.02ms | -54.62% |
| p99 | 0.02ms | 0.03ms | -0.02ms | -49.75% |
| mean | 0.01ms | 0.03ms | -0.02ms | -57.32% |
| min | 0.01ms | 0.02ms | -0.01ms | -61.41% |
| max | 0.02ms | 0.03ms | -0.02ms | -48.55% |
| total | 0.17ms | 0.40ms | -0.23ms | -57.32% |

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
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.04ms | -0.02ms | -45.87% |
| p95 | 0.03ms | 0.16ms | -0.13ms | -81.95% |
| p99 | 0.03ms | 0.25ms | -0.21ms | -87.16% |
| mean | 0.02ms | 0.06ms | -0.04ms | -64.09% |
| min | 0.02ms | 0.02ms | -0.00ms | -17.78% |
| max | 0.03ms | 0.27ms | -0.24ms | -87.92% |
| total | 0.32ms | 0.89ms | -0.57ms | -64.09% |

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
| p50 | 0.01ms | 0.03ms | -0.02ms | -65.79% |
| p95 | 0.01ms | 0.10ms | -0.09ms | -87.19% |
| p99 | 0.02ms | 0.22ms | -0.21ms | -93.20% |
| mean | 0.01ms | 0.04ms | -0.03ms | -76.50% |
| min | 0.01ms | 0.02ms | -0.01ms | -61.75% |
| max | 0.02ms | 0.25ms | -0.24ms | -93.81% |
| total | 0.15ms | 0.62ms | -0.47ms | -76.50% |

