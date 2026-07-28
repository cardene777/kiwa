# Perf Suite — cli-test-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 8.82ms | 500ms | PASS | improved — gate 対象外 (fs syscall の揺らぎが実行ごとに p50 で 200% 超動く (#1718)) |
| batch_cli_run (5x echo test) | 20.08ms | 1000ms | PASS | improved — gate 対象外 (子 process の起動時間が実行ごとに大きく動く (#1718)) |
| setup_cleanup_cycle (5 sequential setup+stop) | 5.81ms | 500ms | PASS | improved — gate 対象外 (fs syscall の揺らぎが実行ごとに p50 で 200% 超動く (#1718)) |

## Concurrent p95 (concurrency = 2, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 6.28ms | 1000ms | PASS |
| batch_cli_run (5x echo test) | 22.77ms | 2000ms | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 4.39ms | 1000ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | -31232 B | 0 B | 102400 B | yes | WAIVED (fs の Buffer pool の伸びを拾うため実装の保持量を表さない (#1719)) |
| batch_cli_run (5x echo test) | 29504 B | 0 B | 102400 B | yes | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | -30296 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### file_scaffold_workflow (setup + 20 writeFile + listFiles)

# Perf Report — file_scaffold_workflow (setup + 20 writeFile + listFiles).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 4.16ms |
| p95 | 8.82ms |
| p99 | 11.37ms |
| mean | 4.87ms |
| stdev | 2.23ms |
| min | 3.28ms |
| max | 12.01ms |
| total | 73.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 4.16ms | 7.33ms | -3.17ms | -43.19% |
| p95 | 8.82ms | 23.16ms | -14.34ms | -61.91% |
| p99 | 11.37ms | 36.67ms | -25.31ms | -69.00% |
| mean | 4.87ms | 9.67ms | -4.80ms | -49.62% |
| min | 3.28ms | 3.22ms | +0.06ms | +1.97% |
| max | 12.01ms | 50.35ms | -38.35ms | -76.16% |
| total | 73.10ms | 1673.56ms | -1600.47ms | -95.63% |

### batch_cli_run (5x echo test)

# Perf Report — batch_cli_run (5x echo test).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 13.83ms |
| p95 | 20.08ms |
| p99 | 21.61ms |
| mean | 14.88ms |
| stdev | 3.18ms |
| min | 11.70ms |
| max | 22.00ms |
| total | 223.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 13.83ms | 17.14ms | -3.31ms | -19.31% |
| p95 | 20.08ms | 59.48ms | -39.40ms | -66.23% |
| p99 | 21.61ms | 78.64ms | -57.03ms | -72.52% |
| mean | 14.88ms | 23.88ms | -9.00ms | -37.70% |
| min | 11.70ms | 12.66ms | -0.96ms | -7.60% |
| max | 22.00ms | 167.87ms | -145.87ms | -86.90% |
| total | 223.15ms | 4130.76ms | -3907.61ms | -94.60% |

### setup_cleanup_cycle (5 sequential setup+stop)

# Perf Report — setup_cleanup_cycle (5 sequential setup+stop).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 3.11ms |
| p95 | 5.81ms |
| p99 | 7.89ms |
| mean | 3.55ms |
| stdev | 1.49ms |
| min | 2.35ms |
| max | 8.40ms |
| total | 53.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 3.11ms | 4.84ms | -1.73ms | -35.81% |
| p95 | 5.81ms | 17.32ms | -11.51ms | -66.45% |
| p99 | 7.89ms | 31.57ms | -23.69ms | -75.03% |
| mean | 3.55ms | 6.96ms | -3.42ms | -49.08% |
| min | 2.35ms | 2.47ms | -0.12ms | -4.73% |
| max | 8.40ms | 39.82ms | -31.42ms | -78.90% |
| total | 53.19ms | 1204.59ms | -1151.41ms | -95.58% |

