# Perf Suite — crypto

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| signAndVerifyJWT | 0.0067ms | 0.02ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| hashSha256 | 0.0026ms | 0.0048ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| aesGcmRoundtrip | 0.0067ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signAndVerifyJWT | 0.17ms | 10ms | PASS |
| hashSha256 | 0.04ms | 10ms | PASS |
| aesGcmRoundtrip | 0.16ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signAndVerifyJWT | -37696 B | 28736 B | 102400 B | yes | PASS |
| hashSha256 | -27256 B | 0 B | 102400 B | yes | PASS |
| aesGcmRoundtrip | -17032 B | -11261 B | 102400 B | yes | PASS |

## Detailed serial reports

### signAndVerifyJWT

# Perf Report — signAndVerifyJWT.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0067ms |
| p50 | 0.0079ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0099ms |
| stdev | 0.01ms |
| min | 0.0065ms |
| max | 0.15ms |
| total | 1.99ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0067ms | 0.0063ms | +0.00033ms | +5.27% |
| p50 | 0.0079ms | 0.0074ms | +0.00052ms | +7.02% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -35.95% |
| p99 | 0.02ms | 0.10ms | -0.07ms | -76.02% |
| mean | 0.0099ms | 0.02ms | -0.0054ms | -35.12% |
| min | 0.0065ms | 0.0060ms | +0.00050ms | +8.33% |
| max | 0.15ms | 0.42ms | -0.27ms | -64.42% |
| total | 1.99ms | 3.07ms | -1.08ms | -35.12% |

### hashSha256

# Perf Report — hashSha256.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0026ms |
| p50 | 0.0027ms |
| p95 | 0.0048ms |
| p99 | 0.0089ms |
| mean | 0.0031ms |
| stdev | 0.0013ms |
| min | 0.0025ms |
| max | 0.01ms |
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0025ms | +0.000083ms | +3.27% |
| p50 | 0.0027ms | 0.0027ms | +0.000042ms | +1.55% |
| p95 | 0.0048ms | 0.0048ms | +0.000010ms | +0.22% |
| p99 | 0.0089ms | 0.0094ms | -0.00058ms | -6.14% |
| mean | 0.0031ms | 0.0030ms | +0.000087ms | +2.89% |
| min | 0.0025ms | 0.0025ms | +0.000083ms | +3.38% |
| max | 0.01ms | 0.01ms | -0.00075ms | -5.94% |
| total | 0.62ms | 0.61ms | +0.02ms | +2.89% |

### aesGcmRoundtrip

# Perf Report — aesGcmRoundtrip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0067ms |
| p50 | 0.0071ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0081ms |
| stdev | 0.0027ms |
| min | 0.0064ms |
| max | 0.03ms |
| total | 1.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0067ms | 0.0063ms | +0.00037ms | +5.94% |
| p50 | 0.0071ms | 0.0068ms | +0.00027ms | +3.97% |
| p95 | 0.01ms | 0.01ms | +0.00099ms | +8.32% |
| p99 | 0.02ms | 0.02ms | +0.00076ms | +4.36% |
| mean | 0.0081ms | 0.0076ms | +0.00050ms | +6.64% |
| min | 0.0064ms | 0.0060ms | +0.00046ms | +7.69% |
| max | 0.03ms | 0.02ms | +0.0044ms | +17.87% |
| total | 1.62ms | 1.51ms | +0.10ms | +6.64% |

