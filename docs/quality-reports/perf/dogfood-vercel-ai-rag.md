# Perf Suite — dogfood-vercel-ai-rag

| op | p95 | gate | regression | blockers |
|---|---|---|---|---|
| embed | 0.01ms | PASS | n/a | none |
| retrieve | 0.01ms | PASS | n/a | none |
| answer | 9.27ms | PASS | n/a | none |

## embed

# Perf Report — embed

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.44ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 0.00-0.01 | 88 | ########## |
| 2 | 0.01-0.01 | 5 | # |
| 3 | 0.01-0.01 | 2 | # |
| 4 | 0.01-0.01 | 1 | # |
| 5 | 0.01-0.01 | 2 | # |
| 6 | 0.01-0.01 | 0 |  |
| 7 | 0.01-0.01 | 0 |  |
| 8 | 0.01-0.02 | 0 |  |
| 9 | 0.02-0.02 | 0 |  |
| 10 | 0.02-0.02 | 2 | # |

## retrieve

# Perf Report — retrieve

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.79ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 0.01-0.01 | 74 | ########## |
| 2 | 0.01-0.01 | 17 | ## |
| 3 | 0.01-0.01 | 5 | # |
| 4 | 0.01-0.02 | 2 | # |
| 5 | 0.02-0.02 | 0 |  |
| 6 | 0.02-0.02 | 1 | # |
| 7 | 0.02-0.02 | 0 |  |
| 8 | 0.02-0.03 | 0 |  |
| 9 | 0.03-0.03 | 0 |  |
| 10 | 0.03-0.03 | 1 | # |

## answer

# Perf Report — answer

| metric | value |
|---|---|
| iterations | 10 |
| warmup | 5 |
| p50 | 9.13ms |
| p95 | 9.27ms |
| p99 | 9.27ms |
| mean | 9.09ms |
| stdev | 0.17ms |
| min | 8.68ms |
| max | 9.27ms |
| total | 90.95ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 8.68-8.74 | 1 | ### |
| 2 | 8.74-8.79 | 0 |  |
| 3 | 8.79-8.85 | 0 |  |
| 4 | 8.85-8.91 | 0 |  |
| 5 | 8.91-8.97 | 1 | ### |
| 6 | 8.97-9.03 | 0 |  |
| 7 | 9.03-9.09 | 0 |  |
| 8 | 9.09-9.15 | 3 | ######## |
| 9 | 9.15-9.21 | 4 | ########## |
| 10 | 9.21-9.27 | 1 | ### |

