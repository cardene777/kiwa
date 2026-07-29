# Perf Suite — nextjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeServerAction | 0.00058ms | 0.0031ms | 5ms | 0.00033ms | PASS | stable (差 0.00029ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| invokeMiddleware | 0.0045ms | 0.0067ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderServerComponent | 0.00038ms | 0.00071ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerAction | 0.02ms | 10ms | PASS |
| invokeMiddleware | 0.07ms | 10ms | PASS |
| renderServerComponent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerAction | -298384 B | 0 B | 102400 B | yes | PASS |
| invokeMiddleware | -28512 B | 0 B | 102400 B | yes | PASS |
| renderServerComponent | 600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerAction

# Perf Report — invokeServerAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00071ms |
| p95 | 0.0031ms |
| p99 | 0.0084ms |
| mean | 0.0012ms |
| stdev | 0.0018ms |
| min | 0.00054ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00087ms | -0.00029ms | -33.06% |
| p50 | 0.00071ms | 0.00088ms | -0.00017ms | -18.97% |
| p95 | 0.0031ms | 0.0025ms | +0.00063ms | +25.51% |
| p99 | 0.0084ms | 0.0070ms | +0.0014ms | +19.52% |
| mean | 0.0012ms | 0.0013ms | -0.000045ms | -3.56% |
| min | 0.00054ms | 0.00083ms | -0.00029ms | -35.05% |
| max | 0.02ms | 0.02ms | -0.0035ms | -15.30% |
| total | 0.24ms | 0.25ms | -0.0089ms | -3.56% |

### invokeMiddleware

# Perf Report — invokeMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0045ms |
| p50 | 0.0045ms |
| p95 | 0.0067ms |
| p99 | 0.01ms |
| mean | 0.0051ms |
| stdev | 0.0024ms |
| min | 0.0044ms |
| max | 0.03ms |
| total | 1.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0052ms | -0.00071ms | -13.72% |
| p50 | 0.0045ms | 0.0054ms | -0.00083ms | -15.50% |
| p95 | 0.0067ms | 0.0087ms | -0.0020ms | -23.12% |
| p99 | 0.01ms | 0.02ms | -0.0018ms | -10.90% |
| mean | 0.0051ms | 0.0059ms | -0.00086ms | -14.48% |
| min | 0.0044ms | 0.0051ms | -0.00071ms | -13.93% |
| max | 0.03ms | 0.02ms | +0.0028ms | +11.56% |
| total | 1.01ms | 1.19ms | -0.17ms | -14.48% |

### renderServerComponent

# Perf Report — renderServerComponent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00071ms |
| p99 | 0.0034ms |
| mean | 0.00052ms |
| stdev | 0.00068ms |
| min | 0.00038ms |
| max | 0.0066ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p50 | 0.00042ms | 0.00046ms | -0.000043ms | -9.37% |
| p95 | 0.00071ms | 0.00069ms | +0.000020ms | +2.93% |
| p99 | 0.0034ms | 0.0031ms | +0.00025ms | +8.15% |
| mean | 0.00052ms | 0.00061ms | -0.000092ms | -14.92% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0066ms | 0.01ms | -0.0058ms | -46.98% |
| total | 0.10ms | 0.12ms | -0.02ms | -14.92% |

