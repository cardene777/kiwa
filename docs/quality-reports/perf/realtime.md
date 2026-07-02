# Perf Suite — realtime

| op | p95 | gate | regression | blockers |
|---|---|---|---|---|
| supabasePresenceTrack | 5.86ms | PASS | n/a | none |
| ablyPublish | 0.00ms | PASS | n/a | none |
| pusherSubscribeChannel | 0.00ms | PASS | n/a | none |
| socketioEmit | 0.00ms | PASS | n/a | none |

## supabasePresenceTrack

# Perf Report — supabase.channel.track

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 5.69ms |
| p95 | 5.86ms |
| p99 | 5.94ms |
| mean | 5.66ms |
| stdev | 0.21ms |
| min | 4.55ms |
| max | 6.20ms |
| total | 1131.83ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 4.55-4.72 | 4 | # |
| 2 | 4.72-4.88 | 1 | # |
| 3 | 4.88-5.05 | 0 |  |
| 4 | 5.05-5.21 | 3 | # |
| 5 | 5.21-5.38 | 10 | # |
| 6 | 5.38-5.54 | 4 | # |
| 7 | 5.54-5.71 | 96 | ########## |
| 8 | 5.71-5.87 | 74 | ######## |
| 9 | 5.87-6.04 | 7 | # |
| 10 | 6.04-6.20 | 1 | # |

## ablyPublish

# Perf Report — ably.channel.publish

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
| total | 0.21ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 0.00-0.00 | 176 | ########## |
| 2 | 0.00-0.00 | 12 | # |
| 3 | 0.00-0.00 | 4 | # |
| 4 | 0.00-0.00 | 2 | # |
| 5 | 0.00-0.00 | 2 | # |
| 6 | 0.00-0.01 | 0 |  |
| 7 | 0.01-0.01 | 1 | # |
| 8 | 0.01-0.01 | 2 | # |
| 9 | 0.01-0.01 | 0 |  |
| 10 | 0.01-0.01 | 1 | # |

## pusherSubscribeChannel

# Perf Report — pusher.subscribeChannel

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
| max | 0.02ms |
| total | 0.35ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 0.00-0.00 | 181 | ########## |
| 2 | 0.00-0.00 | 9 | # |
| 3 | 0.00-0.01 | 7 | # |
| 4 | 0.01-0.01 | 1 | # |
| 5 | 0.01-0.01 | 0 |  |
| 6 | 0.01-0.01 | 0 |  |
| 7 | 0.01-0.01 | 1 | # |
| 8 | 0.01-0.02 | 0 |  |
| 9 | 0.02-0.02 | 0 |  |
| 10 | 0.02-0.02 | 1 | # |

## socketioEmit

# Perf Report — socketio.emit

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

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 0.00-0.00 | 178 | ########## |
| 2 | 0.00-0.00 | 11 | # |
| 3 | 0.00-0.00 | 6 | # |
| 4 | 0.00-0.00 | 2 | # |
| 5 | 0.00-0.00 | 0 |  |
| 6 | 0.00-0.00 | 0 |  |
| 7 | 0.00-0.00 | 1 | # |
| 8 | 0.00-0.00 | 1 | # |
| 9 | 0.00-0.01 | 0 |  |
| 10 | 0.01-0.01 | 1 | # |

