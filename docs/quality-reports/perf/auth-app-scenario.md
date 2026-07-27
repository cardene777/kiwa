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
| login_flow (createUser + issueSession + getSessionAndUser) | 0.02ms | 40ms | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.26ms | 40ms | PASS |
| session_validate_loop (10x getSessionAndUser) | 0.20ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | -54864 B | -67124 B | 102400 B | yes | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | -7976 B | 0 B | 102400 B | yes | PASS |
| session_validate_loop (10x getSessionAndUser) | -3520 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.75% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +10.28% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -2.50% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.38% |
| min | 0.00ms | 0.00ms | +0.00ms | +18.18% |
| max | 0.02ms | 0.02ms | -0.00ms | -6.09% |
| total | 0.12ms | 0.11ms | +0.01ms | +10.38% |

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +59.75% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +22.31% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +39.35% |
| mean | 0.00ms | 0.00ms | +0.00ms | +36.30% |
| min | 0.00ms | 0.00ms | +0.00ms | +13.64% |
| max | 0.01ms | 0.01ms | +0.00ms | +43.10% |
| total | 0.12ms | 0.09ms | +0.03ms | +36.30% |

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
| p50 | 0.00ms | 0.01ms | -0.00ms | -57.62% |
| p95 | 0.00ms | 0.01ms | -0.00ms | -54.28% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -52.61% |
| mean | 0.00ms | 0.01ms | -0.00ms | -56.98% |
| min | 0.00ms | 0.01ms | -0.00ms | -58.92% |
| max | 0.00ms | 0.01ms | -0.00ms | -52.41% |
| total | 0.07ms | 0.17ms | -0.10ms | -56.98% |

