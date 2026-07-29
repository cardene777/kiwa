# Perf Suite — auth-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.0014ms | 0.01ms | 20ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.0019ms | 0.0093ms | 20ms | 0.00042ms | PASS | stable (p10 -2% (閾値未満)、 p95 +34% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| session_validate_loop (10x getSessionAndUser) | 0.0022ms | 0.0045ms | 30ms | 0.00042ms | PASS | stable (p10 -0% (閾値未満)、 p95 +52% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.01ms | 40ms | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.01ms | 40ms | PASS |
| session_validate_loop (10x getSessionAndUser) | 0.15ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | -53088 B | 0 B | 102400 B | yes | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 3184 B | 0 B | 102400 B | yes | PASS |
| session_validate_loop (10x getSessionAndUser) | -424 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### login_flow (createUser + issueSession + getSessionAndUser)

# Perf Report — login_flow (createUser + issueSession + getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0014ms |
| p50 | 0.0018ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0034ms |
| stdev | 0.0034ms |
| min | 0.0014ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0014ms | 0.0014ms | 0.00ms | 0.00% |
| p50 | 0.0018ms | 0.0016ms | +0.00013ms | +7.59% |
| p95 | 0.01ms | 0.01ms | -0.00018ms | -1.55% |
| p99 | 0.01ms | 0.01ms | -0.00043ms | -2.97% |
| mean | 0.0034ms | 0.0033ms | +0.00011ms | +3.28% |
| min | 0.0014ms | 0.0013ms | +0.000083ms | +6.23% |
| max | 0.01ms | 0.02ms | -0.00088ms | -5.76% |
| total | 0.10ms | 0.10ms | +0.0032ms | +3.28% |

### oauth_flow (upsertUserFromProfile + issueSession)

# Perf Report — oauth_flow (upsertUserFromProfile + issueSession).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0019ms |
| p50 | 0.0030ms |
| p95 | 0.0093ms |
| p99 | 0.01ms |
| mean | 0.0038ms |
| stdev | 0.0026ms |
| min | 0.0019ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0020ms | -0.000041ms | -2.10% |
| p50 | 0.0030ms | 0.0022ms | +0.00083ms | +38.05% |
| p95 | 0.0093ms | 0.0069ms | +0.0024ms | +34.27% |
| p99 | 0.01ms | 0.0095ms | +0.0020ms | +21.61% |
| mean | 0.0038ms | 0.0030ms | +0.00082ms | +26.98% |
| min | 0.0019ms | 0.0019ms | -0.000042ms | -2.19% |
| max | 0.01ms | 0.01ms | +0.0019ms | +18.01% |
| total | 0.12ms | 0.09ms | +0.02ms | +26.98% |

### session_validate_loop (10x getSessionAndUser)

# Perf Report — session_validate_loop (10x getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0036ms |
| p95 | 0.0045ms |
| p99 | 0.0050ms |
| mean | 0.0033ms |
| stdev | 0.00093ms |
| min | 0.0022ms |
| max | 0.0053ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0022ms | -0.0000041ms | -0.19% |
| p50 | 0.0036ms | 0.0023ms | +0.0013ms | +55.50% |
| p95 | 0.0045ms | 0.0030ms | +0.0015ms | +51.82% |
| p99 | 0.0050ms | 0.0031ms | +0.0020ms | +64.22% |
| mean | 0.0033ms | 0.0024ms | +0.00094ms | +39.68% |
| min | 0.0022ms | 0.0021ms | +0.000041ms | +1.93% |
| max | 0.0053ms | 0.0031ms | +0.0022ms | +70.23% |
| total | 0.10ms | 0.07ms | +0.03ms | +39.68% |

