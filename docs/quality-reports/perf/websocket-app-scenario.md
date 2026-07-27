# Perf Suite — websocket-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.01ms | 100ms | PASS | stable |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.01ms | 100ms | PASS | stable |
| binary_frame_batch (5 encode + parse round-trip) | 0.00ms | 100ms | PASS | stable |
| room_registry_batch (5 room join + broadcast + leave) | 0.01ms | 100ms | PASS | stable |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.00ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.04ms | 200ms | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.03ms | 200ms | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 0.02ms | 200ms | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 0.02ms | 200ms | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 2056 B | 0 B | 102400 B | yes | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | -1624 B | 0 B | 102400 B | yes | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 656 B | 0 B | 102400 B | yes | PASS |
| room_registry_batch (5 room join + broadcast + leave) | -1920 B | 0 B | 102400 B | yes | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 2736 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +5.93% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -5.05% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +2.19% |
| mean | 0.01ms | 0.01ms | +0.00ms | +5.08% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.73% |
| max | 0.02ms | 0.02ms | +0.00ms | +3.66% |
| total | 0.17ms | 0.16ms | +0.01ms | +5.08% |

### broadcast_batch (5 rooms x 3 clients broadcast)

# Perf Report — broadcast_batch (5 rooms x 3 clients broadcast).serial

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
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +5.61% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +27.37% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +31.51% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.91% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.52% |
| max | 0.01ms | 0.01ms | +0.00ms | +32.28% |
| total | 0.10ms | 0.10ms | +0.00ms | +4.91% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +1.64% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +21.08% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +20.43% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.84% |
| min | 0.00ms | 0.00ms | -0.00ms | -3.54% |
| max | 0.00ms | 0.00ms | +0.00ms | +20.27% |
| total | 0.05ms | 0.05ms | +0.00ms | +3.84% |

### room_registry_batch (5 room join + broadcast + leave)

# Perf Report — room_registry_batch (5 room join + broadcast + leave).serial

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
| p50 | 0.01ms | 0.01ms | +0.00ms | +1.65% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +29.46% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +27.16% |
| mean | 0.01ms | 0.01ms | +0.00ms | +7.16% |
| min | 0.00ms | 0.00ms | -0.00ms | -14.65% |
| max | 0.01ms | 0.01ms | +0.00ms | +26.61% |
| total | 0.12ms | 0.11ms | +0.01ms | +7.16% |

### reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle)

# Perf Report — reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle).serial

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
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.27% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +5.55% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +6.79% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.48% |
| min | 0.00ms | 0.00ms | +0.00ms | +8.53% |
| max | 0.00ms | 0.00ms | +0.00ms | +7.03% |
| total | 0.04ms | 0.04ms | +0.00ms | +7.48% |

