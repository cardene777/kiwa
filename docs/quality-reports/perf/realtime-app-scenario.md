# Perf Suite — realtime-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.01ms | 0.03ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| presence_workload (trackPresence 10 users + untrack) | 0.01ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.0033ms | 0.0063ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | cpu | 0.08ms | 0.09ms | 0.01ms | 0.164 | 0.164 | 0.01ms | 0.01ms |
| presence_workload (trackPresence 10 users + untrack) | cpu | 0.08ms | 0.09ms | 0.01ms | 0.124 | 0.110 | 0.01ms | 0.0090ms |
| reconnect_resilience (5x connect/disconnect/reconnect) | cpu | 0.08ms | 0.10ms | 0.0033ms | 0.039 | 0.038 | 0.0033ms | 0.0032ms |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.07ms | 200ms | PASS |
| presence_workload (trackPresence 10 users + untrack) | 0.04ms | 200ms | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.03ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | -25232 B | -31464 B | 102400 B | yes | PASS |
| presence_workload (trackPresence 10 users + untrack) | -312 B | 0 B | 102400 B | yes | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 11248 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0070ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.30ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.969)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.000024ms | -0.18% |
| p50 | 0.02ms | 0.02ms | +0.0014ms | +8.17% |
| p95 | 0.03ms | 0.03ms | +0.00079ms | +2.72% |
| p99 | 0.03ms | 0.04ms | -0.000040ms | -0.11% |
| mean | 0.02ms | 0.02ms | +0.00015ms | +0.76% |
| min | 0.01ms | 0.01ms | -0.00032ms | -2.49% |
| max | 0.04ms | 0.04ms | -0.00025ms | -0.68% |
| total | 0.29ms | 0.29ms | +0.0022ms | +0.76% |

### presence_workload (trackPresence 10 users + untrack)

# Perf Report — presence_workload (trackPresence 10 users + untrack).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0023ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.988)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0090ms | +0.0011ms | +12.64% |
| p50 | 0.01ms | 0.0098ms | +0.0015ms | +15.19% |
| p95 | 0.02ms | 0.01ms | +0.0011ms | +7.46% |
| p99 | 0.02ms | 0.02ms | +0.0031ms | +20.57% |
| mean | 0.01ms | 0.01ms | +0.0010ms | +9.48% |
| min | 0.01ms | 0.0090ms | +0.0012ms | +12.98% |
| max | 0.02ms | 0.02ms | +0.0036ms | +23.77% |
| total | 0.18ms | 0.16ms | +0.02ms | +9.48% |

### reconnect_resilience (5x connect/disconnect/reconnect)

# Perf Report — reconnect_resilience (5x connect/disconnect/reconnect).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0033ms |
| p50 | 0.0036ms |
| p95 | 0.0063ms |
| p99 | 0.0078ms |
| mean | 0.0042ms |
| stdev | 0.0013ms |
| min | 0.0032ms |
| max | 0.0082ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.973)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0033ms | 0.0032ms | +0.000085ms | +2.68% |
| p50 | 0.0035ms | 0.0033ms | +0.00015ms | +4.64% |
| p95 | 0.0062ms | 0.0060ms | +0.00017ms | +2.86% |
| p99 | 0.0076ms | 0.0083ms | -0.00071ms | -8.53% |
| mean | 0.0040ms | 0.0039ms | +0.00019ms | +4.82% |
| min | 0.0031ms | 0.0030ms | +0.000082ms | +2.69% |
| max | 0.0079ms | 0.0089ms | -0.00093ms | -10.45% |
| total | 0.06ms | 0.06ms | +0.0028ms | +4.82% |

