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
| chat_room_workflow (10 send across 4 providers) | 0.03ms | 200ms | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.03ms | 200ms | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 0.02ms | 200ms | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 0.02ms | 200ms | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 19104 B | -15023 B | 102400 B | yes | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 1744 B | 0 B | 102400 B | yes | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 736 B | 0 B | 102400 B | yes | PASS |
| room_registry_batch (5 room join + broadcast + leave) | -704 B | 0 B | 102400 B | yes | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | -376 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -2.64% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -26.23% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +17.75% |
| mean | 0.01ms | 0.01ms | -0.00ms | -1.78% |
| min | 0.01ms | 0.01ms | -0.00ms | -0.73% |
| max | 0.02ms | 0.02ms | +0.01ms | +26.72% |
| total | 0.16ms | 0.16ms | -0.00ms | -1.78% |

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
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +26.63% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +71.75% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +57.18% |
| mean | 0.01ms | 0.00ms | +0.00ms | +34.75% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.98% |
| max | 0.01ms | 0.01ms | +0.00ms | +54.49% |
| total | 0.13ms | 0.10ms | +0.03ms | +34.75% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -4.18% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +39.44% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +39.26% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.88% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.76% |
| max | 0.00ms | 0.00ms | +0.00ms | +39.22% |
| total | 0.05ms | 0.05ms | +0.00ms | +1.88% |

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.00ms | -7.40% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +24.29% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +20.14% |
| mean | 0.01ms | 0.01ms | -0.00ms | -0.53% |
| min | 0.00ms | 0.00ms | -0.00ms | -10.35% |
| max | 0.01ms | 0.01ms | +0.00ms | +19.15% |
| total | 0.11ms | 0.11ms | -0.00ms | -0.53% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -3.09% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +9.93% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +20.44% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.80% |
| min | 0.00ms | 0.00ms | -0.00ms | -4.24% |
| max | 0.00ms | 0.00ms | +0.00ms | +22.51% |
| total | 0.04ms | 0.04ms | -0.00ms | -0.80% |

