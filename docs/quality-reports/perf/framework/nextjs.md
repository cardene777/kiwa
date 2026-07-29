# Perf Suite — nextjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeServerAction | 0.00063ms | 0.0033ms | 5ms | 0.00033ms | PASS | stable (差 0.00025ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| invokeMiddleware | 0.0045ms | 0.0089ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderServerComponent | 0.00038ms | 0.00060ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerAction | 0.02ms | 10ms | PASS |
| invokeMiddleware | 0.08ms | 10ms | PASS |
| renderServerComponent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerAction | -389792 B | 0 B | 102400 B | yes | PASS |
| invokeMiddleware | -27768 B | 0 B | 102400 B | yes | PASS |
| renderServerComponent | 600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerAction

# Perf Report — invokeServerAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00071ms |
| p95 | 0.0033ms |
| p99 | 0.0095ms |
| mean | 0.0037ms |
| stdev | 0.04ms |
| min | 0.00058ms |
| max | 0.52ms |
| total | 0.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00087ms | -0.00025ms | -28.24% |
| p50 | 0.00071ms | 0.00088ms | -0.00017ms | -19.09% |
| p95 | 0.0033ms | 0.0025ms | +0.00087ms | +35.48% |
| p99 | 0.0095ms | 0.0070ms | +0.0025ms | +35.92% |
| mean | 0.0037ms | 0.0013ms | +0.0024ms | +194.96% |
| min | 0.00058ms | 0.00083ms | -0.00025ms | -30.01% |
| max | 0.52ms | 0.02ms | +0.49ms | +2154.10% |
| total | 0.74ms | 0.25ms | +0.49ms | +194.96% |

### invokeMiddleware

# Perf Report — invokeMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0045ms |
| p50 | 0.0047ms |
| p95 | 0.0089ms |
| p99 | 0.02ms |
| mean | 0.0062ms |
| stdev | 0.01ms |
| min | 0.0045ms |
| max | 0.15ms |
| total | 1.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0052ms | -0.00062ms | -12.10% |
| p50 | 0.0047ms | 0.0054ms | -0.00071ms | -13.17% |
| p95 | 0.0089ms | 0.0087ms | +0.00021ms | +2.43% |
| p99 | 0.02ms | 0.02ms | +0.0024ms | +14.65% |
| mean | 0.0062ms | 0.0059ms | +0.00023ms | +3.83% |
| min | 0.0045ms | 0.0051ms | -0.00062ms | -12.30% |
| max | 0.15ms | 0.02ms | +0.12ms | +511.57% |
| total | 1.23ms | 1.19ms | +0.05ms | +3.83% |

### renderServerComponent

# Perf Report — renderServerComponent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00060ms |
| p99 | 0.0037ms |
| mean | 0.00053ms |
| stdev | 0.00070ms |
| min | 0.00038ms |
| max | 0.0077ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p50 | 0.00042ms | 0.00046ms | -0.000042ms | -9.15% |
| p95 | 0.00060ms | 0.00069ms | -0.000094ms | -13.68% |
| p99 | 0.0037ms | 0.0031ms | +0.00061ms | +19.70% |
| mean | 0.00053ms | 0.00061ms | -0.000080ms | -13.05% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0077ms | 0.01ms | -0.0048ms | -38.26% |
| total | 0.11ms | 0.12ms | -0.02ms | -13.05% |

