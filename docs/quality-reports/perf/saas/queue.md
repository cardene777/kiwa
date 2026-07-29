# Perf Suite — queue

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| bullmqEnvAccessor | 0.00017ms | 0.00059ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| inngestEnvAccessor | 0.00013ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| cloudflareQueuesEnvAccessor | 0.00017ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| sqsEnvAccessor | 0.00017ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| rabbitmqEnvAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bullmqEnvAccessor | 0.01ms | 10ms | PASS |
| inngestEnvAccessor | 0.01ms | 10ms | PASS |
| cloudflareQueuesEnvAccessor | 0.01ms | 10ms | PASS |
| sqsEnvAccessor | 0.00ms | 10ms | PASS |
| rabbitmqEnvAccessor | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bullmqEnvAccessor | -15824 B | 0 B | 102400 B | yes | PASS |
| inngestEnvAccessor | -16432 B | 0 B | 102400 B | yes | PASS |
| cloudflareQueuesEnvAccessor | 584 B | 0 B | 102400 B | yes | PASS |
| sqsEnvAccessor | 680 B | 0 B | 102400 B | yes | PASS |
| rabbitmqEnvAccessor | -192 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### bullmqEnvAccessor

# Perf Report — bullmqEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00059ms |
| p99 | 0.0015ms |
| mean | 0.00025ms |
| stdev | 0.00033ms |
| min | 0.00013ms |
| max | 0.0029ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p50 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p95 | 0.00059ms | 0.00029ms | +0.00029ms | +99.30% |
| p99 | 0.0015ms | 0.0078ms | -0.0062ms | -80.11% |
| mean | 0.00025ms | 0.00060ms | -0.00035ms | -58.05% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0029ms | 0.06ms | -0.06ms | -95.32% |
| total | 0.05ms | 0.12ms | -0.07ms | -58.05% |

### inngestEnvAccessor

# Perf Report — inngestEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00021ms |
| p99 | 0.00050ms |
| mean | 0.00016ms |
| stdev | 0.000076ms |
| min | 0.00013ms |
| max | 0.00083ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00017ms | -0.000041ms | -24.70% |
| p95 | 0.00021ms | 0.00017ms | +0.000041ms | +24.55% |
| p99 | 0.00050ms | 0.00058ms | -0.000082ms | -14.01% |
| mean | 0.00016ms | 0.00016ms | -0.0000013ms | -0.83% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.00083ms | 0.00092ms | -0.000084ms | -9.16% |
| total | 0.03ms | 0.03ms | -0.00026ms | -0.83% |

### cloudflareQueuesEnvAccessor

# Perf Report — cloudflareQueuesEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00029ms |
| p99 | 0.0019ms |
| mean | 0.00032ms |
| stdev | 0.0011ms |
| min | 0.00017ms |
| max | 0.02ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00029ms | 0.00029ms | +0.0000010ms | +0.34% |
| p99 | 0.0019ms | 0.0011ms | +0.00085ms | +78.33% |
| mean | 0.00032ms | 0.00031ms | +0.0000077ms | +2.45% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0029ms | +22.05% |
| total | 0.06ms | 0.06ms | +0.0015ms | +2.45% |

### sqsEnvAccessor

# Perf Report — sqsEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00025ms |
| p99 | 0.00063ms |
| mean | 0.00022ms |
| stdev | 0.00024ms |
| min | 0.00017ms |
| max | 0.0034ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | -0.0000010ms | -0.60% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p99 | 0.00063ms | 0.0011ms | -0.00051ms | -44.48% |
| mean | 0.00022ms | 0.00025ms | -0.000024ms | -9.59% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0034ms | 0.0052ms | -0.0018ms | -35.21% |
| total | 0.04ms | 0.05ms | -0.0047ms | -9.59% |

### rabbitmqEnvAccessor

# Perf Report — rabbitmqEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.00051ms |
| mean | 0.00016ms |
| stdev | 0.00010ms |
| min | 0.00013ms |
| max | 0.0011ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00017ms | -0.000041ms | -24.92% |
| p95 | 0.00017ms | 0.00021ms | -0.000042ms | -20.10% |
| p99 | 0.00051ms | 0.0010ms | -0.00049ms | -49.48% |
| mean | 0.00016ms | 0.00018ms | -0.000019ms | -10.90% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0011ms | 0.0019ms | -0.00079ms | -41.28% |
| total | 0.03ms | 0.04ms | -0.0038ms | -10.90% |

