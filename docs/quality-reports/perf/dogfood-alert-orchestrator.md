# Perf Suite — dogfood-alert-orchestrator

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateRules | 0.0021ms | 0.02ms | 30ms | 0.00033ms | PASS | stable (p10 -2% (閾値未満)、 p95 +240% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| routeAlert | 0.0011ms | 0.0036ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| advanceEscalation | 0.0015ms | 0.0029ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateRules | 0.03ms | 60ms | PASS |
| routeAlert | 0.02ms | 40ms | PASS |
| advanceEscalation | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateRules | 18528 B | -37584 B | 102400 B | yes | PASS |
| routeAlert | 44608 B | 0 B | 102400 B | yes | PASS |
| advanceEscalation | 29736 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateRules

# Perf Report — evaluateRules.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0021ms |
| p50 | 0.0024ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.0053ms |
| stdev | 0.0083ms |
| min | 0.0021ms |
| max | 0.05ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0021ms | -0.000037ms | -1.74% |
| p50 | 0.0024ms | 0.0021ms | +0.00023ms | +10.80% |
| p95 | 0.02ms | 0.0055ms | +0.01ms | +240.37% |
| p99 | 0.04ms | 0.01ms | +0.03ms | +214.55% |
| mean | 0.0053ms | 0.0031ms | +0.0022ms | +72.47% |
| min | 0.0021ms | 0.0021ms | 0.00ms | 0.00% |
| max | 0.05ms | 0.02ms | +0.03ms | +182.88% |
| total | 0.21ms | 0.12ms | +0.09ms | +72.47% |

### routeAlert

# Perf Report — routeAlert.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0012ms |
| p95 | 0.0036ms |
| p99 | 0.0069ms |
| mean | 0.0016ms |
| stdev | 0.0013ms |
| min | 0.0011ms |
| max | 0.0085ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.00096ms | +0.00017ms | +17.43% |
| p50 | 0.0012ms | 0.0010ms | +0.00017ms | +16.04% |
| p95 | 0.0036ms | 0.0035ms | +0.000098ms | +2.77% |
| p99 | 0.0069ms | 0.0049ms | +0.0020ms | +41.73% |
| mean | 0.0016ms | 0.0014ms | +0.00024ms | +17.57% |
| min | 0.0011ms | 0.00096ms | +0.00013ms | +13.05% |
| max | 0.0085ms | 0.0055ms | +0.0031ms | +56.48% |
| total | 0.06ms | 0.05ms | +0.0095ms | +17.57% |

### advanceEscalation

# Perf Report — advanceEscalation.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0015ms |
| p50 | 0.0016ms |
| p95 | 0.0029ms |
| p99 | 0.0097ms |
| mean | 0.0020ms |
| stdev | 0.0019ms |
| min | 0.0015ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0014ms | +0.00012ms | +8.54% |
| p50 | 0.0016ms | 0.0015ms | +0.00013ms | +8.61% |
| p95 | 0.0029ms | 0.0027ms | +0.00020ms | +7.60% |
| p99 | 0.0097ms | 0.0041ms | +0.0056ms | +137.91% |
| mean | 0.0020ms | 0.0017ms | +0.00039ms | +23.54% |
| min | 0.0015ms | 0.0014ms | +0.00013ms | +9.09% |
| max | 0.01ms | 0.0043ms | +0.0091ms | +214.71% |
| total | 0.08ms | 0.07ms | +0.02ms | +23.54% |

