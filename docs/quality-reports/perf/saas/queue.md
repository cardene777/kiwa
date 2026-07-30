# Perf Suite — queue

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| bullmqEnvAccessor | 0.00013ms | 0.0014ms | 5ms | 0.00032ms | PASS | stable (検知には +0.00032ms (baseline 比 +257%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| inngestEnvAccessor | 0.00013ms | 0.00034ms | 5ms | 0.00031ms | PASS | stable (検知には +0.00031ms (baseline 比 +251%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| cloudflareQueuesEnvAccessor | 0.00017ms | 0.0024ms | 5ms | 0.00031ms | PASS | stable (検知には +0.00031ms (baseline 比 +188%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| sqsEnvAccessor | 0.00017ms | 0.0013ms | 5ms | 0.00031ms | PASS | stable (検知には +0.00031ms (baseline 比 +189%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| rabbitmqEnvAccessor | 0.00013ms | 0.0016ms | 5ms | 0.00031ms | PASS | stable (検知には +0.00031ms (baseline 比 +247%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| bullmqEnvAccessor | cpu | 0.09ms | 0.09ms | 0.00013ms | 0.001 | 0.002 | 0.00012ms | 0.00013ms |
| inngestEnvAccessor | cpu | 0.09ms | 0.10ms | 0.00013ms | 0.001 | 0.002 | 0.00012ms | 0.00013ms |
| cloudflareQueuesEnvAccessor | cpu | 0.09ms | 0.10ms | 0.00017ms | 0.002 | 0.002 | 0.00016ms | 0.00017ms |
| sqsEnvAccessor | cpu | 0.09ms | 0.10ms | 0.00017ms | 0.002 | 0.002 | 0.00016ms | 0.00017ms |
| rabbitmqEnvAccessor | cpu | 0.09ms | 0.10ms | 0.00013ms | 0.001 | 0.002 | 0.00012ms | 0.00013ms |

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
| bullmqEnvAccessor | -21936 B | 0 B | 102400 B | yes | PASS |
| inngestEnvAccessor | -15448 B | 0 B | 102400 B | yes | PASS |
| cloudflareQueuesEnvAccessor | 2648 B | 0 B | 102400 B | yes | PASS |
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
| p50 | 0.00017ms |
| p95 | 0.0014ms |
| p99 | 0.0034ms |
| mean | 0.00034ms |
| stdev | 0.00094ms |
| min | 0.00013ms |
| max | 0.0088ms |
| total | 0.07ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.966)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00012ms | 0.00013ms | -0.0000042ms | -3.35% |
| p50 | 0.00016ms | 0.00013ms | +0.000035ms | +28.35% |
| p95 | 0.0013ms | 0.0017ms | -0.00034ms | -20.12% |
| p99 | 0.0033ms | 0.0036ms | -0.00026ms | -7.23% |
| mean | 0.00033ms | 0.00044ms | -0.00011ms | -25.74% |
| min | 0.00012ms | 0.000083ms | +0.000038ms | +45.55% |
| max | 0.0085ms | 0.01ms | -0.0021ms | -19.97% |
| total | 0.07ms | 0.09ms | -0.02ms | -25.74% |

### inngestEnvAccessor

# Perf Report — inngestEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00034ms |
| p99 | 0.0033ms |
| mean | 0.00025ms |
| stdev | 0.00051ms |
| min | 0.00013ms |
| max | 0.0044ms |
| total | 0.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.946)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00012ms | 0.00013ms | -0.0000068ms | -5.42% |
| p50 | 0.00016ms | 0.00013ms | +0.000032ms | +25.61% |
| p95 | 0.00032ms | 0.00033ms | -0.000016ms | -4.83% |
| p99 | 0.0031ms | 0.0025ms | +0.00062ms | +24.62% |
| mean | 0.00024ms | 0.00022ms | +0.000019ms | +8.67% |
| min | 0.00012ms | 0.000083ms | +0.000035ms | +42.45% |
| max | 0.0041ms | 0.0041ms | +0.000013ms | +0.32% |
| total | 0.05ms | 0.04ms | +0.0038ms | +8.67% |

### cloudflareQueuesEnvAccessor

# Perf Report — cloudflareQueuesEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.0024ms |
| p99 | 0.0086ms |
| mean | 0.00062ms |
| stdev | 0.0020ms |
| min | 0.00017ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.940)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00016ms | 0.00017ms | -0.0000090ms | -5.42% |
| p50 | 0.00020ms | 0.00017ms | +0.000029ms | +17.09% |
| p95 | 0.0022ms | 0.0014ms | +0.00084ms | +59.80% |
| p99 | 0.0081ms | 0.0049ms | +0.0032ms | +64.70% |
| mean | 0.00058ms | 0.00046ms | +0.00012ms | +25.72% |
| min | 0.00016ms | 0.00013ms | +0.000031ms | +24.85% |
| max | 0.02ms | 0.02ms | +0.00078ms | +4.00% |
| total | 0.12ms | 0.09ms | +0.02ms | +25.72% |

### sqsEnvAccessor

# Perf Report — sqsEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.0013ms |
| p99 | 0.0053ms |
| mean | 0.00040ms |
| stdev | 0.00089ms |
| min | 0.00017ms |
| max | 0.0072ms |
| total | 0.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.946)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00016ms | 0.00017ms | -0.0000081ms | -4.87% |
| p50 | 0.00020ms | 0.00021ms | -0.000011ms | -5.44% |
| p95 | 0.0012ms | 0.00070ms | +0.00048ms | +67.78% |
| p99 | 0.0050ms | 0.0058ms | -0.00081ms | -13.93% |
| mean | 0.00038ms | 0.00048ms | -0.00010ms | -21.57% |
| min | 0.00016ms | 0.00013ms | +0.000032ms | +25.57% |
| max | 0.0068ms | 0.03ms | -0.02ms | -73.08% |
| total | 0.08ms | 0.10ms | -0.02ms | -21.57% |

### rabbitmqEnvAccessor

# Perf Report — rabbitmqEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.0016ms |
| p99 | 0.0028ms |
| mean | 0.00031ms |
| stdev | 0.00052ms |
| min | 0.00013ms |
| max | 0.0032ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.930)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00012ms | 0.00013ms | -0.0000087ms | -7.00% |
| p50 | 0.00015ms | 0.00013ms | +0.000029ms | +23.51% |
| p95 | 0.0015ms | 0.00021ms | +0.0013ms | +609.16% |
| p99 | 0.0026ms | 0.0025ms | +0.000054ms | +2.11% |
| mean | 0.00028ms | 0.00020ms | +0.000087ms | +43.92% |
| min | 0.00012ms | 0.000083ms | +0.000033ms | +40.06% |
| max | 0.0029ms | 0.0060ms | -0.0030ms | -50.57% |
| total | 0.06ms | 0.04ms | +0.02ms | +43.92% |

