# Perf Suite — expo-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.01ms | 0.02ms | 100ms | 0.00052ms | PASS | stable (換算後 p10 +9% (閾値未満)、 p95 +94% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| file_capture_batch (camera picture + fileSystem write x5) | 0.0054ms | 0.0093ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| permission_error_handling (5 denied camera + secureStore fail) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | cpu | 0.08ms | 0.12ms | 0.01ms | 0.130 | 0.119 | 0.01ms | 0.01ms |
| file_capture_batch (camera picture + fileSystem write x5) | cpu | 0.10ms | 0.11ms | 0.0054ms | 0.054 | 0.052 | 0.0044ms | 0.0042ms |
| permission_error_handling (5 denied camera + secureStore fail) | cpu | 0.08ms | 0.09ms | 0.02ms | 0.225 | 0.221 | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.10ms | 200ms | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 0.04ms | 200ms | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 0.42ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 17744 B | 0 B | 102400 B | yes | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 2760 B | 8192 B | 102400 B | yes | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 3712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### onboarding_workflow (router + secureStore + notification x10 cycle)

# Perf Report — onboarding_workflow (router + secureStore + notification x10 cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0063ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.28ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.037)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00093ms | +9.14% |
| p50 | 0.01ms | 0.01ms | +0.00091ms | +8.52% |
| p95 | 0.03ms | 0.01ms | +0.01ms | +93.68% |
| p99 | 0.04ms | 0.01ms | +0.02ms | +154.99% |
| mean | 0.01ms | 0.01ms | +0.0035ms | +31.74% |
| min | 0.01ms | 0.01ms | +0.00080ms | +7.96% |
| max | 0.04ms | 0.01ms | +0.02ms | +169.12% |
| total | 0.29ms | 0.22ms | +0.07ms | +31.74% |

### file_capture_batch (camera picture + fileSystem write x5)

# Perf Report — file_capture_batch (camera picture + fileSystem write x5).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0054ms |
| p50 | 0.0067ms |
| p95 | 0.0093ms |
| p99 | 0.01ms |
| mean | 0.0072ms |
| stdev | 0.0020ms |
| min | 0.0052ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.817)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0044ms | 0.0042ms | +0.00017ms | +4.01% |
| p50 | 0.0055ms | 0.0044ms | +0.0011ms | +25.34% |
| p95 | 0.0076ms | 0.0069ms | +0.00071ms | +10.26% |
| p99 | 0.01ms | 0.01ms | +0.00041ms | +4.08% |
| mean | 0.0058ms | 0.0049ms | +0.00094ms | +19.24% |
| min | 0.0042ms | 0.0042ms | +0.000056ms | +1.34% |
| max | 0.01ms | 0.01ms | +0.00034ms | +3.11% |
| total | 0.12ms | 0.10ms | +0.02ms | +19.24% |

### permission_error_handling (5 denied camera + secureStore fail)

# Perf Report — permission_error_handling (5 denied camera + secureStore fail).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0051ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.42ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.986)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00031ms | +1.70% |
| p50 | 0.02ms | 0.02ms | +0.00061ms | +3.24% |
| p95 | 0.03ms | 0.04ms | -0.02ms | -37.73% |
| p99 | 0.04ms | 0.05ms | -0.0093ms | -19.52% |
| mean | 0.02ms | 0.02ms | -0.0015ms | -6.69% |
| min | 0.02ms | 0.02ms | -0.00022ms | -1.21% |
| max | 0.04ms | 0.05ms | -0.0077ms | -15.69% |
| total | 0.42ms | 0.45ms | -0.03ms | -6.69% |

