# Perf Suite — expo-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.01ms | 0.01ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| file_capture_batch (camera picture + fileSystem write x5) | 0.0046ms | 0.0072ms | 100ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |
| permission_error_handling (5 denied camera + secureStore fail) | 0.02ms | 0.04ms | 100ms | 0.00044ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | cpu | 0.09ms | 0.10ms | 0.01ms | 0.122 | 0.119 | n/a | 20.0% | 0.01ms | 0.01ms |
| file_capture_batch (camera picture + fileSystem write x5) | cpu | 0.09ms | 0.10ms | 0.0046ms | 0.052 | 0.052 | n/a | 20.0% | 0.0042ms | 0.0042ms |
| permission_error_handling (5 denied camera + secureStore fail) | cpu | 0.09ms | 0.10ms | 0.02ms | 0.219 | 0.221 | n/a | 20.0% | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.11ms | 200ms | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 0.03ms | 200ms | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 23776 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 1032 B | 8192 B | 102400 B | yes | 23 (3 + 20) | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 3632 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### onboarding_workflow (router + secureStore + notification x10 cycle)

# Perf Report — onboarding_workflow (router + secureStore + notification x10 cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0010ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.900)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00027ms | +2.63% |
| p50 | 0.01ms | 0.01ms | -0.000077ms | -0.72% |
| p95 | 0.01ms | 0.01ms | -0.00038ms | -2.89% |
| p99 | 0.01ms | 0.01ms | -0.000066ms | -0.47% |
| mean | 0.01ms | 0.01ms | +0.0000024ms | +0.02% |
| min | 0.01ms | 0.01ms | +0.00027ms | +2.64% |
| max | 0.01ms | 0.01ms | +0.000012ms | +0.08% |
| total | 0.22ms | 0.22ms | +0.000047ms | +0.02% |

### file_capture_batch (camera picture + fileSystem write x5)

# Perf Report — file_capture_batch (camera picture + fileSystem write x5).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0046ms |
| p50 | 0.0058ms |
| p95 | 0.0072ms |
| p99 | 0.01ms |
| mean | 0.0061ms |
| stdev | 0.0014ms |
| min | 0.0044ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.911)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0042ms | 0.0042ms | -0.000010ms | -0.24% |
| p50 | 0.0053ms | 0.0044ms | +0.00094ms | +21.45% |
| p95 | 0.0065ms | 0.0069ms | -0.00037ms | -5.35% |
| p99 | 0.0092ms | 0.01ms | -0.00098ms | -9.62% |
| mean | 0.0055ms | 0.0049ms | +0.00063ms | +12.83% |
| min | 0.0040ms | 0.0042ms | -0.00018ms | -4.36% |
| max | 0.0099ms | 0.01ms | -0.0011ms | -10.28% |
| total | 0.11ms | 0.10ms | +0.01ms | +12.83% |

### permission_error_handling (5 denied camera + secureStore fail)

# Perf Report — permission_error_handling (5 denied camera + secureStore fail).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.0077ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 0.48ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.884)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00018ms | -1.01% |
| p50 | 0.02ms | 0.02ms | -0.00035ms | -1.86% |
| p95 | 0.04ms | 0.04ms | -0.0047ms | -11.27% |
| p99 | 0.04ms | 0.05ms | -0.0060ms | -12.55% |
| mean | 0.02ms | 0.02ms | -0.0011ms | -4.76% |
| min | 0.02ms | 0.02ms | -0.00013ms | -0.70% |
| max | 0.04ms | 0.05ms | -0.0063ms | -12.82% |
| total | 0.43ms | 0.45ms | -0.02ms | -4.76% |

