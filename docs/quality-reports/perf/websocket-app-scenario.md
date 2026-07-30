# Perf Suite — websocket-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.0067ms | 0.02ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.0053ms | 0.0082ms | 100ms | 0.00046ms | PASS | regressed — gate 無効 (regressionGate=false) |
| binary_frame_batch (5 encode + parse round-trip) | 0.0024ms | 0.0043ms | 100ms | 0.00045ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| room_registry_batch (5 room join + broadcast + leave) | 0.0043ms | 0.02ms | 100ms | 0.00046ms | PASS | stable (換算後 p10 +6% (閾値未満)、 p95 +112% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.0013ms | 0.0035ms | 100ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | cpu | 0.09ms | 0.11ms | 0.0067ms | 0.075 | 0.071 | 0.0060ms | 0.0057ms |
| broadcast_batch (5 rooms x 3 clients broadcast) | cpu | 0.09ms | 0.09ms | 0.0053ms | 0.059 | 0.046 | 0.0049ms | 0.0037ms |
| binary_frame_batch (5 encode + parse round-trip) | cpu | 0.09ms | 0.09ms | 0.0024ms | 0.027 | 0.027 | 0.0021ms | 0.0022ms |
| room_registry_batch (5 room join + broadcast + leave) | cpu | 0.09ms | 0.10ms | 0.0043ms | 0.048 | 0.045 | 0.0040ms | 0.0037ms |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | cpu | 0.09ms | 0.10ms | 0.0013ms | 0.014 | 0.014 | 0.0011ms | 0.0011ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.07ms | 200ms | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.04ms | 200ms | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 0.01ms | 200ms | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 0.12ms | 200ms | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 10600 B | 0 B | 102400 B | yes | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 5272 B | 0 B | 102400 B | yes | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 664 B | 0 B | 102400 B | yes | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 10544 B | 0 B | 102400 B | yes | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 17272 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_room_workflow (10 send across 4 providers)

# Perf Report — chat_room_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0067ms |
| p50 | 0.0074ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0095ms |
| stdev | 0.0062ms |
| min | 0.0067ms |
| max | 0.03ms |
| total | 0.19ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.892)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0057ms | +0.00032ms | +5.58% |
| p50 | 0.0066ms | 0.0058ms | +0.00077ms | +13.17% |
| p95 | 0.02ms | 0.02ms | +0.0030ms | +19.53% |
| p99 | 0.03ms | 0.02ms | +0.0099ms | +59.78% |
| mean | 0.0085ms | 0.0071ms | +0.0014ms | +20.26% |
| min | 0.0059ms | 0.0056ms | +0.00032ms | +5.72% |
| max | 0.03ms | 0.02ms | +0.01ms | +68.89% |
| total | 0.17ms | 0.14ms | +0.03ms | +20.26% |

### broadcast_batch (5 rooms x 3 clients broadcast)

# Perf Report — broadcast_batch (5 rooms x 3 clients broadcast).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0053ms |
| p50 | 0.0066ms |
| p95 | 0.0082ms |
| p99 | 0.0085ms |
| mean | 0.0067ms |
| stdev | 0.0010ms |
| min | 0.0051ms |
| max | 0.0086ms |
| total | 0.13ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.923)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0049ms | 0.0037ms | +0.0011ms | +30.21% |
| p50 | 0.0061ms | 0.0039ms | +0.0021ms | +54.36% |
| p95 | 0.0076ms | 0.0049ms | +0.0027ms | +55.65% |
| p99 | 0.0079ms | 0.0056ms | +0.0023ms | +40.63% |
| mean | 0.0062ms | 0.0042ms | +0.0020ms | +47.79% |
| min | 0.0047ms | 0.0037ms | +0.00098ms | +26.54% |
| max | 0.0080ms | 0.0058ms | +0.0022ms | +37.46% |
| total | 0.12ms | 0.08ms | +0.04ms | +47.79% |

### binary_frame_batch (5 encode + parse round-trip)

# Perf Report — binary_frame_batch (5 encode + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0024ms |
| p50 | 0.0024ms |
| p95 | 0.0043ms |
| p99 | 0.0053ms |
| mean | 0.0027ms |
| stdev | 0.00081ms |
| min | 0.0023ms |
| max | 0.0055ms |
| total | 0.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.901)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0022ms | -0.000030ms | -1.37% |
| p50 | 0.0022ms | 0.0022ms | -0.000052ms | -2.34% |
| p95 | 0.0038ms | 0.0031ms | +0.00076ms | +24.51% |
| p99 | 0.0047ms | 0.01ms | -0.0067ms | -58.65% |
| mean | 0.0024ms | 0.0028ms | -0.00037ms | -13.15% |
| min | 0.0021ms | 0.0021ms | -0.000023ms | -1.07% |
| max | 0.0050ms | 0.01ms | -0.0086ms | -63.40% |
| total | 0.05ms | 0.06ms | -0.0074ms | -13.15% |

### room_registry_batch (5 room join + broadcast + leave)

# Perf Report — room_registry_batch (5 room join + broadcast + leave).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0043ms |
| p50 | 0.0054ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0081ms |
| stdev | 0.0071ms |
| min | 0.0043ms |
| max | 0.03ms |
| total | 0.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.922)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0037ms | +0.00021ms | +5.62% |
| p50 | 0.0050ms | 0.0039ms | +0.0010ms | +26.33% |
| p95 | 0.02ms | 0.0085ms | +0.0095ms | +111.82% |
| p99 | 0.03ms | 0.0086ms | +0.02ms | +230.86% |
| mean | 0.0075ms | 0.0048ms | +0.0027ms | +55.76% |
| min | 0.0039ms | 0.0037ms | +0.00021ms | +5.66% |
| max | 0.03ms | 0.0086ms | +0.02ms | +260.21% |
| total | 0.15ms | 0.10ms | +0.05ms | +55.76% |

### reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle)

# Perf Report — reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0013ms |
| p50 | 0.0013ms |
| p95 | 0.0035ms |
| p99 | 0.0075ms |
| mean | 0.0018ms |
| stdev | 0.0016ms |
| min | 0.0012ms |
| max | 0.0085ms |
| total | 0.04ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.919)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0011ms | +0.000024ms | +2.09% |
| p50 | 0.0012ms | 0.0012ms | +0.000021ms | +1.77% |
| p95 | 0.0032ms | 0.0037ms | -0.00051ms | -13.59% |
| p99 | 0.0069ms | 0.0085ms | -0.0017ms | -19.70% |
| mean | 0.0017ms | 0.0018ms | -0.000094ms | -5.38% |
| min | 0.0011ms | 0.0011ms | +0.000028ms | +2.57% |
| max | 0.0078ms | 0.0097ms | -0.0020ms | -20.28% |
| total | 0.03ms | 0.04ms | -0.0019ms | -5.38% |

