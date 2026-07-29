# Perf Suite — security

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| buildCspHeader | 0.0045ms | 0.0078ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| validateNonce | 0.00021ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildCspHeader | 0.05ms | 10ms | PASS |
| validateNonce | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildCspHeader | -10776 B | 0 B | 102400 B | yes | PASS |
| validateNonce | -2576 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### buildCspHeader

# Perf Report — buildCspHeader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0045ms |
| p50 | 0.0051ms |
| p95 | 0.0078ms |
| p99 | 0.01ms |
| mean | 0.0054ms |
| stdev | 0.0016ms |
| min | 0.0040ms |
| max | 0.02ms |
| total | 1.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0046ms | -0.00013ms | -2.71% |
| p50 | 0.0051ms | 0.0052ms | -0.00010ms | -2.01% |
| p95 | 0.0078ms | 0.0086ms | -0.00081ms | -9.43% |
| p99 | 0.01ms | 0.01ms | -0.00015ms | -1.18% |
| mean | 0.0054ms | 0.0058ms | -0.00041ms | -7.03% |
| min | 0.0040ms | 0.0040ms | -0.000041ms | -1.03% |
| max | 0.02ms | 0.06ms | -0.04ms | -70.25% |
| total | 1.08ms | 1.17ms | -0.08ms | -7.03% |

### validateNonce

# Perf Report — validateNonce.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00029ms |
| p99 | 0.0021ms |
| mean | 0.00032ms |
| stdev | 0.00076ms |
| min | 0.00021ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00029ms | 0.00025ms | +0.000044ms | +17.62% |
| p99 | 0.0021ms | 0.0020ms | +0.00017ms | +8.84% |
| mean | 0.00032ms | 0.00027ms | +0.000043ms | +15.55% |
| min | 0.00021ms | 0.00017ms | +0.000042ms | +25.30% |
| max | 0.01ms | 0.0053ms | +0.0047ms | +89.00% |
| total | 0.06ms | 0.05ms | +0.0085ms | +15.55% |

