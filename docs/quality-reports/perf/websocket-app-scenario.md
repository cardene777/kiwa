# Perf Suite — websocket-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.05ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2808%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +9188%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| binary_frame_batch (5 encode + parse round-trip) | 0.00ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +17795%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| room_registry_batch (5 room join + broadcast + leave) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +6038%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.00ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +21454%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.09ms | 200ms | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.03ms | 200ms | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 0.02ms | 200ms | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 0.03ms | 200ms | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 11336 B | 0 B | 102400 B | yes | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 20480 B | 0 B | 102400 B | yes | PASS |
| binary_frame_batch (5 encode + parse round-trip) | -4152 B | 0 B | 102400 B | yes | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 23128 B | 0 B | 102400 B | yes | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 5904 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_room_workflow (10 send across 4 providers)

# Perf Report — chat_room_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.05ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.01ms | +60.12% |
| p95 | 0.05ms | 0.02ms | +0.04ms | +208.13% |
| p99 | 0.09ms | 0.03ms | +0.06ms | +242.02% |
| mean | 0.02ms | 0.01ms | +0.01ms | +125.75% |
| min | 0.01ms | 0.01ms | +0.01ms | +126.78% |
| max | 0.10ms | 0.03ms | +0.07ms | +247.50% |
| total | 0.47ms | 0.21ms | +0.26ms | +125.75% |

### broadcast_batch (5 rooms x 3 clients broadcast)

# Perf Report — broadcast_batch (5 rooms x 3 clients broadcast).serial

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

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.47% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +34.18% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +35.19% |
| mean | 0.01ms | 0.00ms | +0.00ms | +10.11% |
| min | 0.00ms | 0.00ms | -0.00ms | -1.02% |
| max | 0.01ms | 0.01ms | +0.00ms | +35.40% |
| total | 0.10ms | 0.09ms | +0.01ms | +10.11% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +1.59% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +7.88% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +13.30% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.53% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.04% |
| max | 0.00ms | 0.00ms | +0.00ms | +14.50% |
| total | 0.05ms | 0.05ms | +0.00ms | +2.53% |

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
| min | 0.01ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +9.17% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -10.61% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -16.79% |
| mean | 0.01ms | 0.01ms | +0.00ms | +1.81% |
| min | 0.01ms | 0.00ms | +0.00ms | +11.11% |
| max | 0.01ms | 0.01ms | -0.00ms | -18.11% |
| total | 0.11ms | 0.11ms | +0.00ms | +1.81% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +1.89% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +2.56% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.25% |
| min | 0.00ms | 0.00ms | +0.00ms | +2.01% |
| max | 0.00ms | 0.00ms | +0.00ms | +2.69% |
| total | 0.04ms | 0.04ms | +0.00ms | +1.25% |

