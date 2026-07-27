# Perf Suite — component-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.02ms | 50ms | PASS | stable |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.01ms | 50ms | PASS | stable |
| chromatic_visual_snapshot (create mock x 30) | 0.02ms | 50ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.02ms | 100ms | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.01ms | 100ms | PASS |
| chromatic_visual_snapshot (create mock x 30) | 0.05ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | -14936 B | 0 B | 102400 B | yes | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | -10512 B | 0 B | 102400 B | yes | PASS |
| chromatic_visual_snapshot (create mock x 30) | 816 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### storybook_registry_burst (create registry x 30)

# Perf Report — storybook_registry_burst (create registry x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.39% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +26.96% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +7.81% |
| mean | 0.01ms | 0.01ms | +0.00ms | +9.18% |
| min | 0.00ms | 0.00ms | -0.00ms | -2.04% |
| max | 0.02ms | 0.02ms | +0.00ms | +4.09% |
| total | 0.14ms | 0.13ms | +0.01ms | +9.18% |

### playwright_ct_mock_lifecycle (create mock x 30)

# Perf Report — playwright_ct_mock_lifecycle (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +55.29% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +15.38% |
| p99 | 0.03ms | 0.01ms | +0.01ms | +92.80% |
| mean | 0.01ms | 0.00ms | +0.00ms | +66.65% |
| min | 0.00ms | 0.00ms | +0.00ms | +82.59% |
| max | 0.03ms | 0.01ms | +0.02ms | +109.09% |
| total | 0.13ms | 0.08ms | +0.05ms | +66.65% |

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
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -8.15% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -11.86% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -44.13% |
| mean | 0.01ms | 0.01ms | -0.00ms | -11.07% |
| min | 0.01ms | 0.01ms | +0.00ms | +2.97% |
| max | 0.02ms | 0.03ms | -0.02ms | -48.73% |
| total | 0.17ms | 0.19ms | -0.02ms | -11.07% |

