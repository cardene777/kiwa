# Perf Suite — dogfood-ably-collab-cursor

| op | p95 | gate | regression | blockers |
|---|---|---|---|---|
| joinBoard | 3.55ms | PASS | n/a | none |
| moveCursor | 10.42ms | PASS | n/a | none |
| rewindHistory | 0.01ms | PASS | n/a | none |
| getPresence | 0.00ms | PASS | n/a | none |

## joinBoard

# Perf Report — joinBoard

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 3 |
| p50 | 3.45ms |
| p95 | 3.55ms |
| p99 | 3.58ms |
| mean | 3.44ms |
| stdev | 0.09ms |
| min | 3.06ms |
| max | 3.58ms |
| total | 206.23ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 3.06-3.12 | 1 | # |
| 2 | 3.12-3.17 | 2 | # |
| 3 | 3.17-3.22 | 1 | # |
| 4 | 3.22-3.27 | 0 |  |
| 5 | 3.27-3.32 | 0 |  |
| 6 | 3.32-3.38 | 1 | # |
| 7 | 3.38-3.43 | 4 | # |
| 8 | 3.43-3.48 | 43 | ########## |
| 9 | 3.48-3.53 | 3 | # |
| 10 | 3.53-3.58 | 5 | # |

## moveCursor

# Perf Report — moveCursor

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 3 |
| p50 | 10.31ms |
| p95 | 10.42ms |
| p99 | 10.46ms |
| mean | 10.27ms |
| stdev | 0.20ms |
| min | 9.18ms |
| max | 10.46ms |
| total | 410.78ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 9.18-9.31 | 1 | # |
| 2 | 9.31-9.43 | 0 |  |
| 3 | 9.43-9.56 | 0 |  |
| 4 | 9.56-9.69 | 0 |  |
| 5 | 9.69-9.82 | 0 |  |
| 6 | 9.82-9.95 | 0 |  |
| 7 | 9.95-10.08 | 4 | ## |
| 8 | 10.08-10.20 | 0 |  |
| 9 | 10.20-10.33 | 23 | ########## |
| 10 | 10.33-10.46 | 12 | ##### |

## rewindHistory

# Perf Report — rewindHistory

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.11ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 0.00-0.00 | 49 | ########## |
| 2 | 0.00-0.00 | 6 | # |
| 3 | 0.00-0.00 | 1 | # |
| 4 | 0.00-0.01 | 1 | # |
| 5 | 0.01-0.01 | 0 |  |
| 6 | 0.01-0.01 | 0 |  |
| 7 | 0.01-0.01 | 1 | # |
| 8 | 0.01-0.01 | 1 | # |
| 9 | 0.01-0.01 | 0 |  |
| 10 | 0.01-0.01 | 1 | # |

## getPresence

# Perf Report — getPresence

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.07ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 0.00-0.00 | 92 | ########## |
| 2 | 0.00-0.00 | 4 | # |
| 3 | 0.00-0.00 | 1 | # |
| 4 | 0.00-0.00 | 1 | # |
| 5 | 0.00-0.00 | 1 | # |
| 6 | 0.00-0.00 | 0 |  |
| 7 | 0.00-0.01 | 0 |  |
| 8 | 0.01-0.01 | 0 |  |
| 9 | 0.01-0.01 | 0 |  |
| 10 | 0.01-0.01 | 1 | # |

