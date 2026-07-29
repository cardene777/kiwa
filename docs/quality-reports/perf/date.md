# Perf Suite — date

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| addDays | 0.00021ms | 0.00071ms | 5ms | 0.00033ms | PASS | stable (差 0.000082ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| formatDate | 0.0013ms | 0.0017ms | 5ms | 0.00033ms | PASS | stable (差 0.00025ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| createDateClient | 0.00033ms | 0.00060ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| addDays | 0.01ms | 10ms | PASS |
| formatDate | 0.02ms | 10ms | PASS |
| createDateClient | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| addDays | -9792 B | 0 B | 102400 B | yes | PASS |
| formatDate | -3600 B | 0 B | 102400 B | yes | PASS |
| createDateClient | 7968 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### addDays

# Perf Report — addDays.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00029ms |
| p95 | 0.00071ms |
| p99 | 0.0064ms |
| mean | 0.00080ms |
| stdev | 0.0044ms |
| min | 0.00021ms |
| max | 0.05ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00029ms | -0.000082ms | -28.18% |
| p50 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p95 | 0.00071ms | 0.00042ms | +0.00029ms | +69.68% |
| p99 | 0.0064ms | 0.0035ms | +0.0030ms | +85.97% |
| mean | 0.00080ms | 0.00040ms | +0.00040ms | +99.55% |
| min | 0.00021ms | 0.00029ms | -0.000083ms | -28.52% |
| max | 0.05ms | 0.0053ms | +0.04ms | +754.45% |
| total | 0.16ms | 0.08ms | +0.08ms | +99.55% |

### formatDate

# Perf Report — formatDate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0013ms |
| p95 | 0.0017ms |
| p99 | 0.0050ms |
| mean | 0.0014ms |
| stdev | 0.00076ms |
| min | 0.0013ms |
| max | 0.0086ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0010ms | +0.00025ms | +25.51% |
| p50 | 0.0013ms | 0.0010ms | +0.00029ms | +29.20% |
| p95 | 0.0017ms | 0.0015ms | +0.00026ms | +17.87% |
| p99 | 0.0050ms | 0.0039ms | +0.0011ms | +27.94% |
| mean | 0.0014ms | 0.0012ms | +0.00028ms | +24.53% |
| min | 0.0013ms | 0.00092ms | +0.00033ms | +36.31% |
| max | 0.0086ms | 0.01ms | -0.0058ms | -40.46% |
| total | 0.29ms | 0.23ms | +0.06ms | +24.53% |

### createDateClient

# Perf Report — createDateClient.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00060ms |
| p99 | 0.0046ms |
| mean | 0.00050ms |
| stdev | 0.00082ms |
| min | 0.00033ms |
| max | 0.0088ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00060ms | 0.00056ms | +0.000035ms | +6.18% |
| p99 | 0.0046ms | 0.0023ms | +0.0023ms | +101.25% |
| mean | 0.00050ms | 0.00051ms | -0.000012ms | -2.43% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.0088ms | 0.01ms | -0.0026ms | -22.72% |
| total | 0.10ms | 0.10ms | -0.0025ms | -2.43% |

