# Perf Suite — streaming-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.02ms | 100ms | PASS | stable |
| high_throughput_producer (50 sendBatch record) | 0.03ms | 100ms | PASS | stable |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.06ms | 200ms | PASS |
| high_throughput_producer (50 sendBatch record) | 0.09ms | 200ms | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.02ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | -25848 B | 0 B | 102400 B | yes | PASS |
| high_throughput_producer (50 sendBatch record) | 768 B | 0 B | 102400 B | yes | PASS |
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
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +9.56% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +15.17% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +15.40% |
| mean | 0.01ms | 0.01ms | +0.00ms | +7.84% |
| min | 0.01ms | 0.01ms | +0.00ms | +2.64% |
| max | 0.02ms | 0.01ms | +0.00ms | +15.46% |
| total | 0.18ms | 0.17ms | +0.01ms | +7.84% |

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
| p50 | 0.02ms | 0.02ms | +0.00ms | +3.28% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -5.28% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -19.49% |
| mean | 0.03ms | 0.02ms | +0.00ms | +1.04% |
| min | 0.02ms | 0.02ms | +0.00ms | +0.84% |
| max | 0.03ms | 0.04ms | -0.01ms | -22.29% |
| total | 0.38ms | 0.37ms | +0.00ms | +1.04% |

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
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +7.30% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -0.58% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +4.62% |
| mean | 0.01ms | 0.01ms | +0.00ms | +0.71% |
| min | 0.01ms | 0.01ms | +0.00ms | +2.46% |
| max | 0.02ms | 0.02ms | +0.00ms | +5.67% |
| total | 0.14ms | 0.14ms | +0.00ms | +0.71% |

