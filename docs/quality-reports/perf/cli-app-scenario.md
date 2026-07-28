# Perf Suite — cli-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 3.15ms | 500ms | PASS | improved — gate 対象外 (fs syscall の揺らぎが実行ごとに p50 で 200% 超動く (#1718)) |
| spec_to_test_batch (5 consecutive runSpecToTest) | 0.68ms | 300ms | PASS | improved — gate 対象外 (fs syscall の揺らぎが実行ごとに p50 で 200% 超動く (#1718)) |
| init_error_handling (3 InitConflictError catch) | 1.09ms | 500ms | PASS | improved — gate 対象外 (fs syscall の揺らぎが実行ごとに p50 で 200% 超動く (#1718)) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 18.64ms | 1000ms | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | 2.54ms | 600ms | PASS |
| init_error_handling (3 InitConflictError catch) | 4.02ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 1984 B | 0 B | 102400 B | yes | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | -18672 B | 0 B | 102400 B | yes | PASS |
| init_error_handling (3 InitConflictError catch) | 5320 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### init_workflow (3 fresh project scaffold)

# Perf Report — init_workflow (3 fresh project scaffold).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 2.41ms |
| p95 | 3.15ms |
| p99 | 3.23ms |
| mean | 2.45ms |
| stdev | 0.42ms |
| min | 1.84ms |
| max | 3.25ms |
| total | 48.91ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 2.41ms | 3.21ms | -0.80ms | -24.89% |
| p95 | 3.15ms | 7.34ms | -4.20ms | -57.17% |
| p99 | 3.23ms | 18.87ms | -15.64ms | -82.87% |
| mean | 2.45ms | 3.90ms | -1.45ms | -37.26% |
| min | 1.84ms | 1.87ms | -0.03ms | -1.52% |
| max | 3.25ms | 24.60ms | -21.35ms | -86.77% |
| total | 48.91ms | 779.57ms | -730.65ms | -93.73% |

### spec_to_test_batch (5 consecutive runSpecToTest)

# Perf Report — spec_to_test_batch (5 consecutive runSpecToTest).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.42ms |
| p95 | 0.68ms |
| p99 | 0.73ms |
| mean | 0.46ms |
| stdev | 0.11ms |
| min | 0.38ms |
| max | 0.74ms |
| total | 9.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.42ms | 0.55ms | -0.14ms | -24.87% |
| p95 | 0.68ms | 1.93ms | -1.25ms | -64.69% |
| p99 | 0.73ms | 2.98ms | -2.25ms | -75.47% |
| mean | 0.46ms | 0.82ms | -0.37ms | -44.36% |
| min | 0.38ms | 0.42ms | -0.04ms | -10.14% |
| max | 0.74ms | 6.47ms | -5.73ms | -88.51% |
| total | 9.17ms | 164.78ms | -155.61ms | -94.44% |

### init_error_handling (3 InitConflictError catch)

# Perf Report — init_error_handling (3 InitConflictError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.89ms |
| p95 | 1.09ms |
| p99 | 1.11ms |
| mean | 0.89ms |
| stdev | 0.14ms |
| min | 0.65ms |
| max | 1.12ms |
| total | 17.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.89ms | 1.04ms | -0.15ms | -14.70% |
| p95 | 1.09ms | 2.59ms | -1.51ms | -58.11% |
| p99 | 1.11ms | 4.14ms | -3.03ms | -73.13% |
| mean | 0.89ms | 1.28ms | -0.39ms | -30.48% |
| min | 0.65ms | 0.53ms | +0.11ms | +21.15% |
| max | 1.12ms | 4.80ms | -3.68ms | -76.64% |
| total | 17.80ms | 256.05ms | -238.25ms | -93.05% |

