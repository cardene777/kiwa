# Perf Suite — crypto

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| signAndVerifyJWT | 0.0057ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| hashSha256 | 0.0022ms | 0.0048ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| aesGcmRoundtrip | 0.0056ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signAndVerifyJWT | 0.08ms | 10ms | PASS |
| hashSha256 | 0.03ms | 10ms | PASS |
| aesGcmRoundtrip | 0.09ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signAndVerifyJWT | -34496 B | 0 B | 102400 B | yes | PASS |
| hashSha256 | -26808 B | 0 B | 102400 B | yes | PASS |
| aesGcmRoundtrip | -17128 B | -38484 B | 102400 B | yes | PASS |

## Detailed serial reports

### signAndVerifyJWT

# Perf Report — signAndVerifyJWT.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0057ms |
| p50 | 0.0066ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0074ms |
| stdev | 0.0026ms |
| min | 0.0055ms |
| max | 0.02ms |
| total | 1.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0057ms | 0.0063ms | -0.00067ms | -10.60% |
| p50 | 0.0066ms | 0.0074ms | -0.00081ms | -10.95% |
| p95 | 0.01ms | 0.03ms | -0.02ms | -56.13% |
| p99 | 0.02ms | 0.10ms | -0.08ms | -80.94% |
| mean | 0.0074ms | 0.02ms | -0.0080ms | -51.92% |
| min | 0.0055ms | 0.0060ms | -0.00054ms | -9.03% |
| max | 0.02ms | 0.42ms | -0.40ms | -95.04% |
| total | 1.47ms | 3.07ms | -1.59ms | -51.92% |

### hashSha256

# Perf Report — hashSha256.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0023ms |
| p95 | 0.0048ms |
| p99 | 0.0096ms |
| mean | 0.0028ms |
| stdev | 0.0013ms |
| min | 0.0021ms |
| max | 0.01ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0025ms | -0.00037ms | -14.75% |
| p50 | 0.0023ms | 0.0027ms | -0.00037ms | -13.85% |
| p95 | 0.0048ms | 0.0048ms | -0.000054ms | -1.12% |
| p99 | 0.0096ms | 0.0094ms | +0.00012ms | +1.22% |
| mean | 0.0028ms | 0.0030ms | -0.00026ms | -8.74% |
| min | 0.0021ms | 0.0025ms | -0.00037ms | -15.26% |
| max | 0.01ms | 0.01ms | -0.0015ms | -11.55% |
| total | 0.55ms | 0.61ms | -0.05ms | -8.74% |

### aesGcmRoundtrip

# Perf Report — aesGcmRoundtrip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0056ms |
| p50 | 0.0061ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0072ms |
| stdev | 0.0027ms |
| min | 0.0055ms |
| max | 0.03ms |
| total | 1.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0056ms | 0.0063ms | -0.00067ms | -10.60% |
| p50 | 0.0061ms | 0.0068ms | -0.00073ms | -10.71% |
| p95 | 0.01ms | 0.01ms | +0.00058ms | +4.87% |
| p99 | 0.02ms | 0.02ms | -0.00023ms | -1.28% |
| mean | 0.0072ms | 0.0076ms | -0.00042ms | -5.53% |
| min | 0.0055ms | 0.0060ms | -0.00046ms | -7.69% |
| max | 0.03ms | 0.02ms | +0.00087ms | +3.54% |
| total | 1.43ms | 1.51ms | -0.08ms | -5.53% |

