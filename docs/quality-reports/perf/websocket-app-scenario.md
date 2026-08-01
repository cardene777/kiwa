# Perf Suite — websocket-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.0072ms | 0.03ms | 100ms | 0.0010ms | PASS | stable (換算後 p10 +9% (閾値未満)、 p95 +61% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.0042ms | 0.05ms | 100ms | 0.0011ms | PASS | stable (換算後 p10 +1% (閾値未満)、 p95 +742% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| binary_frame_batch (5 encode + parse round-trip) | 0.0023ms | 0.0036ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |
| room_registry_batch (5 room join + broadcast + leave) | 0.0041ms | 0.0090ms | 100ms | 0.0011ms | PASS | stable — gate 無効 (regressionGate=false) |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.0013ms | 0.0018ms | 100ms | 0.0011ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | cpu | 0.09ms | 0.23ms | 0.0072ms | 0.077 | 0.071 | n/a | 20.0% | 0.0062ms | 0.0057ms |
| broadcast_batch (5 rooms x 3 clients broadcast) | cpu | 0.09ms | 0.20ms | 0.0042ms | 0.046 | 0.046 | n/a | 20.0% | 0.0038ms | 0.0037ms |
| binary_frame_batch (5 encode + parse round-trip) | cpu | 0.09ms | 0.09ms | 0.0023ms | 0.026 | 0.027 | n/a | 20.0% | 0.0021ms | 0.0022ms |
| room_registry_batch (5 room join + broadcast + leave) | cpu | 0.09ms | 0.09ms | 0.0041ms | 0.046 | 0.045 | n/a | 20.0% | 0.0038ms | 0.0037ms |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | cpu | 0.09ms | 0.09ms | 0.0013ms | 0.014 | 0.014 | n/a | 20.0% | 0.0011ms | 0.0011ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.03ms | 200ms | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.05ms | 200ms | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 0.01ms | 200ms | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 0.03ms | 200ms | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | -9784 B | -16012 B | 102400 B | yes | 23 (3 + 20) | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | -48 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 744 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 22760 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | -1416 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### chat_room_workflow (10 send across 4 providers)

# Perf Report — chat_room_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0072ms |
| p50 | 0.0077ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.0084ms |
| min | 0.0072ms |
| max | 0.04ms |
| total | 0.24ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.855)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0062ms | 0.0057ms | +0.00049ms | +8.66% |
| p50 | 0.0066ms | 0.0058ms | +0.00078ms | +13.36% |
| p95 | 0.02ms | 0.02ms | +0.0094ms | +61.32% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +90.56% |
| mean | 0.01ms | 0.0071ms | +0.0034ms | +47.69% |
| min | 0.0061ms | 0.0056ms | +0.00050ms | +8.91% |
| max | 0.03ms | 0.02ms | +0.02ms | +97.18% |
| total | 0.21ms | 0.14ms | +0.07ms | +47.69% |

### broadcast_batch (5 rooms x 3 clients broadcast)

# Perf Report — broadcast_batch (5 rooms x 3 clients broadcast).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0042ms |
| p50 | 0.01ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0040ms |
| max | 0.07ms |
| total | 0.33ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.911)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0038ms | 0.0037ms | +0.000049ms | +1.30% |
| p50 | 0.0095ms | 0.0039ms | +0.0055ms | +140.92% |
| p95 | 0.04ms | 0.0049ms | +0.04ms | +742.48% |
| p99 | 0.06ms | 0.0056ms | +0.05ms | +939.38% |
| mean | 0.02ms | 0.0042ms | +0.01ms | +261.05% |
| min | 0.0037ms | 0.0037ms | -0.000027ms | -0.74% |
| max | 0.06ms | 0.0058ms | +0.06ms | +980.86% |
| total | 0.30ms | 0.08ms | +0.22ms | +261.05% |

### binary_frame_batch (5 encode + parse round-trip)

# Perf Report — binary_frame_batch (5 encode + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0023ms |
| p50 | 0.0024ms |
| p95 | 0.0036ms |
| p99 | 0.0045ms |
| mean | 0.0026ms |
| stdev | 0.00056ms |
| min | 0.0023ms |
| max | 0.0047ms |
| total | 0.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.891)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0022ms | -0.000088ms | -4.07% |
| p50 | 0.0021ms | 0.0022ms | -0.00011ms | -5.13% |
| p95 | 0.0032ms | 0.0031ms | +0.00011ms | +3.61% |
| p99 | 0.0040ms | 0.01ms | -0.0075ms | -65.37% |
| mean | 0.0023ms | 0.0028ms | -0.00054ms | -19.16% |
| min | 0.0020ms | 0.0021ms | -0.000084ms | -3.94% |
| max | 0.0042ms | 0.01ms | -0.0094ms | -69.31% |
| total | 0.05ms | 0.06ms | -0.01ms | -19.16% |

### room_registry_batch (5 room join + broadcast + leave)

# Perf Report — room_registry_batch (5 room join + broadcast + leave).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0041ms |
| p50 | 0.0043ms |
| p95 | 0.0090ms |
| p99 | 0.01ms |
| mean | 0.0055ms |
| stdev | 0.0019ms |
| min | 0.0040ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.930)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0038ms | 0.0037ms | +0.000047ms | +1.27% |
| p50 | 0.0040ms | 0.0039ms | +0.000053ms | +1.36% |
| p95 | 0.0083ms | 0.0085ms | -0.00014ms | -1.60% |
| p99 | 0.0095ms | 0.0086ms | +0.00092ms | +10.72% |
| mean | 0.0051ms | 0.0048ms | +0.00029ms | +6.03% |
| min | 0.0038ms | 0.0037ms | +0.000050ms | +1.35% |
| max | 0.0098ms | 0.0086ms | +0.0012ms | +13.75% |
| total | 0.10ms | 0.10ms | +0.0058ms | +6.03% |

### reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle)

# Perf Report — reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0013ms |
| p50 | 0.0013ms |
| p95 | 0.0018ms |
| p99 | 0.0058ms |
| mean | 0.0016ms |
| stdev | 0.0012ms |
| min | 0.0012ms |
| max | 0.0068ms |
| total | 0.03ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.919)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0011ms | +0.000024ms | +2.15% |
| p50 | 0.0011ms | 0.0012ms | -0.000017ms | -1.49% |
| p95 | 0.0016ms | 0.0037ms | -0.0021ms | -56.49% |
| p99 | 0.0054ms | 0.0085ms | -0.0032ms | -37.39% |
| mean | 0.0014ms | 0.0018ms | -0.00032ms | -18.43% |
| min | 0.0011ms | 0.0011ms | +0.000028ms | +2.54% |
| max | 0.0063ms | 0.0097ms | -0.0035ms | -35.56% |
| total | 0.03ms | 0.04ms | -0.0065ms | -18.43% |

