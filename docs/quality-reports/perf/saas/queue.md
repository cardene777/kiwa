# Perf Suite — queue

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| bullmqEnvAccessor | 0.00013ms | 0.0014ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +261%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| inngestEnvAccessor | 0.00013ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +263%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| cloudflareQueuesEnvAccessor | 0.00017ms | 0.00098ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| sqsEnvAccessor | 0.00017ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +198%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| rabbitmqEnvAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +262%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| bullmqEnvAccessor | cpu | 0.08ms | 0.00013ms | 0.002 | 0.002 | 0.00012ms | 0.00013ms |
| inngestEnvAccessor | cpu | 0.08ms | 0.00013ms | 0.002 | 0.002 | 0.00012ms | 0.00013ms |
| cloudflareQueuesEnvAccessor | cpu | 0.08ms | 0.00017ms | 0.002 | 0.002 | 0.00016ms | 0.00017ms |
| sqsEnvAccessor | cpu | 0.08ms | 0.00017ms | 0.002 | 0.002 | 0.00016ms | 0.00017ms |
| rabbitmqEnvAccessor | cpu | 0.08ms | 0.00013ms | 0.002 | 0.002 | 0.00012ms | 0.00013ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bullmqEnvAccessor | 0.00ms | 10ms | PASS |
| inngestEnvAccessor | 0.00ms | 10ms | PASS |
| cloudflareQueuesEnvAccessor | 0.01ms | 10ms | PASS |
| sqsEnvAccessor | 0.00ms | 10ms | PASS |
| rabbitmqEnvAccessor | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bullmqEnvAccessor | -14384 B | 0 B | 102400 B | yes | PASS |
| inngestEnvAccessor | -18400 B | 0 B | 102400 B | yes | PASS |
| cloudflareQueuesEnvAccessor | 4584 B | 0 B | 102400 B | yes | PASS |
| sqsEnvAccessor | 712 B | 0 B | 102400 B | yes | PASS |
| rabbitmqEnvAccessor | 944 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### bullmqEnvAccessor

# Perf Report — bullmqEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.0014ms |
| p99 | 0.0042ms |
| mean | 0.00040ms |
| stdev | 0.0011ms |
| min | 0.00013ms |
| max | 0.0094ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.0014ms | 0.0013ms | +0.000088ms | +6.82% |
| p99 | 0.0042ms | 0.0029ms | +0.0013ms | +44.28% |
| mean | 0.00040ms | 0.00032ms | +0.000080ms | +24.72% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0094ms | 0.01ms | -0.0037ms | -28.12% |
| total | 0.08ms | 0.06ms | +0.02ms | +24.72% |

### inngestEnvAccessor

# Perf Report — inngestEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00025ms |
| p99 | 0.0017ms |
| mean | 0.00021ms |
| stdev | 0.00048ms |
| min | 0.000083ms |
| max | 0.0055ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00025ms | 0.00021ms | +0.000041ms | +19.62% |
| p99 | 0.0017ms | 0.0016ms | +0.000099ms | +6.07% |
| mean | 0.00021ms | 0.00018ms | +0.000024ms | +13.37% |
| min | 0.000083ms | 0.000083ms | 0.00ms | 0.00% |
| max | 0.0055ms | 0.0036ms | +0.0018ms | +50.57% |
| total | 0.04ms | 0.04ms | +0.0049ms | +13.37% |

### cloudflareQueuesEnvAccessor

# Perf Report — cloudflareQueuesEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00098ms |
| p99 | 0.0063ms |
| mean | 0.00047ms |
| stdev | 0.0017ms |
| min | 0.00013ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p95 | 0.00098ms | 0.00051ms | +0.00046ms | +89.58% |
| p99 | 0.0063ms | 0.0058ms | +0.00048ms | +8.38% |
| mean | 0.00047ms | 0.00043ms | +0.000044ms | +10.09% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | +0.0029ms | +15.69% |
| total | 0.09ms | 0.09ms | +0.0087ms | +10.09% |

### sqsEnvAccessor

# Perf Report — sqsEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00025ms |
| p99 | 0.0024ms |
| mean | 0.00027ms |
| stdev | 0.00071ms |
| min | 0.00017ms |
| max | 0.0077ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00017ms | +0.000041ms | +24.55% |
| p95 | 0.00025ms | 0.00025ms | -0.0000020ms | -0.81% |
| p99 | 0.0024ms | 0.0036ms | -0.0012ms | -33.36% |
| mean | 0.00027ms | 0.00026ms | +0.000013ms | +5.00% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0077ms | 0.0054ms | +0.0023ms | +42.64% |
| total | 0.05ms | 0.05ms | +0.0026ms | +5.00% |

### rabbitmqEnvAccessor

# Perf Report — rabbitmqEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.0023ms |
| mean | 0.00022ms |
| stdev | 0.00051ms |
| min | 0.000083ms |
| max | 0.0045ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00017ms | 0.00025ms | -0.000081ms | -32.38% |
| p99 | 0.0023ms | 0.0016ms | +0.00066ms | +40.92% |
| mean | 0.00022ms | 0.00022ms | +0.0000052ms | +2.41% |
| min | 0.000083ms | 0.000083ms | 0.00ms | 0.00% |
| max | 0.0045ms | 0.0066ms | -0.0021ms | -31.46% |
| total | 0.04ms | 0.04ms | +0.0010ms | +2.41% |

