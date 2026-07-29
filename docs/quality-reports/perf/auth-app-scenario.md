# Perf Suite — auth-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.01ms | 20ms | PASS | stable (検知には +0.5ms (baseline 比 +3747%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.01ms | 20ms | PASS | stable (差 0.02ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| session_validate_loop (10x getSessionAndUser) | 0.00ms | 30ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.02ms | 40ms | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.02ms | 40ms | PASS |
| session_validate_loop (10x getSessionAndUser) | 1.42ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | -53400 B | 0 B | 102400 B | yes | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | -15320 B | 0 B | 102400 B | yes | PASS |
| session_validate_loop (10x getSessionAndUser) | 696 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +4.18% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +3.17% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +10.64% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.83% |
| min | 0.00ms | 0.00ms | -0.00ms | -2.58% |
| max | 0.02ms | 0.02ms | +0.00ms | +12.96% |
| total | 0.12ms | 0.12ms | -0.00ms | -0.83% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +16.92% |
| p95 | 0.01ms | 0.03ms | -0.02ms | -71.95% |
| p99 | 0.01ms | 0.04ms | -0.02ms | -65.21% |
| mean | 0.00ms | 0.01ms | -0.00ms | -48.33% |
| min | 0.00ms | 0.00ms | +0.00ms | +4.38% |
| max | 0.01ms | 0.04ms | -0.02ms | -62.12% |
| total | 0.11ms | 0.22ms | -0.11ms | -48.33% |

### session_validate_loop (10x getSessionAndUser)

# Perf Report — session_validate_loop (10x getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +37.79% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +50.61% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +263.92% |
| mean | 0.00ms | 0.00ms | +0.00ms | +45.56% |
| min | 0.00ms | 0.00ms | +0.00ms | +3.51% |
| max | 0.02ms | 0.00ms | +0.01ms | +348.11% |
| total | 0.11ms | 0.08ms | +0.03ms | +45.56% |

