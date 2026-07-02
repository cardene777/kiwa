# Perf Suite — quality-metrics

| op | p95 | gate | regression | blockers |
|---|---|---|---|---|
| evaluateReleaseGate | 0.00ms | PASS | stable | none |
| diffReports | 0.00ms | PASS | stable | none |

## evaluateReleaseGate

# Perf Report — evaluateReleaseGate

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +0.06% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -7.35% |
| mean | 0.00ms | 0.00ms | -0.00ms | -5.29% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -25.35% |
| total | 0.07ms | 0.07ms | -0.00ms | -5.29% |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 0.00-0.00 | 92 | ########## |
| 2 | 0.00-0.00 | 4 | # |
| 3 | 0.00-0.00 | 2 | # |
| 4 | 0.00-0.00 | 0 |  |
| 5 | 0.00-0.00 | 0 |  |
| 6 | 0.00-0.01 | 0 |  |
| 7 | 0.01-0.01 | 0 |  |
| 8 | 0.01-0.01 | 0 |  |
| 9 | 0.01-0.01 | 0 |  |
| 10 | 0.01-0.01 | 2 | # |

## diffReports

# Perf Report — diffReports

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.83% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +3.78% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +0.56% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.88% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.34% |
| max | 0.01ms | 0.01ms | -0.00ms | -2.22% |
| total | 0.08ms | 0.08ms | -0.00ms | -0.88% |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 0.00-0.00 | 91 | ########## |
| 2 | 0.00-0.00 | 2 | # |
| 3 | 0.00-0.00 | 0 |  |
| 4 | 0.00-0.00 | 3 | # |
| 5 | 0.00-0.00 | 2 | # |
| 6 | 0.00-0.01 | 0 |  |
| 7 | 0.01-0.01 | 0 |  |
| 8 | 0.01-0.01 | 1 | # |
| 9 | 0.01-0.01 | 0 |  |
| 10 | 0.01-0.01 | 1 | # |

