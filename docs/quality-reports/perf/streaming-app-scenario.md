# Perf Suite — streaming-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.02ms | 0.09ms | 100ms | 0.00078ms | PASS | regressed — gate 無効 (regressionGate=false) |
| high_throughput_producer (50 sendBatch record) | 0.02ms | 0.04ms | 100ms | 0.00096ms | PASS | improved — gate 無効 (regressionGate=false) |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.0063ms | 0.02ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | cpu | 0.12ms | 0.24ms | 0.02ms | 0.200 | 0.117 | n/a | 20.0% | 0.02ms | 0.0095ms |
| high_throughput_producer (50 sendBatch record) | cpu | 0.10ms | 0.11ms | 0.02ms | 0.157 | 0.239 | n/a | 20.0% | 0.01ms | 0.02ms |
| consumer_subscribe_multi_topic (5 topic subscribe) | cpu | 0.09ms | 0.10ms | 0.0063ms | 0.066 | 0.074 | n/a | 20.0% | 0.0054ms | 0.0060ms |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.11ms | 200ms | PASS |
| high_throughput_producer (50 sendBatch record) | 0.09ms | 200ms | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.02ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | -21672 B | -16831 B | 102400 B | yes | 18 (3 + 15) | PASS |
| high_throughput_producer (50 sendBatch record) | -32632 B | 0 B | 102400 B | yes | 18 (3 + 15) | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | -344 B | 0 B | 102400 B | yes | 18 (3 + 15) | PASS |

## Detailed serial reports

### event_pipeline (producer + 20 send + admin listTopics)

# Perf Report — event_pipeline (producer + 20 send + admin listTopics).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.09ms |
| p99 | 0.10ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.11ms |
| total | 0.63ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.672)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.0095ms | +0.0068ms | +71.67% |
| p50 | 0.02ms | 0.01ms | +0.01ms | +89.72% |
| p95 | 0.06ms | 0.02ms | +0.05ms | +292.89% |
| p99 | 0.07ms | 0.02ms | +0.05ms | +330.81% |
| mean | 0.03ms | 0.01ms | +0.02ms | +138.02% |
| min | 0.02ms | 0.0095ms | +0.0067ms | +70.53% |
| max | 0.07ms | 0.02ms | +0.06ms | +340.10% |
| total | 0.43ms | 0.18ms | +0.25ms | +138.02% |

### high_throughput_producer (50 sendBatch record)

# Perf Report — high_throughput_producer (50 sendBatch record).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.07ms |
| total | 0.33ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.822)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0065ms | -34.24% |
| p50 | 0.01ms | 0.02ms | -0.0062ms | -29.83% |
| p95 | 0.03ms | 0.03ms | +0.0048ms | +17.57% |
| p99 | 0.05ms | 0.03ms | +0.03ms | +89.68% |
| mean | 0.02ms | 0.02ms | -0.0038ms | -17.52% |
| min | 0.01ms | 0.02ms | -0.0063ms | -33.65% |
| max | 0.06ms | 0.03ms | +0.03ms | +107.22% |
| total | 0.27ms | 0.33ms | -0.06ms | -17.52% |

### consumer_subscribe_multi_topic (5 topic subscribe)

# Perf Report — consumer_subscribe_multi_topic (5 topic subscribe).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0063ms |
| p50 | 0.0096ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0040ms |
| min | 0.0061ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.858)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0054ms | 0.0060ms | -0.00059ms | -9.96% |
| p50 | 0.0083ms | 0.0083ms | -0.000072ms | -0.87% |
| p95 | 0.01ms | 0.01ms | +0.00012ms | +0.86% |
| p99 | 0.02ms | 0.02ms | -0.00033ms | -2.10% |
| mean | 0.0087ms | 0.0089ms | -0.00019ms | -2.08% |
| min | 0.0052ms | 0.0053ms | -0.00011ms | -2.10% |
| max | 0.02ms | 0.02ms | -0.00044ms | -2.74% |
| total | 0.13ms | 0.13ms | -0.0028ms | -2.08% |

