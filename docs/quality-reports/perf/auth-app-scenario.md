# Perf Suite — auth-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.0030ms | 0.04ms | 20ms | 0.00043ms | PASS | stable (換算後 p10 +78% (閾値未満)、 p95 +145% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.0022ms | 0.02ms | 20ms | 0.00042ms | PASS | stable (換算後 p10 -3% (閾値未満)、 p95 +46% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| session_validate_loop (10x getSessionAndUser) | 0.0032ms | 0.03ms | 30ms | 0.00043ms | PASS | regressed — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | cpu | 0.09ms | 0.18ms | 0.0030ms | 0.033 | 0.018 | n/a | 20.0% | 0.0027ms | 0.0015ms |
| oauth_flow (upsertUserFromProfile + issueSession) | cpu | 0.09ms | 0.12ms | 0.0022ms | 0.023 | 0.024 | n/a | 20.0% | 0.0019ms | 0.0019ms |
| session_validate_loop (10x getSessionAndUser) | cpu | 0.09ms | 0.14ms | 0.0032ms | 0.034 | 0.028 | n/a | 20.0% | 0.0028ms | 0.0023ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.03ms | 40ms | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.22ms | 40ms | PASS |
| session_validate_loop (10x getSessionAndUser) | 0.20ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | -57632 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 4552 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |
| session_validate_loop (10x getSessionAndUser) | 728 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |

## Detailed serial reports

### login_flow (createUser + issueSession + getSessionAndUser)

# Perf Report — login_flow (createUser + issueSession + getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0030ms |
| p50 | 0.0070ms |
| p95 | 0.04ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0015ms |
| max | 0.07ms |
| total | 0.41ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.874)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0015ms | +0.0012ms | +77.55% |
| p50 | 0.0061ms | 0.0025ms | +0.0036ms | +144.78% |
| p95 | 0.04ms | 0.01ms | +0.02ms | +144.56% |
| p99 | 0.05ms | 0.02ms | +0.03ms | +175.48% |
| mean | 0.01ms | 0.0044ms | +0.0076ms | +171.17% |
| min | 0.0013ms | 0.0013ms | -0.000059ms | -4.39% |
| max | 0.06ms | 0.02ms | +0.04ms | +183.52% |
| total | 0.36ms | 0.13ms | +0.23ms | +171.17% |

### oauth_flow (upsertUserFromProfile + issueSession)

# Perf Report — oauth_flow (upsertUserFromProfile + issueSession).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0036ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0053ms |
| stdev | 0.0047ms |
| min | 0.0021ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.859)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0019ms | -0.000056ms | -2.93% |
| p50 | 0.0031ms | 0.0022ms | +0.00093ms | +42.29% |
| p95 | 0.01ms | 0.0091ms | +0.0042ms | +46.03% |
| p99 | 0.02ms | 0.02ms | -0.0022ms | -11.89% |
| mean | 0.0045ms | 0.0037ms | +0.00078ms | +20.86% |
| min | 0.0018ms | 0.0016ms | +0.00020ms | +12.31% |
| max | 0.02ms | 0.02ms | -0.0047ms | -21.17% |
| total | 0.14ms | 0.11ms | +0.02ms | +20.86% |

### session_validate_loop (10x getSessionAndUser)

# Perf Report — session_validate_loop (10x getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0032ms |
| p50 | 0.0061ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.0090ms |
| stdev | 0.0081ms |
| min | 0.0027ms |
| max | 0.03ms |
| total | 0.27ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.873)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0023ms | +0.00049ms | +21.40% |
| p50 | 0.0053ms | 0.0024ms | +0.0029ms | +118.99% |
| p95 | 0.03ms | 0.0054ms | +0.02ms | +361.66% |
| p99 | 0.03ms | 0.01ms | +0.01ms | +107.01% |
| mean | 0.0078ms | 0.0031ms | +0.0048ms | +155.95% |
| min | 0.0023ms | 0.0022ms | +0.00012ms | +5.37% |
| max | 0.03ms | 0.02ms | +0.01ms | +74.78% |
| total | 0.23ms | 0.09ms | +0.14ms | +155.95% |

