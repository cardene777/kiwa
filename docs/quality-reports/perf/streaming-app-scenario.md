# Perf Suite — streaming-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.01ms | 0.02ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| high_throughput_producer (50 sendBatch record) | 0.02ms | 0.03ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.0060ms | 0.02ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | cpu | 0.09ms | 0.09ms | 0.01ms | 0.124 | 0.117 | 0.01ms | 0.0095ms |
| high_throughput_producer (50 sendBatch record) | cpu | 0.09ms | 0.10ms | 0.02ms | 0.251 | 0.239 | 0.02ms | 0.02ms |
| consumer_subscribe_multi_topic (5 topic subscribe) | cpu | 0.09ms | 0.09ms | 0.0060ms | 0.066 | 0.074 | 0.0053ms | 0.0060ms |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.06ms | 200ms | PASS |
| high_throughput_producer (50 sendBatch record) | 0.14ms | 200ms | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.02ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | -33040 B | 0 B | 102400 B | yes | PASS |
| high_throughput_producer (50 sendBatch record) | -312 B | 0 B | 102400 B | yes | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 1480 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0025ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.895)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0095ms | +0.00060ms | +6.27% |
| p50 | 0.01ms | 0.01ms | +0.00088ms | +7.37% |
| p95 | 0.02ms | 0.02ms | +0.000033ms | +0.21% |
| p99 | 0.02ms | 0.02ms | +0.00076ms | +4.67% |
| mean | 0.01ms | 0.01ms | +0.00085ms | +7.13% |
| min | 0.010ms | 0.0095ms | +0.00046ms | +4.85% |
| max | 0.02ms | 0.02ms | +0.00094ms | +5.76% |
| total | 0.19ms | 0.18ms | +0.01ms | +7.13% |

### high_throughput_producer (50 sendBatch record)

# Perf Report — high_throughput_producer (50 sendBatch record).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0043ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.38ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.891)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00092ms | +4.84% |
| p50 | 0.02ms | 0.02ms | +0.00041ms | +1.98% |
| p95 | 0.03ms | 0.03ms | +0.0012ms | +4.44% |
| p99 | 0.03ms | 0.03ms | +0.0060ms | +21.41% |
| mean | 0.02ms | 0.02ms | +0.00074ms | +3.41% |
| min | 0.02ms | 0.02ms | +0.0011ms | +6.10% |
| max | 0.04ms | 0.03ms | +0.0072ms | +25.54% |
| total | 0.34ms | 0.33ms | +0.01ms | +3.41% |

### consumer_subscribe_multi_topic (5 topic subscribe)

# Perf Report — consumer_subscribe_multi_topic (5 topic subscribe).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0060ms |
| p50 | 0.0090ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0096ms |
| stdev | 0.0037ms |
| min | 0.0058ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.894)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0053ms | 0.0060ms | -0.00063ms | -10.56% |
| p50 | 0.0081ms | 0.0083ms | -0.00025ms | -2.97% |
| p95 | 0.01ms | 0.01ms | -0.000097ms | -0.70% |
| p99 | 0.01ms | 0.02ms | -0.00080ms | -5.16% |
| mean | 0.0086ms | 0.0089ms | -0.00029ms | -3.24% |
| min | 0.0052ms | 0.0053ms | -0.00012ms | -2.17% |
| max | 0.01ms | 0.02ms | -0.00098ms | -6.12% |
| total | 0.13ms | 0.13ms | -0.0043ms | -3.24% |

