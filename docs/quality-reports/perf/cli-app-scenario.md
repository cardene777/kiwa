# Perf Suite — cli-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 3.49ms | 4.98ms | 500ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| spec_to_test_batch (5 consecutive runSpecToTest) | 0.50ms | 0.98ms | 300ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| init_error_handling (3 InitConflictError catch) | 0.80ms | 1.49ms | 500ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 20.83ms | 1000ms | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | 3.79ms | 600ms | PASS |
| init_error_handling (3 InitConflictError catch) | 4.11ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 10832 B | 0 B | 102400 B | yes | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | -1704 B | 0 B | 102400 B | yes | PASS |
| init_error_handling (3 InitConflictError catch) | 5320 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### init_workflow (3 fresh project scaffold)

# Perf Report — init_workflow (3 fresh project scaffold).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 3.49ms |
| p50 | 3.95ms |
| p95 | 4.98ms |
| p99 | 5.19ms |
| mean | 4.07ms |
| stdev | 0.61ms |
| min | 3.19ms |
| max | 5.24ms |
| total | 81.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.49ms | 3.53ms | -0.04ms | -1.21% |
| p50 | 3.95ms | 5.63ms | -1.68ms | -29.81% |
| p95 | 4.98ms | 12.29ms | -7.31ms | -59.46% |
| p99 | 5.19ms | 12.47ms | -7.29ms | -58.43% |
| mean | 4.07ms | 6.73ms | -2.66ms | -39.46% |
| min | 3.19ms | 3.07ms | +0.12ms | +4.02% |
| max | 5.24ms | 12.52ms | -7.28ms | -58.17% |
| total | 81.49ms | 134.62ms | -53.13ms | -39.46% |

### spec_to_test_batch (5 consecutive runSpecToTest)

# Perf Report — spec_to_test_batch (5 consecutive runSpecToTest).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.50ms |
| p50 | 0.61ms |
| p95 | 0.98ms |
| p99 | 1.00ms |
| mean | 0.64ms |
| stdev | 0.15ms |
| min | 0.47ms |
| max | 1.00ms |
| total | 12.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.50ms | 0.51ms | -0.0055ms | -1.08% |
| p50 | 0.61ms | 0.57ms | +0.04ms | +7.35% |
| p95 | 0.98ms | 1.16ms | -0.18ms | -15.49% |
| p99 | 1.00ms | 1.27ms | -0.27ms | -21.49% |
| mean | 0.64ms | 0.63ms | +0.01ms | +1.66% |
| min | 0.47ms | 0.45ms | +0.02ms | +4.03% |
| max | 1.00ms | 1.30ms | -0.30ms | -22.83% |
| total | 12.80ms | 12.59ms | +0.21ms | +1.66% |

### init_error_handling (3 InitConflictError catch)

# Perf Report — init_error_handling (3 InitConflictError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.80ms |
| p50 | 1.10ms |
| p95 | 1.49ms |
| p99 | 1.56ms |
| mean | 1.11ms |
| stdev | 0.21ms |
| min | 0.75ms |
| max | 1.57ms |
| total | 22.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.80ms | 0.83ms | -0.04ms | -4.69% |
| p50 | 1.10ms | 1.06ms | +0.04ms | +3.68% |
| p95 | 1.49ms | 1.69ms | -0.20ms | -11.72% |
| p99 | 1.56ms | 1.72ms | -0.16ms | -9.29% |
| mean | 1.11ms | 1.13ms | -0.02ms | -1.84% |
| min | 0.75ms | 0.77ms | -0.02ms | -2.83% |
| max | 1.57ms | 1.72ms | -0.15ms | -8.70% |
| total | 22.13ms | 22.54ms | -0.41ms | -1.84% |

