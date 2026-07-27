# Perf Suite — cli-test-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 6.33ms | 500ms | PASS | stable |
| batch_cli_run (5x echo test) | 19.80ms | 1000ms | PASS | regressed |
| setup_cleanup_cycle (5 sequential setup+stop) | 2.69ms | 500ms | PASS | stable |

## Concurrent p95 (concurrency = 2, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 6.06ms | 1000ms | PASS |
| batch_cli_run (5x echo test) | 12.56ms | 2000ms | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 3.92ms | 1000ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | -29736 B | 0 B | 102400 B | yes | PASS |
| batch_cli_run (5x echo test) | 26912 B | 0 B | 102400 B | yes | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | -30808 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### file_scaffold_workflow (setup + 20 writeFile + listFiles)

# Perf Report — file_scaffold_workflow (setup + 20 writeFile + listFiles).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 4.06ms |
| p95 | 6.33ms |
| p99 | 7.27ms |
| mean | 4.19ms |
| stdev | 1.23ms |
| min | 2.86ms |
| max | 7.50ms |
| total | 62.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 4.06ms | 3.80ms | +0.26ms | +6.76% |
| p95 | 6.33ms | 5.58ms | +0.74ms | +13.30% |
| p99 | 7.27ms | 6.64ms | +0.63ms | +9.48% |
| mean | 4.19ms | 4.10ms | +0.08ms | +2.03% |
| min | 2.86ms | 3.05ms | -0.19ms | -6.12% |
| max | 7.50ms | 6.90ms | +0.60ms | +8.70% |
| total | 62.79ms | 61.54ms | +1.25ms | +2.03% |

### batch_cli_run (5x echo test)

# Perf Report — batch_cli_run (5x echo test).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 13.18ms |
| p95 | 19.80ms |
| p99 | 22.78ms |
| mean | 14.54ms |
| stdev | 3.06ms |
| min | 12.31ms |
| max | 23.52ms |
| total | 218.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 13.18ms | 10.99ms | +2.19ms | +19.92% |
| p95 | 19.80ms | 11.89ms | +7.91ms | +66.50% |
| p99 | 22.78ms | 11.95ms | +10.83ms | +90.63% |
| mean | 14.54ms | 11.05ms | +3.48ms | +31.50% |
| min | 12.31ms | 10.24ms | +2.07ms | +20.19% |
| max | 23.52ms | 11.96ms | +11.56ms | +96.62% |
| total | 218.04ms | 165.81ms | +52.23ms | +31.50% |

### setup_cleanup_cycle (5 sequential setup+stop)

# Perf Report — setup_cleanup_cycle (5 sequential setup+stop).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 2.18ms |
| p95 | 2.69ms |
| p99 | 2.82ms |
| mean | 2.27ms |
| stdev | 0.25ms |
| min | 2.01ms |
| max | 2.85ms |
| total | 34.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 2.18ms | 2.46ms | -0.28ms | -11.54% |
| p95 | 2.69ms | 3.10ms | -0.41ms | -13.15% |
| p99 | 2.82ms | 3.24ms | -0.43ms | -13.12% |
| mean | 2.27ms | 2.48ms | -0.21ms | -8.33% |
| min | 2.01ms | 2.02ms | -0.01ms | -0.63% |
| max | 2.85ms | 3.27ms | -0.43ms | -13.11% |
| total | 34.09ms | 37.19ms | -3.10ms | -8.33% |

