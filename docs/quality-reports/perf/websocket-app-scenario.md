# Perf Suite — websocket-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.01ms | 100ms | PASS | stable |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.01ms | 100ms | PASS | stable |
| binary_frame_batch (5 encode + parse round-trip) | 0.00ms | 100ms | PASS | improved |
| room_registry_batch (5 room join + broadcast + leave) | 0.01ms | 100ms | PASS | n/a (baseline seeded) |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.01ms | 100ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.04ms | 200ms | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.03ms | 200ms | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 0.01ms | 200ms | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 0.02ms | 200ms | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 884784 B | 0 B | 102400 B | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | -7626728 B | 0 B | 102400 B | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 154408 B | 0 B | 102400 B | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 365240 B | 0 B | 102400 B | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 186112 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### chat_room_workflow (10 send across 4 providers)

# Perf Report — chat_room_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -20.73% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -9.81% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -19.25% |
| mean | 0.01ms | 0.01ms | -0.00ms | -18.66% |
| min | 0.01ms | 0.01ms | -0.00ms | -20.24% |
| max | 0.02ms | 0.02ms | -0.00ms | -20.86% |
| total | 0.15ms | 0.19ms | -0.03ms | -18.66% |

### broadcast_batch (5 rooms x 3 clients broadcast)

# Perf Report — broadcast_batch (5 rooms x 3 clients broadcast).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -11.65% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -2.88% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +18.72% |
| mean | 0.01ms | 0.01ms | -0.00ms | -4.39% |
| min | 0.00ms | 0.00ms | -0.00ms | -13.41% |
| max | 0.01ms | 0.01ms | +0.00ms | +23.66% |
| total | 0.12ms | 0.12ms | -0.01ms | -4.39% |

### binary_frame_batch (5 encode + parse round-trip)

# Perf Report — binary_frame_batch (5 encode + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -33.36% |
| p95 | 0.00ms | 0.01ms | -0.01ms | -75.89% |
| p99 | 0.00ms | 0.01ms | -0.01ms | -63.95% |
| mean | 0.00ms | 0.00ms | -0.00ms | -43.76% |
| min | 0.00ms | 0.00ms | -0.00ms | -17.76% |
| max | 0.00ms | 0.01ms | -0.01ms | -61.00% |
| total | 0.05ms | 0.09ms | -0.04ms | -43.76% |

### room_registry_batch (5 room join + broadcast + leave)

# Perf Report — room_registry_batch (5 room join + broadcast + leave).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.10ms |

### reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle)

# Perf Report — reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.05ms |

