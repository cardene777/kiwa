# Perf Suite — cli-test-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 5.36ms | 500ms | PASS | stable |
| batch_cli_run (5x echo test) | 12.00ms | 1000ms | PASS | stable |
| setup_cleanup_cycle (5 sequential setup+stop) | 2.79ms | 500ms | PASS | stable |

## Concurrent p95 (concurrency = 2, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 5.12ms | 1000ms | PASS |
| batch_cli_run (5x echo test) | 12.09ms | 2000ms | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 3.68ms | 1000ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | -28032 B | 0 B | 102400 B | yes | PASS |
| batch_cli_run (5x echo test) | 26760 B | 0 B | 102400 B | yes | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | -29432 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### file_scaffold_workflow (setup + 20 writeFile + listFiles)

# Perf Report — file_scaffold_workflow (setup + 20 writeFile + listFiles).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 3.42ms |
| p95 | 5.36ms |
| p99 | 6.51ms |
| mean | 3.73ms |
| stdev | 1.02ms |
| min | 2.79ms |
| max | 6.80ms |
| total | 55.98ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 3.42ms | 3.80ms | -0.38ms | -10.03% |
| p95 | 5.36ms | 5.58ms | -0.23ms | -4.04% |
| p99 | 6.51ms | 6.64ms | -0.12ms | -1.86% |
| mean | 3.73ms | 4.10ms | -0.37ms | -9.04% |
| min | 2.79ms | 3.05ms | -0.25ms | -8.36% |
| max | 6.80ms | 6.90ms | -0.10ms | -1.42% |
| total | 55.98ms | 61.54ms | -5.57ms | -9.04% |

### batch_cli_run (5x echo test)

# Perf Report — batch_cli_run (5x echo test).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 10.77ms |
| p95 | 12.00ms |
| p99 | 12.60ms |
| mean | 10.90ms |
| stdev | 0.74ms |
| min | 9.95ms |
| max | 12.75ms |
| total | 163.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 10.77ms | 10.99ms | -0.22ms | -2.02% |
| p95 | 12.00ms | 11.89ms | +0.10ms | +0.88% |
| p99 | 12.60ms | 11.95ms | +0.65ms | +5.42% |
| mean | 10.90ms | 11.05ms | -0.15ms | -1.39% |
| min | 9.95ms | 10.24ms | -0.29ms | -2.84% |
| max | 12.75ms | 11.96ms | +0.78ms | +6.55% |
| total | 163.50ms | 165.81ms | -2.31ms | -1.39% |

### setup_cleanup_cycle (5 sequential setup+stop)

# Perf Report — setup_cleanup_cycle (5 sequential setup+stop).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 2.24ms |
| p95 | 2.79ms |
| p99 | 2.84ms |
| mean | 2.28ms |
| stdev | 0.24ms |
| min | 2.01ms |
| max | 2.85ms |
| total | 34.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 2.24ms | 2.46ms | -0.21ms | -8.70% |
| p95 | 2.79ms | 3.10ms | -0.32ms | -10.21% |
| p99 | 2.84ms | 3.24ms | -0.40ms | -12.41% |
| mean | 2.28ms | 2.48ms | -0.20ms | -8.03% |
| min | 2.01ms | 2.02ms | -0.01ms | -0.53% |
| max | 2.85ms | 3.27ms | -0.42ms | -12.93% |
| total | 34.21ms | 37.19ms | -2.99ms | -8.03% |

