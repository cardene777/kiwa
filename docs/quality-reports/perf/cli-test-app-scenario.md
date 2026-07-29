# Perf Suite — cli-test-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00023ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00045ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 3.59ms | 5.88ms | 500ms | 0.00045ms | PASS | improved — gate 無効 (regressionGate=false) |
| batch_cli_run (5x echo test) | 11.87ms | 14.10ms | 1000ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| setup_cleanup_cycle (5 sequential setup+stop) | 2.94ms | 3.92ms | 500ms | 0.00045ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 2, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 6.02ms | 1000ms | PASS |
| batch_cli_run (5x echo test) | 16.32ms | 2000ms | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 4.65ms | 1000ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | -34248 B | 0 B | 102400 B | yes | WAIVED (fs の Buffer pool の伸びを拾うため実装の保持量を表さない (#1719)) |
| batch_cli_run (5x echo test) | 22464 B | 0 B | 102400 B | yes | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | -22968 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### file_scaffold_workflow (setup + 20 writeFile + listFiles)

# Perf Report — file_scaffold_workflow (setup + 20 writeFile + listFiles).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 3.59ms |
| p50 | 4.02ms |
| p95 | 5.88ms |
| p99 | 6.82ms |
| mean | 4.28ms |
| stdev | 0.90ms |
| min | 3.52ms |
| max | 7.05ms |
| total | 64.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.59ms | 4.67ms | -1.08ms | -23.16% |
| p50 | 4.02ms | 6.16ms | -2.14ms | -34.78% |
| p95 | 5.88ms | 8.98ms | -3.10ms | -34.56% |
| p99 | 6.82ms | 9.49ms | -2.67ms | -28.18% |
| mean | 4.28ms | 6.54ms | -2.26ms | -34.51% |
| min | 3.52ms | 4.43ms | -0.91ms | -20.61% |
| max | 7.05ms | 9.62ms | -2.57ms | -26.69% |
| total | 64.24ms | 98.09ms | -33.86ms | -34.51% |

### batch_cli_run (5x echo test)

# Perf Report — batch_cli_run (5x echo test).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 11.87ms |
| p50 | 12.39ms |
| p95 | 14.10ms |
| p99 | 14.27ms |
| mean | 12.78ms |
| stdev | 0.85ms |
| min | 11.56ms |
| max | 14.32ms |
| total | 191.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 11.87ms | 14.41ms | -2.55ms | -17.67% |
| p50 | 12.39ms | 18.71ms | -6.32ms | -33.77% |
| p95 | 14.10ms | 27.98ms | -13.88ms | -49.62% |
| p99 | 14.27ms | 28.59ms | -14.32ms | -50.08% |
| mean | 12.78ms | 20.54ms | -7.77ms | -37.80% |
| min | 11.56ms | 14.06ms | -2.50ms | -17.80% |
| max | 14.32ms | 28.74ms | -14.43ms | -50.20% |
| total | 191.70ms | 308.17ms | -116.48ms | -37.80% |

### setup_cleanup_cycle (5 sequential setup+stop)

# Perf Report — setup_cleanup_cycle (5 sequential setup+stop).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 2.94ms |
| p50 | 3.44ms |
| p95 | 3.92ms |
| p99 | 4.04ms |
| mean | 3.42ms |
| stdev | 0.42ms |
| min | 2.65ms |
| max | 4.07ms |
| total | 51.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 2.94ms | 4.21ms | -1.27ms | -30.19% |
| p50 | 3.44ms | 5.76ms | -2.32ms | -40.25% |
| p95 | 3.92ms | 9.97ms | -6.05ms | -60.70% |
| p99 | 4.04ms | 14.01ms | -9.97ms | -71.16% |
| mean | 3.42ms | 6.43ms | -3.00ms | -46.76% |
| min | 2.65ms | 3.59ms | -0.94ms | -26.13% |
| max | 4.07ms | 15.02ms | -10.95ms | -72.90% |
| total | 51.32ms | 96.39ms | -45.07ms | -46.76% |

