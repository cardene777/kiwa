# Perf Suite — auth-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.0015ms | 0.02ms | 20ms | 0.00038ms | PASS | stable (換算後 p10 -12% (閾値未満)、 p95 +39% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.0024ms | 0.02ms | 20ms | 0.00038ms | PASS | stable (換算後 p10 +12% (閾値未満)、 p95 +93% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| session_validate_loop (10x getSessionAndUser) | 0.0028ms | 0.01ms | 30ms | 0.00036ms | PASS | stable (換算後 p10 +6% (閾値未満)、 p95 +102% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | cpu | 0.09ms | 0.10ms | 0.0015ms | 0.016 | 0.018 | 0.0013ms | 0.0015ms |
| oauth_flow (upsertUserFromProfile + issueSession) | cpu | 0.09ms | 0.10ms | 0.0024ms | 0.027 | 0.024 | 0.0021ms | 0.0019ms |
| session_validate_loop (10x getSessionAndUser) | cpu | 0.09ms | 0.12ms | 0.0028ms | 0.030 | 0.028 | 0.0024ms | 0.0023ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.02ms | 40ms | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.20ms | 40ms | PASS |
| session_validate_loop (10x getSessionAndUser) | 0.16ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | -53248 B | 0 B | 102400 B | yes | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 7744 B | 0 B | 102400 B | yes | PASS |
| session_validate_loop (10x getSessionAndUser) | 72 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### login_flow (createUser + issueSession + getSessionAndUser)

# Perf Report — login_flow (createUser + issueSession + getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0015ms |
| p50 | 0.0024ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0057ms |
| stdev | 0.0071ms |
| min | 0.0013ms |
| max | 0.03ms |
| total | 0.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.907)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0015ms | -0.00018ms | -11.85% |
| p50 | 0.0022ms | 0.0025ms | -0.00031ms | -12.31% |
| p95 | 0.02ms | 0.01ms | +0.0057ms | +38.59% |
| p99 | 0.03ms | 0.02ms | +0.0054ms | +27.18% |
| mean | 0.0052ms | 0.0044ms | +0.00072ms | +16.25% |
| min | 0.0011ms | 0.0013ms | -0.00020ms | -15.01% |
| max | 0.03ms | 0.02ms | +0.0059ms | +27.81% |
| total | 0.15ms | 0.13ms | +0.02ms | +16.25% |

### oauth_flow (upsertUserFromProfile + issueSession)

# Perf Report — oauth_flow (upsertUserFromProfile + issueSession).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0024ms |
| p50 | 0.0044ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.0077ms |
| stdev | 0.0099ms |
| min | 0.0022ms |
| max | 0.05ms |
| total | 0.23ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.905)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0019ms | +0.00023ms | +12.14% |
| p50 | 0.0040ms | 0.0022ms | +0.0018ms | +80.92% |
| p95 | 0.02ms | 0.0091ms | +0.0084ms | +92.63% |
| p99 | 0.04ms | 0.02ms | +0.02ms | +112.41% |
| mean | 0.0069ms | 0.0037ms | +0.0032ms | +86.03% |
| min | 0.0020ms | 0.0016ms | +0.00034ms | +20.66% |
| max | 0.05ms | 0.02ms | +0.03ms | +114.88% |
| total | 0.21ms | 0.11ms | +0.10ms | +86.03% |

### session_validate_loop (10x getSessionAndUser)

# Perf Report — session_validate_loop (10x getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0028ms |
| p50 | 0.0030ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0047ms |
| stdev | 0.0039ms |
| min | 0.0025ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.869)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0023ms | +0.00013ms | +5.54% |
| p50 | 0.0026ms | 0.0024ms | +0.00023ms | +9.43% |
| p95 | 0.01ms | 0.0054ms | +0.0055ms | +101.92% |
| p99 | 0.02ms | 0.01ms | +0.0029ms | +21.77% |
| mean | 0.0041ms | 0.0031ms | +0.0010ms | +33.00% |
| min | 0.0022ms | 0.0022ms | -0.000035ms | -1.58% |
| max | 0.02ms | 0.02ms | +0.0022ms | +13.74% |
| total | 0.12ms | 0.09ms | +0.03ms | +33.00% |

