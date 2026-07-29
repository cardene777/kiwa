# Perf Suite — auth-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.0015ms | 0.01ms | 20ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.0020ms | 0.0095ms | 20ms | 0.00042ms | PASS | stable (p10 -0% (閾値未満)、 p95 +38% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| session_validate_loop (10x getSessionAndUser) | 0.0022ms | 0.0031ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.01ms | 40ms | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.01ms | 40ms | PASS |
| session_validate_loop (10x getSessionAndUser) | 0.16ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | -52752 B | 0 B | 102400 B | yes | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 257472 B | 0 B | 102400 B | yes | PASS |
| session_validate_loop (10x getSessionAndUser) | -504 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### login_flow (createUser + issueSession + getSessionAndUser)

# Perf Report — login_flow (createUser + issueSession + getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0015ms |
| p50 | 0.0020ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0035ms |
| stdev | 0.0037ms |
| min | 0.0015ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0014ms | +0.000083ms | +5.86% |
| p50 | 0.0020ms | 0.0016ms | +0.00037ms | +22.78% |
| p95 | 0.01ms | 0.01ms | +0.0019ms | +16.60% |
| p99 | 0.01ms | 0.01ms | +0.00031ms | +2.13% |
| mean | 0.0035ms | 0.0033ms | +0.00021ms | +6.47% |
| min | 0.0015ms | 0.0013ms | +0.00013ms | +9.38% |
| max | 0.01ms | 0.02ms | -0.00033ms | -2.20% |
| total | 0.11ms | 0.10ms | +0.0064ms | +6.47% |

### oauth_flow (upsertUserFromProfile + issueSession)

# Perf Report — oauth_flow (upsertUserFromProfile + issueSession).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0028ms |
| p95 | 0.0095ms |
| p99 | 0.02ms |
| mean | 0.0040ms |
| stdev | 0.0035ms |
| min | 0.0019ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0020ms | -0.0000041ms | -0.21% |
| p50 | 0.0028ms | 0.0022ms | +0.00060ms | +27.61% |
| p95 | 0.0095ms | 0.0069ms | +0.0026ms | +38.40% |
| p99 | 0.02ms | 0.0095ms | +0.0066ms | +69.89% |
| mean | 0.0040ms | 0.0030ms | +0.00093ms | +30.65% |
| min | 0.0019ms | 0.0019ms | -0.000042ms | -2.19% |
| max | 0.02ms | 0.01ms | +0.0083ms | +79.61% |
| total | 0.12ms | 0.09ms | +0.03ms | +30.65% |

### session_validate_loop (10x getSessionAndUser)

# Perf Report — session_validate_loop (10x getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0023ms |
| p95 | 0.0031ms |
| p99 | 0.0079ms |
| mean | 0.0026ms |
| stdev | 0.0014ms |
| min | 0.0021ms |
| max | 0.0098ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0022ms | -0.000046ms | -2.09% |
| p50 | 0.0023ms | 0.0023ms | +0.000042ms | +1.83% |
| p95 | 0.0031ms | 0.0030ms | +0.00017ms | +5.75% |
| p99 | 0.0079ms | 0.0031ms | +0.0048ms | +157.01% |
| mean | 0.0026ms | 0.0024ms | +0.00023ms | +9.46% |
| min | 0.0021ms | 0.0021ms | 0.00ms | 0.00% |
| max | 0.0098ms | 0.0031ms | +0.0067ms | +217.51% |
| total | 0.08ms | 0.07ms | +0.0068ms | +9.46% |

