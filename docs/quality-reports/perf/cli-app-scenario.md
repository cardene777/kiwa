# Perf Suite — cli-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 2.85ms | 5.58ms | 500ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| spec_to_test_batch (5 consecutive runSpecToTest) | 0.44ms | 1.29ms | 300ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| init_error_handling (3 InitConflictError catch) | 0.82ms | 1.70ms | 500ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 12.84ms | 1000ms | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | 3.59ms | 600ms | PASS |
| init_error_handling (3 InitConflictError catch) | 5.02ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 11304 B | -6528 B | 102400 B | yes | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | -1728 B | 0 B | 102400 B | yes | PASS |
| init_error_handling (3 InitConflictError catch) | 5384 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### init_workflow (3 fresh project scaffold)

# Perf Report — init_workflow (3 fresh project scaffold).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 2.85ms |
| p50 | 3.88ms |
| p95 | 5.58ms |
| p99 | 5.66ms |
| mean | 3.99ms |
| stdev | 0.99ms |
| min | 2.52ms |
| max | 5.68ms |
| total | 79.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 2.85ms | 3.53ms | -0.68ms | -19.35% |
| p50 | 3.88ms | 5.63ms | -1.76ms | -31.17% |
| p95 | 5.58ms | 12.29ms | -6.71ms | -54.61% |
| p99 | 5.66ms | 12.47ms | -6.81ms | -54.59% |
| mean | 3.99ms | 6.73ms | -2.74ms | -40.74% |
| min | 2.52ms | 3.07ms | -0.54ms | -17.64% |
| max | 5.68ms | 12.52ms | -6.83ms | -54.59% |
| total | 79.77ms | 134.62ms | -54.85ms | -40.74% |

### spec_to_test_batch (5 consecutive runSpecToTest)

# Perf Report — spec_to_test_batch (5 consecutive runSpecToTest).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.44ms |
| p50 | 0.59ms |
| p95 | 1.29ms |
| p99 | 1.58ms |
| mean | 0.69ms |
| stdev | 0.34ms |
| min | 0.42ms |
| max | 1.66ms |
| total | 13.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.44ms | 0.51ms | -0.07ms | -13.16% |
| p50 | 0.59ms | 0.57ms | +0.02ms | +3.34% |
| p95 | 1.29ms | 1.16ms | +0.13ms | +11.21% |
| p99 | 1.58ms | 1.27ms | +0.31ms | +24.49% |
| mean | 0.69ms | 0.63ms | +0.06ms | +10.15% |
| min | 0.42ms | 0.45ms | -0.04ms | -7.78% |
| max | 1.66ms | 1.30ms | +0.36ms | +27.45% |
| total | 13.87ms | 12.59ms | +1.28ms | +10.15% |

### init_error_handling (3 InitConflictError catch)

# Perf Report — init_error_handling (3 InitConflictError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.82ms |
| p50 | 1.15ms |
| p95 | 1.70ms |
| p99 | 1.76ms |
| mean | 1.16ms |
| stdev | 0.30ms |
| min | 0.76ms |
| max | 1.77ms |
| total | 23.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.82ms | 0.83ms | -0.02ms | -2.33% |
| p50 | 1.15ms | 1.06ms | +0.08ms | +7.89% |
| p95 | 1.70ms | 1.69ms | +0.01ms | +0.88% |
| p99 | 1.76ms | 1.72ms | +0.04ms | +2.42% |
| mean | 1.16ms | 1.13ms | +0.03ms | +2.60% |
| min | 0.76ms | 0.77ms | -0.01ms | -1.35% |
| max | 1.77ms | 1.72ms | +0.05ms | +2.80% |
| total | 23.13ms | 22.54ms | +0.59ms | +2.60% |

