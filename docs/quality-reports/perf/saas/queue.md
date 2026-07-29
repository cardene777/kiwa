# Perf Suite — queue

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| bullmqEnvAccessor | 0.00017ms | 0.00088ms | 5ms | 0.00033ms | PASS | stable (差 0.000041ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| inngestEnvAccessor | 0.00013ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| cloudflareQueuesEnvAccessor | 0.00021ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| sqsEnvAccessor | 0.00042ms | 0.00055ms | 5ms | 0.00033ms | PASS | stable (差 0.00025ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| rabbitmqEnvAccessor | 0.00017ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (差 0.000041ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bullmqEnvAccessor | 0.01ms | 10ms | PASS |
| inngestEnvAccessor | 0.00ms | 10ms | PASS |
| cloudflareQueuesEnvAccessor | 0.00ms | 10ms | PASS |
| sqsEnvAccessor | 0.02ms | 10ms | PASS |
| rabbitmqEnvAccessor | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bullmqEnvAccessor | -13160 B | 0 B | 102400 B | yes | PASS |
| inngestEnvAccessor | -15104 B | 0 B | 102400 B | yes | PASS |
| cloudflareQueuesEnvAccessor | 2624 B | 0 B | 102400 B | yes | PASS |
| sqsEnvAccessor | 2712 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.00088ms |
| p99 | 0.0037ms |
| mean | 0.00034ms |
| stdev | 0.00096ms |
| min | 0.00013ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p50 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p95 | 0.00088ms | 0.00029ms | +0.00059ms | +199.69% |
| p99 | 0.0037ms | 0.0078ms | -0.0041ms | -52.21% |
| mean | 0.00034ms | 0.00060ms | -0.00026ms | -42.68% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.06ms | -0.05ms | -80.65% |
| total | 0.07ms | 0.12ms | -0.05ms | -42.68% |

### inngestEnvAccessor

# Perf Report — inngestEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00021ms |
| p99 | 0.00071ms |
| mean | 0.00015ms |
| stdev | 0.000088ms |
| min | 0.00013ms |
| max | 0.00092ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00017ms | -0.000041ms | -24.70% |
| p95 | 0.00021ms | 0.00017ms | +0.000041ms | +24.55% |
| p99 | 0.00071ms | 0.00058ms | +0.00012ms | +21.13% |
| mean | 0.00015ms | 0.00016ms | -0.0000048ms | -3.02% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.00092ms | 0.00092ms | 0.00ms | 0.00% |
| total | 0.03ms | 0.03ms | -0.00096ms | -3.02% |

### cloudflareQueuesEnvAccessor

# Perf Report — cloudflareQueuesEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00025ms |
| p99 | 0.0021ms |
| mean | 0.00035ms |
| stdev | 0.0013ms |
| min | 0.00017ms |
| max | 0.02ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| p99 | 0.0021ms | 0.0011ms | +0.0010ms | +94.99% |
| mean | 0.00035ms | 0.00031ms | +0.000036ms | +11.37% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0055ms | +41.86% |
| total | 0.07ms | 0.06ms | +0.0071ms | +11.37% |

### sqsEnvAccessor

# Perf Report — sqsEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.00055ms |
| p99 | 0.0036ms |
| mean | 0.00060ms |
| stdev | 0.0012ms |
| min | 0.00042ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00017ms | +0.00025ms | +149.70% |
| p50 | 0.00046ms | 0.00021ms | +0.00025ms | +120.19% |
| p95 | 0.00055ms | 0.00025ms | +0.00030ms | +118.08% |
| p99 | 0.0036ms | 0.0011ms | +0.0025ms | +216.84% |
| mean | 0.00060ms | 0.00025ms | +0.00036ms | +144.75% |
| min | 0.00042ms | 0.00017ms | +0.00025ms | +150.60% |
| max | 0.01ms | 0.0052ms | +0.0095ms | +182.36% |
| total | 0.12ms | 0.05ms | +0.07ms | +144.75% |

### rabbitmqEnvAccessor

# Perf Report — rabbitmqEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.00088ms |
| mean | 0.00019ms |
| stdev | 0.00019ms |
| min | 0.00013ms |
| max | 0.0025ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p50 | 0.00017ms | 0.00017ms | +5.0e-7ms | +0.30% |
| p95 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p99 | 0.00088ms | 0.0010ms | -0.00012ms | -12.29% |
| mean | 0.00019ms | 0.00018ms | +0.000016ms | +9.27% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0025ms | 0.0019ms | +0.00063ms | +32.67% |
| total | 0.04ms | 0.04ms | +0.0033ms | +9.27% |

