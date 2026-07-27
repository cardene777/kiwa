# Perf Suite — component-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.01ms | 50ms | PASS | stable |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.01ms | 50ms | PASS | stable |
| chromatic_visual_snapshot (create mock x 30) | 0.01ms | 50ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.01ms | 100ms | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.01ms | 100ms | PASS |
| chromatic_visual_snapshot (create mock x 30) | 0.03ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 472480 B | 0 B | 102400 B | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 130528 B | 0 B | 102400 B | PASS |
| chromatic_visual_snapshot (create mock x 30) | 694432 B | 0 B | 102400 B | PASS |

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.99% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +20.05% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -3.53% |
| mean | 0.01ms | 0.01ms | +0.00ms | +9.79% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.03% |
| max | 0.02ms | 0.02ms | -0.00ms | -7.75% |
| total | 0.12ms | 0.11ms | +0.01ms | +9.79% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +28.37% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +16.87% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +0.49% |
| mean | 0.00ms | 0.00ms | +0.00ms | +25.58% |
| min | 0.00ms | 0.00ms | +0.00ms | +43.13% |
| max | 0.01ms | 0.01ms | -0.00ms | -2.90% |
| total | 0.10ms | 0.08ms | +0.02ms | +25.58% |

### chromatic_visual_snapshot (create mock x 30)

# Perf Report — chromatic_visual_snapshot (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -15.88% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -29.24% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -33.24% |
| mean | 0.01ms | 0.01ms | -0.00ms | -16.77% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.86% |
| max | 0.01ms | 0.02ms | -0.01ms | -33.89% |
| total | 0.13ms | 0.16ms | -0.03ms | -16.77% |

