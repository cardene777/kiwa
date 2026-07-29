# Perf Suite — streaming-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00023ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00045ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.0093ms | 0.02ms | 100ms | 0.00045ms | PASS | stable (p10 -5% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| high_throughput_producer (50 sendBatch record) | 0.02ms | 0.03ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.0078ms | 0.01ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.06ms | 200ms | PASS |
| high_throughput_producer (50 sendBatch record) | 0.10ms | 200ms | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.02ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | -25512 B | 0 B | 102400 B | yes | PASS |
| high_throughput_producer (50 sendBatch record) | -824 B | 0 B | 102400 B | yes | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 1000 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### event_pipeline (producer + 20 send + admin listTopics)

# Perf Report — event_pipeline (producer + 20 send + admin listTopics).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0093ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0030ms |
| min | 0.0093ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0093ms | 0.0097ms | -0.00045ms | -4.61% |
| p50 | 0.01ms | 0.01ms | -0.00042ms | -3.95% |
| p95 | 0.02ms | 0.01ms | +0.0037ms | +28.07% |
| p99 | 0.02ms | 0.01ms | +0.0049ms | +36.48% |
| mean | 0.01ms | 0.01ms | +0.00043ms | +3.92% |
| min | 0.0093ms | 0.0095ms | -0.00021ms | -2.20% |
| max | 0.02ms | 0.01ms | +0.0052ms | +38.53% |
| total | 0.17ms | 0.16ms | +0.0065ms | +3.92% |

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
| mean | 0.03ms |
| stdev | 0.0030ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00082ms | +3.92% |
| p50 | 0.02ms | 0.02ms | +0.00029ms | +1.19% |
| p95 | 0.03ms | 0.03ms | -0.0022ms | -6.81% |
| p99 | 0.03ms | 0.04ms | -0.0077ms | -19.46% |
| mean | 0.03ms | 0.03ms | -0.00033ms | -1.32% |
| min | 0.02ms | 0.02ms | +0.0016ms | +7.85% |
| max | 0.03ms | 0.04ms | -0.0091ms | -21.97% |
| total | 0.38ms | 0.38ms | -0.0050ms | -1.32% |

### consumer_subscribe_multi_topic (5 topic subscribe)

# Perf Report — consumer_subscribe_multi_topic (5 topic subscribe).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0078ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0027ms |
| min | 0.0063ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0078ms | 0.0068ms | +0.0010ms | +15.30% |
| p50 | 0.01ms | 0.01ms | +0.0000010ms | +0.01% |
| p95 | 0.01ms | 0.02ms | -0.0026ms | -15.74% |
| p99 | 0.02ms | 0.02ms | -0.00066ms | -3.75% |
| mean | 0.01ms | 0.01ms | +0.000039ms | +0.37% |
| min | 0.0063ms | 0.0058ms | +0.00054ms | +9.34% |
| max | 0.02ms | 0.02ms | -0.00017ms | -0.93% |
| total | 0.16ms | 0.16ms | +0.00058ms | +0.37% |

