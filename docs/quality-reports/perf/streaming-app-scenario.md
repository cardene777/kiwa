# Perf Suite — streaming-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00022ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00045ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.0096ms | 0.02ms | 100ms | 0.00045ms | PASS | stable (p10 -1% (閾値未満)、 p95 +20% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| high_throughput_producer (50 sendBatch record) | 0.02ms | 0.03ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.0071ms | 0.01ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.06ms | 200ms | PASS |
| high_throughput_producer (50 sendBatch record) | 0.09ms | 200ms | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.02ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | -24904 B | 0 B | 102400 B | yes | PASS |
| high_throughput_producer (50 sendBatch record) | -504 B | 0 B | 102400 B | yes | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 1448 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### event_pipeline (producer + 20 send + admin listTopics)

# Perf Report — event_pipeline (producer + 20 send + admin listTopics).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0096ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0023ms |
| min | 0.0093ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0096ms | 0.0097ms | -0.00012ms | -1.28% |
| p50 | 0.01ms | 0.01ms | +0.0011ms | +10.23% |
| p95 | 0.02ms | 0.01ms | +0.0027ms | +20.36% |
| p99 | 0.02ms | 0.01ms | +0.0027ms | +19.97% |
| mean | 0.01ms | 0.01ms | +0.0014ms | +13.15% |
| min | 0.0093ms | 0.0095ms | -0.00021ms | -2.19% |
| max | 0.02ms | 0.01ms | +0.0027ms | +19.88% |
| total | 0.19ms | 0.16ms | +0.02ms | +13.15% |

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
| stdev | 0.0028ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.000033ms | -0.16% |
| p50 | 0.02ms | 0.02ms | -0.0010ms | -4.09% |
| p95 | 0.03ms | 0.03ms | -0.0036ms | -10.97% |
| p99 | 0.03ms | 0.04ms | -0.0097ms | -24.25% |
| mean | 0.02ms | 0.03ms | -0.0017ms | -6.52% |
| min | 0.02ms | 0.02ms | +0.00046ms | +2.27% |
| max | 0.03ms | 0.04ms | -0.01ms | -26.88% |
| total | 0.36ms | 0.38ms | -0.02ms | -6.52% |

### consumer_subscribe_multi_topic (5 topic subscribe)

# Perf Report — consumer_subscribe_multi_topic (5 topic subscribe).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0071ms |
| p50 | 0.0097ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0099ms |
| stdev | 0.0024ms |
| min | 0.0067ms |
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0071ms | 0.0068ms | +0.00028ms | +4.16% |
| p50 | 0.0097ms | 0.01ms | -0.00037ms | -3.71% |
| p95 | 0.01ms | 0.02ms | -0.0035ms | -20.73% |
| p99 | 0.01ms | 0.02ms | -0.0031ms | -17.32% |
| mean | 0.0099ms | 0.01ms | -0.00054ms | -5.18% |
| min | 0.0067ms | 0.0058ms | +0.00096ms | +16.54% |
| max | 0.01ms | 0.02ms | -0.0030ms | -16.52% |
| total | 0.15ms | 0.16ms | -0.0081ms | -5.18% |

