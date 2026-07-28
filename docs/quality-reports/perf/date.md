# Perf Suite — date

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| addDays | 0.00ms | 5ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) |
| formatDate | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +38148%) 以上の悪化が必要) |
| createDateClient | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +90326%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| addDays | 0.01ms | 10ms | PASS |
| formatDate | 0.02ms | 10ms | PASS |
| createDateClient | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| addDays | 344416 B | 0 B | 102400 B | yes | PASS |
| formatDate | -18152 B | 0 B | 102400 B | yes | PASS |
| createDateClient | 4208 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### addDays

# Perf Report — addDays.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.04ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +112.61% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +253.62% |
| p99 | 0.02ms | 0.00ms | +0.01ms | +458.74% |
| mean | 0.00ms | 0.00ms | +0.00ms | +139.37% |
| min | 0.00ms | 0.00ms | -0.00ms | -28.52% |
| max | 0.04ms | 0.01ms | +0.03ms | +304.29% |
| total | 0.21ms | 0.09ms | +0.12ms | +139.37% |

### formatDate

# Perf Report — formatDate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.75% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +15.40% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +92.36% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.08% |
| min | 0.00ms | 0.00ms | -0.00ms | -19.98% |
| max | 0.01ms | 0.01ms | -0.00ms | -13.53% |
| total | 0.24ms | 0.25ms | -0.01ms | -3.08% |

### createDateClient

# Perf Report — createDateClient.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.30% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -16.12% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +35.58% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.87% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.34% |
| max | 0.01ms | 0.01ms | +0.00ms | +52.90% |
| total | 0.09ms | 0.09ms | +0.00ms | +3.87% |

