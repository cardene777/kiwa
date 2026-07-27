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
| session_validate_loop (10x getSessionAndUser) | 0.14ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | -55520 B | 0 B | 102400 B | yes | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | -14496 B | 0 B | 102400 B | yes | PASS |
| session_validate_loop (10x getSessionAndUser) | 816 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.84% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -2.78% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -24.68% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.55% |
| min | 0.00ms | 0.00ms | +0.00ms | +9.09% |
| max | 0.02ms | 0.02ms | -0.01ms | -30.47% |
| total | 0.11ms | 0.11ms | -0.00ms | -3.55% |

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +31.96% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +39.97% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +88.65% |
| mean | 0.00ms | 0.00ms | +0.00ms | +36.26% |
| min | 0.00ms | 0.00ms | -0.00ms | -2.29% |
| max | 0.02ms | 0.01ms | +0.01ms | +97.08% |
| total | 0.12ms | 0.09ms | +0.03ms | +36.26% |

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
| p50 | 0.00ms | 0.01ms | -0.00ms | -58.37% |
| p95 | 0.00ms | 0.01ms | -0.00ms | -47.58% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -34.50% |
| mean | 0.00ms | 0.01ms | -0.00ms | -56.78% |
| min | 0.00ms | 0.01ms | -0.00ms | -62.79% |
| max | 0.00ms | 0.01ms | -0.00ms | -30.11% |
| total | 0.07ms | 0.17ms | -0.10ms | -56.78% |

