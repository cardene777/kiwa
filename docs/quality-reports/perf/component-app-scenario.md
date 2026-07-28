# Perf Suite — component-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.01ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +3536%) 以上の悪化が必要) |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.01ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +4319%) 以上の悪化が必要) |
| chromatic_visual_snapshot (create mock x 30) | 0.02ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +3683%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.03ms | 100ms | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.01ms | 100ms | PASS |
| chromatic_visual_snapshot (create mock x 30) | 0.03ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | -366256 B | 0 B | 102400 B | yes | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | -15520 B | 0 B | 102400 B | yes | PASS |
| chromatic_visual_snapshot (create mock x 30) | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### storybook_registry_burst (create registry x 30)

# Perf Report — storybook_registry_burst (create registry x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -4.81% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -9.81% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +1.77% |
| mean | 0.01ms | 0.01ms | -0.00ms | -4.35% |
| min | 0.00ms | 0.00ms | -0.00ms | -7.13% |
| max | 0.02ms | 0.02ms | +0.00ms | +3.90% |
| total | 0.11ms | 0.11ms | -0.01ms | -4.35% |

### playwright_ct_mock_lifecycle (create mock x 30)

# Perf Report — playwright_ct_mock_lifecycle (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +26.56% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -6.75% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -14.82% |
| mean | 0.00ms | 0.00ms | +0.00ms | +15.03% |
| min | 0.00ms | 0.00ms | +0.00ms | +30.41% |
| max | 0.01ms | 0.01ms | -0.00ms | -16.62% |
| total | 0.10ms | 0.09ms | +0.01ms | +15.03% |

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
| min | 0.00ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +7.04% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +28.65% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +24.70% |
| mean | 0.01ms | 0.01ms | +0.00ms | +12.11% |
| min | 0.00ms | 0.01ms | -0.00ms | -21.58% |
| max | 0.02ms | 0.01ms | +0.00ms | +23.75% |
| total | 0.16ms | 0.15ms | +0.02ms | +12.11% |

