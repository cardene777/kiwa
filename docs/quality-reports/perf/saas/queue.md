# Perf Suite — queue

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| bullmqEnvAccessor | 0.00017ms | 0.00097ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| inngestEnvAccessor | 0.00013ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| cloudflareQueuesEnvAccessor | 0.00017ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (差 0.000042ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| sqsEnvAccessor | 0.00017ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| rabbitmqEnvAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

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
| bullmqEnvAccessor | -20656 B | 0 B | 102400 B | yes | PASS |
| inngestEnvAccessor | -16280 B | 0 B | 102400 B | yes | PASS |
| cloudflareQueuesEnvAccessor | 7008 B | 0 B | 102400 B | yes | PASS |
| sqsEnvAccessor | 1600 B | 0 B | 102400 B | yes | PASS |
| rabbitmqEnvAccessor | 1720 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.0013ms |
| mean | 0.00025ms |
| stdev | 0.00038ms |
| min | 0.00013ms |
| max | 0.0043ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p50 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p95 | 0.00097ms | 0.00029ms | +0.00067ms | +228.24% |
| p99 | 0.0013ms | 0.0078ms | -0.0064ms | -82.74% |
| mean | 0.00025ms | 0.00060ms | -0.00035ms | -57.88% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0043ms | 0.06ms | -0.06ms | -93.08% |
| total | 0.05ms | 0.12ms | -0.07ms | -57.88% |

### inngestEnvAccessor

# Perf Report — inngestEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00021ms |
| p99 | 0.00090ms |
| mean | 0.00025ms |
| stdev | 0.0013ms |
| min | 0.00013ms |
| max | 0.02ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00017ms | -0.000041ms | -24.70% |
| p95 | 0.00021ms | 0.00017ms | +0.000041ms | +24.55% |
| p99 | 0.00090ms | 0.00058ms | +0.00031ms | +53.32% |
| mean | 0.00025ms | 0.00016ms | +0.000093ms | +58.28% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.00092ms | +0.02ms | +1844.71% |
| total | 0.05ms | 0.03ms | +0.02ms | +58.28% |

### cloudflareQueuesEnvAccessor

# Perf Report — cloudflareQueuesEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00025ms |
| p99 | 0.0017ms |
| mean | 0.00031ms |
| stdev | 0.0011ms |
| min | 0.00017ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00021ms | -0.000042ms | -20.19% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| p99 | 0.0017ms | 0.0011ms | +0.00062ms | +57.18% |
| mean | 0.00031ms | 0.00031ms | -0.0000067ms | -2.14% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.0011ms | +8.63% |
| total | 0.06ms | 0.06ms | -0.0013ms | -2.14% |

### sqsEnvAccessor

# Perf Report — sqsEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00025ms |
| p99 | 0.00067ms |
| mean | 0.00022ms |
| stdev | 0.00037ms |
| min | 0.00017ms |
| max | 0.0052ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | -0.0000010ms | -0.60% |
| p50 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p95 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p99 | 0.00067ms | 0.0011ms | -0.00046ms | -40.79% |
| mean | 0.00022ms | 0.00025ms | -0.000025ms | -9.96% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0052ms | 0.0052ms | -0.0000010ms | -0.02% |
| total | 0.04ms | 0.05ms | -0.0049ms | -9.96% |

### rabbitmqEnvAccessor

# Perf Report — rabbitmqEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00017ms |
| p99 | 0.00063ms |
| mean | 0.00018ms |
| stdev | 0.00017ms |
| min | 0.00013ms |
| max | 0.0024ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00017ms | +5.0e-7ms | +0.30% |
| p95 | 0.00017ms | 0.00021ms | -0.000040ms | -19.11% |
| p99 | 0.00063ms | 0.0010ms | -0.00037ms | -37.07% |
| mean | 0.00018ms | 0.00018ms | +0.0000046ms | +2.61% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0024ms | 0.0019ms | +0.00046ms | +23.96% |
| total | 0.04ms | 0.04ms | +0.00092ms | +2.61% |

