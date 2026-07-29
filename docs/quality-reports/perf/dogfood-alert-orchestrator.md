# Perf Suite — dogfood-alert-orchestrator

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateRules | 0.0020ms | 0.0061ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| routeAlert | 0.00096ms | 0.0034ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| advanceEscalation | 0.0010ms | 0.0026ms | 20ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateRules | 0.03ms | 60ms | PASS |
| routeAlert | 0.01ms | 40ms | PASS |
| advanceEscalation | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateRules | 7304 B | 0 B | 102400 B | yes | PASS |
| routeAlert | 33784 B | 0 B | 102400 B | yes | PASS |
| advanceEscalation | 32592 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateRules

# Perf Report — evaluateRules.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0020ms |
| p95 | 0.0061ms |
| p99 | 0.02ms |
| mean | 0.0031ms |
| stdev | 0.0030ms |
| min | 0.0020ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0021ms | -0.00012ms | -5.70% |
| p50 | 0.0020ms | 0.0021ms | -0.000083ms | -3.91% |
| p95 | 0.0061ms | 0.0055ms | +0.00057ms | +10.42% |
| p99 | 0.02ms | 0.01ms | +0.0033ms | +27.32% |
| mean | 0.0031ms | 0.0031ms | +0.0000052ms | +0.17% |
| min | 0.0020ms | 0.0021ms | -0.00013ms | -6.00% |
| max | 0.02ms | 0.02ms | +0.0022ms | +13.30% |
| total | 0.12ms | 0.12ms | +0.00021ms | +0.17% |

### routeAlert

# Perf Report — routeAlert.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0010ms |
| p95 | 0.0034ms |
| p99 | 0.0052ms |
| mean | 0.0013ms |
| stdev | 0.0010ms |
| min | 0.00092ms |
| max | 0.0064ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.00096ms | 0.00ms | 0.00% |
| p50 | 0.0010ms | 0.0010ms | -0.000041ms | -3.94% |
| p95 | 0.0034ms | 0.0035ms | -0.00014ms | -4.02% |
| p99 | 0.0052ms | 0.0049ms | +0.00038ms | +7.82% |
| mean | 0.0013ms | 0.0014ms | -0.0000093ms | -0.68% |
| min | 0.00092ms | 0.00096ms | -0.000042ms | -4.38% |
| max | 0.0064ms | 0.0055ms | +0.00092ms | +16.78% |
| total | 0.05ms | 0.05ms | -0.00037ms | -0.68% |

### advanceEscalation

# Perf Report — advanceEscalation.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0011ms |
| p95 | 0.0026ms |
| p99 | 0.0047ms |
| mean | 0.0015ms |
| stdev | 0.00081ms |
| min | 0.0010ms |
| max | 0.0055ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0014ms | -0.00037ms | -26.41% |
| p50 | 0.0011ms | 0.0015ms | -0.00033ms | -22.84% |
| p95 | 0.0026ms | 0.0027ms | -0.000099ms | -3.67% |
| p99 | 0.0047ms | 0.0041ms | +0.00062ms | +15.14% |
| mean | 0.0015ms | 0.0017ms | -0.00018ms | -11.03% |
| min | 0.0010ms | 0.0014ms | -0.00033ms | -24.22% |
| max | 0.0055ms | 0.0043ms | +0.0012ms | +29.41% |
| total | 0.06ms | 0.07ms | -0.0073ms | -11.03% |

