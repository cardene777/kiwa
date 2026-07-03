# Perf Suite — dogfood-observability-dashboard

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| refreshDashboard | 0.01ms | 30ms | PASS | n/a (baseline seeded) |
| runQuery | 0.01ms | 20ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| refreshDashboard | 0.05ms | 60ms | PASS |
| runQuery | 0.03ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| refreshDashboard | 1739304 B | 0 B | 102400 B | PASS |
| runQuery | 779424 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### refreshDashboard

# Perf Report — refreshDashboard.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.24ms |

### runQuery

# Perf Report — runQuery.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.13ms |

