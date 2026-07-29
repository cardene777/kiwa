# Perf Suite — streaming-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3276%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| high_throughput_producer (50 sendBatch record) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1689%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3161%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.06ms | 200ms | PASS |
| high_throughput_producer (50 sendBatch record) | 0.46ms | 200ms | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.03ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | -1688 B | 0 B | 102400 B | yes | PASS |
| high_throughput_producer (50 sendBatch record) | 616 B | 0 B | 102400 B | yes | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | -14304 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +32.55% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +14.72% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +6.61% |
| mean | 0.01ms | 0.01ms | +0.00ms | +24.63% |
| min | 0.01ms | 0.01ms | +0.00ms | +40.36% |
| max | 0.02ms | 0.02ms | +0.00ms | +4.88% |
| total | 0.22ms | 0.17ms | +0.04ms | +24.63% |

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
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -4.55% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -10.15% |
| p99 | 0.03ms | 0.03ms | -0.01ms | -23.26% |
| mean | 0.02ms | 0.02ms | -0.00ms | -7.63% |
| min | 0.02ms | 0.02ms | -0.00ms | -10.19% |
| max | 0.03ms | 0.04ms | -0.01ms | -25.96% |
| total | 0.33ms | 0.36ms | -0.03ms | -7.63% |

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
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +13.73% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +27.34% |
| p99 | 0.02ms | 0.02ms | +0.01ms | +42.45% |
| mean | 0.01ms | 0.01ms | +0.00ms | +17.65% |
| min | 0.01ms | 0.01ms | +0.00ms | +4.77% |
| max | 0.02ms | 0.02ms | +0.01ms | +46.02% |
| total | 0.18ms | 0.15ms | +0.03ms | +17.65% |

