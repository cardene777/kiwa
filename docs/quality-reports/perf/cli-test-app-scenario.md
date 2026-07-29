# Perf Suite — cli-test-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 2.80ms | 3.97ms | 500ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| batch_cli_run (5x echo test) | 10.78ms | 12.25ms | 1000ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| setup_cleanup_cycle (5 sequential setup+stop) | 2.16ms | 2.40ms | 500ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 2, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 4.49ms | 1000ms | PASS |
| batch_cli_run (5x echo test) | 12.18ms | 2000ms | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 3.49ms | 1000ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | -32464 B | 0 B | 102400 B | yes | WAIVED (fs の Buffer pool の伸びを拾うため実装の保持量を表さない (#1719)) |
| batch_cli_run (5x echo test) | 22976 B | 0 B | 102400 B | yes | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | -23416 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### file_scaffold_workflow (setup + 20 writeFile + listFiles)

# Perf Report — file_scaffold_workflow (setup + 20 writeFile + listFiles).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 2.80ms |
| p50 | 3.12ms |
| p95 | 3.97ms |
| p99 | 4.12ms |
| mean | 3.18ms |
| stdev | 0.40ms |
| min | 2.65ms |
| max | 4.16ms |
| total | 47.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 2.80ms | 4.67ms | -1.88ms | -40.16% |
| p50 | 3.12ms | 6.16ms | -3.04ms | -49.38% |
| p95 | 3.97ms | 8.98ms | -5.02ms | -55.84% |
| p99 | 4.12ms | 9.49ms | -5.37ms | -56.60% |
| mean | 3.18ms | 6.54ms | -3.36ms | -51.37% |
| min | 2.65ms | 4.43ms | -1.79ms | -40.30% |
| max | 4.16ms | 9.62ms | -5.46ms | -56.78% |
| total | 47.70ms | 98.09ms | -50.39ms | -51.37% |

### batch_cli_run (5x echo test)

# Perf Report — batch_cli_run (5x echo test).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 10.78ms |
| p50 | 11.16ms |
| p95 | 12.25ms |
| p99 | 12.33ms |
| mean | 11.27ms |
| stdev | 0.58ms |
| min | 10.16ms |
| max | 12.35ms |
| total | 169.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 10.78ms | 14.41ms | -3.63ms | -25.21% |
| p50 | 11.16ms | 18.71ms | -7.54ms | -40.33% |
| p95 | 12.25ms | 27.98ms | -15.73ms | -56.22% |
| p99 | 12.33ms | 28.59ms | -16.26ms | -56.88% |
| mean | 11.27ms | 20.54ms | -9.28ms | -45.16% |
| min | 10.16ms | 14.06ms | -3.89ms | -27.71% |
| max | 12.35ms | 28.74ms | -16.40ms | -57.05% |
| total | 169.01ms | 308.17ms | -139.16ms | -45.16% |

### setup_cleanup_cycle (5 sequential setup+stop)

# Perf Report — setup_cleanup_cycle (5 sequential setup+stop).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 2.16ms |
| p50 | 2.24ms |
| p95 | 2.40ms |
| p99 | 2.54ms |
| mean | 2.25ms |
| stdev | 0.11ms |
| min | 2.15ms |
| max | 2.57ms |
| total | 33.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 2.16ms | 4.21ms | -2.05ms | -48.70% |
| p50 | 2.24ms | 5.76ms | -3.52ms | -61.10% |
| p95 | 2.40ms | 9.97ms | -7.57ms | -75.93% |
| p99 | 2.54ms | 14.01ms | -11.47ms | -81.90% |
| mean | 2.25ms | 6.43ms | -4.18ms | -65.03% |
| min | 2.15ms | 3.59ms | -1.44ms | -40.14% |
| max | 2.57ms | 15.02ms | -12.45ms | -82.89% |
| total | 33.70ms | 96.39ms | -62.68ms | -65.03% |

