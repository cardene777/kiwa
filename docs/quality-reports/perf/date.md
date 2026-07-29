# Perf Suite — date

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| addDays | 0.00029ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| formatDate | 0.00096ms | 0.0016ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| createDateClient | 0.00038ms | 0.00056ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| addDays | 0.01ms | 10ms | PASS |
| formatDate | 0.02ms | 10ms | PASS |
| createDateClient | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| addDays | 5112 B | -46745 B | 102400 B | yes | PASS |
| formatDate | -3584 B | 0 B | 102400 B | yes | PASS |
| createDateClient | 8496 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### addDays

# Perf Report — addDays.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00029ms |
| p95 | 0.0015ms |
| p99 | 0.0049ms |
| mean | 0.00049ms |
| stdev | 0.00069ms |
| min | 0.00025ms |
| max | 0.0054ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p50 | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| p95 | 0.0015ms | 0.00042ms | +0.0011ms | +267.98% |
| p99 | 0.0049ms | 0.0035ms | +0.0014ms | +40.68% |
| mean | 0.00049ms | 0.00040ms | +0.000092ms | +23.03% |
| min | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| max | 0.0054ms | 0.0053ms | +0.00013ms | +2.36% |
| total | 0.10ms | 0.08ms | +0.02ms | +23.03% |

### formatDate

# Perf Report — formatDate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0011ms |
| p95 | 0.0016ms |
| p99 | 0.0071ms |
| mean | 0.0012ms |
| stdev | 0.0010ms |
| min | 0.00088ms |
| max | 0.01ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.0010ms | -0.000038ms | -3.81% |
| p50 | 0.0011ms | 0.0010ms | +0.000084ms | +8.40% |
| p95 | 0.0016ms | 0.0015ms | +0.00013ms | +8.69% |
| p99 | 0.0071ms | 0.0039ms | +0.0033ms | +83.48% |
| mean | 0.0012ms | 0.0012ms | +0.000091ms | +7.85% |
| min | 0.00088ms | 0.00092ms | -0.000042ms | -4.58% |
| max | 0.01ms | 0.01ms | -0.0040ms | -27.45% |
| total | 0.25ms | 0.23ms | +0.02ms | +7.85% |

### createDateClient

# Perf Report — createDateClient.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00038ms |
| p95 | 0.00056ms |
| p99 | 0.0030ms |
| mean | 0.00050ms |
| stdev | 0.00080ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00056ms | 0.00056ms | -0.0000041ms | -0.74% |
| p99 | 0.0030ms | 0.0023ms | +0.00069ms | +30.30% |
| mean | 0.00050ms | 0.00051ms | -0.000014ms | -2.75% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.0014ms | -12.09% |
| total | 0.10ms | 0.10ms | -0.0028ms | -2.75% |

