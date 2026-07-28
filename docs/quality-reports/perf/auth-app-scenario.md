# Perf Suite — auth-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.01ms | 20ms | PASS | stable (検知には +0.5ms (baseline 比 +3747%) 以上の悪化が必要) |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.01ms | 20ms | PASS | stable (差 0.02ms が下限 0.5ms 未満で判定を保留) |
| session_validate_loop (10x getSessionAndUser) | 0.00ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +16283%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.01ms | 40ms | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.17ms | 40ms | PASS |
| session_validate_loop (10x getSessionAndUser) | 0.26ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | -52720 B | 0 B | 102400 B | yes | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 235376 B | 0 B | 102400 B | yes | PASS |
| session_validate_loop (10x getSessionAndUser) | 616 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -2.07% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -4.78% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -4.82% |
| mean | 0.00ms | 0.00ms | -0.00ms | -11.47% |
| min | 0.00ms | 0.00ms | -0.00ms | -12.86% |
| max | 0.02ms | 0.02ms | -0.00ms | -7.41% |
| total | 0.11ms | 0.12ms | -0.01ms | -11.47% |

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +22.59% |
| p95 | 0.01ms | 0.03ms | -0.02ms | -69.81% |
| p99 | 0.01ms | 0.04ms | -0.03ms | -71.67% |
| mean | 0.00ms | 0.01ms | -0.00ms | -50.52% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.05% |
| max | 0.01ms | 0.04ms | -0.03ms | -71.40% |
| total | 0.11ms | 0.22ms | -0.11ms | -50.52% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.60% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -10.79% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -17.22% |
| mean | 0.00ms | 0.00ms | -0.00ms | -8.80% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.95% |
| max | 0.00ms | 0.00ms | -0.00ms | -18.10% |
| total | 0.07ms | 0.08ms | -0.01ms | -8.80% |

