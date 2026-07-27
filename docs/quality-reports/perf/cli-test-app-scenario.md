# Perf Suite — cli-test-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 6.23ms | 500ms | PASS | improved |
| batch_cli_run (5x echo test) | 20.84ms | 1000ms | PASS | stable |
| setup_cleanup_cycle (5 sequential setup+stop) | 2.07ms | 500ms | PASS | improved |

## Concurrent p95 (concurrency = 2, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 4.56ms | 1000ms | PASS |
| batch_cli_run (5x echo test) | 13.30ms | 2000ms | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 3.15ms | 1000ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 154280 B | 10342 B | 102400 B | PASS |
| batch_cli_run (5x echo test) | 541336 B | 525 B | 102400 B | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | -551696 B | -5663 B | 102400 B | PASS |

## Detailed serial reports

### file_scaffold_workflow (setup + 20 writeFile + listFiles)

# Perf Report — file_scaffold_workflow (setup + 20 writeFile + listFiles).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 3.83ms |
| p95 | 6.23ms |
| p99 | 6.73ms |
| mean | 4.19ms |
| stdev | 1.03ms |
| min | 2.95ms |
| max | 6.86ms |
| total | 62.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 3.83ms | 7.77ms | -3.94ms | -50.69% |
| p95 | 6.23ms | 11.46ms | -5.23ms | -45.61% |
| p99 | 6.73ms | 14.88ms | -8.15ms | -54.76% |
| mean | 4.19ms | 8.32ms | -4.14ms | -49.71% |
| min | 2.95ms | 6.56ms | -3.61ms | -55.01% |
| max | 6.86ms | 15.73ms | -8.88ms | -56.43% |
| total | 62.78ms | 124.83ms | -62.05ms | -49.71% |

### batch_cli_run (5x echo test)

# Perf Report — batch_cli_run (5x echo test).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 13.35ms |
| p95 | 20.84ms |
| p99 | 28.98ms |
| mean | 14.61ms |
| stdev | 4.70ms |
| min | 12.11ms |
| max | 31.02ms |
| total | 219.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 13.35ms | 17.10ms | -3.75ms | -21.91% |
| p95 | 20.84ms | 21.06ms | -0.22ms | -1.04% |
| p99 | 28.98ms | 22.22ms | +6.76ms | +30.44% |
| mean | 14.61ms | 17.22ms | -2.62ms | -15.20% |
| min | 12.11ms | 14.91ms | -2.79ms | -18.75% |
| max | 31.02ms | 22.51ms | +8.51ms | +37.81% |
| total | 219.09ms | 258.36ms | -39.27ms | -15.20% |

### setup_cleanup_cycle (5 sequential setup+stop)

# Perf Report — setup_cleanup_cycle (5 sequential setup+stop).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 1.89ms |
| p95 | 2.07ms |
| p99 | 2.12ms |
| mean | 1.88ms |
| stdev | 0.11ms |
| min | 1.74ms |
| max | 2.14ms |
| total | 28.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 1.89ms | 4.03ms | -2.15ms | -53.18% |
| p95 | 2.07ms | 4.87ms | -2.81ms | -57.58% |
| p99 | 2.12ms | 4.99ms | -2.87ms | -57.50% |
| mean | 1.88ms | 4.09ms | -2.21ms | -53.98% |
| min | 1.74ms | 2.89ms | -1.15ms | -39.83% |
| max | 2.14ms | 5.02ms | -2.89ms | -57.48% |
| total | 28.26ms | 61.41ms | -33.15ms | -53.98% |

