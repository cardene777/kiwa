# Perf Suite — date

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| addDays | 0.00025ms | 0.0016ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| formatDate | 0.00083ms | 0.0014ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| createDateClient | 0.00029ms | 0.00047ms | 5ms | 0.00033ms | PASS | stable (差 0.000083ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| addDays | 0.01ms | 10ms | PASS |
| formatDate | 0.02ms | 10ms | PASS |
| createDateClient | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| addDays | 84816 B | 0 B | 102400 B | yes | PASS |
| formatDate | -19576 B | 0 B | 102400 B | yes | PASS |
| createDateClient | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### addDays

# Perf Report — addDays.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.0016ms |
| p99 | 0.0055ms |
| mean | 0.00051ms |
| stdev | 0.00091ms |
| min | 0.00021ms |
| max | 0.0080ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| p50 | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| p95 | 0.0016ms | 0.00042ms | +0.0012ms | +288.27% |
| p99 | 0.0055ms | 0.0035ms | +0.0020ms | +57.82% |
| mean | 0.00051ms | 0.00040ms | +0.00011ms | +28.09% |
| min | 0.00021ms | 0.00029ms | -0.000083ms | -28.52% |
| max | 0.0080ms | 0.0053ms | +0.0027ms | +51.20% |
| total | 0.10ms | 0.08ms | +0.02ms | +28.09% |

### formatDate

# Perf Report — formatDate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.00096ms |
| p95 | 0.0014ms |
| p99 | 0.0069ms |
| mean | 0.0011ms |
| stdev | 0.00088ms |
| min | 0.00079ms |
| max | 0.0076ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.0010ms | -0.00016ms | -16.26% |
| p50 | 0.00096ms | 0.0010ms | -0.000041ms | -4.10% |
| p95 | 0.0014ms | 0.0015ms | -0.000081ms | -5.54% |
| p99 | 0.0069ms | 0.0039ms | +0.0030ms | +77.63% |
| mean | 0.0011ms | 0.0012ms | -0.000032ms | -2.81% |
| min | 0.00079ms | 0.00092ms | -0.00013ms | -13.63% |
| max | 0.0076ms | 0.01ms | -0.0068ms | -47.40% |
| total | 0.22ms | 0.23ms | -0.0065ms | -2.81% |

### createDateClient

# Perf Report — createDateClient.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00047ms |
| p99 | 0.0024ms |
| mean | 0.00043ms |
| stdev | 0.00061ms |
| min | 0.00029ms |
| max | 0.0066ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00038ms | -0.000083ms | -22.13% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.00047ms | 0.00056ms | -0.000096ms | -17.14% |
| p99 | 0.0024ms | 0.0023ms | +0.000077ms | +3.38% |
| mean | 0.00043ms | 0.00051ms | -0.000086ms | -16.68% |
| min | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| max | 0.0066ms | 0.01ms | -0.0048ms | -42.12% |
| total | 0.09ms | 0.10ms | -0.02ms | -16.68% |

