# Perf Suite — security

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| buildCspHeader | 0.0045ms | 0.0075ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| validateNonce | 0.00021ms | 0.00038ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildCspHeader | 0.06ms | 10ms | PASS |
| validateNonce | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildCspHeader | -9016 B | 0 B | 102400 B | yes | PASS |
| validateNonce | -3600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### buildCspHeader

# Perf Report — buildCspHeader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0045ms |
| p50 | 0.0050ms |
| p95 | 0.0075ms |
| p99 | 0.01ms |
| mean | 0.0053ms |
| stdev | 0.0013ms |
| min | 0.0040ms |
| max | 0.01ms |
| total | 1.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0046ms | -0.00013ms | -2.71% |
| p50 | 0.0050ms | 0.0052ms | -0.00015ms | -2.80% |
| p95 | 0.0075ms | 0.0086ms | -0.0011ms | -12.53% |
| p99 | 0.01ms | 0.01ms | -0.00056ms | -4.36% |
| mean | 0.0053ms | 0.0058ms | -0.00049ms | -8.44% |
| min | 0.0040ms | 0.0040ms | +0.000041ms | +1.03% |
| max | 0.01ms | 0.06ms | -0.04ms | -74.98% |
| total | 1.07ms | 1.17ms | -0.10ms | -8.44% |

### validateNonce

# Perf Report — validateNonce.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00038ms |
| p99 | 0.0017ms |
| mean | 0.00028ms |
| stdev | 0.00034ms |
| min | 0.00017ms |
| max | 0.0043ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00038ms | 0.00025ms | +0.00013ms | +50.00% |
| p99 | 0.0017ms | 0.0020ms | -0.00029ms | -14.99% |
| mean | 0.00028ms | 0.00027ms | +0.0000021ms | +0.76% |
| min | 0.00017ms | 0.00017ms | +0.0000010ms | +0.60% |
| max | 0.0043ms | 0.0053ms | -0.00096ms | -18.11% |
| total | 0.06ms | 0.05ms | +0.00042ms | +0.76% |

