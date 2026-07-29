# Perf Suite — core

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| parseSpec | 0.0037ms | 0.01ms | 5ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| createPool | 0.0013ms | 0.0031ms | 5ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseSpec | 0.06ms | 10ms | PASS |
| createPool | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseSpec | -5744 B | 0 B | 102400 B | yes | PASS |
| createPool | 6496 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseSpec

# Perf Report — parseSpec.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0037ms |
| p50 | 0.0056ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0061ms |
| stdev | 0.0031ms |
| min | 0.0036ms |
| max | 0.03ms |
| total | 1.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0050ms | -0.0013ms | -25.63% |
| p50 | 0.0056ms | 0.0066ms | -0.0010ms | -15.04% |
| p95 | 0.01ms | 0.02ms | -0.0045ms | -28.63% |
| p99 | 0.02ms | 0.02ms | +0.0027ms | +13.99% |
| mean | 0.0061ms | 0.0080ms | -0.0019ms | -23.80% |
| min | 0.0036ms | 0.0047ms | -0.0012ms | -24.57% |
| max | 0.03ms | 0.02ms | +0.0048ms | +21.40% |
| total | 1.22ms | 1.61ms | -0.38ms | -23.80% |

### createPool

# Perf Report — createPool.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0013ms |
| p95 | 0.0031ms |
| p99 | 0.0059ms |
| mean | 0.0016ms |
| stdev | 0.0013ms |
| min | 0.0012ms |
| max | 0.01ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0012ms | +0.000083ms | +7.11% |
| p50 | 0.0013ms | 0.0013ms | -0.000042ms | -3.11% |
| p95 | 0.0031ms | 0.0029ms | +0.00019ms | +6.29% |
| p99 | 0.0059ms | 0.0081ms | -0.0022ms | -27.32% |
| mean | 0.0016ms | 0.0016ms | -0.000039ms | -2.36% |
| min | 0.0012ms | 0.0011ms | +0.000083ms | +7.66% |
| max | 0.01ms | 0.02ms | -0.0065ms | -33.62% |
| total | 0.32ms | 0.33ms | -0.0078ms | -2.36% |

