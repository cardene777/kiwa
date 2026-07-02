# Perf Suite — dogfood-socketio-notification

| op | p95 | gate | regression | blockers |
|---|---|---|---|---|
| subscribeRoom | 3.58ms | PASS | n/a | none |
| deliverNotification | 3.47ms | PASS | n/a | none |
| getPending | 0.00ms | PASS | n/a | none |
| simulateReconnect | 0.00ms | PASS | n/a | none |

## subscribeRoom

# Perf Report — subscribeRoom

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 3 |
| p50 | 3.52ms |
| p95 | 3.58ms |
| p99 | 3.66ms |
| mean | 3.43ms |
| stdev | 0.26ms |
| min | 2.35ms |
| max | 3.66ms |
| total | 206.05ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 2.35-2.48 | 2 | # |
| 2 | 2.48-2.61 | 1 | # |
| 3 | 2.61-2.75 | 0 |  |
| 4 | 2.75-2.88 | 0 |  |
| 5 | 2.88-3.01 | 0 |  |
| 6 | 3.01-3.14 | 1 | # |
| 7 | 3.14-3.27 | 4 | # |
| 8 | 3.27-3.40 | 2 | # |
| 9 | 3.40-3.53 | 29 | ########## |
| 10 | 3.53-3.66 | 21 | ####### |

## deliverNotification

# Perf Report — deliverNotification

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 5 |
| p50 | 3.43ms |
| p95 | 3.47ms |
| p99 | 3.49ms |
| mean | 3.34ms |
| stdev | 0.28ms |
| min | 2.28ms |
| max | 3.49ms |
| total | 333.97ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 2.28-2.40 | 6 | # |
| 2 | 2.40-2.52 | 0 |  |
| 3 | 2.52-2.65 | 0 |  |
| 4 | 2.65-2.77 | 0 |  |
| 5 | 2.77-2.89 | 0 |  |
| 6 | 2.89-3.01 | 0 |  |
| 7 | 3.01-3.13 | 3 | # |
| 8 | 3.13-3.25 | 6 | # |
| 9 | 3.25-3.37 | 3 | # |
| 10 | 3.37-3.49 | 82 | ########## |

## getPending

# Perf Report — getPending

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
| total | 0.04ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 0.00-0.00 | 93 | ########## |
| 2 | 0.00-0.00 | 1 | # |
| 3 | 0.00-0.00 | 3 | # |
| 4 | 0.00-0.00 | 0 |  |
| 5 | 0.00-0.00 | 2 | # |
| 6 | 0.00-0.00 | 0 |  |
| 7 | 0.00-0.00 | 0 |  |
| 8 | 0.00-0.00 | 0 |  |
| 9 | 0.00-0.00 | 0 |  |
| 10 | 0.00-0.01 | 1 | # |

## simulateReconnect

# Perf Report — simulateReconnect

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.03ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 0.00-0.00 | 31 | ########## |
| 2 | 0.00-0.00 | 4 | # |
| 3 | 0.00-0.00 | 2 | # |
| 4 | 0.00-0.00 | 1 | # |
| 5 | 0.00-0.00 | 0 |  |
| 6 | 0.00-0.00 | 0 |  |
| 7 | 0.00-0.00 | 1 | # |
| 8 | 0.00-0.00 | 0 |  |
| 9 | 0.00-0.00 | 0 |  |
| 10 | 0.00-0.01 | 1 | # |

