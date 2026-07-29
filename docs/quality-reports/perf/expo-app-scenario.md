# Perf Suite — expo-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.0099ms | 0.01ms | 100ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |
| file_capture_batch (camera picture + fileSystem write x5) | 0.0049ms | 0.02ms | 100ms | 0.00043ms | PASS | stable (p10 +15% (閾値未満)、 p95 +124% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| permission_error_handling (5 denied camera + secureStore fail) | 0.02ms | 0.03ms | 100ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | cpu | 0.08ms | 0.0099ms | 0.121 | 0.123 | 0.01ms | 0.01ms |
| file_capture_batch (camera picture + fileSystem write x5) | cpu | 0.08ms | 0.0049ms | 0.061 | 0.053 | 0.0050ms | 0.0044ms |
| permission_error_handling (5 denied camera + secureStore fail) | cpu | 0.08ms | 0.02ms | 0.218 | 0.219 | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.07ms | 200ms | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 0.03ms | 200ms | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 25576 B | 0 B | 102400 B | yes | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 1120 B | 0 B | 102400 B | yes | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 3632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### onboarding_workflow (router + secureStore + notification x10 cycle)

# Perf Report — onboarding_workflow (router + secureStore + notification x10 cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0099ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00047ms |
| min | 0.0097ms |
| max | 0.01ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0099ms | 0.01ms | -0.00041ms | -4.00% |
| p50 | 0.01ms | 0.01ms | -0.00060ms | -5.52% |
| p95 | 0.01ms | 0.01ms | -0.0032ms | -22.27% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -47.78% |
| mean | 0.01ms | 0.01ms | -0.0014ms | -11.89% |
| min | 0.0097ms | 0.01ms | -0.00033ms | -3.32% |
| max | 0.01ms | 0.02ms | -0.01ms | -51.66% |
| total | 0.21ms | 0.24ms | -0.03ms | -11.89% |

### file_capture_batch (camera picture + fileSystem write x5)

# Perf Report — file_capture_batch (camera picture + fileSystem write x5).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0049ms |
| p50 | 0.0056ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0068ms |
| stdev | 0.0032ms |
| min | 0.0045ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0049ms | 0.0044ms | +0.00055ms | +12.47% |
| p50 | 0.0056ms | 0.0047ms | +0.00090ms | +18.95% |
| p95 | 0.02ms | 0.0071ms | +0.0085ms | +119.00% |
| p99 | 0.02ms | 0.0071ms | +0.0088ms | +123.45% |
| mean | 0.0068ms | 0.0050ms | +0.0018ms | +36.39% |
| min | 0.0045ms | 0.0044ms | +0.00012ms | +2.86% |
| max | 0.02ms | 0.0071ms | +0.0089ms | +124.56% |
| total | 0.14ms | 0.10ms | +0.04ms | +36.39% |

### permission_error_handling (5 denied camera + secureStore fail)

# Perf Report — permission_error_handling (5 denied camera + secureStore fail).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0031ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0019ms | -9.58% |
| p50 | 0.02ms | 0.02ms | -0.0018ms | -9.07% |
| p95 | 0.03ms | 0.05ms | -0.02ms | -46.70% |
| p99 | 0.03ms | 0.05ms | -0.02ms | -45.65% |
| mean | 0.02ms | 0.02ms | -0.0053ms | -21.47% |
| min | 0.02ms | 0.02ms | -0.0020ms | -10.52% |
| max | 0.03ms | 0.05ms | -0.02ms | -45.42% |
| total | 0.39ms | 0.50ms | -0.11ms | -21.47% |

