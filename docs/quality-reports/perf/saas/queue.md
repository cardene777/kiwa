# Perf Suite — queue

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| bullmqEnvAccessor | 0.00017ms | 0.00080ms | 5ms | 0.00033ms | PASS | stable (差 0.000041ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| inngestEnvAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| cloudflareQueuesEnvAccessor | 0.00017ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (差 0.000042ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| sqsEnvAccessor | 0.00017ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| rabbitmqEnvAccessor | 0.00013ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bullmqEnvAccessor | 0.01ms | 10ms | PASS |
| inngestEnvAccessor | 0.01ms | 10ms | PASS |
| cloudflareQueuesEnvAccessor | 0.00ms | 10ms | PASS |
| sqsEnvAccessor | 0.00ms | 10ms | PASS |
| rabbitmqEnvAccessor | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bullmqEnvAccessor | 181288 B | 0 B | 102400 B | yes | PASS |
| inngestEnvAccessor | -15968 B | 0 B | 102400 B | yes | PASS |
| cloudflareQueuesEnvAccessor | 680 B | 0 B | 102400 B | yes | PASS |
| sqsEnvAccessor | 584 B | 0 B | 102400 B | yes | PASS |
| rabbitmqEnvAccessor | 256 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### bullmqEnvAccessor

# Perf Report — bullmqEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00080ms |
| p99 | 0.0015ms |
| mean | 0.00026ms |
| stdev | 0.00032ms |
| min | 0.00013ms |
| max | 0.0033ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p50 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p95 | 0.00080ms | 0.00029ms | +0.00050ms | +170.75% |
| p99 | 0.0015ms | 0.0078ms | -0.0063ms | -81.25% |
| mean | 0.00026ms | 0.00060ms | -0.00034ms | -57.18% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0033ms | 0.06ms | -0.06ms | -94.64% |
| total | 0.05ms | 0.12ms | -0.07ms | -57.18% |

### inngestEnvAccessor

# Perf Report — inngestEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.00084ms |
| mean | 0.00016ms |
| stdev | 0.00012ms |
| min | 0.00013ms |
| max | 0.0012ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00017ms | -0.000041ms | -24.70% |
| p95 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p99 | 0.00084ms | 0.00058ms | +0.00025ms | +43.01% |
| mean | 0.00016ms | 0.00016ms | +0.0000014ms | +0.91% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0012ms | 0.00092ms | +0.00025ms | +27.26% |
| total | 0.03ms | 0.03ms | +0.00029ms | +0.91% |

### cloudflareQueuesEnvAccessor

# Perf Report — cloudflareQueuesEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.0017ms |
| mean | 0.00028ms |
| stdev | 0.00094ms |
| min | 0.00017ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00021ms | -0.000042ms | -20.19% |
| p50 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p95 | 0.00021ms | 0.00029ms | -0.000082ms | -28.18% |
| p99 | 0.0017ms | 0.0011ms | +0.00060ms | +55.62% |
| mean | 0.00028ms | 0.00031ms | -0.000031ms | -9.99% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00013ms | -0.96% |
| total | 0.06ms | 0.06ms | -0.0063ms | -9.99% |

### sqsEnvAccessor

# Perf Report — sqsEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.00059ms |
| mean | 0.00021ms |
| stdev | 0.00029ms |
| min | 0.00013ms |
| max | 0.0042ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | -0.0000010ms | -0.60% |
| p50 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p95 | 0.00021ms | 0.00025ms | -0.000041ms | -16.40% |
| p99 | 0.00059ms | 0.0011ms | -0.00055ms | -48.18% |
| mean | 0.00021ms | 0.00025ms | -0.000035ms | -14.01% |
| min | 0.00013ms | 0.00017ms | -0.000041ms | -24.70% |
| max | 0.0042ms | 0.0052ms | -0.0010ms | -20.00% |
| total | 0.04ms | 0.05ms | -0.0069ms | -14.01% |

### rabbitmqEnvAccessor

# Perf Report — rabbitmqEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00025ms |
| p99 | 0.00055ms |
| mean | 0.00023ms |
| stdev | 0.00081ms |
| min | 0.00013ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00017ms | +5.0e-7ms | +0.30% |
| p95 | 0.00025ms | 0.00021ms | +0.000041ms | +19.62% |
| p99 | 0.00055ms | 0.0010ms | -0.00045ms | -45.25% |
| mean | 0.00023ms | 0.00018ms | +0.000058ms | +33.10% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0019ms | +0.0097ms | +506.73% |
| total | 0.05ms | 0.04ms | +0.01ms | +33.10% |

