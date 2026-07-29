# Perf Suite — trpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.0044ms | 0.0055ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_batch (5 authenticated mutation) | 0.0025ms | 0.0032ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.02ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky handler retry to success) | 0.02ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.0066ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | cpu | 0.08ms | 0.0044ms | 0.054 | 0.056 | 0.0043ms | 0.0045ms |
| mutation_batch (5 authenticated mutation) | cpu | 0.08ms | 0.0025ms | 0.031 | 0.033 | 0.0025ms | 0.0027ms |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | cpu | 0.08ms | 0.02ms | 0.188 | 0.189 | 0.02ms | 0.02ms |
| retry_recovery (5 flaky handler retry to success) | cpu | 0.08ms | 0.02ms | 0.188 | 0.194 | 0.02ms | 0.02ms |
| concurrent_batch (5 batchInvoke of 4 procedures each) | cpu | 0.08ms | 0.0066ms | 0.082 | 0.087 | 0.0066ms | 0.0070ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.02ms | 200ms | PASS |
| mutation_batch (5 authenticated mutation) | 0.03ms | 200ms | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.07ms | 200ms | PASS |
| retry_recovery (5 flaky handler retry to success) | 0.07ms | 200ms | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 14072 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 authenticated mutation) | -260416 B | 0 B | 102400 B | yes | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 184 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky handler retry to success) | 10296 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 976 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### router_dispatch_workflow (10 query mix via client)

# Perf Report — router_dispatch_workflow (10 query mix via client).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0044ms |
| p50 | 0.0046ms |
| p95 | 0.0055ms |
| p99 | 0.0060ms |
| mean | 0.0047ms |
| stdev | 0.00046ms |
| min | 0.0043ms |
| max | 0.0062ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0044ms | 0.0045ms | -0.00012ms | -2.78% |
| p50 | 0.0046ms | 0.0046ms | -0.000062ms | -1.35% |
| p95 | 0.0055ms | 0.0092ms | -0.0037ms | -40.02% |
| p99 | 0.0060ms | 0.01ms | -0.0074ms | -55.20% |
| mean | 0.0047ms | 0.0054ms | -0.00066ms | -12.27% |
| min | 0.0043ms | 0.0045ms | -0.00017ms | -3.71% |
| max | 0.0062ms | 0.01ms | -0.0084ms | -57.59% |
| total | 0.09ms | 0.11ms | -0.01ms | -12.27% |

### mutation_batch (5 authenticated mutation)

# Perf Report — mutation_batch (5 authenticated mutation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0025ms |
| p50 | 0.0026ms |
| p95 | 0.0032ms |
| p99 | 0.0061ms |
| mean | 0.0029ms |
| stdev | 0.00096ms |
| min | 0.0025ms |
| max | 0.0069ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0027ms | -0.00013ms | -4.87% |
| p50 | 0.0026ms | 0.0027ms | -0.00015ms | -5.31% |
| p95 | 0.0032ms | 0.0030ms | +0.00023ms | +7.64% |
| p99 | 0.0061ms | 0.0031ms | +0.0031ms | +100.40% |
| mean | 0.0029ms | 0.0028ms | +0.000096ms | +3.46% |
| min | 0.0025ms | 0.0026ms | -0.00017ms | -6.32% |
| max | 0.0069ms | 0.0031ms | +0.0038ms | +123.00% |
| total | 0.06ms | 0.06ms | +0.0019ms | +3.46% |

### middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch)

# Perf Report — middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0022ms |
| min | 0.02ms |
| max | 0.02ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00016ms | -1.06% |
| p50 | 0.02ms | 0.02ms | +0.00021ms | +1.27% |
| p95 | 0.02ms | 0.02ms | -0.00049ms | -2.24% |
| p99 | 0.02ms | 0.02ms | -0.00093ms | -4.06% |
| mean | 0.02ms | 0.02ms | -0.000054ms | -0.32% |
| min | 0.02ms | 0.02ms | -0.000041ms | -0.27% |
| max | 0.02ms | 0.02ms | -0.0010ms | -4.48% |
| total | 0.34ms | 0.34ms | -0.0011ms | -0.32% |

### retry_recovery (5 flaky handler retry to success)

# Perf Report — retry_recovery (5 flaky handler retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0020ms |
| min | 0.02ms |
| max | 0.02ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00049ms | -3.13% |
| p50 | 0.02ms | 0.02ms | -0.0014ms | -8.22% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -34.78% |
| p99 | 0.02ms | 0.04ms | -0.01ms | -36.79% |
| mean | 0.02ms | 0.02ms | -0.0027ms | -14.02% |
| min | 0.02ms | 0.02ms | -0.00042ms | -2.68% |
| max | 0.02ms | 0.04ms | -0.01ms | -37.23% |
| total | 0.34ms | 0.39ms | -0.05ms | -14.02% |

### concurrent_batch (5 batchInvoke of 4 procedures each)

# Perf Report — concurrent_batch (5 batchInvoke of 4 procedures each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0066ms |
| p50 | 0.0075ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0090ms |
| stdev | 0.0037ms |
| min | 0.0066ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0066ms | 0.0070ms | -0.00039ms | -5.59% |
| p50 | 0.0075ms | 0.0078ms | -0.00023ms | -2.95% |
| p95 | 0.02ms | 0.02ms | +0.0021ms | +13.21% |
| p99 | 0.02ms | 0.02ms | +0.0012ms | +6.99% |
| mean | 0.0090ms | 0.0087ms | +0.00027ms | +3.12% |
| min | 0.0066ms | 0.0067ms | -0.00017ms | -2.47% |
| max | 0.02ms | 0.02ms | +0.0010ms | +5.58% |
| total | 0.18ms | 0.17ms | +0.0055ms | +3.12% |

