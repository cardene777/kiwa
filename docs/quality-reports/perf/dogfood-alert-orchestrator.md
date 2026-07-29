# Perf Suite — dogfood-alert-orchestrator

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateRules | 0.0020ms | 0.0057ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| routeAlert | 0.0010ms | 0.0034ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| advanceEscalation | 0.0011ms | 0.0028ms | 20ms | 0.00033ms | PASS | stable (差 0.00033ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateRules | 0.03ms | 60ms | PASS |
| routeAlert | 0.04ms | 40ms | PASS |
| advanceEscalation | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateRules | 8576 B | 0 B | 102400 B | yes | PASS |
| routeAlert | 34240 B | 0 B | 102400 B | yes | PASS |
| advanceEscalation | 32496 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateRules

# Perf Report — evaluateRules.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0021ms |
| p95 | 0.0057ms |
| p99 | 0.02ms |
| mean | 0.0032ms |
| stdev | 0.0030ms |
| min | 0.0020ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0021ms | -0.000079ms | -3.72% |
| p50 | 0.0021ms | 0.0021ms | -0.000041ms | -1.93% |
| p95 | 0.0057ms | 0.0055ms | +0.00017ms | +3.06% |
| p99 | 0.02ms | 0.01ms | +0.0032ms | +25.98% |
| mean | 0.0032ms | 0.0031ms | +0.00011ms | +3.44% |
| min | 0.0020ms | 0.0021ms | -0.000042ms | -2.02% |
| max | 0.02ms | 0.02ms | +0.0030ms | +18.68% |
| total | 0.13ms | 0.12ms | +0.0042ms | +3.44% |

### routeAlert

# Perf Report — routeAlert.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0011ms |
| p95 | 0.0034ms |
| p99 | 0.0060ms |
| mean | 0.0015ms |
| stdev | 0.0011ms |
| min | 0.0010ms |
| max | 0.0071ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.00096ms | +0.000083ms | +8.66% |
| p50 | 0.0011ms | 0.0010ms | +0.000043ms | +4.13% |
| p95 | 0.0034ms | 0.0035ms | -0.00014ms | -4.01% |
| p99 | 0.0060ms | 0.0049ms | +0.0011ms | +23.59% |
| mean | 0.0015ms | 0.0014ms | +0.00011ms | +8.29% |
| min | 0.0010ms | 0.00096ms | +0.000042ms | +4.38% |
| max | 0.0071ms | 0.0055ms | +0.0017ms | +30.52% |
| total | 0.06ms | 0.05ms | +0.0045ms | +8.29% |

### advanceEscalation

# Perf Report — advanceEscalation.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0014ms |
| p95 | 0.0028ms |
| p99 | 0.0033ms |
| mean | 0.0015ms |
| stdev | 0.00058ms |
| min | 0.0011ms |
| max | 0.0035ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0014ms | -0.00033ms | -23.52% |
| p50 | 0.0014ms | 0.0015ms | -0.00010ms | -7.10% |
| p95 | 0.0028ms | 0.0027ms | +0.00012ms | +4.59% |
| p99 | 0.0033ms | 0.0041ms | -0.00076ms | -18.66% |
| mean | 0.0015ms | 0.0017ms | -0.00015ms | -9.14% |
| min | 0.0011ms | 0.0014ms | -0.00029ms | -21.24% |
| max | 0.0035ms | 0.0043ms | -0.00079ms | -18.64% |
| total | 0.06ms | 0.07ms | -0.0060ms | -9.14% |

