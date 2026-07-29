# Perf Suite — queue

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| bullmqEnvAccessor | 0.00017ms | 0.00084ms | 5ms | 0.00033ms | PASS | stable (差 0.000041ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| inngestEnvAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| cloudflareQueuesEnvAccessor | 0.00017ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (差 0.000042ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| sqsEnvAccessor | 0.00017ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| rabbitmqEnvAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bullmqEnvAccessor | 0.01ms | 10ms | PASS |
| inngestEnvAccessor | 0.00ms | 10ms | PASS |
| cloudflareQueuesEnvAccessor | 0.00ms | 10ms | PASS |
| sqsEnvAccessor | 0.00ms | 10ms | PASS |
| rabbitmqEnvAccessor | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bullmqEnvAccessor | -13584 B | 0 B | 102400 B | yes | PASS |
| inngestEnvAccessor | -16432 B | 0 B | 102400 B | yes | PASS |
| cloudflareQueuesEnvAccessor | -328 B | 0 B | 102400 B | yes | PASS |
| sqsEnvAccessor | 360 B | 0 B | 102400 B | yes | PASS |
| rabbitmqEnvAccessor | -1344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### bullmqEnvAccessor

# Perf Report — bullmqEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00084ms |
| p99 | 0.0015ms |
| mean | 0.00025ms |
| stdev | 0.00038ms |
| min | 0.00013ms |
| max | 0.0045ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p50 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p95 | 0.00084ms | 0.00029ms | +0.00054ms | +184.00% |
| p99 | 0.0015ms | 0.0078ms | -0.0062ms | -80.16% |
| mean | 0.00025ms | 0.00060ms | -0.00035ms | -57.88% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0045ms | 0.06ms | -0.06ms | -92.67% |
| total | 0.05ms | 0.12ms | -0.07ms | -57.88% |

### inngestEnvAccessor

# Perf Report — inngestEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.00054ms |
| mean | 0.00015ms |
| stdev | 0.000078ms |
| min | 0.00013ms |
| max | 0.00096ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00017ms | -0.000041ms | -24.70% |
| p95 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p99 | 0.00054ms | 0.00058ms | -0.000042ms | -7.11% |
| mean | 0.00015ms | 0.00016ms | -0.0000069ms | -4.33% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.00096ms | 0.00092ms | +0.000042ms | +4.58% |
| total | 0.03ms | 0.03ms | -0.0014ms | -4.33% |

### cloudflareQueuesEnvAccessor

# Perf Report — cloudflareQueuesEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00025ms |
| p99 | 0.0022ms |
| mean | 0.00030ms |
| stdev | 0.0011ms |
| min | 0.00013ms |
| max | 0.02ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00021ms | -0.000042ms | -20.19% |
| p50 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p95 | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| p99 | 0.0022ms | 0.0011ms | +0.0011ms | +101.74% |
| mean | 0.00030ms | 0.00031ms | -0.000011ms | -3.52% |
| min | 0.00013ms | 0.00017ms | -0.000041ms | -24.70% |
| max | 0.02ms | 0.01ms | +0.0023ms | +17.26% |
| total | 0.06ms | 0.06ms | -0.0022ms | -3.52% |

### sqsEnvAccessor

# Perf Report — sqsEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00021ms |
| p99 | 0.0014ms |
| mean | 0.00023ms |
| stdev | 0.00036ms |
| min | 0.00017ms |
| max | 0.0049ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | -0.0000010ms | -0.60% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00021ms | 0.00025ms | -0.000041ms | -16.40% |
| p99 | 0.0014ms | 0.0011ms | +0.00024ms | +21.14% |
| mean | 0.00023ms | 0.00025ms | -0.000012ms | -5.02% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0049ms | 0.0052ms | -0.00029ms | -5.61% |
| total | 0.05ms | 0.05ms | -0.0025ms | -5.02% |

### rabbitmqEnvAccessor

# Perf Report — rabbitmqEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.00047ms |
| mean | 0.00016ms |
| stdev | 0.00017ms |
| min | 0.00013ms |
| max | 0.0023ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00017ms | -0.000041ms | -24.92% |
| p95 | 0.00017ms | 0.00021ms | -0.000042ms | -20.10% |
| p99 | 0.00047ms | 0.0010ms | -0.00053ms | -53.45% |
| mean | 0.00016ms | 0.00018ms | -0.000012ms | -7.00% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0023ms | 0.0019ms | +0.00042ms | +21.76% |
| total | 0.03ms | 0.04ms | -0.0025ms | -7.00% |

