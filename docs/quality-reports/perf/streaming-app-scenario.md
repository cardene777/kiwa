# Perf Suite — streaming-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| high_throughput_producer (50 sendBatch record) | 0.04ms | 0.25ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.0073ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.05ms | 200ms | PASS |
| high_throughput_producer (50 sendBatch record) | 0.28ms | 200ms | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.03ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 13344 B | -16407 B | 102400 B | yes | PASS |
| high_throughput_producer (50 sendBatch record) | -8600 B | 0 B | 102400 B | yes | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 5088 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### event_pipeline (producer + 20 send + admin listTopics)

# Perf Report — event_pipeline (producer + 20 send + admin listTopics).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0016ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0097ms | +0.0026ms | +26.78% |
| p50 | 0.01ms | 0.01ms | +0.0035ms | +33.46% |
| p95 | 0.02ms | 0.01ms | +0.0038ms | +28.66% |
| p99 | 0.02ms | 0.01ms | +0.0037ms | +27.26% |
| mean | 0.01ms | 0.01ms | +0.0029ms | +26.62% |
| min | 0.01ms | 0.0095ms | +0.0025ms | +26.32% |
| max | 0.02ms | 0.01ms | +0.0037ms | +26.91% |
| total | 0.21ms | 0.16ms | +0.04ms | +26.62% |

### high_throughput_producer (50 sendBatch record)

# Perf Report — high_throughput_producer (50 sendBatch record).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.25ms |
| p99 | 0.40ms |
| mean | 0.08ms |
| stdev | 0.10ms |
| min | 0.04ms |
| max | 0.44ms |
| total | 1.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.02ms | +0.02ms | +99.13% |
| p50 | 0.04ms | 0.02ms | +0.02ms | +79.73% |
| p95 | 0.25ms | 0.03ms | +0.22ms | +672.03% |
| p99 | 0.40ms | 0.04ms | +0.36ms | +903.80% |
| mean | 0.08ms | 0.03ms | +0.05ms | +211.30% |
| min | 0.04ms | 0.02ms | +0.02ms | +103.92% |
| max | 0.44ms | 0.04ms | +0.39ms | +949.74% |
| total | 1.18ms | 0.38ms | +0.80ms | +211.30% |

### consumer_subscribe_multi_topic (5 topic subscribe)

# Perf Report — consumer_subscribe_multi_topic (5 topic subscribe).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0073ms |
| p50 | 0.0096ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0027ms |
| min | 0.0072ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0073ms | 0.0068ms | +0.00053ms | +7.84% |
| p50 | 0.0096ms | 0.01ms | -0.00046ms | -4.54% |
| p95 | 0.01ms | 0.02ms | -0.0024ms | -14.13% |
| p99 | 0.02ms | 0.02ms | -0.0014ms | -8.15% |
| mean | 0.01ms | 0.01ms | -0.00037ms | -3.53% |
| min | 0.0072ms | 0.0058ms | +0.0014ms | +23.72% |
| max | 0.02ms | 0.02ms | -0.0012ms | -6.74% |
| total | 0.15ms | 0.16ms | -0.0055ms | -3.53% |

