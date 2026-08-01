# Perf Suite — data-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.0045ms | 0.04ms | 50ms | 0.00045ms | PASS | stable (換算後 p10 +4% (閾値未満)、 p95 +86% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.03ms | 0.05ms | 50ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |
| integrated_workflow (queue + clock combined) | 0.0027ms | 0.01ms | 50ms | 0.00045ms | PASS | stable (換算後 p10 -2% (閾値未満)、 p95 +57% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | cpu | 0.09ms | 0.12ms | 0.0045ms | 0.051 | 0.049 | n/a | 20.0% | 0.0042ms | 0.0040ms |
| cron_scheduling (10 schedule + advanceMs 5 turn) | cpu | 0.09ms | 0.10ms | 0.03ms | 0.353 | 0.354 | n/a | 20.0% | 0.03ms | 0.03ms |
| integrated_workflow (queue + clock combined) | cpu | 0.09ms | 0.10ms | 0.0027ms | 0.031 | 0.031 | n/a | 20.0% | 0.0025ms | 0.0026ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.02ms | 100ms | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.27ms | 100ms | PASS |
| integrated_workflow (queue + clock combined) | 0.02ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | -27184 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 6472 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |
| integrated_workflow (queue + clock combined) | -4976 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |

## Detailed serial reports

### queue_burst (setup + 50 send + 50 receive)

# Perf Report — queue_burst (setup + 50 send + 50 receive).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0045ms |
| p50 | 0.0054ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0033ms |
| max | 0.04ms |
| total | 0.34ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.923)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0042ms | 0.0040ms | +0.00017ms | +4.27% |
| p50 | 0.0049ms | 0.0045ms | +0.00044ms | +9.82% |
| p95 | 0.04ms | 0.02ms | +0.02ms | +85.68% |
| p99 | 0.04ms | 0.02ms | +0.02ms | +68.78% |
| mean | 0.01ms | 0.0076ms | +0.0029ms | +38.03% |
| min | 0.0031ms | 0.0029ms | +0.00020ms | +7.00% |
| max | 0.04ms | 0.02ms | +0.02ms | +62.36% |
| total | 0.32ms | 0.23ms | +0.09ms | +38.03% |

### cron_scheduling (10 schedule + advanceMs 5 turn)

# Perf Report — cron_scheduling (10 schedule + advanceMs 5 turn).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.04ms |
| stdev | 0.0067ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 1.07ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.936)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00015ms | -0.50% |
| p50 | 0.03ms | 0.04ms | -0.0088ms | -22.64% |
| p95 | 0.04ms | 0.04ms | -0.000050ms | -0.11% |
| p99 | 0.05ms | 0.05ms | +0.00019ms | +0.36% |
| mean | 0.03ms | 0.04ms | -0.0037ms | -9.90% |
| min | 0.03ms | 0.03ms | +0.00039ms | +1.37% |
| max | 0.05ms | 0.05ms | +0.00050ms | +0.92% |
| total | 1.00ms | 1.11ms | -0.11ms | -9.90% |

### integrated_workflow (queue + clock combined)

# Perf Report — integrated_workflow (queue + clock combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0029ms |
| p95 | 0.01ms |
| p99 | 0.07ms |
| mean | 0.0066ms |
| stdev | 0.02ms |
| min | 0.0027ms |
| max | 0.09ms |
| total | 0.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.923)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0026ms | -0.000040ms | -1.56% |
| p50 | 0.0027ms | 0.0027ms | +0.0000069ms | +0.26% |
| p95 | 0.01ms | 0.0076ms | +0.0044ms | +57.48% |
| p99 | 0.06ms | 0.01ms | +0.05ms | +340.22% |
| mean | 0.0061ms | 0.0036ms | +0.0025ms | +69.30% |
| min | 0.0025ms | 0.0025ms | -1.9e-7ms | -0.01% |
| max | 0.08ms | 0.02ms | +0.06ms | +384.72% |
| total | 0.18ms | 0.11ms | +0.08ms | +69.30% |

