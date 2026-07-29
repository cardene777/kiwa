# Perf Suite — cli-test-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00063ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0013ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 3.56ms | 14.25ms | 500ms | 0.0013ms | PASS | improved — gate 無効 (regressionGate=false) |
| batch_cli_run (5x echo test) | 15.81ms | 26.76ms | 1000ms | 0.0013ms | PASS | stable — gate 無効 (regressionGate=false) |
| setup_cleanup_cycle (5 sequential setup+stop) | 2.54ms | 4.39ms | 500ms | 0.0013ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 2, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 12.15ms | 1000ms | PASS |
| batch_cli_run (5x echo test) | 29.26ms | 2000ms | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 6.83ms | 1000ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | -31600 B | 0 B | 102400 B | yes | WAIVED (fs の Buffer pool の伸びを拾うため実装の保持量を表さない (#1719)) |
| batch_cli_run (5x echo test) | 24384 B | 0 B | 102400 B | yes | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | -22360 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### file_scaffold_workflow (setup + 20 writeFile + listFiles)

# Perf Report — file_scaffold_workflow (setup + 20 writeFile + listFiles).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 3.56ms |
| p50 | 4.73ms |
| p95 | 14.25ms |
| p99 | 25.08ms |
| mean | 6.44ms |
| stdev | 6.05ms |
| min | 3.40ms |
| max | 27.79ms |
| total | 96.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.56ms | 4.67ms | -1.12ms | -23.90% |
| p50 | 4.73ms | 6.16ms | -1.43ms | -23.29% |
| p95 | 14.25ms | 8.98ms | +5.27ms | +58.65% |
| p99 | 25.08ms | 9.49ms | +15.59ms | +164.20% |
| mean | 6.44ms | 6.54ms | -0.10ms | -1.51% |
| min | 3.40ms | 4.43ms | -1.03ms | -23.30% |
| max | 27.79ms | 9.62ms | +18.17ms | +188.83% |
| total | 96.62ms | 98.09ms | -1.48ms | -1.51% |

### batch_cli_run (5x echo test)

# Perf Report — batch_cli_run (5x echo test).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 15.81ms |
| p50 | 17.88ms |
| p95 | 26.76ms |
| p99 | 28.11ms |
| mean | 19.16ms |
| stdev | 3.66ms |
| min | 15.09ms |
| max | 28.45ms |
| total | 287.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 15.81ms | 14.41ms | +1.39ms | +9.65% |
| p50 | 17.88ms | 18.71ms | -0.83ms | -4.41% |
| p95 | 26.76ms | 27.98ms | -1.22ms | -4.35% |
| p99 | 28.11ms | 28.59ms | -0.48ms | -1.67% |
| mean | 19.16ms | 20.54ms | -1.39ms | -6.76% |
| min | 15.09ms | 14.06ms | +1.04ms | +7.37% |
| max | 28.45ms | 28.74ms | -0.29ms | -1.02% |
| total | 287.34ms | 308.17ms | -20.84ms | -6.76% |

### setup_cleanup_cycle (5 sequential setup+stop)

# Perf Report — setup_cleanup_cycle (5 sequential setup+stop).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 2.54ms |
| p50 | 3.46ms |
| p95 | 4.39ms |
| p99 | 5.09ms |
| mean | 3.41ms |
| stdev | 0.77ms |
| min | 2.37ms |
| max | 5.27ms |
| total | 51.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 2.54ms | 4.21ms | -1.67ms | -39.63% |
| p50 | 3.46ms | 5.76ms | -2.30ms | -39.97% |
| p95 | 4.39ms | 9.97ms | -5.57ms | -55.91% |
| p99 | 5.09ms | 14.01ms | -8.91ms | -63.64% |
| mean | 3.41ms | 6.43ms | -3.02ms | -47.00% |
| min | 2.37ms | 3.59ms | -1.22ms | -34.10% |
| max | 5.27ms | 15.02ms | -9.75ms | -64.92% |
| total | 51.09ms | 96.39ms | -45.30ms | -47.00% |

