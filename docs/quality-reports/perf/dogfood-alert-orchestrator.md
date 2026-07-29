# Perf Suite — dogfood-alert-orchestrator

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateRules | 0.0020ms | 0.0060ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| routeAlert | 0.00096ms | 0.0037ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| advanceEscalation | 0.0011ms | 0.0035ms | 20ms | 0.00033ms | PASS | stable (差 0.00033ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateRules | 0.03ms | 60ms | PASS |
| routeAlert | 0.01ms | 40ms | PASS |
| advanceEscalation | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateRules | 4584 B | 0 B | 102400 B | yes | PASS |
| routeAlert | 33304 B | 0 B | 102400 B | yes | PASS |
| advanceEscalation | 22904 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateRules

# Perf Report — evaluateRules.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0021ms |
| p95 | 0.0060ms |
| p99 | 0.01ms |
| mean | 0.0031ms |
| stdev | 0.0027ms |
| min | 0.0019ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0021ms | -0.000079ms | -3.72% |
| p50 | 0.0021ms | 0.0021ms | 0.00ms | 0.00% |
| p95 | 0.0060ms | 0.0055ms | +0.00053ms | +9.59% |
| p99 | 0.01ms | 0.01ms | +0.0013ms | +10.36% |
| mean | 0.0031ms | 0.0031ms | +0.000066ms | +2.14% |
| min | 0.0019ms | 0.0021ms | -0.00021ms | -9.99% |
| max | 0.02ms | 0.02ms | +0.00088ms | +5.38% |
| total | 0.13ms | 0.12ms | +0.0026ms | +2.14% |

### routeAlert

# Perf Report — routeAlert.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0010ms |
| p95 | 0.0037ms |
| p99 | 0.0057ms |
| mean | 0.0015ms |
| stdev | 0.0011ms |
| min | 0.00079ms |
| max | 0.0069ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.00096ms | 0.00ms | 0.00% |
| p50 | 0.0010ms | 0.0010ms | +5.0e-7ms | +0.05% |
| p95 | 0.0037ms | 0.0035ms | +0.00015ms | +4.27% |
| p99 | 0.0057ms | 0.0049ms | +0.00082ms | +16.97% |
| mean | 0.0015ms | 0.0014ms | +0.00012ms | +8.90% |
| min | 0.00079ms | 0.00096ms | -0.00017ms | -17.43% |
| max | 0.0069ms | 0.0055ms | +0.0015ms | +26.71% |
| total | 0.06ms | 0.05ms | +0.0048ms | +8.90% |

### advanceEscalation

# Perf Report — advanceEscalation.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0014ms |
| p95 | 0.0035ms |
| p99 | 0.0083ms |
| mean | 0.0018ms |
| stdev | 0.0016ms |
| min | 0.0011ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0014ms | -0.00033ms | -23.52% |
| p50 | 0.0014ms | 0.0015ms | -0.000042ms | -2.85% |
| p95 | 0.0035ms | 0.0027ms | +0.00085ms | +31.75% |
| p99 | 0.0083ms | 0.0041ms | +0.0042ms | +103.87% |
| mean | 0.0018ms | 0.0017ms | +0.00015ms | +9.02% |
| min | 0.0011ms | 0.0014ms | -0.00029ms | -21.24% |
| max | 0.01ms | 0.0043ms | +0.0067ms | +156.87% |
| total | 0.07ms | 0.07ms | +0.0060ms | +9.02% |

