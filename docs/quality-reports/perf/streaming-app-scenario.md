# Perf Suite — streaming-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.01ms | 0.02ms | 100ms | 0.0012ms | PASS | regressed — gate 無効 (regressionGate=false) |
| high_throughput_producer (50 sendBatch record) | 0.02ms | 0.40ms | 100ms | 0.0012ms | PASS | stable (p10 +16% (閾値未満)、 p95 +1110% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.0077ms | 0.02ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.07ms | 200ms | PASS |
| high_throughput_producer (50 sendBatch record) | 0.12ms | 200ms | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.09ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | -29544 B | 0 B | 102400 B | yes | PASS |
| high_throughput_producer (50 sendBatch record) | -10928 B | 0 B | 102400 B | yes | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | -720 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### event_pipeline (producer + 20 send + admin listTopics)

# Perf Report — event_pipeline (producer + 20 send + admin listTopics).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0026ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0097ms | +0.0045ms | +45.86% |
| p50 | 0.02ms | 0.01ms | +0.0052ms | +49.21% |
| p95 | 0.02ms | 0.01ms | +0.0085ms | +64.12% |
| p99 | 0.02ms | 0.01ms | +0.0083ms | +61.01% |
| mean | 0.02ms | 0.01ms | +0.0060ms | +54.27% |
| min | 0.01ms | 0.0095ms | +0.0042ms | +43.86% |
| max | 0.02ms | 0.01ms | +0.0082ms | +60.25% |
| total | 0.25ms | 0.16ms | +0.09ms | +54.27% |

### high_throughput_producer (50 sendBatch record)

# Perf Report — high_throughput_producer (50 sendBatch record).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.40ms |
| p99 | 0.74ms |
| mean | 0.10ms |
| stdev | 0.21ms |
| min | 0.02ms |
| max | 0.83ms |
| total | 1.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0033ms | +15.67% |
| p50 | 0.03ms | 0.02ms | +0.0082ms | +33.73% |
| p95 | 0.40ms | 0.03ms | +0.37ms | +1109.81% |
| p99 | 0.74ms | 0.04ms | +0.70ms | +1766.84% |
| mean | 0.10ms | 0.03ms | +0.07ms | +282.46% |
| min | 0.02ms | 0.02ms | +0.0030ms | +14.88% |
| max | 0.83ms | 0.04ms | +0.79ms | +1897.08% |
| total | 1.45ms | 0.38ms | +1.07ms | +282.46% |

### consumer_subscribe_multi_topic (5 topic subscribe)

# Perf Report — consumer_subscribe_multi_topic (5 topic subscribe).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0077ms |
| p50 | 0.0098ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0028ms |
| min | 0.0075ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.0068ms | +0.00093ms | +13.71% |
| p50 | 0.0098ms | 0.01ms | -0.00025ms | -2.47% |
| p95 | 0.02ms | 0.02ms | -0.0017ms | -10.04% |
| p99 | 0.02ms | 0.02ms | -0.00040ms | -2.29% |
| mean | 0.01ms | 0.01ms | +0.00017ms | +1.59% |
| min | 0.0075ms | 0.0058ms | +0.0017ms | +29.49% |
| max | 0.02ms | 0.02ms | -0.000084ms | -0.47% |
| total | 0.16ms | 0.16ms | +0.0025ms | +1.59% |

