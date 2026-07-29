# Perf Suite — crypto

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| signAndVerifyJWT | 0.0061ms | 0.02ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| hashSha256 | 0.0023ms | 0.0050ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| aesGcmRoundtrip | 0.0060ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signAndVerifyJWT | 0.11ms | 10ms | PASS |
| hashSha256 | 0.04ms | 10ms | PASS |
| aesGcmRoundtrip | 0.09ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signAndVerifyJWT | -34496 B | 0 B | 102400 B | yes | PASS |
| hashSha256 | -26560 B | 0 B | 102400 B | yes | PASS |
| aesGcmRoundtrip | -17144 B | -34334 B | 102400 B | yes | PASS |

## Detailed serial reports

### signAndVerifyJWT

# Perf Report — signAndVerifyJWT.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0061ms |
| p50 | 0.0070ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.0093ms |
| stdev | 0.0069ms |
| min | 0.0059ms |
| max | 0.07ms |
| total | 1.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0061ms | 0.0063ms | -0.00021ms | -3.28% |
| p50 | 0.0070ms | 0.0074ms | -0.00038ms | -5.06% |
| p95 | 0.02ms | 0.03ms | -0.0071ms | -24.96% |
| p99 | 0.04ms | 0.10ms | -0.06ms | -59.90% |
| mean | 0.0093ms | 0.02ms | -0.0061ms | -39.57% |
| min | 0.0059ms | 0.0060ms | -0.00013ms | -2.08% |
| max | 0.07ms | 0.42ms | -0.35ms | -83.55% |
| total | 1.85ms | 3.07ms | -1.21ms | -39.57% |

### hashSha256

# Perf Report — hashSha256.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0023ms |
| p50 | 0.0025ms |
| p95 | 0.0050ms |
| p99 | 0.01ms |
| mean | 0.0029ms |
| stdev | 0.0015ms |
| min | 0.0023ms |
| max | 0.01ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0025ms | -0.00021ms | -8.22% |
| p50 | 0.0025ms | 0.0027ms | -0.00025ms | -9.23% |
| p95 | 0.0050ms | 0.0048ms | +0.00016ms | +3.29% |
| p99 | 0.01ms | 0.0094ms | +0.0014ms | +14.35% |
| mean | 0.0029ms | 0.0030ms | -0.00012ms | -3.97% |
| min | 0.0023ms | 0.0025ms | -0.00017ms | -6.79% |
| max | 0.01ms | 0.01ms | +0.00017ms | +1.32% |
| total | 0.58ms | 0.61ms | -0.02ms | -3.97% |

### aesGcmRoundtrip

# Perf Report — aesGcmRoundtrip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0060ms |
| p50 | 0.0064ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0078ms |
| stdev | 0.0078ms |
| min | 0.0059ms |
| max | 0.11ms |
| total | 1.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0063ms | -0.00025ms | -3.97% |
| p50 | 0.0064ms | 0.0068ms | -0.00040ms | -5.81% |
| p95 | 0.01ms | 0.01ms | +0.00075ms | +6.28% |
| p99 | 0.02ms | 0.02ms | +0.00067ms | +3.83% |
| mean | 0.0078ms | 0.0076ms | +0.00026ms | +3.46% |
| min | 0.0059ms | 0.0060ms | -0.000041ms | -0.69% |
| max | 0.11ms | 0.02ms | +0.09ms | +354.46% |
| total | 1.57ms | 1.51ms | +0.05ms | +3.46% |

