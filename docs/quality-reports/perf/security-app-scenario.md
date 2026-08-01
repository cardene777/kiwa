# Perf Suite — security-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00054ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0011ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.09ms | 0.29ms | 30ms | 0.00092ms | PASS | regressed — gate 無効 (regressionGate=false) |
| security_headers_validate_loop (20 build + validate) | 0.0064ms | 0.05ms | 50ms | 0.00093ms | PASS | regressed — gate 無効 (regressionGate=false) |
| production_hardening_flow (csp + security headers combined) | 0.0013ms | 0.0053ms | 30ms | 0.00094ms | PASS | stable (差 0.00054ms が下限 0.00094ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | cpu | 0.10ms | 0.20ms | 0.09ms | 0.946 | 0.625 | n/a | 20.0% | 0.08ms | 0.05ms |
| security_headers_validate_loop (20 build + validate) | cpu | 0.09ms | 0.14ms | 0.0064ms | 0.069 | 0.027 | n/a | 20.0% | 0.0055ms | 0.0022ms |
| production_hardening_flow (csp + security headers combined) | cpu | 0.09ms | 0.10ms | 0.0013ms | 0.013 | 0.020 | n/a | 20.0% | 0.0011ms | 0.0016ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.73ms | 60ms | PASS |
| security_headers_validate_loop (20 build + validate) | 0.03ms | 100ms | PASS |
| production_hardening_flow (csp + security headers combined) | 0.01ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | -11664 B | -8773 B | 102400 B | yes | 33 (3 + 30) | PASS |
| security_headers_validate_loop (20 build + validate) | 14768 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |
| production_hardening_flow (csp + security headers combined) | 904 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |

## Detailed serial reports

### csp_build_burst (50 buildCspHeader)

# Perf Report — csp_build_burst (50 buildCspHeader).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.09ms |
| p50 | 0.14ms |
| p95 | 0.29ms |
| p99 | 2.87ms |
| mean | 0.27ms |
| stdev | 0.69ms |
| min | 0.06ms |
| max | 3.92ms |
| total | 8.07ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.857)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.08ms | 0.05ms | +0.03ms | +51.24% |
| p50 | 0.12ms | 0.06ms | +0.06ms | +105.45% |
| p95 | 0.25ms | 0.09ms | +0.16ms | +170.77% |
| p99 | 2.46ms | 0.25ms | +2.21ms | +882.06% |
| mean | 0.23ms | 0.07ms | +0.16ms | +234.60% |
| min | 0.05ms | 0.04ms | +0.01ms | +32.29% |
| max | 3.36ms | 0.31ms | +3.05ms | +975.55% |
| total | 6.91ms | 2.07ms | +4.85ms | +234.60% |

### security_headers_validate_loop (20 build + validate)

# Perf Report — security_headers_validate_loop (20 build + validate).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0064ms |
| p50 | 0.01ms |
| p95 | 0.05ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0064ms |
| max | 0.11ms |
| total | 0.56ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.863)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0055ms | 0.0022ms | +0.0034ms | +153.58% |
| p50 | 0.01ms | 0.0053ms | +0.0071ms | +134.13% |
| p95 | 0.05ms | 0.01ms | +0.03ms | +232.72% |
| p99 | 0.08ms | 0.02ms | +0.06ms | +320.96% |
| mean | 0.02ms | 0.0061ms | +0.010ms | +163.90% |
| min | 0.0055ms | 0.0019ms | +0.0036ms | +193.35% |
| max | 0.10ms | 0.02ms | +0.07ms | +342.11% |
| total | 0.48ms | 0.18ms | +0.30ms | +163.90% |

### production_hardening_flow (csp + security headers combined)

# Perf Report — production_hardening_flow (csp + security headers combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0014ms |
| p95 | 0.0053ms |
| p99 | 0.0097ms |
| mean | 0.0022ms |
| stdev | 0.0021ms |
| min | 0.0012ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.869)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0016ms | -0.00054ms | -33.12% |
| p50 | 0.0012ms | 0.0017ms | -0.00051ms | -30.05% |
| p95 | 0.0046ms | 0.0030ms | +0.0015ms | +50.79% |
| p99 | 0.0084ms | 0.0050ms | +0.0034ms | +68.86% |
| mean | 0.0019ms | 0.0020ms | -0.000067ms | -3.34% |
| min | 0.0011ms | 0.0016ms | -0.00053ms | -33.60% |
| max | 0.0098ms | 0.0057ms | +0.0041ms | +71.33% |
| total | 0.06ms | 0.06ms | -0.0020ms | -3.34% |

