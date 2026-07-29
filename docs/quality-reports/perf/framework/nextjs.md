# Perf Suite — nextjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeServerAction | 0.00063ms | 0.0019ms | 5ms | 0.00033ms | PASS | stable (差 0.00025ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| invokeMiddleware | 0.0045ms | 0.0091ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderServerComponent | 0.00038ms | 0.00058ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerAction | 0.02ms | 10ms | PASS |
| invokeMiddleware | 0.06ms | 10ms | PASS |
| renderServerComponent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerAction | -17584 B | 0 B | 102400 B | yes | PASS |
| invokeMiddleware | -12544 B | 0 B | 102400 B | yes | PASS |
| renderServerComponent | 600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerAction

# Perf Report — invokeServerAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00079ms |
| p95 | 0.0019ms |
| p99 | 0.0073ms |
| mean | 0.0011ms |
| stdev | 0.0017ms |
| min | 0.00058ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00087ms | -0.00025ms | -28.24% |
| p50 | 0.00079ms | 0.00088ms | -0.000084ms | -9.60% |
| p95 | 0.0019ms | 0.0025ms | -0.00057ms | -23.30% |
| p99 | 0.0073ms | 0.0070ms | +0.00033ms | +4.67% |
| mean | 0.0011ms | 0.0013ms | -0.00015ms | -11.92% |
| min | 0.00058ms | 0.00083ms | -0.00025ms | -30.01% |
| max | 0.02ms | 0.02ms | -0.0032ms | -13.84% |
| total | 0.22ms | 0.25ms | -0.03ms | -11.92% |

### invokeMiddleware

# Perf Report — invokeMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0045ms |
| p50 | 0.0046ms |
| p95 | 0.0091ms |
| p99 | 0.03ms |
| mean | 0.0059ms |
| stdev | 0.0078ms |
| min | 0.0044ms |
| max | 0.10ms |
| total | 1.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0052ms | -0.00071ms | -13.70% |
| p50 | 0.0046ms | 0.0054ms | -0.00075ms | -13.95% |
| p95 | 0.0091ms | 0.0087ms | +0.00043ms | +5.01% |
| p99 | 0.03ms | 0.02ms | +0.0085ms | +51.50% |
| mean | 0.0059ms | 0.0059ms | -0.000024ms | -0.41% |
| min | 0.0044ms | 0.0051ms | -0.00071ms | -13.93% |
| max | 0.10ms | 0.02ms | +0.08ms | +320.88% |
| total | 1.18ms | 1.19ms | -0.0049ms | -0.41% |

### renderServerComponent

# Perf Report — renderServerComponent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00058ms |
| p99 | 0.0038ms |
| mean | 0.00052ms |
| stdev | 0.00059ms |
| min | 0.00038ms |
| max | 0.0054ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p50 | 0.00042ms | 0.00046ms | -0.000042ms | -9.15% |
| p95 | 0.00058ms | 0.00069ms | -0.00011ms | -15.49% |
| p99 | 0.0038ms | 0.0031ms | +0.00065ms | +21.03% |
| mean | 0.00052ms | 0.00061ms | -0.000092ms | -14.95% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0054ms | 0.01ms | -0.0070ms | -56.37% |
| total | 0.10ms | 0.12ms | -0.02ms | -14.95% |

