# Perf Suite — query-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.01ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.0050ms | 0.0066ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | cpu | 0.08ms | 0.01ms | 0.124 | 0.131 | 0.01ms | 0.01ms |
| mutation_invalidate_batch (5 mutate with invalidate chain) | cpu | 0.08ms | 0.0050ms | 0.061 | 0.063 | 0.0049ms | 0.0051ms |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | cpu | 0.08ms | 0.02ms | 0.277 | 0.284 | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.05ms | 200ms | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.04ms | 200ms | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 166688 B | 0 B | 102400 B | yes | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 264 B | 0 B | 102400 B | yes | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 1184 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_fetch_workflow (10 fetchQuery across 4 providers)

# Perf Report — dashboard_fetch_workflow (10 fetchQuery across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0022ms |
| min | 0.0099ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00029ms | -2.72% |
| p50 | 0.01ms | 0.01ms | -0.00046ms | -4.08% |
| p95 | 0.02ms | 0.02ms | -0.0044ms | -20.11% |
| p99 | 0.02ms | 0.03ms | -0.0091ms | -34.29% |
| mean | 0.01ms | 0.01ms | -0.0010ms | -8.29% |
| min | 0.0099ms | 0.0099ms | +0.0000010ms | +0.01% |
| max | 0.02ms | 0.03ms | -0.01ms | -37.07% |
| total | 0.23ms | 0.25ms | -0.02ms | -8.29% |

### mutation_invalidate_batch (5 mutate with invalidate chain)

# Perf Report — mutation_invalidate_batch (5 mutate with invalidate chain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0050ms |
| p50 | 0.0051ms |
| p95 | 0.0066ms |
| p99 | 0.0067ms |
| mean | 0.0053ms |
| stdev | 0.00054ms |
| min | 0.0050ms |
| max | 0.0067ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0050ms | 0.0051ms | -0.00013ms | -2.44% |
| p50 | 0.0051ms | 0.0052ms | -0.00013ms | -2.40% |
| p95 | 0.0066ms | 0.0064ms | +0.00023ms | +3.58% |
| p99 | 0.0067ms | 0.0067ms | -0.000087ms | -1.29% |
| mean | 0.0053ms | 0.0055ms | -0.00013ms | -2.44% |
| min | 0.0050ms | 0.0051ms | -0.000083ms | -1.63% |
| max | 0.0067ms | 0.0068ms | -0.00017ms | -2.43% |
| total | 0.11ms | 0.11ms | -0.0027ms | -2.44% |

### subscribe_error_handling (5 fetch throw + catch + listener notify)

# Perf Report — subscribe_error_handling (5 fetch throw + catch + listener notify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0024ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00015ms | -0.67% |
| p50 | 0.02ms | 0.02ms | +0.00038ms | +1.60% |
| p95 | 0.03ms | 0.04ms | -0.0083ms | -23.36% |
| p99 | 0.03ms | 0.06ms | -0.02ms | -43.42% |
| mean | 0.02ms | 0.03ms | -0.0021ms | -7.93% |
| min | 0.02ms | 0.02ms | +0.00012ms | +0.56% |
| max | 0.03ms | 0.06ms | -0.03ms | -46.27% |
| total | 0.49ms | 0.53ms | -0.04ms | -7.93% |

