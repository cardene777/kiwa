# Perf Suite — nextjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeServerAction | 0.00063ms | 0.0021ms | 5ms | 0.00033ms | PASS | stable (差 0.00025ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| invokeMiddleware | 0.0045ms | 0.0073ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderServerComponent | 0.00038ms | 0.00059ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerAction | 0.02ms | 10ms | PASS |
| invokeMiddleware | 0.07ms | 10ms | PASS |
| renderServerComponent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerAction | -108784 B | 0 B | 102400 B | yes | PASS |
| invokeMiddleware | -12560 B | 0 B | 102400 B | yes | PASS |
| renderServerComponent | 696 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerAction

# Perf Report — invokeServerAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00071ms |
| p95 | 0.0021ms |
| p99 | 0.01ms |
| mean | 0.0034ms |
| stdev | 0.03ms |
| min | 0.00063ms |
| max | 0.47ms |
| total | 0.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00087ms | -0.00025ms | -28.24% |
| p50 | 0.00071ms | 0.00088ms | -0.00017ms | -19.09% |
| p95 | 0.0021ms | 0.0025ms | -0.00041ms | -16.53% |
| p99 | 0.01ms | 0.0070ms | +0.0039ms | +55.92% |
| mean | 0.0034ms | 0.0013ms | +0.0022ms | +175.23% |
| min | 0.00063ms | 0.00083ms | -0.00021ms | -24.97% |
| max | 0.47ms | 0.02ms | +0.45ms | +1951.18% |
| total | 0.69ms | 0.25ms | +0.44ms | +175.23% |

### invokeMiddleware

# Perf Report — invokeMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0045ms |
| p50 | 0.0046ms |
| p95 | 0.0073ms |
| p99 | 0.02ms |
| mean | 0.0055ms |
| stdev | 0.0061ms |
| min | 0.0044ms |
| max | 0.09ms |
| total | 1.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0052ms | -0.00067ms | -12.91% |
| p50 | 0.0046ms | 0.0054ms | -0.00075ms | -13.95% |
| p95 | 0.0073ms | 0.0087ms | -0.0013ms | -15.47% |
| p99 | 0.02ms | 0.02ms | +0.0023ms | +13.67% |
| mean | 0.0055ms | 0.0059ms | -0.00048ms | -8.03% |
| min | 0.0044ms | 0.0051ms | -0.00071ms | -13.93% |
| max | 0.09ms | 0.02ms | +0.06ms | +260.53% |
| total | 1.09ms | 1.19ms | -0.10ms | -8.03% |

### renderServerComponent

# Perf Report — renderServerComponent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00059ms |
| p99 | 0.0028ms |
| mean | 0.00052ms |
| stdev | 0.00067ms |
| min | 0.00038ms |
| max | 0.0069ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p50 | 0.00042ms | 0.00046ms | -0.000043ms | -9.37% |
| p95 | 0.00059ms | 0.00069ms | -0.00010ms | -14.89% |
| p99 | 0.0028ms | 0.0031ms | -0.00033ms | -10.53% |
| mean | 0.00052ms | 0.00061ms | -0.000095ms | -15.53% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0069ms | 0.01ms | -0.0055ms | -44.63% |
| total | 0.10ms | 0.12ms | -0.02ms | -15.53% |

