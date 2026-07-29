# Perf Suite — crypto

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| signAndVerifyJWT | 0.0059ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| hashSha256 | 0.0022ms | 0.0050ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| aesGcmRoundtrip | 0.0060ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signAndVerifyJWT | 0.09ms | 10ms | PASS |
| hashSha256 | 0.04ms | 10ms | PASS |
| aesGcmRoundtrip | 0.10ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signAndVerifyJWT | -37064 B | 0 B | 102400 B | yes | PASS |
| hashSha256 | -28024 B | 0 B | 102400 B | yes | PASS |
| aesGcmRoundtrip | -17144 B | -15061 B | 102400 B | yes | PASS |

## Detailed serial reports

### signAndVerifyJWT

# Perf Report — signAndVerifyJWT.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0059ms |
| p50 | 0.0068ms |
| p95 | 0.01ms |
| p99 | 0.05ms |
| mean | 0.0085ms |
| stdev | 0.0065ms |
| min | 0.0057ms |
| max | 0.06ms |
| total | 1.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0063ms | -0.00042ms | -6.57% |
| p50 | 0.0068ms | 0.0074ms | -0.00058ms | -7.87% |
| p95 | 0.01ms | 0.03ms | -0.01ms | -47.28% |
| p99 | 0.05ms | 0.10ms | -0.05ms | -52.24% |
| mean | 0.0085ms | 0.02ms | -0.0068ms | -44.36% |
| min | 0.0057ms | 0.0060ms | -0.00025ms | -4.17% |
| max | 0.06ms | 0.42ms | -0.36ms | -85.64% |
| total | 1.71ms | 3.07ms | -1.36ms | -44.36% |

### hashSha256

# Perf Report — hashSha256.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0024ms |
| p95 | 0.0050ms |
| p99 | 0.0098ms |
| mean | 0.0028ms |
| stdev | 0.0014ms |
| min | 0.0022ms |
| max | 0.01ms |
| total | 0.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0025ms | -0.00029ms | -11.49% |
| p50 | 0.0024ms | 0.0027ms | -0.00033ms | -12.30% |
| p95 | 0.0050ms | 0.0048ms | +0.00016ms | +3.22% |
| p99 | 0.0098ms | 0.0094ms | +0.00040ms | +4.21% |
| mean | 0.0028ms | 0.0030ms | -0.00025ms | -8.26% |
| min | 0.0022ms | 0.0025ms | -0.00029ms | -11.88% |
| max | 0.01ms | 0.01ms | -0.0024ms | -18.81% |
| total | 0.56ms | 0.61ms | -0.05ms | -8.26% |

### aesGcmRoundtrip

# Perf Report — aesGcmRoundtrip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0060ms |
| p50 | 0.0063ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0084ms |
| stdev | 0.01ms |
| min | 0.0058ms |
| max | 0.14ms |
| total | 1.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0063ms | -0.00030ms | -4.71% |
| p50 | 0.0063ms | 0.0068ms | -0.00050ms | -7.34% |
| p95 | 0.01ms | 0.01ms | +0.0019ms | +15.53% |
| p99 | 0.03ms | 0.02ms | +0.0093ms | +53.22% |
| mean | 0.0084ms | 0.0076ms | +0.00080ms | +10.54% |
| min | 0.0058ms | 0.0060ms | -0.00017ms | -2.79% |
| max | 0.14ms | 0.02ms | +0.11ms | +451.08% |
| total | 1.67ms | 1.51ms | +0.16ms | +10.54% |

