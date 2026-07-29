# Perf Suite — streaming-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.0093ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| high_throughput_producer (50 sendBatch record) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.0075ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.05ms | 200ms | PASS |
| high_throughput_producer (50 sendBatch record) | 0.09ms | 200ms | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.02ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | -25696 B | 0 B | 102400 B | yes | PASS |
| high_throughput_producer (50 sendBatch record) | -424 B | 0 B | 102400 B | yes | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 1448 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### event_pipeline (producer + 20 send + admin listTopics)

# Perf Report — event_pipeline (producer + 20 send + admin listTopics).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0093ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0022ms |
| min | 0.0091ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0093ms | 0.0097ms | -0.00046ms | -4.70% |
| p50 | 0.01ms | 0.01ms | -0.00050ms | -4.73% |
| p95 | 0.01ms | 0.01ms | +0.0015ms | +11.50% |
| p99 | 0.02ms | 0.01ms | +0.0029ms | +21.43% |
| mean | 0.01ms | 0.01ms | +0.000056ms | +0.51% |
| min | 0.0091ms | 0.0095ms | -0.00038ms | -3.95% |
| max | 0.02ms | 0.01ms | +0.0033ms | +23.85% |
| total | 0.17ms | 0.16ms | +0.00083ms | +0.51% |

### high_throughput_producer (50 sendBatch record)

# Perf Report — high_throughput_producer (50 sendBatch record).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0032ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00013ms | -0.63% |
| p50 | 0.02ms | 0.02ms | -0.0012ms | -4.94% |
| p95 | 0.03ms | 0.03ms | -0.0041ms | -12.35% |
| p99 | 0.03ms | 0.04ms | -0.0071ms | -17.95% |
| mean | 0.02ms | 0.03ms | -0.0017ms | -6.62% |
| min | 0.02ms | 0.02ms | +0.00063ms | +3.10% |
| max | 0.03ms | 0.04ms | -0.0079ms | -19.06% |
| total | 0.36ms | 0.38ms | -0.03ms | -6.62% |

### consumer_subscribe_multi_topic (5 topic subscribe)

# Perf Report — consumer_subscribe_multi_topic (5 topic subscribe).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0075ms |
| p50 | 0.0099ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0029ms |
| min | 0.0069ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0075ms | 0.0068ms | +0.00069ms | +10.16% |
| p50 | 0.0099ms | 0.01ms | -0.00017ms | -1.65% |
| p95 | 0.02ms | 0.02ms | -0.0012ms | -7.29% |
| p99 | 0.02ms | 0.02ms | -0.000012ms | -0.07% |
| mean | 0.01ms | 0.01ms | +0.000067ms | +0.64% |
| min | 0.0069ms | 0.0058ms | +0.0011ms | +18.70% |
| max | 0.02ms | 0.02ms | +0.00029ms | +1.62% |
| total | 0.16ms | 0.16ms | +0.0010ms | +0.64% |

