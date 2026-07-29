# Perf Suite — security

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| buildCspHeader | 0.0045ms | 0.0087ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| validateNonce | 0.00021ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildCspHeader | 0.06ms | 10ms | PASS |
| validateNonce | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildCspHeader | -10832 B | 0 B | 102400 B | yes | PASS |
| validateNonce | -3552 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### buildCspHeader

# Perf Report — buildCspHeader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0045ms |
| p50 | 0.0051ms |
| p95 | 0.0087ms |
| p99 | 0.02ms |
| mean | 0.0058ms |
| stdev | 0.0028ms |
| min | 0.0040ms |
| max | 0.03ms |
| total | 1.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0046ms | -0.000079ms | -1.71% |
| p50 | 0.0051ms | 0.0052ms | -0.000062ms | -1.20% |
| p95 | 0.0087ms | 0.0086ms | +0.00010ms | +1.16% |
| p99 | 0.02ms | 0.01ms | +0.0056ms | +43.79% |
| mean | 0.0058ms | 0.0058ms | -0.000031ms | -0.53% |
| min | 0.0040ms | 0.0040ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.06ms | -0.02ms | -42.60% |
| total | 1.16ms | 1.17ms | -0.0062ms | -0.53% |

### validateNonce

# Perf Report — validateNonce.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00025ms |
| p99 | 0.0014ms |
| mean | 0.00025ms |
| stdev | 0.00029ms |
| min | 0.00017ms |
| max | 0.0037ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00021ms | -0.0000010ms | -0.48% |
| p95 | 0.00025ms | 0.00025ms | +0.0000020ms | +0.82% |
| p99 | 0.0014ms | 0.0020ms | -0.00059ms | -29.86% |
| mean | 0.00025ms | 0.00027ms | -0.000019ms | -6.95% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0037ms | 0.0053ms | -0.0016ms | -29.92% |
| total | 0.05ms | 0.05ms | -0.0038ms | -6.95% |

