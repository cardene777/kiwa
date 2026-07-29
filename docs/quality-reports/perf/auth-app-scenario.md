# Perf Suite — auth-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.0017ms | 0.02ms | 20ms | 0.00050ms | PASS | stable (差 0.00029ms が下限 0.00050ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.0022ms | 0.0093ms | 20ms | 0.00050ms | PASS | stable (p10 +15% (閾値未満)、 p95 +35% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| session_validate_loop (10x getSessionAndUser) | 0.0026ms | 0.0034ms | 30ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.02ms | 40ms | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.14ms | 40ms | PASS |
| session_validate_loop (10x getSessionAndUser) | 0.02ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | -53360 B | 0 B | 102400 B | yes | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 7696 B | 0 B | 102400 B | yes | PASS |
| session_validate_loop (10x getSessionAndUser) | 8816 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### login_flow (createUser + issueSession + getSessionAndUser)

# Perf Report — login_flow (createUser + issueSession + getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0017ms |
| p50 | 0.0026ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0045ms |
| stdev | 0.0045ms |
| min | 0.0016ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0014ms | +0.00029ms | +20.61% |
| p50 | 0.0026ms | 0.0016ms | +0.00098ms | +59.48% |
| p95 | 0.02ms | 0.01ms | +0.0043ms | +38.03% |
| p99 | 0.02ms | 0.01ms | +0.0016ms | +10.85% |
| mean | 0.0045ms | 0.0033ms | +0.0012ms | +37.45% |
| min | 0.0016ms | 0.0013ms | +0.00029ms | +21.91% |
| max | 0.02ms | 0.02ms | +0.00079ms | +5.20% |
| total | 0.14ms | 0.10ms | +0.04ms | +37.45% |

### oauth_flow (upsertUserFromProfile + issueSession)

# Perf Report — oauth_flow (upsertUserFromProfile + issueSession).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0031ms |
| p95 | 0.0093ms |
| p99 | 0.01ms |
| mean | 0.0041ms |
| stdev | 0.0028ms |
| min | 0.0022ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0020ms | +0.00029ms | +14.91% |
| p50 | 0.0031ms | 0.0022ms | +0.00094ms | +42.82% |
| p95 | 0.0093ms | 0.0069ms | +0.0024ms | +35.38% |
| p99 | 0.01ms | 0.0095ms | +0.0040ms | +42.57% |
| mean | 0.0041ms | 0.0030ms | +0.0010ms | +33.96% |
| min | 0.0022ms | 0.0019ms | +0.00025ms | +13.04% |
| max | 0.01ms | 0.01ms | +0.0046ms | +44.01% |
| total | 0.12ms | 0.09ms | +0.03ms | +33.96% |

### session_validate_loop (10x getSessionAndUser)

# Perf Report — session_validate_loop (10x getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0026ms |
| p50 | 0.0027ms |
| p95 | 0.0034ms |
| p99 | 0.0037ms |
| mean | 0.0028ms |
| stdev | 0.00029ms |
| min | 0.0025ms |
| max | 0.0038ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0022ms | +0.00037ms | +16.98% |
| p50 | 0.0027ms | 0.0023ms | +0.00038ms | +16.41% |
| p95 | 0.0034ms | 0.0030ms | +0.00048ms | +16.23% |
| p99 | 0.0037ms | 0.0031ms | +0.00065ms | +21.08% |
| mean | 0.0028ms | 0.0024ms | +0.00039ms | +16.34% |
| min | 0.0025ms | 0.0021ms | +0.00037ms | +17.65% |
| max | 0.0038ms | 0.0031ms | +0.00071ms | +22.96% |
| total | 0.08ms | 0.07ms | +0.01ms | +16.34% |

