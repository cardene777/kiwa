# Perf Suite — fresh-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.28ms | 100ms | PASS | regressed |
| island_mount_batch (5 mountIsland with different props) | 0.03ms | 100ms | PASS | stable |
| handler_error_handling (5 throw + catch) | 0.05ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 1.15ms | 200ms | PASS |
| island_mount_batch (5 mountIsland with different props) | 0.04ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.15ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 3719400 B | 2800 B | 102400 B | PASS |
| island_mount_batch (5 mountIsland with different props) | 425720 B | 0 B | 102400 B | PASS |
| handler_error_handling (5 throw + catch) | -7086536 B | -3906 B | 102400 B | PASS |

## Detailed serial reports

### handler_workflow (10 invokeFreshHandler GET+POST mix)

# Perf Report — handler_workflow (10 invokeFreshHandler GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.15ms |
| p95 | 0.28ms |
| p99 | 0.41ms |
| mean | 0.17ms |
| stdev | 0.07ms |
| min | 0.12ms |
| max | 0.44ms |
| total | 3.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.15ms | 0.14ms | +0.01ms | +7.03% |
| p95 | 0.28ms | 0.16ms | +0.13ms | +80.33% |
| p99 | 0.41ms | 0.16ms | +0.25ms | +150.84% |
| mean | 0.17ms | 0.14ms | +0.03ms | +21.08% |
| min | 0.12ms | 0.12ms | -0.00ms | -2.35% |
| max | 0.44ms | 0.17ms | +0.28ms | +167.49% |
| total | 3.39ms | 2.80ms | +0.59ms | +21.08% |

### island_mount_batch (5 mountIsland with different props)

# Perf Report — island_mount_batch (5 mountIsland with different props).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.13ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.15ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -10.19% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +40.79% |
| p99 | 0.13ms | 0.02ms | +0.11ms | +537.69% |
| mean | 0.02ms | 0.01ms | +0.01ms | +49.39% |
| min | 0.01ms | 0.01ms | -0.00ms | -3.55% |
| max | 0.15ms | 0.02ms | +0.13ms | +650.90% |
| total | 0.38ms | 0.25ms | +0.12ms | +49.39% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 0.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.00ms | -5.31% |
| p95 | 0.05ms | 0.07ms | -0.02ms | -25.49% |
| p99 | 0.06ms | 0.09ms | -0.03ms | -34.09% |
| mean | 0.04ms | 0.04ms | -0.01ms | -12.49% |
| min | 0.03ms | 0.04ms | -0.00ms | -11.09% |
| max | 0.06ms | 0.10ms | -0.04ms | -35.59% |
| total | 0.76ms | 0.87ms | -0.11ms | -12.49% |

