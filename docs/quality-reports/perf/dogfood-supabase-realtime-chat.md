# Perf Suite — dogfood-supabase-realtime-chat

| op | p95 | gate | regression | blockers |
|---|---|---|---|---|
| joinRoom | 3.48ms | PASS | n/a | none |
| sendMessage | 0.00ms | PASS | n/a | none |
| getPresence | 0.00ms | PASS | n/a | none |
| sendTyping | 0.00ms | PASS | n/a | none |

## joinRoom

# Perf Report — joinRoom

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 3 |
| p50 | 3.43ms |
| p95 | 3.48ms |
| p99 | 3.51ms |
| mean | 3.41ms |
| stdev | 0.15ms |
| min | 2.30ms |
| max | 3.51ms |
| total | 204.60ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 2.30-2.42 | 1 | # |
| 2 | 2.42-2.55 | 0 |  |
| 3 | 2.55-2.67 | 0 |  |
| 4 | 2.67-2.79 | 0 |  |
| 5 | 2.79-2.91 | 0 |  |
| 6 | 2.91-3.03 | 0 |  |
| 7 | 3.03-3.15 | 0 |  |
| 8 | 3.15-3.27 | 1 | # |
| 9 | 3.27-3.39 | 1 | # |
| 10 | 3.39-3.51 | 57 | ########## |

## sendMessage

# Perf Report — sendMessage

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
| total | 0.06ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 0.00-0.00 | 88 | ########## |
| 2 | 0.00-0.00 | 6 | # |
| 3 | 0.00-0.00 | 3 | # |
| 4 | 0.00-0.00 | 1 | # |
| 5 | 0.00-0.00 | 1 | # |
| 6 | 0.00-0.00 | 0 |  |
| 7 | 0.00-0.00 | 0 |  |
| 8 | 0.00-0.01 | 0 |  |
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
| max | 0.00ms |
| total | 0.05ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 0.00-0.00 | 92 | ########## |
| 2 | 0.00-0.00 | 4 | # |
| 3 | 0.00-0.00 | 1 | # |
| 4 | 0.00-0.00 | 2 | # |
| 5 | 0.00-0.00 | 0 |  |
| 6 | 0.00-0.00 | 0 |  |
| 7 | 0.00-0.00 | 0 |  |
| 8 | 0.00-0.00 | 0 |  |
| 9 | 0.00-0.00 | 0 |  |
| 10 | 0.00-0.00 | 1 | # |

## sendTyping

# Perf Report — sendTyping

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.03ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 0.00-0.00 | 14 | ########## |
| 2 | 0.00-0.00 | 4 | ### |
| 3 | 0.00-0.00 | 3 | ## |
| 4 | 0.00-0.00 | 0 |  |
| 5 | 0.00-0.00 | 1 | # |
| 6 | 0.00-0.00 | 3 | ## |
| 7 | 0.00-0.00 | 1 | # |
| 8 | 0.00-0.00 | 2 | # |
| 9 | 0.00-0.00 | 0 |  |
| 10 | 0.00-0.00 | 2 | # |

