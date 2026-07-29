# Perf Suite — cli-test-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 3.06ms | 4.53ms | 500ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| batch_cli_run (5x echo test) | 11.41ms | 13.33ms | 1000ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| setup_cleanup_cycle (5 sequential setup+stop) | 2.48ms | 3.29ms | 500ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 2, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 6.06ms | 1000ms | PASS |
| batch_cli_run (5x echo test) | 14.98ms | 2000ms | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 4.68ms | 1000ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | -34352 B | 0 B | 102400 B | yes | WAIVED (fs の Buffer pool の伸びを拾うため実装の保持量を表さない (#1719)) |
| batch_cli_run (5x echo test) | 23408 B | 0 B | 102400 B | yes | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | -23640 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### file_scaffold_workflow (setup + 20 writeFile + listFiles)

# Perf Report — file_scaffold_workflow (setup + 20 writeFile + listFiles).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 3.06ms |
| p50 | 3.85ms |
| p95 | 4.53ms |
| p99 | 4.64ms |
| mean | 3.76ms |
| stdev | 0.53ms |
| min | 2.97ms |
| max | 4.67ms |
| total | 56.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.06ms | 4.67ms | -1.61ms | -34.54% |
| p50 | 3.85ms | 6.16ms | -2.31ms | -37.55% |
| p95 | 4.53ms | 8.98ms | -4.45ms | -49.51% |
| p99 | 4.64ms | 9.49ms | -4.85ms | -51.11% |
| mean | 3.76ms | 6.54ms | -2.78ms | -42.58% |
| min | 2.97ms | 4.43ms | -1.46ms | -32.85% |
| max | 4.67ms | 9.62ms | -4.95ms | -51.48% |
| total | 56.33ms | 98.09ms | -41.76ms | -42.58% |

### batch_cli_run (5x echo test)

# Perf Report — batch_cli_run (5x echo test).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 11.41ms |
| p50 | 12.01ms |
| p95 | 13.33ms |
| p99 | 13.84ms |
| mean | 12.16ms |
| stdev | 0.84ms |
| min | 10.88ms |
| max | 13.97ms |
| total | 182.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 11.41ms | 14.41ms | -3.00ms | -20.84% |
| p50 | 12.01ms | 18.71ms | -6.70ms | -35.79% |
| p95 | 13.33ms | 27.98ms | -14.65ms | -52.35% |
| p99 | 13.84ms | 28.59ms | -14.75ms | -51.59% |
| mean | 12.16ms | 20.54ms | -8.38ms | -40.80% |
| min | 10.88ms | 14.06ms | -3.18ms | -22.59% |
| max | 13.97ms | 28.74ms | -14.78ms | -51.41% |
| total | 182.43ms | 308.17ms | -125.75ms | -40.80% |

### setup_cleanup_cycle (5 sequential setup+stop)

# Perf Report — setup_cleanup_cycle (5 sequential setup+stop).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 2.48ms |
| p50 | 2.86ms |
| p95 | 3.29ms |
| p99 | 3.34ms |
| mean | 2.86ms |
| stdev | 0.31ms |
| min | 2.34ms |
| max | 3.35ms |
| total | 42.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 2.48ms | 4.21ms | -1.73ms | -41.04% |
| p50 | 2.86ms | 5.76ms | -2.91ms | -50.40% |
| p95 | 3.29ms | 9.97ms | -6.67ms | -66.96% |
| p99 | 3.34ms | 14.01ms | -10.67ms | -76.17% |
| mean | 2.86ms | 6.43ms | -3.56ms | -55.45% |
| min | 2.34ms | 3.59ms | -1.25ms | -34.90% |
| max | 3.35ms | 15.02ms | -11.67ms | -77.70% |
| total | 42.94ms | 96.39ms | -53.45ms | -55.45% |

