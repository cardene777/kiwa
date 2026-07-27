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
| storybook_registry_burst (create registry x 30) | 0.02ms | 100ms | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.01ms | 100ms | PASS |
| chromatic_visual_snapshot (create mock x 30) | 0.03ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | -14920 B | 0 B | 102400 B | yes | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | -134160 B | 0 B | 102400 B | yes | PASS |
| chromatic_visual_snapshot (create mock x 30) | 912 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.41% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -31.84% |
| p99 | 0.02ms | 0.02ms | -0.01ms | -24.51% |
| mean | 0.01ms | 0.01ms | -0.00ms | -13.64% |
| min | 0.00ms | 0.00ms | -0.00ms | -5.04% |
| max | 0.02ms | 0.02ms | -0.01ms | -23.09% |
| total | 0.11ms | 0.13ms | -0.02ms | -13.64% |

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
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.53% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -32.13% |
| p99 | 0.01ms | 0.01ms | -0.01ms | -38.63% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.38% |
| min | 0.00ms | 0.00ms | +0.00ms | +50.06% |
| max | 0.01ms | 0.01ms | -0.01ms | -40.00% |
| total | 0.08ms | 0.08ms | +0.00ms | +0.38% |

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
| min | 0.01ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +0.29% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -36.60% |
| p99 | 0.01ms | 0.03ms | -0.01ms | -51.43% |
| mean | 0.01ms | 0.01ms | -0.00ms | -14.83% |
| min | 0.01ms | 0.01ms | -0.00ms | -4.44% |
| max | 0.01ms | 0.03ms | -0.02ms | -53.55% |
| total | 0.16ms | 0.19ms | -0.03ms | -14.83% |

