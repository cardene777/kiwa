# Perf Suite — rust-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeAxumHandler | 0.00050ms | 0.0020ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeActixHandler | 0.00050ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureTowerMiddleware | 0.00071ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable (差 0.00013ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| invokeRocketRoute | 0.00050ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +23% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeAxumHandler | 0.01ms | 10ms | PASS |
| invokeActixHandler | 0.01ms | 10ms | PASS |
| captureTowerMiddleware | 0.01ms | 10ms | PASS |
| invokeRocketRoute | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeAxumHandler | -17688 B | 0 B | 102400 B | yes | PASS |
| invokeActixHandler | 16440 B | 0 B | 102400 B | yes | PASS |
| captureTowerMiddleware | 616 B | 0 B | 102400 B | yes | PASS |
| invokeRocketRoute | 3744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeAxumHandler

# Perf Report — invokeAxumHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0020ms |
| p99 | 0.0069ms |
| mean | 0.00085ms |
| stdev | 0.0011ms |
| min | 0.00050ms |
| max | 0.0078ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| p50 | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| p95 | 0.0020ms | 0.0020ms | +0.000046ms | +2.31% |
| p99 | 0.0069ms | 0.0068ms | +0.00011ms | +1.66% |
| mean | 0.00085ms | 0.00083ms | +0.000015ms | +1.85% |
| min | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| max | 0.0078ms | 0.0088ms | -0.0010ms | -11.80% |
| total | 0.17ms | 0.17ms | +0.0031ms | +1.85% |

### invokeActixHandler

# Perf Report — invokeActixHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00050ms |
| p95 | 0.0015ms |
| p99 | 0.0031ms |
| mean | 0.00065ms |
| stdev | 0.00067ms |
| min | 0.00046ms |
| max | 0.0067ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00046ms | +0.000042ms | +9.17% |
| p50 | 0.00050ms | 0.00046ms | +0.000041ms | +8.93% |
| p95 | 0.0015ms | 0.0016ms | -0.000042ms | -2.64% |
| p99 | 0.0031ms | 0.0033ms | -0.00015ms | -4.53% |
| mean | 0.00065ms | 0.00060ms | +0.000043ms | +7.08% |
| min | 0.00046ms | 0.00042ms | +0.000042ms | +10.10% |
| max | 0.0067ms | 0.0052ms | +0.0015ms | +29.58% |
| total | 0.13ms | 0.12ms | +0.0085ms | +7.08% |

### captureTowerMiddleware

# Perf Report — captureTowerMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00071ms |
| p50 | 0.00071ms |
| p95 | 0.0015ms |
| p99 | 0.01ms |
| mean | 0.0011ms |
| stdev | 0.0020ms |
| min | 0.00067ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00071ms | 0.00058ms | +0.00013ms | +21.44% |
| p50 | 0.00071ms | 0.00069ms | +0.000022ms | +3.13% |
| p95 | 0.0015ms | 0.0014ms | +0.000016ms | +1.09% |
| p99 | 0.01ms | 0.0061ms | +0.0070ms | +115.13% |
| mean | 0.0011ms | 0.00088ms | +0.00019ms | +21.74% |
| min | 0.00067ms | 0.00054ms | +0.00013ms | +23.11% |
| max | 0.02ms | 0.01ms | +0.01ms | +91.11% |
| total | 0.21ms | 0.18ms | +0.04ms | +21.74% |

### invokeRocketRoute

# Perf Report — invokeRocketRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00050ms |
| p95 | 0.0011ms |
| p99 | 0.0034ms |
| mean | 0.00065ms |
| stdev | 0.00064ms |
| min | 0.00042ms |
| max | 0.0055ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p95 | 0.0011ms | 0.00086ms | +0.00020ms | +23.13% |
| p99 | 0.0034ms | 0.0028ms | +0.00068ms | +24.84% |
| mean | 0.00065ms | 0.00062ms | +0.000032ms | +5.19% |
| min | 0.00042ms | 0.00046ms | -0.000042ms | -9.15% |
| max | 0.0055ms | 0.0048ms | +0.00067ms | +13.80% |
| total | 0.13ms | 0.12ms | +0.0064ms | +5.19% |

