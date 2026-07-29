# Perf Suite — core

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| parseSpec | 0.0048ms | 0.0089ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| createPool | 0.0016ms | 0.0024ms | 5ms | 0.00033ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseSpec | 0.07ms | 10ms | PASS |
| createPool | 0.51ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseSpec | -4080 B | -27793 B | 102400 B | yes | PASS |
| createPool | 5264 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseSpec

# Perf Report — parseSpec.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0048ms |
| p50 | 0.0049ms |
| p95 | 0.0089ms |
| p99 | 0.02ms |
| mean | 0.0067ms |
| stdev | 0.02ms |
| min | 0.0046ms |
| max | 0.23ms |
| total | 1.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0048ms | 0.0050ms | -0.00025ms | -4.88% |
| p50 | 0.0049ms | 0.0066ms | -0.0018ms | -26.64% |
| p95 | 0.0089ms | 0.02ms | -0.0066ms | -42.62% |
| p99 | 0.02ms | 0.02ms | -0.0023ms | -12.23% |
| mean | 0.0067ms | 0.0080ms | -0.0013ms | -16.01% |
| min | 0.0046ms | 0.0047ms | -0.00017ms | -3.49% |
| max | 0.23ms | 0.02ms | +0.21ms | +939.27% |
| total | 1.35ms | 1.61ms | -0.26ms | -16.01% |

### createPool

# Perf Report — createPool.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0016ms |
| p50 | 0.0016ms |
| p95 | 0.0024ms |
| p99 | 0.0058ms |
| mean | 0.0018ms |
| stdev | 0.0011ms |
| min | 0.0015ms |
| max | 0.01ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0016ms | 0.0012ms | +0.00042ms | +35.65% |
| p50 | 0.0016ms | 0.0013ms | +0.00029ms | +21.86% |
| p95 | 0.0024ms | 0.0029ms | -0.00052ms | -17.76% |
| p99 | 0.0058ms | 0.0081ms | -0.0024ms | -28.99% |
| mean | 0.0018ms | 0.0016ms | +0.00019ms | +11.72% |
| min | 0.0015ms | 0.0011ms | +0.00046ms | +42.29% |
| max | 0.01ms | 0.02ms | -0.0069ms | -36.01% |
| total | 0.37ms | 0.33ms | +0.04ms | +11.72% |

