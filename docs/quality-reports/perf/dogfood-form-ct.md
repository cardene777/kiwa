# Perf Suite — dogfood-form-ct

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| mountAllForms | 0.12ms | 50ms | PASS | n/a (baseline seeded) |
| validateAllForms | 0.08ms | 80ms | PASS | n/a (baseline seeded) |
| submitAllForms | 0.03ms | 80ms | PASS | n/a (baseline seeded) |
| a11yAllForms | 0.11ms | 80ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| mountAllForms | 0.44ms | 100ms | PASS |
| validateAllForms | 0.44ms | 160ms | PASS |
| submitAllForms | 0.34ms | 160ms | PASS |
| a11yAllForms | 0.69ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| mountAllForms | 3837312 B | 0 B | 102400 B | PASS |
| validateAllForms | 1037776 B | 0 B | 102400 B | PASS |
| submitAllForms | 4604864 B | 0 B | 102400 B | PASS |
| a11yAllForms | 3251560 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### mountAllForms

# Perf Report — mountAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.06ms |
| p95 | 0.12ms |
| p99 | 0.21ms |
| mean | 0.07ms |
| stdev | 0.03ms |
| min | 0.04ms |
| max | 0.21ms |
| total | 2.82ms |

### validateAllForms

# Perf Report — validateAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.04ms |
| p95 | 0.08ms |
| p99 | 0.14ms |
| mean | 0.05ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.14ms |
| total | 1.82ms |

### submitAllForms

# Perf Report — submitAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.98ms |

### a11yAllForms

# Perf Report — a11yAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.06ms |
| p95 | 0.11ms |
| p99 | 0.18ms |
| mean | 0.07ms |
| stdev | 0.03ms |
| min | 0.05ms |
| max | 0.18ms |
| total | 2.72ms |

