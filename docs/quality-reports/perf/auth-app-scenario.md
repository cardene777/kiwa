# Perf Suite — auth-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.01ms | 20ms | PASS | stable |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.01ms | 20ms | PASS | stable |
| session_validate_loop (10x getSessionAndUser) | 0.00ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.01ms | 40ms | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.11ms | 40ms | PASS |
| session_validate_loop (10x getSessionAndUser) | 0.12ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | -54656 B | 0 B | 102400 B | yes | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | -15744 B | 0 B | 102400 B | yes | PASS |
| session_validate_loop (10x getSessionAndUser) | -208 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### login_flow (createUser + issueSession + getSessionAndUser)

# Perf Report — login_flow (createUser + issueSession + getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.87% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -0.92% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -25.04% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.72% |
| min | 0.00ms | 0.00ms | -0.00ms | -6.11% |
| max | 0.02ms | 0.02ms | -0.01ms | -31.24% |
| total | 0.11ms | 0.11ms | +0.00ms | +2.72% |

### oauth_flow (upsertUserFromProfile + issueSession)

# Perf Report — oauth_flow (upsertUserFromProfile + issueSession).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
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
| p50 | 0.00ms | 0.00ms | +0.00ms | +38.12% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +23.95% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +4.09% |
| mean | 0.00ms | 0.00ms | +0.00ms | +17.77% |
| min | 0.00ms | 0.00ms | -0.00ms | -11.35% |
| max | 0.01ms | 0.01ms | -0.00ms | -1.25% |
| total | 0.10ms | 0.09ms | +0.02ms | +17.77% |

### session_validate_loop (10x getSessionAndUser)

# Perf Report — session_validate_loop (10x getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.00ms | -60.97% |
| p95 | 0.00ms | 0.01ms | -0.00ms | -56.39% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -54.26% |
| mean | 0.00ms | 0.01ms | -0.00ms | -60.35% |
| min | 0.00ms | 0.01ms | -0.00ms | -64.33% |
| max | 0.00ms | 0.01ms | -0.00ms | -54.21% |
| total | 0.07ms | 0.17ms | -0.10ms | -60.35% |

