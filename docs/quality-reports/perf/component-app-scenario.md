# Perf Suite — component-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.02ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +3536%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.01ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +4319%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| chromatic_visual_snapshot (create mock x 30) | 0.02ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +3683%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.07ms | 100ms | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.02ms | 100ms | PASS |
| chromatic_visual_snapshot (create mock x 30) | 0.03ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 4888 B | -15860 B | 102400 B | yes | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 13856 B | 0 B | 102400 B | yes | PASS |
| chromatic_visual_snapshot (create mock x 30) | 3264 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### storybook_registry_burst (create registry x 30)

# Perf Report — storybook_registry_burst (create registry x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.01ms | +157.68% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +68.44% |
| p99 | 0.04ms | 0.02ms | +0.02ms | +102.97% |
| mean | 0.01ms | 0.01ms | +0.01ms | +135.89% |
| min | 0.01ms | 0.00ms | +0.01ms | +154.10% |
| max | 0.04ms | 0.02ms | +0.02ms | +109.32% |
| total | 0.27ms | 0.11ms | +0.16ms | +135.89% |

### playwright_ct_mock_lifecycle (create mock x 30)

# Perf Report — playwright_ct_mock_lifecycle (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +41.25% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -8.01% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +1.42% |
| mean | 0.01ms | 0.00ms | +0.00ms | +25.22% |
| min | 0.00ms | 0.00ms | +0.00ms | +54.30% |
| max | 0.01ms | 0.01ms | +0.00ms | +3.51% |
| total | 0.11ms | 0.09ms | +0.02ms | +25.22% |

### chromatic_visual_snapshot (create mock x 30)

# Perf Report — chromatic_visual_snapshot (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +37.92% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +10.92% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +17.73% |
| mean | 0.01ms | 0.01ms | +0.00ms | +28.92% |
| min | 0.01ms | 0.01ms | +0.00ms | +5.02% |
| max | 0.02ms | 0.01ms | +0.00ms | +19.36% |
| total | 0.19ms | 0.15ms | +0.04ms | +28.92% |

