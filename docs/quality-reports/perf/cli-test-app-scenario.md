# Perf Suite — cli-test-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 2.88ms | 4.53ms | 500ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| batch_cli_run (5x echo test) | 12.60ms | 15.98ms | 1000ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| setup_cleanup_cycle (5 sequential setup+stop) | 2.32ms | 4.48ms | 500ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 2, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 5.48ms | 1000ms | PASS |
| batch_cli_run (5x echo test) | 78.44ms | 2000ms | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 4.03ms | 1000ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | -31008 B | 0 B | 102400 B | yes | WAIVED (fs の Buffer pool の伸びを拾うため実装の保持量を表さない (#1719)) |
| batch_cli_run (5x echo test) | 23336 B | 0 B | 102400 B | yes | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | -22840 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### file_scaffold_workflow (setup + 20 writeFile + listFiles)

# Perf Report — file_scaffold_workflow (setup + 20 writeFile + listFiles).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 2.88ms |
| p50 | 3.19ms |
| p95 | 4.53ms |
| p99 | 5.94ms |
| mean | 3.38ms |
| stdev | 0.86ms |
| min | 2.72ms |
| max | 6.29ms |
| total | 50.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 2.88ms | 4.67ms | -1.80ms | -38.42% |
| p50 | 3.19ms | 6.16ms | -2.97ms | -48.22% |
| p95 | 4.53ms | 8.98ms | -4.45ms | -49.51% |
| p99 | 5.94ms | 9.49ms | -3.55ms | -37.43% |
| mean | 3.38ms | 6.54ms | -3.16ms | -48.32% |
| min | 2.72ms | 4.43ms | -1.71ms | -38.50% |
| max | 6.29ms | 9.62ms | -3.33ms | -34.61% |
| total | 50.70ms | 98.09ms | -47.39ms | -48.32% |

### batch_cli_run (5x echo test)

# Perf Report — batch_cli_run (5x echo test).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 12.60ms |
| p50 | 13.59ms |
| p95 | 15.98ms |
| p99 | 16.42ms |
| mean | 13.81ms |
| stdev | 1.26ms |
| min | 12.14ms |
| max | 16.53ms |
| total | 207.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 12.60ms | 14.41ms | -1.81ms | -12.57% |
| p50 | 13.59ms | 18.71ms | -5.11ms | -27.34% |
| p95 | 15.98ms | 27.98ms | -12.01ms | -42.91% |
| p99 | 16.42ms | 28.59ms | -12.17ms | -42.57% |
| mean | 13.81ms | 20.54ms | -6.73ms | -32.76% |
| min | 12.14ms | 14.06ms | -1.92ms | -13.67% |
| max | 16.53ms | 28.74ms | -12.21ms | -42.49% |
| total | 207.20ms | 308.17ms | -100.97ms | -32.76% |

### setup_cleanup_cycle (5 sequential setup+stop)

# Perf Report — setup_cleanup_cycle (5 sequential setup+stop).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 2.32ms |
| p50 | 2.91ms |
| p95 | 4.48ms |
| p99 | 6.68ms |
| mean | 3.04ms |
| stdev | 1.21ms |
| min | 2.25ms |
| max | 7.23ms |
| total | 45.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 2.32ms | 4.21ms | -1.90ms | -45.05% |
| p50 | 2.91ms | 5.76ms | -2.86ms | -49.59% |
| p95 | 4.48ms | 9.97ms | -5.48ms | -55.03% |
| p99 | 6.68ms | 14.01ms | -7.33ms | -52.30% |
| mean | 3.04ms | 6.43ms | -3.39ms | -52.74% |
| min | 2.25ms | 3.59ms | -1.34ms | -37.41% |
| max | 7.23ms | 15.02ms | -7.79ms | -51.85% |
| total | 45.55ms | 96.39ms | -50.83ms | -52.74% |

