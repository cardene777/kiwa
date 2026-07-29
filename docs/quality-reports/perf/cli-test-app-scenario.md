# Perf Suite — cli-test-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 3.96ms | 6.14ms | 500ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| batch_cli_run (5x echo test) | 12.95ms | 16.58ms | 1000ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| setup_cleanup_cycle (5 sequential setup+stop) | 2.66ms | 3.61ms | 500ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 2, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 6.83ms | 1000ms | PASS |
| batch_cli_run (5x echo test) | 26.72ms | 2000ms | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 13.80ms | 1000ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | -33408 B | 0 B | 102400 B | yes | WAIVED (fs の Buffer pool の伸びを拾うため実装の保持量を表さない (#1719)) |
| batch_cli_run (5x echo test) | 22552 B | 0 B | 102400 B | yes | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | -23064 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### file_scaffold_workflow (setup + 20 writeFile + listFiles)

# Perf Report — file_scaffold_workflow (setup + 20 writeFile + listFiles).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 3.96ms |
| p50 | 4.46ms |
| p95 | 6.14ms |
| p99 | 6.39ms |
| mean | 4.77ms |
| stdev | 0.84ms |
| min | 3.68ms |
| max | 6.45ms |
| total | 71.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.96ms | 4.67ms | -0.72ms | -15.37% |
| p50 | 4.46ms | 6.16ms | -1.69ms | -27.52% |
| p95 | 6.14ms | 8.98ms | -2.84ms | -31.65% |
| p99 | 6.39ms | 9.49ms | -3.10ms | -32.70% |
| mean | 4.77ms | 6.54ms | -1.77ms | -27.12% |
| min | 3.68ms | 4.43ms | -0.75ms | -17.00% |
| max | 6.45ms | 9.62ms | -3.17ms | -32.95% |
| total | 71.49ms | 98.09ms | -26.60ms | -27.12% |

### batch_cli_run (5x echo test)

# Perf Report — batch_cli_run (5x echo test).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 12.95ms |
| p50 | 14.38ms |
| p95 | 16.58ms |
| p99 | 16.77ms |
| mean | 14.57ms |
| stdev | 1.25ms |
| min | 12.77ms |
| max | 16.82ms |
| total | 218.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 12.95ms | 14.41ms | -1.47ms | -10.17% |
| p50 | 14.38ms | 18.71ms | -4.33ms | -23.14% |
| p95 | 16.58ms | 27.98ms | -11.41ms | -40.76% |
| p99 | 16.77ms | 28.59ms | -11.82ms | -41.34% |
| mean | 14.57ms | 20.54ms | -5.98ms | -29.09% |
| min | 12.77ms | 14.06ms | -1.29ms | -9.18% |
| max | 16.82ms | 28.74ms | -11.93ms | -41.49% |
| total | 218.53ms | 308.17ms | -89.64ms | -29.09% |

### setup_cleanup_cycle (5 sequential setup+stop)

# Perf Report — setup_cleanup_cycle (5 sequential setup+stop).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 2.66ms |
| p50 | 2.96ms |
| p95 | 3.61ms |
| p99 | 3.71ms |
| mean | 3.09ms |
| stdev | 0.34ms |
| min | 2.56ms |
| max | 3.73ms |
| total | 46.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 2.66ms | 4.21ms | -1.55ms | -36.76% |
| p50 | 2.96ms | 5.76ms | -2.81ms | -48.68% |
| p95 | 3.61ms | 9.97ms | -6.36ms | -63.78% |
| p99 | 3.71ms | 14.01ms | -10.30ms | -73.54% |
| mean | 3.09ms | 6.43ms | -3.34ms | -51.98% |
| min | 2.56ms | 3.59ms | -1.03ms | -28.62% |
| max | 3.73ms | 15.02ms | -11.29ms | -75.15% |
| total | 46.29ms | 96.39ms | -50.10ms | -51.98% |

