# Perf Suite — auth-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.0015ms | 0.01ms | 20ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.0018ms | 0.0085ms | 20ms | 0.00049ms | PASS | stable (p10 -7% (閾値未満)、 p95 +23% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| session_validate_loop (10x getSessionAndUser) | 0.0021ms | 0.0053ms | 30ms | 0.00049ms | PASS | stable (p10 -4% (閾値未満)、 p95 +79% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.01ms | 40ms | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.01ms | 40ms | PASS |
| session_validate_loop (10x getSessionAndUser) | 0.11ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | -51736 B | 0 B | 102400 B | yes | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 3216 B | 0 B | 102400 B | yes | PASS |
| session_validate_loop (10x getSessionAndUser) | -4840 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### login_flow (createUser + issueSession + getSessionAndUser)

# Perf Report — login_flow (createUser + issueSession + getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0015ms |
| p50 | 0.0019ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0040ms |
| stdev | 0.0042ms |
| min | 0.0015ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0014ms | +0.00012ms | +8.81% |
| p50 | 0.0019ms | 0.0016ms | +0.00025ms | +15.19% |
| p95 | 0.01ms | 0.01ms | +0.0018ms | +15.81% |
| p99 | 0.02ms | 0.01ms | +0.00088ms | +6.10% |
| mean | 0.0040ms | 0.0033ms | +0.00067ms | +20.30% |
| min | 0.0015ms | 0.0013ms | +0.00017ms | +12.53% |
| max | 0.02ms | 0.02ms | +0.00092ms | +6.02% |
| total | 0.12ms | 0.10ms | +0.02ms | +20.30% |

### oauth_flow (upsertUserFromProfile + issueSession)

# Perf Report — oauth_flow (upsertUserFromProfile + issueSession).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0029ms |
| p95 | 0.0085ms |
| p99 | 0.0099ms |
| mean | 0.0034ms |
| stdev | 0.0021ms |
| min | 0.0017ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0020ms | -0.00013ms | -6.59% |
| p50 | 0.0029ms | 0.0022ms | +0.00067ms | +30.46% |
| p95 | 0.0085ms | 0.0069ms | +0.0016ms | +22.71% |
| p99 | 0.0099ms | 0.0095ms | +0.00043ms | +4.56% |
| mean | 0.0034ms | 0.0030ms | +0.00038ms | +12.71% |
| min | 0.0017ms | 0.0019ms | -0.00021ms | -10.90% |
| max | 0.01ms | 0.01ms | -0.00012ms | -1.19% |
| total | 0.10ms | 0.09ms | +0.01ms | +12.71% |

### session_validate_loop (10x getSessionAndUser)

# Perf Report — session_validate_loop (10x getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0021ms |
| p50 | 0.0022ms |
| p95 | 0.0053ms |
| p99 | 0.0096ms |
| mean | 0.0027ms |
| stdev | 0.0018ms |
| min | 0.0020ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0022ms | -0.000083ms | -3.76% |
| p50 | 0.0022ms | 0.0023ms | -0.000083ms | -3.62% |
| p95 | 0.0053ms | 0.0030ms | +0.0024ms | +79.26% |
| p99 | 0.0096ms | 0.0031ms | +0.0066ms | +213.37% |
| mean | 0.0027ms | 0.0024ms | +0.00029ms | +12.37% |
| min | 0.0020ms | 0.0021ms | -0.000084ms | -3.95% |
| max | 0.01ms | 0.0031ms | +0.0077ms | +248.57% |
| total | 0.08ms | 0.07ms | +0.0088ms | +12.37% |

