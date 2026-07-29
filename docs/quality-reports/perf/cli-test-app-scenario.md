# Perf Suite — cli-test-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 6.75ms | 26.67ms | 500ms | 0.00050ms | PASS | stable (p10 +44% (閾値未満)、 p95 +197% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| batch_cli_run (5x echo test) | 12.25ms | 16.41ms | 1000ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| setup_cleanup_cycle (5 sequential setup+stop) | 3.65ms | 12.59ms | 500ms | 0.00050ms | PASS | stable (p10 -13% (閾値未満)、 p95 +26% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 2, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 12.68ms | 1000ms | PASS |
| batch_cli_run (5x echo test) | 91.77ms | 2000ms | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 14.86ms | 1000ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | -34456 B | 0 B | 102400 B | yes | WAIVED (fs の Buffer pool の伸びを拾うため実装の保持量を表さない (#1719)) |
| batch_cli_run (5x echo test) | 28200 B | 0 B | 102400 B | yes | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | -22936 B | -26608 B | 102400 B | yes | PASS |

## Detailed serial reports

### file_scaffold_workflow (setup + 20 writeFile + listFiles)

# Perf Report — file_scaffold_workflow (setup + 20 writeFile + listFiles).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 6.75ms |
| p50 | 9.08ms |
| p95 | 26.67ms |
| p99 | 26.80ms |
| mean | 12.71ms |
| stdev | 7.51ms |
| min | 4.69ms |
| max | 26.83ms |
| total | 190.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 6.75ms | 4.67ms | +2.08ms | +44.44% |
| p50 | 9.08ms | 6.16ms | +2.92ms | +47.48% |
| p95 | 26.67ms | 8.98ms | +17.69ms | +196.92% |
| p99 | 26.80ms | 9.49ms | +17.31ms | +182.31% |
| mean | 12.71ms | 6.54ms | +6.17ms | +94.28% |
| min | 4.69ms | 4.43ms | +0.26ms | +5.83% |
| max | 26.83ms | 9.62ms | +17.21ms | +178.90% |
| total | 190.58ms | 98.09ms | +92.49ms | +94.28% |

### batch_cli_run (5x echo test)

# Perf Report — batch_cli_run (5x echo test).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 12.25ms |
| p50 | 13.66ms |
| p95 | 16.41ms |
| p99 | 17.39ms |
| mean | 14.17ms |
| stdev | 1.67ms |
| min | 11.72ms |
| max | 17.63ms |
| total | 212.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 12.25ms | 14.41ms | -2.17ms | -15.03% |
| p50 | 13.66ms | 18.71ms | -5.04ms | -26.96% |
| p95 | 16.41ms | 27.98ms | -11.57ms | -41.36% |
| p99 | 17.39ms | 28.59ms | -11.21ms | -39.20% |
| mean | 14.17ms | 20.54ms | -6.38ms | -31.03% |
| min | 11.72ms | 14.06ms | -2.33ms | -16.60% |
| max | 17.63ms | 28.74ms | -11.12ms | -38.67% |
| total | 212.54ms | 308.17ms | -95.64ms | -31.03% |

### setup_cleanup_cycle (5 sequential setup+stop)

# Perf Report — setup_cleanup_cycle (5 sequential setup+stop).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 3.65ms |
| p50 | 5.42ms |
| p95 | 12.59ms |
| p99 | 16.31ms |
| mean | 6.34ms |
| stdev | 3.66ms |
| min | 3.18ms |
| max | 17.24ms |
| total | 95.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.65ms | 4.21ms | -0.57ms | -13.42% |
| p50 | 5.42ms | 5.76ms | -0.35ms | -6.01% |
| p95 | 12.59ms | 9.97ms | +2.62ms | +26.29% |
| p99 | 16.31ms | 14.01ms | +2.30ms | +16.41% |
| mean | 6.34ms | 6.43ms | -0.08ms | -1.28% |
| min | 3.18ms | 3.59ms | -0.41ms | -11.51% |
| max | 17.24ms | 15.02ms | +2.22ms | +14.77% |
| total | 95.16ms | 96.39ms | -1.23ms | -1.28% |

