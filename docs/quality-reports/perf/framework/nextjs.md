# Perf Suite — nextjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeServerAction | 0.00079ms | 0.0030ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeMiddleware | 0.0044ms | 0.0072ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderServerComponent | 0.00042ms | 0.00060ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerAction | 0.02ms | 10ms | PASS |
| invokeMiddleware | 0.08ms | 10ms | PASS |
| renderServerComponent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerAction | 432 B | 0 B | 102400 B | yes | PASS |
| invokeMiddleware | -11616 B | 0 B | 102400 B | yes | PASS |
| renderServerComponent | -15400 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerAction

# Perf Report — invokeServerAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00079ms |
| p50 | 0.00083ms |
| p95 | 0.0030ms |
| p99 | 0.0094ms |
| mean | 0.0013ms |
| stdev | 0.0020ms |
| min | 0.00063ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00079ms | 0.00087ms | -0.000080ms | -9.17% |
| p50 | 0.00083ms | 0.00088ms | -0.000041ms | -4.74% |
| p95 | 0.0030ms | 0.0025ms | +0.00049ms | +19.97% |
| p99 | 0.0094ms | 0.0070ms | +0.0024ms | +33.53% |
| mean | 0.0013ms | 0.0013ms | +0.000036ms | +2.84% |
| min | 0.00063ms | 0.00083ms | -0.00021ms | -24.97% |
| max | 0.02ms | 0.02ms | -0.0018ms | -8.02% |
| total | 0.26ms | 0.25ms | +0.0071ms | +2.84% |

### invokeMiddleware

# Perf Report — invokeMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0044ms |
| p50 | 0.0045ms |
| p95 | 0.0072ms |
| p99 | 0.01ms |
| mean | 0.0051ms |
| stdev | 0.0023ms |
| min | 0.0043ms |
| max | 0.03ms |
| total | 1.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0044ms | 0.0052ms | -0.00075ms | -14.52% |
| p50 | 0.0045ms | 0.0054ms | -0.00083ms | -15.50% |
| p95 | 0.0072ms | 0.0087ms | -0.0014ms | -16.38% |
| p99 | 0.01ms | 0.02ms | -0.0028ms | -16.59% |
| mean | 0.0051ms | 0.0059ms | -0.00081ms | -13.69% |
| min | 0.0043ms | 0.0051ms | -0.00075ms | -14.76% |
| max | 0.03ms | 0.02ms | +0.0011ms | +4.66% |
| total | 1.02ms | 1.19ms | -0.16ms | -13.69% |

### renderServerComponent

# Perf Report — renderServerComponent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.00060ms |
| p99 | 0.0037ms |
| mean | 0.00061ms |
| stdev | 0.0010ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p50 | 0.00046ms | 0.00046ms | -0.0000010ms | -0.22% |
| p95 | 0.00060ms | 0.00069ms | -0.000090ms | -13.08% |
| p99 | 0.0037ms | 0.0031ms | +0.00054ms | +17.43% |
| mean | 0.00061ms | 0.00061ms | -0.0000023ms | -0.37% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.01ms | 0.01ms | +0.00054ms | +4.36% |
| total | 0.12ms | 0.12ms | -0.00046ms | -0.37% |

