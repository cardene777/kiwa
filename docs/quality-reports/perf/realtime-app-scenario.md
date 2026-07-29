# Perf Suite — realtime-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.01ms | 0.03ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| presence_workload (trackPresence 10 users + untrack) | 0.0096ms | 0.01ms | 100ms | 0.00052ms | PASS | stable — gate 無効 (regressionGate=false) |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.0031ms | 0.0052ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | cpu | 0.08ms | 0.01ms | 0.158 | 0.195 | 0.01ms | 0.02ms |
| presence_workload (trackPresence 10 users + untrack) | cpu | 0.08ms | 0.0096ms | 0.120 | 0.123 | 0.010ms | 0.01ms |
| reconnect_resilience (5x connect/disconnect/reconnect) | cpu | 0.08ms | 0.0031ms | 0.039 | 0.039 | 0.0032ms | 0.0032ms |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.07ms | 200ms | PASS |
| presence_workload (trackPresence 10 users + untrack) | 0.04ms | 200ms | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.02ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | -24720 B | 0 B | 102400 B | yes | PASS |
| presence_workload (trackPresence 10 users + untrack) | 152 B | 0 B | 102400 B | yes | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 11152 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_room_broadcast (subscribe + 20 publish)

# Perf Report — chat_room_broadcast (subscribe + 20 publish).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0063ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0032ms | -20.16% |
| p50 | 0.02ms | 0.02ms | -0.00050ms | -2.72% |
| p95 | 0.03ms | 0.03ms | +0.00086ms | +3.13% |
| p99 | 0.03ms | 0.03ms | +0.00091ms | +2.76% |
| mean | 0.02ms | 0.02ms | -0.0015ms | -7.54% |
| min | 0.01ms | 0.01ms | -0.0023ms | -15.28% |
| max | 0.04ms | 0.03ms | +0.00092ms | +2.69% |
| total | 0.27ms | 0.30ms | -0.02ms | -7.54% |

### presence_workload (trackPresence 10 users + untrack)

# Perf Report — presence_workload (trackPresence 10 users + untrack).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0096ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0018ms |
| min | 0.0095ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0096ms | 0.01ms | -0.00063ms | -6.11% |
| p50 | 0.01ms | 0.01ms | -0.00017ms | -1.57% |
| p95 | 0.01ms | 0.01ms | -0.000025ms | -0.18% |
| p99 | 0.02ms | 0.02ms | +0.00016ms | +1.05% |
| mean | 0.01ms | 0.01ms | -0.00050ms | -4.32% |
| min | 0.0095ms | 0.01ms | -0.00058ms | -5.76% |
| max | 0.02ms | 0.02ms | +0.00021ms | +1.32% |
| total | 0.17ms | 0.17ms | -0.0075ms | -4.32% |

### reconnect_resilience (5x connect/disconnect/reconnect)

# Perf Report — reconnect_resilience (5x connect/disconnect/reconnect).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0031ms |
| p50 | 0.0032ms |
| p95 | 0.0052ms |
| p99 | 0.0068ms |
| mean | 0.0036ms |
| stdev | 0.0010ms |
| min | 0.0031ms |
| max | 0.0072ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0031ms | 0.0032ms | -0.00012ms | -3.85% |
| p50 | 0.0032ms | 0.0035ms | -0.00029ms | -8.24% |
| p95 | 0.0052ms | 0.0092ms | -0.0040ms | -43.76% |
| p99 | 0.0068ms | 0.01ms | -0.0045ms | -39.85% |
| mean | 0.0036ms | 0.0044ms | -0.00086ms | -19.24% |
| min | 0.0031ms | 0.0032ms | -0.00012ms | -3.85% |
| max | 0.0072ms | 0.01ms | -0.0046ms | -39.09% |
| total | 0.05ms | 0.07ms | -0.01ms | -19.24% |

