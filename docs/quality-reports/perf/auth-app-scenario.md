# Perf Suite — auth-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.0017ms | 0.01ms | 20ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.0023ms | 0.01ms | 20ms | 0.00042ms | PASS | stable (p10 +17% (閾値未満)、 p95 +108% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| session_validate_loop (10x getSessionAndUser) | 0.0023ms | 0.0034ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.01ms | 40ms | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.01ms | 40ms | PASS |
| session_validate_loop (10x getSessionAndUser) | 0.20ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | -53320 B | 0 B | 102400 B | yes | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 5520 B | 0 B | 102400 B | yes | PASS |
| session_validate_loop (10x getSessionAndUser) | -504 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### login_flow (createUser + issueSession + getSessionAndUser)

# Perf Report — login_flow (createUser + issueSession + getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0017ms |
| p50 | 0.0023ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0040ms |
| stdev | 0.0041ms |
| min | 0.0016ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0014ms | +0.00024ms | +17.28% |
| p50 | 0.0023ms | 0.0016ms | +0.00065ms | +39.22% |
| p95 | 0.01ms | 0.01ms | +0.0022ms | +19.28% |
| p99 | 0.02ms | 0.01ms | +0.0024ms | +16.51% |
| mean | 0.0040ms | 0.0033ms | +0.00067ms | +20.22% |
| min | 0.0016ms | 0.0013ms | +0.00025ms | +18.83% |
| max | 0.02ms | 0.02ms | +0.0019ms | +12.32% |
| total | 0.12ms | 0.10ms | +0.02ms | +20.22% |

### oauth_flow (upsertUserFromProfile + issueSession)

# Perf Report — oauth_flow (upsertUserFromProfile + issueSession).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0023ms |
| p50 | 0.0035ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0049ms |
| stdev | 0.0046ms |
| min | 0.0022ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0020ms | +0.00033ms | +17.05% |
| p50 | 0.0035ms | 0.0022ms | +0.0013ms | +59.96% |
| p95 | 0.01ms | 0.0069ms | +0.0074ms | +107.79% |
| p99 | 0.02ms | 0.0095ms | +0.01ms | +124.28% |
| mean | 0.0049ms | 0.0030ms | +0.0019ms | +63.19% |
| min | 0.0022ms | 0.0019ms | +0.00029ms | +15.18% |
| max | 0.02ms | 0.01ms | +0.01ms | +118.81% |
| total | 0.15ms | 0.09ms | +0.06ms | +63.19% |

### session_validate_loop (10x getSessionAndUser)

# Perf Report — session_validate_loop (10x getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0023ms |
| p50 | 0.0024ms |
| p95 | 0.0034ms |
| p99 | 0.0037ms |
| mean | 0.0025ms |
| stdev | 0.00037ms |
| min | 0.0022ms |
| max | 0.0038ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0022ms | +0.00013ms | +5.70% |
| p50 | 0.0024ms | 0.0023ms | +0.00013ms | +5.50% |
| p95 | 0.0034ms | 0.0030ms | +0.00048ms | +16.20% |
| p99 | 0.0037ms | 0.0031ms | +0.00068ms | +22.05% |
| mean | 0.0025ms | 0.0024ms | +0.00015ms | +6.42% |
| min | 0.0022ms | 0.0021ms | +0.00012ms | +5.88% |
| max | 0.0038ms | 0.0031ms | +0.00075ms | +24.32% |
| total | 0.08ms | 0.07ms | +0.0046ms | +6.42% |

