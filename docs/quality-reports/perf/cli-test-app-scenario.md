# Perf Suite — cli-test-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 5.45ms | 500ms | PASS | stable |
| batch_cli_run (5x echo test) | 12.96ms | 1000ms | PASS | stable |
| setup_cleanup_cycle (5 sequential setup+stop) | 2.47ms | 500ms | PASS | improved |

## Concurrent p95 (concurrency = 2, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 6.82ms | 1000ms | PASS |
| batch_cli_run (5x echo test) | 13.04ms | 2000ms | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 3.62ms | 1000ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | -28592 B | 0 B | 102400 B | yes | PASS |
| batch_cli_run (5x echo test) | 26760 B | 0 B | 102400 B | yes | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | -31256 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### file_scaffold_workflow (setup + 20 writeFile + listFiles)

# Perf Report — file_scaffold_workflow (setup + 20 writeFile + listFiles).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 3.26ms |
| p95 | 5.45ms |
| p99 | 6.04ms |
| mean | 3.60ms |
| stdev | 0.92ms |
| min | 2.82ms |
| max | 6.19ms |
| total | 53.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 3.26ms | 3.80ms | -0.54ms | -14.24% |
| p95 | 5.45ms | 5.58ms | -0.14ms | -2.44% |
| p99 | 6.04ms | 6.64ms | -0.59ms | -8.95% |
| mean | 3.60ms | 4.10ms | -0.51ms | -12.34% |
| min | 2.82ms | 3.05ms | -0.23ms | -7.41% |
| max | 6.19ms | 6.90ms | -0.71ms | -10.27% |
| total | 53.95ms | 61.54ms | -7.59ms | -12.34% |

### batch_cli_run (5x echo test)

# Perf Report — batch_cli_run (5x echo test).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 11.47ms |
| p95 | 12.96ms |
| p99 | 13.40ms |
| mean | 11.56ms |
| stdev | 0.82ms |
| min | 10.68ms |
| max | 13.51ms |
| total | 173.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 11.47ms | 10.99ms | +0.48ms | +4.37% |
| p95 | 12.96ms | 11.89ms | +1.07ms | +9.01% |
| p99 | 13.40ms | 11.95ms | +1.45ms | +12.13% |
| mean | 11.56ms | 11.05ms | +0.50ms | +4.55% |
| min | 10.68ms | 10.24ms | +0.44ms | +4.27% |
| max | 13.51ms | 11.96ms | +1.54ms | +12.91% |
| total | 173.35ms | 165.81ms | +7.54ms | +4.55% |

### setup_cleanup_cycle (5 sequential setup+stop)

# Perf Report — setup_cleanup_cycle (5 sequential setup+stop).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 2.17ms |
| p95 | 2.47ms |
| p99 | 2.56ms |
| mean | 2.16ms |
| stdev | 0.18ms |
| min | 1.89ms |
| max | 2.58ms |
| total | 32.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 2.17ms | 2.46ms | -0.29ms | -11.89% |
| p95 | 2.47ms | 3.10ms | -0.64ms | -20.51% |
| p99 | 2.56ms | 3.24ms | -0.68ms | -21.02% |
| mean | 2.16ms | 2.48ms | -0.32ms | -13.02% |
| min | 1.89ms | 2.02ms | -0.13ms | -6.20% |
| max | 2.58ms | 3.27ms | -0.69ms | -21.14% |
| total | 32.35ms | 37.19ms | -4.84ms | -13.02% |

