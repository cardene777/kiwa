# Perf Suite — dogfood-visual-regression

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| seedAllBaselines | 0.18ms | 50ms | PASS | n/a (baseline seeded) |
| captureAllScenesNeutral | 0.32ms | 80ms | PASS | n/a (baseline seeded) |
| captureAllScenesChanged | 0.18ms | 80ms | PASS | n/a (baseline seeded) |
| acceptAllPendingChanges | 0.30ms | 80ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| seedAllBaselines | 1.39ms | 100ms | PASS |
| captureAllScenesNeutral | 2.11ms | 160ms | PASS |
| captureAllScenesChanged | 2.07ms | 160ms | PASS |
| acceptAllPendingChanges | 1.92ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| seedAllBaselines | -4520768 B | 0 B | 102400 B | PASS |
| captureAllScenesNeutral | 2652872 B | 0 B | 102400 B | PASS |
| captureAllScenesChanged | 3371784 B | 0 B | 102400 B | PASS |
| acceptAllPendingChanges | -6178920 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### seedAllBaselines

# Perf Report — seedAllBaselines.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.10ms |
| p95 | 0.18ms |
| p99 | 0.47ms |
| mean | 0.12ms |
| stdev | 0.06ms |
| min | 0.08ms |
| max | 0.47ms |
| total | 4.77ms |

### captureAllScenesNeutral

# Perf Report — captureAllScenesNeutral.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.17ms |
| p95 | 0.32ms |
| p99 | 0.41ms |
| mean | 0.19ms |
| stdev | 0.05ms |
| min | 0.16ms |
| max | 0.41ms |
| total | 7.69ms |

### captureAllScenesChanged

# Perf Report — captureAllScenesChanged.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.16ms |
| p95 | 0.18ms |
| p99 | 0.34ms |
| mean | 0.17ms |
| stdev | 0.03ms |
| min | 0.16ms |
| max | 0.34ms |
| total | 6.74ms |

### acceptAllPendingChanges

# Perf Report — acceptAllPendingChanges.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.17ms |
| p95 | 0.30ms |
| p99 | 0.48ms |
| mean | 0.19ms |
| stdev | 0.06ms |
| min | 0.16ms |
| max | 0.48ms |
| total | 7.40ms |

