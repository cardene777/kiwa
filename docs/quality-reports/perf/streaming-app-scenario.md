# Perf Suite — streaming-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.01ms | 100ms | PASS | stable |
| high_throughput_producer (50 sendBatch record) | 0.03ms | 100ms | PASS | stable |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.16ms | 200ms | PASS |
| high_throughput_producer (50 sendBatch record) | 0.10ms | 200ms | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.02ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | -13176 B | 0 B | 102400 B | yes | PASS |
| high_throughput_producer (50 sendBatch record) | -14672 B | 0 B | 102400 B | yes | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 2120 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +9.56% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +4.23% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +3.88% |
| mean | 0.01ms | 0.01ms | +0.00ms | +5.41% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.65% |
| max | 0.01ms | 0.01ms | +0.00ms | +3.79% |
| total | 0.18ms | 0.17ms | +0.01ms | +5.41% |

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
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +2.76% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -1.86% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -18.68% |
| mean | 0.03ms | 0.02ms | +0.00ms | +4.88% |
| min | 0.02ms | 0.02ms | +0.00ms | +18.45% |
| max | 0.03ms | 0.04ms | -0.01ms | -21.99% |
| total | 0.39ms | 0.37ms | +0.02ms | +4.88% |

### consumer_subscribe_multi_topic (5 topic subscribe)

# Perf Report — consumer_subscribe_multi_topic (5 topic subscribe).serial

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
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +2.74% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -0.16% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -5.38% |
| mean | 0.01ms | 0.01ms | +0.00ms | +1.64% |
| min | 0.01ms | 0.01ms | +0.00ms | +1.24% |
| max | 0.02ms | 0.02ms | -0.00ms | -6.44% |
| total | 0.14ms | 0.14ms | +0.00ms | +1.64% |

