# Perf Suite — crypto

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| signAndVerifyJWT | 0.0058ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| hashSha256 | 0.0026ms | 0.0051ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| aesGcmRoundtrip | 0.0058ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signAndVerifyJWT | 0.09ms | 10ms | PASS |
| hashSha256 | 0.04ms | 10ms | PASS |
| aesGcmRoundtrip | 0.10ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signAndVerifyJWT | -36248 B | 0 B | 102400 B | yes | PASS |
| hashSha256 | -27984 B | 0 B | 102400 B | yes | PASS |
| aesGcmRoundtrip | -17256 B | -28458 B | 102400 B | yes | PASS |

## Detailed serial reports

### signAndVerifyJWT

# Perf Report — signAndVerifyJWT.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0058ms |
| p50 | 0.0069ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0078ms |
| stdev | 0.0025ms |
| min | 0.0055ms |
| max | 0.02ms |
| total | 1.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0058ms | 0.0063ms | -0.00050ms | -7.90% |
| p50 | 0.0069ms | 0.0074ms | -0.00048ms | -6.46% |
| p95 | 0.01ms | 0.03ms | -0.01ms | -52.10% |
| p99 | 0.02ms | 0.10ms | -0.08ms | -81.93% |
| mean | 0.0078ms | 0.02ms | -0.0076ms | -49.31% |
| min | 0.0055ms | 0.0060ms | -0.00050ms | -8.33% |
| max | 0.02ms | 0.42ms | -0.40ms | -95.26% |
| total | 1.55ms | 3.07ms | -1.51ms | -49.31% |

### hashSha256

# Perf Report — hashSha256.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0026ms |
| p50 | 0.0027ms |
| p95 | 0.0051ms |
| p99 | 0.01ms |
| mean | 0.0032ms |
| stdev | 0.0015ms |
| min | 0.0025ms |
| max | 0.01ms |
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0025ms | +0.000041ms | +1.61% |
| p50 | 0.0027ms | 0.0027ms | +0.0000010ms | +0.04% |
| p95 | 0.0051ms | 0.0048ms | +0.00026ms | +5.33% |
| p99 | 0.01ms | 0.0094ms | +0.0019ms | +20.17% |
| mean | 0.0032ms | 0.0030ms | +0.00015ms | +4.86% |
| min | 0.0025ms | 0.0025ms | +0.0000010ms | +0.04% |
| max | 0.01ms | 0.01ms | -0.00038ms | -2.97% |
| total | 0.63ms | 0.61ms | +0.03ms | +4.86% |

### aesGcmRoundtrip

# Perf Report — aesGcmRoundtrip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0058ms |
| p50 | 0.0062ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0071ms |
| stdev | 0.0027ms |
| min | 0.0056ms |
| max | 0.03ms |
| total | 1.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0058ms | 0.0063ms | -0.00050ms | -7.95% |
| p50 | 0.0062ms | 0.0068ms | -0.00060ms | -8.87% |
| p95 | 0.01ms | 0.01ms | +0.0018ms | +15.35% |
| p99 | 0.02ms | 0.02ms | +0.00086ms | +4.92% |
| mean | 0.0071ms | 0.0076ms | -0.00045ms | -5.88% |
| min | 0.0056ms | 0.0060ms | -0.00033ms | -5.59% |
| max | 0.03ms | 0.02ms | +0.0015ms | +6.07% |
| total | 1.43ms | 1.51ms | -0.09ms | -5.88% |

