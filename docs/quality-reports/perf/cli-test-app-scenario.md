# Perf Suite — cli-test-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限はこの 2 倍 = 0.00050ms。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | gate | regression |
|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 15.72ms | 67.83ms | 500ms | PASS | regressed — gate 無効 (regressionGate=false) |
| batch_cli_run (5x echo test) | 23.12ms | 39.96ms | 1000ms | PASS | regressed — gate 無効 (regressionGate=false) |
| setup_cleanup_cycle (5 sequential setup+stop) | 3.54ms | 5.00ms | 500ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 2, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 75.80ms | 1000ms | PASS |
| batch_cli_run (5x echo test) | 68.09ms | 2000ms | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 6.69ms | 1000ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | -34448 B | 0 B | 102400 B | yes | WAIVED (fs の Buffer pool の伸びを拾うため実装の保持量を表さない (#1719)) |
| batch_cli_run (5x echo test) | 22624 B | 0 B | 102400 B | yes | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | -21816 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### file_scaffold_workflow (setup + 20 writeFile + listFiles)

# Perf Report — file_scaffold_workflow (setup + 20 writeFile + listFiles).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 15.72ms |
| p50 | 20.89ms |
| p95 | 67.83ms |
| p99 | 74.79ms |
| mean | 30.82ms |
| stdev | 19.67ms |
| min | 13.76ms |
| max | 76.54ms |
| total | 462.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 15.72ms | 4.67ms | +11.04ms | +236.22% |
| p50 | 20.89ms | 6.16ms | +14.73ms | +239.11% |
| p95 | 67.83ms | 8.98ms | +58.85ms | +655.23% |
| p99 | 74.79ms | 9.49ms | +65.30ms | +687.96% |
| mean | 30.82ms | 6.54ms | +24.28ms | +371.27% |
| min | 13.76ms | 4.43ms | +9.33ms | +210.67% |
| max | 76.54ms | 9.62ms | +66.92ms | +695.60% |
| total | 462.28ms | 98.09ms | +364.19ms | +371.27% |

### batch_cli_run (5x echo test)

# Perf Report — batch_cli_run (5x echo test).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 23.12ms |
| p50 | 27.05ms |
| p95 | 39.96ms |
| p99 | 45.57ms |
| mean | 27.78ms |
| stdev | 6.70ms |
| min | 18.36ms |
| max | 46.98ms |
| total | 416.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 23.12ms | 14.41ms | +8.71ms | +60.42% |
| p50 | 27.05ms | 18.71ms | +8.34ms | +44.61% |
| p95 | 39.96ms | 27.98ms | +11.98ms | +42.82% |
| p99 | 45.57ms | 28.59ms | +16.98ms | +59.39% |
| mean | 27.78ms | 20.54ms | +7.24ms | +35.24% |
| min | 18.36ms | 14.06ms | +4.30ms | +30.62% |
| max | 46.98ms | 28.74ms | +18.23ms | +63.42% |
| total | 416.77ms | 308.17ms | +108.60ms | +35.24% |

### setup_cleanup_cycle (5 sequential setup+stop)

# Perf Report — setup_cleanup_cycle (5 sequential setup+stop).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 3.54ms |
| p50 | 3.88ms |
| p95 | 5.00ms |
| p99 | 6.04ms |
| mean | 4.00ms |
| stdev | 0.72ms |
| min | 3.17ms |
| max | 6.30ms |
| total | 60.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.54ms | 4.21ms | -0.68ms | -16.05% |
| p50 | 3.88ms | 5.76ms | -1.88ms | -32.69% |
| p95 | 5.00ms | 9.97ms | -4.96ms | -49.82% |
| p99 | 6.04ms | 14.01ms | -7.97ms | -56.91% |
| mean | 4.00ms | 6.43ms | -2.42ms | -37.69% |
| min | 3.17ms | 3.59ms | -0.42ms | -11.77% |
| max | 6.30ms | 15.02ms | -8.72ms | -58.08% |
| total | 60.06ms | 96.39ms | -36.33ms | -37.69% |

