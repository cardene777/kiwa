# Perf Suite — dogfood-vercel-ai-rag

| op | p95 | gate | regression | blockers |
|---|---|---|---|---|
| embed | 0.01ms | PASS | stable | none |
| retrieve | 0.01ms | PASS | stable | none |
| answer | 10.20ms | PASS | stable | none |

## embed

# Perf Report — embed

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -6.61% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -14.11% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.73% |
| min | 0.00ms | 0.00ms | +0.00ms | +2.37% |
| max | 0.02ms | 0.02ms | -0.00ms | -22.23% |
| total | 0.43ms | 0.44ms | -0.01ms | -2.73% |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 0.00-0.00 | 88 | ########## |
| 2 | 0.00-0.01 | 3 | # |
| 3 | 0.01-0.01 | 5 | # |
| 4 | 0.01-0.01 | 2 | # |
| 5 | 0.01-0.01 | 0 |  |
| 6 | 0.01-0.01 | 0 |  |
| 7 | 0.01-0.01 | 0 |  |
| 8 | 0.01-0.01 | 0 |  |
| 9 | 0.01-0.01 | 1 | # |
| 10 | 0.01-0.02 | 1 | # |

## retrieve

# Perf Report — retrieve

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +2.41% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +14.98% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -1.99% |
| mean | 0.01ms | 0.01ms | +0.00ms | +2.00% |
| min | 0.01ms | 0.01ms | -0.00ms | -0.72% |
| max | 0.02ms | 0.02ms | +0.00ms | +10.60% |
| total | 0.77ms | 0.75ms | +0.02ms | +2.00% |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 0.01-0.01 | 49 | ########## |
| 2 | 0.01-0.01 | 27 | ###### |
| 3 | 0.01-0.01 | 10 | ## |
| 4 | 0.01-0.01 | 5 | # |
| 5 | 0.01-0.01 | 1 | # |
| 6 | 0.01-0.01 | 4 | # |
| 7 | 0.01-0.01 | 2 | # |
| 8 | 0.01-0.02 | 1 | # |
| 9 | 0.02-0.02 | 0 |  |
| 10 | 0.02-0.02 | 1 | # |

## answer

# Perf Report — answer

| metric | value |
|---|---|
| iterations | 10 |
| warmup | 5 |
| p50 | 10.12ms |
| p95 | 10.20ms |
| p99 | 10.20ms |
| mean | 9.90ms |
| stdev | 0.53ms |
| min | 8.61ms |
| max | 10.20ms |
| total | 99.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 10.12ms | 10.00ms | +0.12ms | +1.19% |
| p95 | 10.20ms | 10.14ms | +0.06ms | +0.58% |
| p99 | 10.20ms | 10.14ms | +0.06ms | +0.58% |
| mean | 9.90ms | 9.62ms | +0.28ms | +2.96% |
| min | 8.61ms | 8.19ms | +0.42ms | +5.18% |
| max | 10.20ms | 10.14ms | +0.06ms | +0.58% |
| total | 99.01ms | 96.16ms | +2.85ms | +2.96% |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 8.61-8.77 | 1 | # |
| 2 | 8.77-8.93 | 0 |  |
| 3 | 8.93-9.09 | 0 |  |
| 4 | 9.09-9.25 | 0 |  |
| 5 | 9.25-9.41 | 1 | # |
| 6 | 9.41-9.57 | 0 |  |
| 7 | 9.57-9.73 | 0 |  |
| 8 | 9.73-9.89 | 0 |  |
| 9 | 9.89-10.04 | 0 |  |
| 10 | 10.04-10.20 | 8 | ########## |

