# Perf Suite — websocket-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2808%) 以上の悪化が必要) |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +9188%) 以上の悪化が必要) |
| binary_frame_batch (5 encode + parse round-trip) | 0.00ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +17795%) 以上の悪化が必要) |
| room_registry_batch (5 room join + broadcast + leave) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +6038%) 以上の悪化が必要) |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.00ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +21454%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.06ms | 200ms | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.03ms | 200ms | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 0.02ms | 200ms | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 0.02ms | 200ms | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | -6808 B | 0 B | 102400 B | yes | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 5152 B | 0 B | 102400 B | yes | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 392 B | 0 B | 102400 B | yes | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 27296 B | 0 B | 102400 B | yes | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 5904 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.01ms | 0.01ms | -0.00ms | -39.88% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -22.00% |
| p99 | 0.02ms | 0.03ms | -0.00ms | -15.30% |
| mean | 0.01ms | 0.01ms | -0.00ms | -23.51% |
| min | 0.01ms | 0.01ms | -0.00ms | -12.74% |
| max | 0.02ms | 0.03ms | -0.00ms | -14.22% |
| total | 0.16ms | 0.21ms | -0.05ms | -23.51% |

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -2.38% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +17.19% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +28.70% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.86% |
| min | 0.00ms | 0.00ms | -0.00ms | -22.78% |
| max | 0.01ms | 0.01ms | +0.00ms | +31.03% |
| total | 0.09ms | 0.09ms | -0.00ms | -1.86% |

### binary_frame_batch (5 encode + parse round-trip)

# Perf Report — binary_frame_batch (5 encode + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -9.71% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +3.06% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +65.21% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.33% |
| min | 0.00ms | 0.00ms | -0.00ms | -11.49% |
| max | 0.01ms | 0.00ms | +0.00ms | +79.00% |
| total | 0.05ms | 0.05ms | -0.00ms | -3.33% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -3.92% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -4.63% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -5.43% |
| mean | 0.01ms | 0.01ms | -0.00ms | -5.23% |
| min | 0.00ms | 0.00ms | -0.00ms | -18.51% |
| max | 0.01ms | 0.01ms | -0.00ms | -5.61% |
| total | 0.11ms | 0.11ms | -0.01ms | -5.23% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.84% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -7.48% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -10.27% |
| mean | 0.00ms | 0.00ms | -0.00ms | -8.26% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.18% |
| max | 0.00ms | 0.00ms | -0.00ms | -10.80% |
| total | 0.04ms | 0.04ms | -0.00ms | -8.26% |

