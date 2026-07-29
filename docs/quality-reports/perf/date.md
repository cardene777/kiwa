# Perf Suite — date

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| addDays | 0.00025ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| formatDate | 0.00088ms | 0.0014ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| createDateClient | 0.00029ms | 0.00050ms | 5ms | 0.00033ms | PASS | stable (差 0.000083ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| addDays | 0.01ms | 10ms | PASS |
| formatDate | 0.02ms | 10ms | PASS |
| createDateClient | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| addDays | -19944 B | 0 B | 102400 B | yes | PASS |
| formatDate | -19576 B | 0 B | 102400 B | yes | PASS |
| createDateClient | -232 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### addDays

# Perf Report — addDays.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.0012ms |
| p99 | 0.0069ms |
| mean | 0.00052ms |
| stdev | 0.0010ms |
| min | 0.00021ms |
| max | 0.0086ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| p50 | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| p95 | 0.0012ms | 0.00042ms | +0.00079ms | +188.28% |
| p99 | 0.0069ms | 0.0035ms | +0.0034ms | +98.46% |
| mean | 0.00052ms | 0.00040ms | +0.00012ms | +29.34% |
| min | 0.00021ms | 0.00029ms | -0.000083ms | -28.52% |
| max | 0.0086ms | 0.0053ms | +0.0033ms | +63.01% |
| total | 0.10ms | 0.08ms | +0.02ms | +29.34% |

### formatDate

# Perf Report — formatDate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00096ms |
| p95 | 0.0014ms |
| p99 | 0.0038ms |
| mean | 0.0011ms |
| stdev | 0.00060ms |
| min | 0.00079ms |
| max | 0.0067ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.0010ms | -0.00012ms | -12.14% |
| p50 | 0.00096ms | 0.0010ms | -0.000041ms | -4.10% |
| p95 | 0.0014ms | 0.0015ms | -0.000085ms | -5.82% |
| p99 | 0.0038ms | 0.0039ms | -0.000085ms | -2.17% |
| mean | 0.0011ms | 0.0012ms | -0.000093ms | -8.05% |
| min | 0.00079ms | 0.00092ms | -0.00013ms | -13.74% |
| max | 0.0067ms | 0.01ms | -0.0077ms | -53.18% |
| total | 0.21ms | 0.23ms | -0.02ms | -8.05% |

### createDateClient

# Perf Report — createDateClient.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00050ms |
| p99 | 0.0024ms |
| mean | 0.00042ms |
| stdev | 0.00058ms |
| min | 0.00029ms |
| max | 0.0062ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00038ms | -0.000083ms | -22.13% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.00050ms | 0.00056ms | -0.000061ms | -10.79% |
| p99 | 0.0024ms | 0.0023ms | +0.000074ms | +3.25% |
| mean | 0.00042ms | 0.00051ms | -0.000094ms | -18.37% |
| min | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| max | 0.0062ms | 0.01ms | -0.0052ms | -45.78% |
| total | 0.08ms | 0.10ms | -0.02ms | -18.37% |

