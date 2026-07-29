# Perf Suite — queue

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| bullmqEnvAccessor | 0.00017ms | 0.00097ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| inngestEnvAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| cloudflareQueuesEnvAccessor | 0.00017ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (差 0.000042ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| sqsEnvAccessor | 0.00017ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| rabbitmqEnvAccessor | 0.00013ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bullmqEnvAccessor | 0.01ms | 10ms | PASS |
| inngestEnvAccessor | 0.01ms | 10ms | PASS |
| cloudflareQueuesEnvAccessor | 0.00ms | 10ms | PASS |
| sqsEnvAccessor | 0.00ms | 10ms | PASS |
| rabbitmqEnvAccessor | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bullmqEnvAccessor | -23048 B | 0 B | 102400 B | yes | PASS |
| inngestEnvAccessor | -16432 B | 0 B | 102400 B | yes | PASS |
| cloudflareQueuesEnvAccessor | 680 B | 0 B | 102400 B | yes | PASS |
| sqsEnvAccessor | -448 B | 0 B | 102400 B | yes | PASS |
| rabbitmqEnvAccessor | 912 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### bullmqEnvAccessor

# Perf Report — bullmqEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00097ms |
| p99 | 0.0020ms |
| mean | 0.00027ms |
| stdev | 0.00038ms |
| min | 0.00013ms |
| max | 0.0034ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p50 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p95 | 0.00097ms | 0.00029ms | +0.00067ms | +228.63% |
| p99 | 0.0020ms | 0.0078ms | -0.0058ms | -74.26% |
| mean | 0.00027ms | 0.00060ms | -0.00033ms | -55.72% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0034ms | 0.06ms | -0.06ms | -94.50% |
| total | 0.05ms | 0.12ms | -0.07ms | -55.72% |

### inngestEnvAccessor

# Perf Report — inngestEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00017ms |
| p99 | 0.00042ms |
| mean | 0.00016ms |
| stdev | 0.000089ms |
| min | 0.00013ms |
| max | 0.0012ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p95 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p99 | 0.00042ms | 0.00058ms | -0.00017ms | -28.27% |
| mean | 0.00016ms | 0.00016ms | +0.0000025ms | +1.57% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0012ms | 0.00092ms | +0.00029ms | +31.84% |
| total | 0.03ms | 0.03ms | +0.00050ms | +1.57% |

### cloudflareQueuesEnvAccessor

# Perf Report — cloudflareQueuesEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00021ms |
| p99 | 0.0018ms |
| mean | 0.00031ms |
| stdev | 0.0012ms |
| min | 0.00017ms |
| max | 0.02ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00021ms | -0.000042ms | -20.19% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00021ms | 0.00029ms | -0.000080ms | -27.47% |
| p99 | 0.0018ms | 0.0011ms | +0.00070ms | +64.58% |
| mean | 0.00031ms | 0.00031ms | +9.8e-7ms | +0.31% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0033ms | +25.57% |
| total | 0.06ms | 0.06ms | +0.00020ms | +0.31% |

### sqsEnvAccessor

# Perf Report — sqsEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00025ms |
| p99 | 0.00088ms |
| mean | 0.00023ms |
| stdev | 0.00035ms |
| min | 0.00017ms |
| max | 0.0049ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | -0.0000010ms | -0.60% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p99 | 0.00088ms | 0.0011ms | -0.00026ms | -22.53% |
| mean | 0.00023ms | 0.00025ms | -0.000016ms | -6.30% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0049ms | 0.0052ms | -0.00029ms | -5.62% |
| total | 0.05ms | 0.05ms | -0.0031ms | -6.30% |

### rabbitmqEnvAccessor

# Perf Report — rabbitmqEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.00059ms |
| mean | 0.00017ms |
| stdev | 0.000096ms |
| min | 0.00013ms |
| max | 0.0011ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00017ms | +5.0e-7ms | +0.30% |
| p95 | 0.00021ms | 0.00021ms | -0.0000010ms | -0.48% |
| p99 | 0.00059ms | 0.0010ms | -0.00041ms | -41.21% |
| mean | 0.00017ms | 0.00018ms | -0.0000069ms | -3.90% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0011ms | 0.0019ms | -0.00083ms | -43.42% |
| total | 0.03ms | 0.04ms | -0.0014ms | -3.90% |

