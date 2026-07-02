# Perf Suite — dogfood-anthropic-chatbot

| op | p95 | gate | regression | blockers |
|---|---|---|---|---|
| reply | 9.27ms | PASS | n/a | none |
| replyStream | 17.06ms | PASS | n/a | none |
| toolLoop | 18.44ms | PASS | n/a | none |

## reply

# Perf Report — reply

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 5 |
| p50 | 9.11ms |
| p95 | 9.27ms |
| p99 | 9.35ms |
| mean | 9.02ms |
| stdev | 0.32ms |
| min | 7.78ms |
| max | 9.45ms |
| total | 902.29ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 7.78-7.95 | 2 | # |
| 2 | 7.95-8.12 | 3 | # |
| 3 | 8.12-8.28 | 2 | # |
| 4 | 8.28-8.45 | 0 |  |
| 5 | 8.45-8.62 | 3 | # |
| 6 | 8.62-8.78 | 3 | # |
| 7 | 8.78-8.95 | 2 | # |
| 8 | 8.95-9.11 | 39 | ######### |
| 9 | 9.11-9.28 | 43 | ########## |
| 10 | 9.28-9.45 | 3 | # |

## replyStream

# Perf Report — replyStream

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 15.55ms |
| p95 | 17.06ms |
| p99 | 17.72ms |
| mean | 15.49ms |
| stdev | 0.99ms |
| min | 13.27ms |
| max | 17.72ms |
| total | 464.71ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 13.27-13.72 | 1 | ## |
| 2 | 13.72-14.16 | 2 | ### |
| 3 | 14.16-14.61 | 4 | ####### |
| 4 | 14.61-15.05 | 1 | ## |
| 5 | 15.05-15.50 | 6 | ########## |
| 6 | 15.50-15.94 | 6 | ########## |
| 7 | 15.94-16.39 | 5 | ######## |
| 8 | 16.39-16.83 | 3 | ##### |
| 9 | 16.83-17.28 | 1 | ## |
| 10 | 17.28-17.72 | 1 | ## |

## toolLoop

# Perf Report — toolLoop

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 18.14ms |
| p95 | 18.44ms |
| p99 | 18.58ms |
| mean | 17.97ms |
| stdev | 0.51ms |
| min | 16.46ms |
| max | 18.58ms |
| total | 538.98ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 16.46-16.68 | 2 | ## |
| 2 | 16.68-16.89 | 0 |  |
| 3 | 16.89-17.10 | 1 | # |
| 4 | 17.10-17.31 | 0 |  |
| 5 | 17.31-17.52 | 2 | ## |
| 6 | 17.52-17.73 | 1 | # |
| 7 | 17.73-17.94 | 1 | # |
| 8 | 17.94-18.15 | 9 | ######## |
| 9 | 18.15-18.37 | 12 | ########## |
| 10 | 18.37-18.58 | 2 | ## |

