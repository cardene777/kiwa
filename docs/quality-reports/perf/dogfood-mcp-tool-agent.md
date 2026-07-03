# Perf Suite — dogfood-mcp-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| handshakeAndDiscover | 0.01ms | 20ms | PASS | n/a (baseline seeded) |
| callEachToolDirectly | 0.02ms | 30ms | PASS | n/a (baseline seeded) |
| runClaudeMcpChain | 27.67ms | 80ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handshakeAndDiscover | 0.05ms | 40ms | PASS |
| callEachToolDirectly | 0.20ms | 60ms | PASS |
| runClaudeMcpChain | 27.59ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| handshakeAndDiscover | -6527912 B | -3571 B | 102400 B | PASS |
| callEachToolDirectly | -1273656 B | 0 B | 102400 B | PASS |
| runClaudeMcpChain | -6026072 B | -200 B | 102400 B | PASS |

## Detailed serial reports

### handshakeAndDiscover

# Perf Report — handshakeAndDiscover.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.29ms |

### callEachToolDirectly

# Perf Report — callEachToolDirectly.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.95ms |

### runClaudeMcpChain

# Perf Report — runClaudeMcpChain.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p50 | 27.29ms |
| p95 | 27.67ms |
| p99 | 27.91ms |
| mean | 27.21ms |
| stdev | 0.35ms |
| min | 26.23ms |
| max | 27.91ms |
| total | 1632.64ms |

