# Perf Suite — cli-test-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 149.08ms | 500ms | PASS | regressed — gate 無効 (regressionGate=false) |
| batch_cli_run (5x echo test) | 176.49ms | 1000ms | PASS | regressed — gate 無効 (regressionGate=false) |
| setup_cleanup_cycle (5 sequential setup+stop) | 25.63ms | 500ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 2, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 26.60ms | 1000ms | PASS |
| batch_cli_run (5x echo test) | 245.02ms | 2000ms | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 24.62ms | 1000ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | -31128 B | 0 B | 102400 B | yes | WAIVED (fs の Buffer pool の伸びを拾うため実装の保持量を表さない (#1719)) |
| batch_cli_run (5x echo test) | 25512 B | 0 B | 102400 B | yes | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | -24096 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### file_scaffold_workflow (setup + 20 writeFile + listFiles)

# Perf Report — file_scaffold_workflow (setup + 20 writeFile + listFiles).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 32.74ms |
| p95 | 149.08ms |
| p99 | 155.01ms |
| mean | 47.45ms |
| stdev | 43.48ms |
| min | 13.52ms |
| max | 156.50ms |
| total | 711.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 32.74ms | 7.33ms | +25.41ms | +346.55% |
| p95 | 149.08ms | 23.16ms | +125.92ms | +543.79% |
| p99 | 155.01ms | 36.67ms | +118.34ms | +322.66% |
| mean | 47.45ms | 9.67ms | +37.78ms | +390.53% |
| min | 13.52ms | 3.22ms | +10.30ms | +320.41% |
| max | 156.50ms | 50.35ms | +106.14ms | +210.80% |
| total | 711.79ms | 1673.56ms | -961.77ms | -57.47% |

### batch_cli_run (5x echo test)

# Perf Report — batch_cli_run (5x echo test).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 122.43ms |
| p95 | 176.49ms |
| p99 | 177.55ms |
| mean | 117.83ms |
| stdev | 40.69ms |
| min | 52.03ms |
| max | 177.82ms |
| total | 1767.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 122.43ms | 17.14ms | +105.30ms | +614.44% |
| p95 | 176.49ms | 59.48ms | +117.00ms | +196.71% |
| p99 | 177.55ms | 78.64ms | +98.91ms | +125.77% |
| mean | 117.83ms | 23.88ms | +93.96ms | +393.50% |
| min | 52.03ms | 12.66ms | +39.37ms | +310.97% |
| max | 177.82ms | 167.87ms | +9.95ms | +5.93% |
| total | 1767.51ms | 4130.76ms | -2363.25ms | -57.21% |

### setup_cleanup_cycle (5 sequential setup+stop)

# Perf Report — setup_cleanup_cycle (5 sequential setup+stop).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 20.21ms |
| p95 | 25.63ms |
| p99 | 26.10ms |
| mean | 19.81ms |
| stdev | 4.06ms |
| min | 11.39ms |
| max | 26.22ms |
| total | 297.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 20.21ms | 4.84ms | +15.37ms | +317.68% |
| p95 | 25.63ms | 17.32ms | +8.30ms | +47.93% |
| p99 | 26.10ms | 31.57ms | -5.47ms | -17.34% |
| mean | 19.81ms | 6.96ms | +12.84ms | +184.47% |
| min | 11.39ms | 2.47ms | +8.92ms | +361.87% |
| max | 26.22ms | 39.82ms | -13.60ms | -34.16% |
| total | 297.12ms | 1204.59ms | -907.48ms | -75.33% |

