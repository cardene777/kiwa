# Perf Suite — streaming-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.01ms | 0.02ms | 100ms | 0.00052ms | PASS | stable — gate 無効 (regressionGate=false) |
| high_throughput_producer (50 sendBatch record) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.0055ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | cpu | 0.08ms | 0.01ms | 0.130 | 0.116 | 0.01ms | 0.0098ms |
| high_throughput_producer (50 sendBatch record) | cpu | 0.08ms | 0.02ms | 0.263 | 0.243 | 0.02ms | 0.02ms |
| consumer_subscribe_multi_topic (5 topic subscribe) | cpu | 0.08ms | 0.0055ms | 0.067 | 0.071 | 0.0055ms | 0.0058ms |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.05ms | 200ms | PASS |
| high_throughput_producer (50 sendBatch record) | 0.10ms | 200ms | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.02ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | -33568 B | 0 B | 102400 B | yes | PASS |
| high_throughput_producer (50 sendBatch record) | 920 B | 0 B | 102400 B | yes | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 952 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0019ms |
| min | 0.0099ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0098ms | +0.00063ms | +6.36% |
| p50 | 0.01ms | 0.01ms | +0.0013ms | +12.51% |
| p95 | 0.02ms | 0.02ms | +0.00014ms | +0.89% |
| p99 | 0.02ms | 0.02ms | -0.00014ms | -0.83% |
| mean | 0.01ms | 0.01ms | +0.00092ms | +8.01% |
| min | 0.0099ms | 0.0097ms | +0.00017ms | +1.71% |
| max | 0.02ms | 0.02ms | -0.00021ms | -1.23% |
| total | 0.19ms | 0.17ms | +0.01ms | +8.01% |

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
| stdev | 0.0018ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0018ms | +9.15% |
| p50 | 0.02ms | 0.02ms | +0.00087ms | +3.98% |
| p95 | 0.03ms | 0.03ms | -0.000017ms | -0.06% |
| p99 | 0.03ms | 0.03ms | -0.0028ms | -9.02% |
| mean | 0.02ms | 0.02ms | +0.0010ms | +4.55% |
| min | 0.02ms | 0.02ms | +0.0016ms | +8.02% |
| max | 0.03ms | 0.03ms | -0.0035ms | -10.89% |
| total | 0.35ms | 0.34ms | +0.02ms | +4.55% |

### consumer_subscribe_multi_topic (5 topic subscribe)

# Perf Report — consumer_subscribe_multi_topic (5 topic subscribe).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0055ms |
| p50 | 0.0086ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0087ms |
| stdev | 0.0035ms |
| min | 0.0053ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0055ms | 0.0058ms | -0.00034ms | -5.86% |
| p50 | 0.0086ms | 0.01ms | -0.0019ms | -17.92% |
| p95 | 0.01ms | 0.03ms | -0.01ms | -48.62% |
| p99 | 0.02ms | 0.04ms | -0.03ms | -59.52% |
| mean | 0.0087ms | 0.01ms | -0.0038ms | -30.55% |
| min | 0.0053ms | 0.0058ms | -0.00046ms | -7.92% |
| max | 0.02ms | 0.05ms | -0.03ms | -61.04% |
| total | 0.13ms | 0.19ms | -0.06ms | -30.55% |

