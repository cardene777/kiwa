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
| oauth_flow (upsertUserFromProfile + issueSession) | 0.01ms | 40ms | PASS |
| session_validate_loop (10x getSessionAndUser) | 0.02ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 160040 B | 0 B | 102400 B | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 210472 B | 0 B | 102400 B | PASS |
| session_validate_loop (10x getSessionAndUser) | 285952 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### login_flow (createUser + issueSession + getSessionAndUser)

# Perf Report — login_flow (createUser + issueSession + getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.96% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +5.88% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +24.41% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.28% |
| min | 0.00ms | 0.00ms | +0.00ms | +9.38% |
| max | 0.02ms | 0.01ms | +0.00ms | +33.72% |
| total | 0.12ms | 0.11ms | +0.01ms | +8.28% |

### oauth_flow (upsertUserFromProfile + issueSession)

# Perf Report — oauth_flow (upsertUserFromProfile + issueSession).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -25.90% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -22.55% |
| p99 | 0.02ms | 0.05ms | -0.03ms | -66.04% |
| mean | 0.00ms | 0.01ms | -0.00ms | -35.41% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.07ms | -0.05ms | -68.95% |
| total | 0.11ms | 0.17ms | -0.06ms | -35.41% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -19.99% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -24.57% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -1.27% |
| mean | 0.00ms | 0.00ms | -0.00ms | -15.10% |
| min | 0.00ms | 0.00ms | -0.00ms | -1.97% |
| max | 0.00ms | 0.00ms | +0.00ms | +7.61% |
| total | 0.07ms | 0.08ms | -0.01ms | -15.10% |

