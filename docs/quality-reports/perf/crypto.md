# Perf Suite — crypto

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| signAndVerifyJWT | 0.0069ms | 0.02ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| hashSha256 | 0.0026ms | 0.0065ms | 5ms | 0.00033ms | PASS | stable (p10 +3% (閾値未満)、 p95 +34% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| aesGcmRoundtrip | 0.0064ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signAndVerifyJWT | 0.42ms | 10ms | PASS |
| hashSha256 | 0.11ms | 10ms | PASS |
| aesGcmRoundtrip | 0.37ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signAndVerifyJWT | -35720 B | 0 B | 102400 B | yes | PASS |
| hashSha256 | -28136 B | -16384 B | 102400 B | yes | PASS |
| aesGcmRoundtrip | -17144 B | -8734 B | 102400 B | yes | PASS |

## Detailed serial reports

### signAndVerifyJWT

# Perf Report — signAndVerifyJWT.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0069ms |
| p50 | 0.0091ms |
| p95 | 0.02ms |
| p99 | 0.12ms |
| mean | 0.01ms |
| stdev | 0.04ms |
| min | 0.0064ms |
| max | 0.44ms |
| total | 2.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0069ms | 0.0063ms | +0.00058ms | +9.14% |
| p50 | 0.0091ms | 0.0074ms | +0.0017ms | +22.75% |
| p95 | 0.02ms | 0.03ms | -0.0078ms | -27.49% |
| p99 | 0.12ms | 0.10ms | +0.02ms | +22.77% |
| mean | 0.01ms | 0.02ms | -0.0010ms | -6.60% |
| min | 0.0064ms | 0.0060ms | +0.00037ms | +6.25% |
| max | 0.44ms | 0.42ms | +0.01ms | +2.64% |
| total | 2.86ms | 3.07ms | -0.20ms | -6.60% |

### hashSha256

# Perf Report — hashSha256.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0026ms |
| p50 | 0.0029ms |
| p95 | 0.0065ms |
| p99 | 0.01ms |
| mean | 0.0033ms |
| stdev | 0.0017ms |
| min | 0.0025ms |
| max | 0.01ms |
| total | 0.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0025ms | +0.000083ms | +3.27% |
| p50 | 0.0029ms | 0.0027ms | +0.00017ms | +6.17% |
| p95 | 0.0065ms | 0.0048ms | +0.0017ms | +34.38% |
| p99 | 0.01ms | 0.0094ms | +0.0025ms | +26.47% |
| mean | 0.0033ms | 0.0030ms | +0.00030ms | +10.02% |
| min | 0.0025ms | 0.0025ms | +0.000042ms | +1.71% |
| max | 0.01ms | 0.01ms | +0.0022ms | +17.82% |
| total | 0.67ms | 0.61ms | +0.06ms | +10.02% |

### aesGcmRoundtrip

# Perf Report — aesGcmRoundtrip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0064ms |
| p50 | 0.0069ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0080ms |
| stdev | 0.0027ms |
| min | 0.0062ms |
| max | 0.03ms |
| total | 1.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0064ms | 0.0063ms | +0.00013ms | +1.99% |
| p50 | 0.0069ms | 0.0068ms | +0.000084ms | +1.23% |
| p95 | 0.01ms | 0.01ms | +0.0019ms | +16.00% |
| p99 | 0.02ms | 0.02ms | +0.0010ms | +5.84% |
| mean | 0.0080ms | 0.0076ms | +0.00039ms | +5.11% |
| min | 0.0062ms | 0.0060ms | +0.00021ms | +3.51% |
| max | 0.03ms | 0.02ms | +0.0015ms | +5.90% |
| total | 1.59ms | 1.51ms | +0.08ms | +5.11% |

