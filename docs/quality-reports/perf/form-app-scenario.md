# Perf Suite — form-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.08ms | 0.11ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_field_validate_batch (5 provider-mixed validate) | 0.0025ms | 0.0047ms | 100ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |
| submit_error_handling (5 required-missing → onError catch) | 0.03ms | 0.07ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | cpu | 0.09ms | 0.08ms | 0.889 | 0.760 | 0.07ms | 0.06ms |
| multi_field_validate_batch (5 provider-mixed validate) | cpu | 0.09ms | 0.0025ms | 0.028 | 0.029 | 0.0023ms | 0.0024ms |
| submit_error_handling (5 required-missing → onError catch) | cpu | 0.08ms | 0.03ms | 0.378 | 0.276 | 0.03ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.45ms | 200ms | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 0.02ms | 200ms | PASS |
| submit_error_handling (5 required-missing → onError catch) | 0.16ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 11192 B | 0 B | 102400 B | yes | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 1976 B | 0 B | 102400 B | yes | PASS |
| submit_error_handling (5 required-missing → onError catch) | 7744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### signup_workflow (10 register+submit cycle)

# Perf Report — signup_workflow (10 register+submit cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.08ms |
| p50 | 0.09ms |
| p95 | 0.11ms |
| p99 | 0.12ms |
| mean | 0.09ms |
| stdev | 0.01ms |
| min | 0.08ms |
| max | 0.13ms |
| total | 1.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.08ms | 0.06ms | +0.01ms | +21.25% |
| p50 | 0.09ms | 0.07ms | +0.02ms | +30.88% |
| p95 | 0.11ms | 0.10ms | +0.01ms | +14.35% |
| p99 | 0.12ms | 0.12ms | +0.0076ms | +6.46% |
| mean | 0.09ms | 0.07ms | +0.02ms | +22.97% |
| min | 0.08ms | 0.06ms | +0.01ms | +24.02% |
| max | 0.13ms | 0.12ms | +0.0060ms | +4.92% |
| total | 1.80ms | 1.46ms | +0.34ms | +22.97% |

### multi_field_validate_batch (5 provider-mixed validate)

# Perf Report — multi_field_validate_batch (5 provider-mixed validate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0025ms |
| p50 | 0.0026ms |
| p95 | 0.0047ms |
| p99 | 0.0047ms |
| mean | 0.0031ms |
| stdev | 0.00078ms |
| min | 0.0025ms |
| max | 0.0047ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0024ms | +0.00013ms | +5.26% |
| p50 | 0.0026ms | 0.0024ms | +0.00017ms | +6.83% |
| p95 | 0.0047ms | 0.0051ms | -0.00044ms | -8.55% |
| p99 | 0.0047ms | 0.01ms | -0.0090ms | -65.50% |
| mean | 0.0031ms | 0.0033ms | -0.00015ms | -4.58% |
| min | 0.0025ms | 0.0023ms | +0.00012ms | +5.31% |
| max | 0.0047ms | 0.02ms | -0.01ms | -70.08% |
| total | 0.06ms | 0.07ms | -0.0030ms | -4.58% |

### submit_error_handling (5 required-missing → onError catch)

# Perf Report — submit_error_handling (5 required-missing → onError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.07ms |
| p99 | 0.30ms |
| mean | 0.05ms |
| stdev | 0.07ms |
| min | 0.03ms |
| max | 0.36ms |
| total | 1.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.02ms | +0.0086ms | +37.84% |
| p50 | 0.04ms | 0.02ms | +0.01ms | +53.32% |
| p95 | 0.07ms | 0.03ms | +0.04ms | +112.10% |
| p99 | 0.30ms | 0.06ms | +0.24ms | +423.13% |
| mean | 0.05ms | 0.03ms | +0.03ms | +106.15% |
| min | 0.03ms | 0.02ms | +0.0051ms | +23.42% |
| max | 0.36ms | 0.06ms | +0.29ms | +465.18% |
| total | 1.09ms | 0.53ms | +0.56ms | +106.15% |

