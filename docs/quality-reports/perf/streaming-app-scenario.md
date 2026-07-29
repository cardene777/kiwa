# Perf Suite — streaming-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.0095ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| high_throughput_producer (50 sendBatch record) | 0.02ms | 0.04ms | 100ms | 0.00050ms | PASS | stable (p10 +13% (閾値未満)、 p95 +26% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.0077ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | 0.06ms | 200ms | PASS |
| high_throughput_producer (50 sendBatch record) | 0.11ms | 200ms | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 0.02ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_pipeline (producer + 20 send + admin listTopics) | -26320 B | 0 B | 102400 B | yes | PASS |
| high_throughput_producer (50 sendBatch record) | 888 B | 0 B | 102400 B | yes | PASS |
| consumer_subscribe_multi_topic (5 topic subscribe) | 920 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0024ms |
| min | 0.0092ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.0097ms | -0.00027ms | -2.74% |
| p50 | 0.01ms | 0.01ms | +0.00054ms | +5.11% |
| p95 | 0.02ms | 0.01ms | +0.0023ms | +17.48% |
| p99 | 0.02ms | 0.01ms | +0.0043ms | +31.94% |
| mean | 0.01ms | 0.01ms | +0.00055ms | +4.98% |
| min | 0.0092ms | 0.0095ms | -0.00033ms | -3.52% |
| max | 0.02ms | 0.01ms | +0.0048ms | +35.47% |
| total | 0.17ms | 0.16ms | +0.0082ms | +4.98% |

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
| stdev | 0.0071ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0028ms | +13.06% |
| p50 | 0.03ms | 0.02ms | +0.0041ms | +16.69% |
| p95 | 0.04ms | 0.03ms | +0.0086ms | +26.05% |
| p99 | 0.04ms | 0.04ms | +0.0028ms | +7.07% |
| mean | 0.03ms | 0.03ms | +0.0049ms | +19.20% |
| min | 0.02ms | 0.02ms | +0.0035ms | +17.56% |
| max | 0.04ms | 0.04ms | +0.0014ms | +3.31% |
| total | 0.45ms | 0.38ms | +0.07ms | +19.20% |

### consumer_subscribe_multi_topic (5 topic subscribe)

# Perf Report — consumer_subscribe_multi_topic (5 topic subscribe).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0077ms |
| p50 | 0.0099ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0024ms |
| min | 0.0065ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.0068ms | +0.00092ms | +13.47% |
| p50 | 0.0099ms | 0.01ms | -0.00021ms | -2.06% |
| p95 | 0.01ms | 0.02ms | -0.0027ms | -16.14% |
| p99 | 0.02ms | 0.02ms | -0.0022ms | -12.30% |
| mean | 0.01ms | 0.01ms | -0.00020ms | -1.94% |
| min | 0.0065ms | 0.0058ms | +0.00067ms | +11.52% |
| max | 0.02ms | 0.02ms | -0.0020ms | -11.40% |
| total | 0.15ms | 0.16ms | -0.0030ms | -1.94% |

