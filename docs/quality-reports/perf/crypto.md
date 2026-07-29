# Perf Suite — crypto

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| signAndVerifyJWT | 0.0060ms | 0.02ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| hashSha256 | 0.0022ms | 0.0052ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| aesGcmRoundtrip | 0.0060ms | 0.02ms | 5ms | 0.00033ms | PASS | stable (p10 -4% (閾値未満)、 p95 +56% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signAndVerifyJWT | 0.13ms | 10ms | PASS |
| hashSha256 | 0.04ms | 10ms | PASS |
| aesGcmRoundtrip | 0.15ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signAndVerifyJWT | -43736 B | 0 B | 102400 B | yes | PASS |
| hashSha256 | -26712 B | 0 B | 102400 B | yes | PASS |
| aesGcmRoundtrip | -17144 B | -28892 B | 102400 B | yes | PASS |

## Detailed serial reports

### signAndVerifyJWT

# Perf Report — signAndVerifyJWT.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0060ms |
| p50 | 0.0072ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0085ms |
| stdev | 0.0049ms |
| min | 0.0057ms |
| max | 0.06ms |
| total | 1.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0063ms | -0.00038ms | -5.99% |
| p50 | 0.0072ms | 0.0074ms | -0.00023ms | -3.09% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -44.80% |
| p99 | 0.02ms | 0.10ms | -0.08ms | -78.35% |
| mean | 0.0085ms | 0.02ms | -0.0068ms | -44.65% |
| min | 0.0057ms | 0.0060ms | -0.00025ms | -4.17% |
| max | 0.06ms | 0.42ms | -0.37ms | -86.48% |
| total | 1.70ms | 3.07ms | -1.37ms | -44.65% |

### hashSha256

# Perf Report — hashSha256.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0024ms |
| p95 | 0.0052ms |
| p99 | 0.010ms |
| mean | 0.0028ms |
| stdev | 0.0013ms |
| min | 0.0021ms |
| max | 0.01ms |
| total | 0.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0025ms | -0.00029ms | -11.49% |
| p50 | 0.0024ms | 0.0027ms | -0.00029ms | -10.75% |
| p95 | 0.0052ms | 0.0048ms | +0.00037ms | +7.68% |
| p99 | 0.010ms | 0.0094ms | +0.00052ms | +5.52% |
| mean | 0.0028ms | 0.0030ms | -0.00024ms | -7.97% |
| min | 0.0021ms | 0.0025ms | -0.00033ms | -13.55% |
| max | 0.01ms | 0.01ms | -0.0019ms | -15.18% |
| total | 0.56ms | 0.61ms | -0.05ms | -7.97% |

### aesGcmRoundtrip

# Perf Report — aesGcmRoundtrip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0060ms |
| p50 | 0.0063ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0082ms |
| stdev | 0.0047ms |
| min | 0.0058ms |
| max | 0.04ms |
| total | 1.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0063ms | -0.00025ms | -3.99% |
| p50 | 0.0063ms | 0.0068ms | -0.00048ms | -7.03% |
| p95 | 0.02ms | 0.01ms | +0.0066ms | +55.74% |
| p99 | 0.03ms | 0.02ms | +0.0082ms | +46.53% |
| mean | 0.0082ms | 0.0076ms | +0.00061ms | +8.02% |
| min | 0.0058ms | 0.0060ms | -0.00017ms | -2.79% |
| max | 0.04ms | 0.02ms | +0.02ms | +66.44% |
| total | 1.64ms | 1.51ms | +0.12ms | +8.02% |

