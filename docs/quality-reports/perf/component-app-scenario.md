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
| playwright_ct_mock_lifecycle (create mock x 30) | 0.02ms | 100ms | PASS |
| chromatic_visual_snapshot (create mock x 30) | 0.01ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | -14936 B | 0 B | 102400 B | yes | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | -11312 B | 0 B | 102400 B | yes | PASS |
| chromatic_visual_snapshot (create mock x 30) | 6392 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.34% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -22.78% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -11.97% |
| mean | 0.01ms | 0.01ms | -0.00ms | -12.38% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.09% |
| max | 0.02ms | 0.02ms | -0.00ms | -9.87% |
| total | 0.11ms | 0.13ms | -0.02ms | -12.38% |

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
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +49.25% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -5.58% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -16.74% |
| mean | 0.01ms | 0.00ms | +0.00ms | +32.77% |
| min | 0.00ms | 0.00ms | +0.00ms | +72.57% |
| max | 0.01ms | 0.01ms | -0.00ms | -19.09% |
| total | 0.10ms | 0.08ms | +0.03ms | +32.77% |

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
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -7.27% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -33.28% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -53.60% |
| mean | 0.01ms | 0.01ms | -0.00ms | -18.04% |
| min | 0.01ms | 0.01ms | +0.00ms | +8.16% |
| max | 0.01ms | 0.03ms | -0.02ms | -56.49% |
| total | 0.15ms | 0.19ms | -0.03ms | -18.04% |

