# Perf Suite — date

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| addDays | 0.00025ms | 0.00059ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| formatDate | 0.00088ms | 0.0018ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| createDateClient | 0.00029ms | 0.00047ms | 5ms | 0.00033ms | PASS | stable (差 0.000083ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| addDays | 0.01ms | 10ms | PASS |
| formatDate | 0.01ms | 10ms | PASS |
| createDateClient | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| addDays | -5872 B | 0 B | 102400 B | yes | PASS |
| formatDate | -19576 B | 0 B | 102400 B | yes | PASS |
| createDateClient | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### addDays

# Perf Report — addDays.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00059ms |
| p99 | 0.0033ms |
| mean | 0.00037ms |
| stdev | 0.00050ms |
| min | 0.00021ms |
| max | 0.0047ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| p50 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p95 | 0.00059ms | 0.00042ms | +0.00017ms | +41.62% |
| p99 | 0.0033ms | 0.0035ms | -0.00020ms | -5.89% |
| mean | 0.00037ms | 0.00040ms | -0.000027ms | -6.68% |
| min | 0.00021ms | 0.00029ms | -0.000083ms | -28.52% |
| max | 0.0047ms | 0.0053ms | -0.00062ms | -11.81% |
| total | 0.07ms | 0.08ms | -0.0053ms | -6.68% |

### formatDate

# Perf Report — formatDate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.0010ms |
| p95 | 0.0018ms |
| p99 | 0.0071ms |
| mean | 0.0012ms |
| stdev | 0.0010ms |
| min | 0.00083ms |
| max | 0.0096ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.0010ms | -0.00012ms | -12.14% |
| p50 | 0.0010ms | 0.0010ms | 0.00ms | 0.00% |
| p95 | 0.0018ms | 0.0015ms | +0.00029ms | +19.97% |
| p99 | 0.0071ms | 0.0039ms | +0.0032ms | +82.01% |
| mean | 0.0012ms | 0.0012ms | +0.000011ms | +0.92% |
| min | 0.00083ms | 0.00092ms | -0.000084ms | -9.16% |
| max | 0.0096ms | 0.01ms | -0.0048ms | -33.24% |
| total | 0.23ms | 0.23ms | +0.0021ms | +0.92% |

### createDateClient

# Perf Report — createDateClient.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00047ms |
| p99 | 0.0029ms |
| mean | 0.00043ms |
| stdev | 0.00063ms |
| min | 0.00029ms |
| max | 0.0064ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00038ms | -0.000083ms | -22.13% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.00047ms | 0.00056ms | -0.000090ms | -16.03% |
| p99 | 0.0029ms | 0.0023ms | +0.00066ms | +28.68% |
| mean | 0.00043ms | 0.00051ms | -0.000079ms | -15.40% |
| min | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| max | 0.0064ms | 0.01ms | -0.0050ms | -43.96% |
| total | 0.09ms | 0.10ms | -0.02ms | -15.40% |

