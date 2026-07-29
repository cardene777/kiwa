# Perf Suite — dogfood-alert-orchestrator

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateRules | 0.0021ms | 0.0088ms | 30ms | 0.00033ms | PASS | stable (p10 -2% (閾値未満)、 p95 +59% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| routeAlert | 0.00079ms | 0.0084ms | 20ms | 0.00033ms | PASS | stable (p10 -17% (閾値未満)、 p95 +138% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| advanceEscalation | 0.0010ms | 0.0025ms | 20ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateRules | 0.03ms | 60ms | PASS |
| routeAlert | 0.02ms | 40ms | PASS |
| advanceEscalation | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateRules | 6552 B | 0 B | 102400 B | yes | PASS |
| routeAlert | 23912 B | 0 B | 102400 B | yes | PASS |
| advanceEscalation | 26456 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateRules

# Perf Report — evaluateRules.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0021ms |
| p50 | 0.0023ms |
| p95 | 0.0088ms |
| p99 | 0.01ms |
| mean | 0.0033ms |
| stdev | 0.0025ms |
| min | 0.0021ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0021ms | -0.000038ms | -1.79% |
| p50 | 0.0023ms | 0.0021ms | +0.00015ms | +6.85% |
| p95 | 0.0088ms | 0.0055ms | +0.0033ms | +59.49% |
| p99 | 0.01ms | 0.01ms | +0.00054ms | +4.44% |
| mean | 0.0033ms | 0.0031ms | +0.00028ms | +9.24% |
| min | 0.0021ms | 0.0021ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | -0.0011ms | -6.64% |
| total | 0.13ms | 0.12ms | +0.01ms | +9.24% |

### routeAlert

# Perf Report — routeAlert.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00079ms |
| p50 | 0.00092ms |
| p95 | 0.0084ms |
| p99 | 0.01ms |
| mean | 0.0019ms |
| stdev | 0.0025ms |
| min | 0.00075ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00079ms | 0.00096ms | -0.00017ms | -17.33% |
| p50 | 0.00092ms | 0.0010ms | -0.00012ms | -11.91% |
| p95 | 0.0084ms | 0.0035ms | +0.0049ms | +138.00% |
| p99 | 0.01ms | 0.0049ms | +0.0052ms | +107.25% |
| mean | 0.0019ms | 0.0014ms | +0.00058ms | +42.73% |
| min | 0.00075ms | 0.00096ms | -0.00021ms | -21.71% |
| max | 0.01ms | 0.0055ms | +0.0046ms | +84.72% |
| total | 0.08ms | 0.05ms | +0.02ms | +42.73% |

### advanceEscalation

# Perf Report — advanceEscalation.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0014ms |
| p95 | 0.0025ms |
| p99 | 0.0046ms |
| mean | 0.0015ms |
| stdev | 0.00077ms |
| min | 0.0010ms |
| max | 0.0053ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0014ms | -0.00037ms | -26.41% |
| p50 | 0.0014ms | 0.0015ms | -0.000083ms | -5.69% |
| p95 | 0.0025ms | 0.0027ms | -0.00021ms | -7.99% |
| p99 | 0.0046ms | 0.0041ms | +0.00053ms | +13.04% |
| mean | 0.0015ms | 0.0017ms | -0.00013ms | -7.69% |
| min | 0.0010ms | 0.0014ms | -0.00033ms | -24.29% |
| max | 0.0053ms | 0.0043ms | +0.0011ms | +25.51% |
| total | 0.06ms | 0.07ms | -0.0051ms | -7.69% |

