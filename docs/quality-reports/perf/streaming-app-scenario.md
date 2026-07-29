# Perf Suite — streaming-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.0095ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (p10 -2% (閾値未満)、 p95 +39% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| high_throughput_producer (50 sendBatch record) | 0.02ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.0071ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.07ms | 200ms | PASS |
| high_throughput_producer (50 sendBatch record) | 0.09ms | 200ms | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.02ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | -17616 B | 0 B | 102400 B | yes | PASS |
| high_throughput_producer (50 sendBatch record) | -712 B | 0 B | 102400 B | yes | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 1000 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### event_pipeline (producer + 20 send + admin listTopics)

# Perf Report — event_pipeline (producer + 20 send + admin listTopics).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0095ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0036ms |
| min | 0.0095ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.0097ms | -0.00022ms | -2.31% |
| p50 | 0.01ms | 0.01ms | +0.00029ms | +2.75% |
| p95 | 0.02ms | 0.01ms | +0.0052ms | +39.34% |
| p99 | 0.02ms | 0.01ms | +0.0085ms | +63.03% |
| mean | 0.01ms | 0.01ms | +0.00080ms | +7.26% |
| min | 0.0095ms | 0.0095ms | -0.000042ms | -0.44% |
| max | 0.02ms | 0.01ms | +0.0094ms | +68.81% |
| total | 0.18ms | 0.16ms | +0.01ms | +7.26% |

### high_throughput_producer (50 sendBatch record)

# Perf Report — high_throughput_producer (50 sendBatch record).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0041ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0035ms | +16.81% |
| p50 | 0.03ms | 0.02ms | +0.0027ms | +10.90% |
| p95 | 0.04ms | 0.03ms | +0.0031ms | +9.36% |
| p99 | 0.04ms | 0.04ms | -0.0030ms | -7.49% |
| mean | 0.03ms | 0.03ms | +0.0030ms | +11.86% |
| min | 0.02ms | 0.02ms | +0.0039ms | +19.21% |
| max | 0.04ms | 0.04ms | -0.0045ms | -10.83% |
| total | 0.43ms | 0.38ms | +0.05ms | +11.86% |

### consumer_subscribe_multi_topic (5 topic subscribe)

# Perf Report — consumer_subscribe_multi_topic (5 topic subscribe).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0071ms |
| p50 | 0.0095ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.010ms |
| stdev | 0.0027ms |
| min | 0.0069ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0071ms | 0.0068ms | +0.00031ms | +4.53% |
| p50 | 0.0095ms | 0.01ms | -0.00054ms | -5.37% |
| p95 | 0.01ms | 0.02ms | -0.0027ms | -15.77% |
| p99 | 0.02ms | 0.02ms | -0.0018ms | -9.97% |
| mean | 0.010ms | 0.01ms | -0.00047ms | -4.51% |
| min | 0.0069ms | 0.0058ms | +0.0011ms | +19.42% |
| max | 0.02ms | 0.02ms | -0.0015ms | -8.61% |
| total | 0.15ms | 0.16ms | -0.0071ms | -4.51% |

