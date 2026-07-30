# Perf Suite — state-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.0035ms | 0.01ms | 100ms | 0.00045ms | PASS | stable (換算後 p10 +1% (閾値未満)、 p95 +96% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| subscribe_batch (5 listener + 5 state updates) | 0.0025ms | 0.01ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatch_error_handling (5 unknown action type dispatch) | 0.01ms | 0.03ms | 100ms | 0.00044ms | PASS | stable (換算後 p10 -2% (閾値未満)、 p95 +53% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | cpu | 0.09ms | 0.10ms | 0.0035ms | 0.039 | 0.039 | 0.0032ms | 0.0032ms |
| subscribe_batch (5 listener + 5 state updates) | cpu | 0.09ms | 0.10ms | 0.0025ms | 0.028 | 0.028 | 0.0023ms | 0.0022ms |
| dispatch_error_handling (5 unknown action type dispatch) | cpu | 0.09ms | 0.22ms | 0.01ms | 0.108 | 0.110 | 0.0089ms | 0.0091ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.02ms | 200ms | PASS |
| subscribe_batch (5 listener + 5 state updates) | 0.02ms | 200ms | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | 0.19ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 3224 B | -11207 B | 102400 B | yes | PASS |
| subscribe_batch (5 listener + 5 state updates) | 648 B | 0 B | 102400 B | yes | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | -1464 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (5 provider x 2 dispatch cycles)

# Perf Report — multi_provider_workflow (5 provider x 2 dispatch cycles).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0035ms |
| p50 | 0.0037ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0049ms |
| stdev | 0.0033ms |
| min | 0.0035ms |
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.899)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0032ms | 0.0032ms | +0.000018ms | +0.56% |
| p50 | 0.0033ms | 0.0033ms | +0.000045ms | +1.38% |
| p95 | 0.0096ms | 0.0049ms | +0.0047ms | +95.57% |
| p99 | 0.01ms | 0.01ms | +0.0025ms | +21.61% |
| mean | 0.0044ms | 0.0039ms | +0.00045ms | +11.57% |
| min | 0.0031ms | 0.0031ms | +0.000064ms | +2.07% |
| max | 0.02ms | 0.01ms | +0.0020ms | +14.89% |
| total | 0.09ms | 0.08ms | +0.0091ms | +11.57% |

### subscribe_batch (5 listener + 5 state updates)

# Perf Report — subscribe_batch (5 listener + 5 state updates).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0025ms |
| p50 | 0.0037ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0044ms |
| stdev | 0.0033ms |
| min | 0.0024ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.908)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0022ms | +0.000021ms | +0.92% |
| p50 | 0.0033ms | 0.0027ms | +0.00062ms | +22.68% |
| p95 | 0.0096ms | 0.0085ms | +0.0011ms | +12.62% |
| p99 | 0.01ms | 0.01ms | -0.00060ms | -4.23% |
| mean | 0.0040ms | 0.0038ms | +0.00020ms | +5.20% |
| min | 0.0022ms | 0.0022ms | -0.000051ms | -2.32% |
| max | 0.01ms | 0.02ms | -0.0010ms | -6.53% |
| total | 0.08ms | 0.08ms | +0.0040ms | +5.20% |

### dispatch_error_handling (5 unknown action type dispatch)

# Perf Report — dispatch_error_handling (5 unknown action type dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.01ms |
| stdev | 0.0097ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 0.30ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.882)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0089ms | 0.0091ms | -0.00015ms | -1.66% |
| p50 | 0.0094ms | 0.0092ms | +0.00016ms | +1.69% |
| p95 | 0.03ms | 0.02ms | +0.0089ms | +53.04% |
| p99 | 0.04ms | 0.03ms | +0.0078ms | +24.19% |
| mean | 0.01ms | 0.01ms | +0.0022ms | +19.68% |
| min | 0.0089ms | 0.0090ms | -0.00011ms | -1.20% |
| max | 0.04ms | 0.04ms | +0.0076ms | +20.86% |
| total | 0.26ms | 0.22ms | +0.04ms | +19.68% |

