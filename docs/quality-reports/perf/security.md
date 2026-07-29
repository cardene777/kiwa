# Perf Suite — security

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| buildCspHeader | 0.0047ms | 0.0097ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| validateNonce | 0.00021ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildCspHeader | 0.16ms | 10ms | PASS |
| validateNonce | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildCspHeader | -6872 B | 0 B | 102400 B | yes | PASS |
| validateNonce | -3840 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### buildCspHeader

# Perf Report — buildCspHeader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0047ms |
| p50 | 0.0051ms |
| p95 | 0.0097ms |
| p99 | 0.01ms |
| mean | 0.0060ms |
| stdev | 0.0041ms |
| min | 0.0040ms |
| max | 0.06ms |
| total | 1.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0047ms | 0.0046ms | +0.00012ms | +2.70% |
| p50 | 0.0051ms | 0.0052ms | -0.000062ms | -1.20% |
| p95 | 0.0097ms | 0.0086ms | +0.0011ms | +12.63% |
| p99 | 0.01ms | 0.01ms | +0.0016ms | +12.23% |
| mean | 0.0060ms | 0.0058ms | +0.00021ms | +3.52% |
| min | 0.0040ms | 0.0040ms | +0.000042ms | +1.05% |
| max | 0.06ms | 0.06ms | +0.0031ms | +5.63% |
| total | 1.21ms | 1.17ms | +0.04ms | +3.52% |

### validateNonce

# Perf Report — validateNonce.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.0011ms |
| p99 | 0.02ms |
| mean | 0.0012ms |
| stdev | 0.0077ms |
| min | 0.00021ms |
| max | 0.10ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00025ms | 0.00021ms | +0.000041ms | +19.62% |
| p95 | 0.0011ms | 0.00025ms | +0.00081ms | +324.18% |
| p99 | 0.02ms | 0.0020ms | +0.01ms | +729.83% |
| mean | 0.0012ms | 0.00027ms | +0.00097ms | +353.21% |
| min | 0.00021ms | 0.00017ms | +0.000042ms | +25.30% |
| max | 0.10ms | 0.0053ms | +0.09ms | +1768.74% |
| total | 0.25ms | 0.05ms | +0.19ms | +353.21% |

