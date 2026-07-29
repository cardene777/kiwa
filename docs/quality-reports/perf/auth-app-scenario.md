# Perf Suite — auth-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00057ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.0018ms | 0.02ms | 20ms | 0.00057ms | PASS | stable (差 0.00037ms が下限 0.00057ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.0025ms | 0.0097ms | 20ms | 0.00057ms | PASS | stable (差 0.00054ms が下限 0.00057ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| session_validate_loop (10x getSessionAndUser) | 0.0028ms | 0.0036ms | 30ms | 0.00057ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.02ms | 40ms | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.02ms | 40ms | PASS |
| session_validate_loop (10x getSessionAndUser) | 0.03ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 324792 B | 0 B | 102400 B | yes | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 200 B | 0 B | 102400 B | yes | PASS |
| session_validate_loop (10x getSessionAndUser) | 3928 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### login_flow (createUser + issueSession + getSessionAndUser)

# Perf Report — login_flow (createUser + issueSession + getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0023ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0045ms |
| stdev | 0.0047ms |
| min | 0.0018ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0014ms | +0.00037ms | +26.46% |
| p50 | 0.0023ms | 0.0016ms | +0.00067ms | +40.49% |
| p95 | 0.02ms | 0.01ms | +0.0039ms | +34.23% |
| p99 | 0.02ms | 0.01ms | +0.0049ms | +33.90% |
| mean | 0.0045ms | 0.0033ms | +0.0011ms | +34.76% |
| min | 0.0018ms | 0.0013ms | +0.00042ms | +31.28% |
| max | 0.02ms | 0.02ms | +0.0043ms | +28.49% |
| total | 0.13ms | 0.10ms | +0.03ms | +34.76% |

### oauth_flow (upsertUserFromProfile + issueSession)

# Perf Report — oauth_flow (upsertUserFromProfile + issueSession).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0025ms |
| p50 | 0.0034ms |
| p95 | 0.0097ms |
| p99 | 0.01ms |
| mean | 0.0042ms |
| stdev | 0.0025ms |
| min | 0.0023ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0020ms | +0.00054ms | +27.47% |
| p50 | 0.0034ms | 0.0022ms | +0.0012ms | +53.31% |
| p95 | 0.0097ms | 0.0069ms | +0.0028ms | +40.09% |
| p99 | 0.01ms | 0.0095ms | +0.0021ms | +22.18% |
| mean | 0.0042ms | 0.0030ms | +0.0012ms | +40.19% |
| min | 0.0023ms | 0.0019ms | +0.00038ms | +19.56% |
| max | 0.01ms | 0.01ms | +0.0019ms | +18.41% |
| total | 0.13ms | 0.09ms | +0.04ms | +40.19% |

### session_validate_loop (10x getSessionAndUser)

# Perf Report — session_validate_loop (10x getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0028ms |
| p50 | 0.0030ms |
| p95 | 0.0036ms |
| p99 | 0.0040ms |
| mean | 0.0031ms |
| stdev | 0.00031ms |
| min | 0.0027ms |
| max | 0.0042ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0022ms | +0.00063ms | +28.31% |
| p50 | 0.0030ms | 0.0023ms | +0.00067ms | +29.11% |
| p95 | 0.0036ms | 0.0030ms | +0.00060ms | +20.15% |
| p99 | 0.0040ms | 0.0031ms | +0.00095ms | +31.09% |
| mean | 0.0031ms | 0.0024ms | +0.00068ms | +28.42% |
| min | 0.0027ms | 0.0021ms | +0.00054ms | +25.46% |
| max | 0.0042ms | 0.0031ms | +0.0011ms | +36.45% |
| total | 0.09ms | 0.07ms | +0.02ms | +28.42% |

