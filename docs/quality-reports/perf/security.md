# Perf Suite — security

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| buildCspHeader | 0.0049ms | 0.0096ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| validateNonce | 0.00021ms | 0.00033ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildCspHeader | 0.06ms | 10ms | PASS |
| validateNonce | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildCspHeader | -11160 B | 0 B | 102400 B | yes | PASS |
| validateNonce | -2576 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### buildCspHeader

# Perf Report — buildCspHeader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0049ms |
| p50 | 0.0055ms |
| p95 | 0.0096ms |
| p99 | 0.01ms |
| mean | 0.0063ms |
| stdev | 0.0041ms |
| min | 0.0043ms |
| max | 0.06ms |
| total | 1.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0049ms | 0.0046ms | +0.00029ms | +6.30% |
| p50 | 0.0055ms | 0.0052ms | +0.00031ms | +6.02% |
| p95 | 0.0096ms | 0.0086ms | +0.00093ms | +10.82% |
| p99 | 0.01ms | 0.01ms | +0.0010ms | +8.05% |
| mean | 0.0063ms | 0.0058ms | +0.00042ms | +7.26% |
| min | 0.0043ms | 0.0040ms | +0.00029ms | +7.30% |
| max | 0.06ms | 0.06ms | +0.0037ms | +6.61% |
| total | 1.25ms | 1.17ms | +0.08ms | +7.26% |

### validateNonce

# Perf Report — validateNonce.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.00033ms |
| p99 | 0.0017ms |
| mean | 0.00029ms |
| stdev | 0.00036ms |
| min | 0.00021ms |
| max | 0.0046ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00025ms | 0.00021ms | +0.000041ms | +19.62% |
| p95 | 0.00033ms | 0.00025ms | +0.000083ms | +33.22% |
| p99 | 0.0017ms | 0.0020ms | -0.00029ms | -14.98% |
| mean | 0.00029ms | 0.00027ms | +0.000017ms | +6.25% |
| min | 0.00021ms | 0.00017ms | +0.000042ms | +25.30% |
| max | 0.0046ms | 0.0053ms | -0.00071ms | -13.38% |
| total | 0.06ms | 0.05ms | +0.0034ms | +6.25% |

