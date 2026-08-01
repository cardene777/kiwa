# Perf Suite — auth

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| nextAuthProviderLookup | 0.00013ms | 0.0021ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +241%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| luciaSessionIdGenerate | 0.00013ms | 0.0019ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +237%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| betterAuthProviderLookup | 0.00013ms | 0.00063ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +237%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| clerkUsersCreateAccessor | 0.00013ms | 0.00021ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +242%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| auth0RulesActionsAccessor | 0.00013ms | 0.00021ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +236%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| supabaseAuthEnvAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00031ms | PASS | stable (検知には +0.00031ms (baseline 比 +246%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| webAuthnAuthenticatorList | 0.00013ms | 0.0018ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +244%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| passkeyListAuthenticators | 0.00017ms | 0.00029ms | 5ms | 0.00031ms | PASS | stable (検知には +0.00031ms (baseline 比 +186%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| oauth21CreatePkceChallenge | 0.0044ms | 0.06ms | 10ms | 0.00030ms | PASS | stable (換算後 p10 +7% (閾値未満)、 p95 +336% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| oidcDiscoveryFetch | 0.00025ms | 0.00033ms | 5ms | 0.00031ms | PASS | stable (検知には +0.00031ms (baseline 比 +123%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| nextAuthProviderLookup | cpu | 0.09ms | 0.14ms | 0.00013ms | 0.001 | 0.002 | n/a | 20.0% | 0.00011ms | 0.00013ms |
| luciaSessionIdGenerate | cpu | 0.09ms | 0.16ms | 0.00013ms | 0.001 | 0.002 | n/a | 20.0% | 0.00011ms | 0.00013ms |
| betterAuthProviderLookup | cpu | 0.09ms | 0.10ms | 0.00013ms | 0.001 | 0.002 | n/a | 20.0% | 0.00011ms | 0.00013ms |
| clerkUsersCreateAccessor | cpu | 0.09ms | 0.09ms | 0.00013ms | 0.001 | 0.002 | n/a | 20.0% | 0.00011ms | 0.00013ms |
| auth0RulesActionsAccessor | cpu | 0.09ms | 0.09ms | 0.00013ms | 0.001 | 0.002 | n/a | 20.0% | 0.00011ms | 0.00013ms |
| supabaseAuthEnvAccessor | cpu | 0.09ms | 0.09ms | 0.00013ms | 0.001 | 0.002 | n/a | 20.0% | 0.00012ms | 0.00013ms |
| webAuthnAuthenticatorList | cpu | 0.09ms | 0.14ms | 0.00013ms | 0.001 | 0.002 | n/a | 20.0% | 0.00011ms | 0.00013ms |
| passkeyListAuthenticators | cpu | 0.09ms | 0.09ms | 0.00017ms | 0.002 | 0.002 | n/a | 20.0% | 0.00015ms | 0.00017ms |
| oauth21CreatePkceChallenge | cpu | 0.09ms | 0.18ms | 0.0044ms | 0.049 | 0.046 | n/a | 20.0% | 0.0040ms | 0.0037ms |
| oidcDiscoveryFetch | cpu | 0.09ms | 0.09ms | 0.00025ms | 0.003 | 0.003 | n/a | 20.0% | 0.00023ms | 0.00025ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| nextAuthProviderLookup | 0.01ms | 10ms | PASS |
| luciaSessionIdGenerate | 0.01ms | 10ms | PASS |
| betterAuthProviderLookup | 0.00ms | 10ms | PASS |
| clerkUsersCreateAccessor | 0.00ms | 10ms | PASS |
| auth0RulesActionsAccessor | 0.00ms | 10ms | PASS |
| supabaseAuthEnvAccessor | 0.01ms | 10ms | PASS |
| webAuthnAuthenticatorList | 0.00ms | 10ms | PASS |
| passkeyListAuthenticators | 0.00ms | 10ms | PASS |
| oauth21CreatePkceChallenge | 0.67ms | 20ms | PASS |
| oidcDiscoveryFetch | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| nextAuthProviderLookup | -4784 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| luciaSessionIdGenerate | -15008 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| betterAuthProviderLookup | 2680 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| clerkUsersCreateAccessor | 1664 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| auth0RulesActionsAccessor | 4304 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| supabaseAuthEnvAccessor | 2680 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| webAuthnAuthenticatorList | 112 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| passkeyListAuthenticators | 3552 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| oauth21CreatePkceChallenge | -20928 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| oidcDiscoveryFetch | 376 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### nextAuthProviderLookup

# Perf Report — nextAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.0021ms |
| p99 | 0.0038ms |
| mean | 0.00049ms |
| stdev | 0.0012ms |
| min | 0.00013ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.902)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00011ms | 0.00013ms | -0.000012ms | -9.84% |
| p50 | 0.00015ms | 0.00013ms | +0.000025ms | +20.09% |
| p95 | 0.0019ms | 0.0016ms | +0.00037ms | +23.77% |
| p99 | 0.0034ms | 0.0035ms | -0.000070ms | -2.04% |
| mean | 0.00044ms | 0.00038ms | +0.000065ms | +17.10% |
| min | 0.00011ms | 0.000083ms | +0.000030ms | +35.78% |
| max | 0.01ms | 0.02ms | -0.0032ms | -20.10% |
| total | 0.09ms | 0.08ms | +0.01ms | +17.10% |

### luciaSessionIdGenerate

# Perf Report — luciaSessionIdGenerate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.0019ms |
| p99 | 0.0033ms |
| mean | 0.00045ms |
| stdev | 0.00069ms |
| min | 0.00013ms |
| max | 0.0040ms |
| total | 0.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.888)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00011ms | 0.00013ms | -0.000014ms | -11.21% |
| p50 | 0.00015ms | 0.00013ms | +0.000023ms | +18.62% |
| p95 | 0.0017ms | 0.00025ms | +0.0015ms | +585.65% |
| p99 | 0.0029ms | 0.00077ms | +0.0022ms | +281.67% |
| mean | 0.00040ms | 0.00018ms | +0.00022ms | +125.54% |
| min | 0.00011ms | 0.00013ms | -0.000014ms | -11.21% |
| max | 0.0035ms | 0.0040ms | -0.00053ms | -13.04% |
| total | 0.08ms | 0.04ms | +0.04ms | +125.54% |

### betterAuthProviderLookup

# Perf Report — betterAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00063ms |
| p99 | 0.0034ms |
| mean | 0.00039ms |
| stdev | 0.0019ms |
| min | 0.00013ms |
| max | 0.03ms |
| total | 0.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.888)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00011ms | 0.00013ms | -0.000014ms | -11.17% |
| p50 | 0.00015ms | 0.00013ms | +0.000022ms | +17.96% |
| p95 | 0.00056ms | 0.00021ms | +0.00035ms | +168.29% |
| p99 | 0.0030ms | 0.0038ms | -0.00083ms | -21.67% |
| mean | 0.00035ms | 0.00029ms | +0.000055ms | +18.78% |
| min | 0.00011ms | 0.000083ms | +0.000028ms | +33.78% |
| max | 0.02ms | 0.02ms | +0.0027ms | +13.26% |
| total | 0.07ms | 0.06ms | +0.01ms | +18.78% |

### clerkUsersCreateAccessor

# Perf Report — clerkUsersCreateAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.00063ms |
| mean | 0.00017ms |
| stdev | 0.00014ms |
| min | 0.00013ms |
| max | 0.0016ms |
| total | 0.03ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.906)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00011ms | 0.00013ms | -0.000012ms | -9.38% |
| p50 | 0.00015ms | 0.00013ms | +0.000025ms | +20.34% |
| p95 | 0.00019ms | 0.00021ms | -0.000019ms | -8.94% |
| p99 | 0.00057ms | 0.0021ms | -0.0016ms | -73.10% |
| mean | 0.00016ms | 0.00020ms | -0.000044ms | -21.84% |
| min | 0.00011ms | 0.000083ms | +0.000030ms | +36.48% |
| max | 0.0015ms | 0.0078ms | -0.0063ms | -81.10% |
| total | 0.03ms | 0.04ms | -0.0087ms | -21.84% |

### auth0RulesActionsAccessor

# Perf Report — auth0RulesActionsAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.0015ms |
| mean | 0.00023ms |
| stdev | 0.00066ms |
| min | 0.00013ms |
| max | 0.0084ms |
| total | 0.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.884)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00011ms | 0.00013ms | -0.000015ms | -11.62% |
| p50 | 0.00015ms | 0.00017ms | -0.000018ms | -11.09% |
| p95 | 0.00018ms | 0.00034ms | -0.00015ms | -45.62% |
| p99 | 0.0013ms | 0.0026ms | -0.0012ms | -48.74% |
| mean | 0.00021ms | 0.00026ms | -0.000059ms | -22.34% |
| min | 0.00011ms | 0.00013ms | -0.000015ms | -11.62% |
| max | 0.0074ms | 0.0050ms | +0.0025ms | +50.01% |
| total | 0.04ms | 0.05ms | -0.01ms | -22.34% |

### supabaseAuthEnvAccessor

# Perf Report — supabaseAuthEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00017ms |
| p99 | 0.00088ms |
| mean | 0.00017ms |
| stdev | 0.00011ms |
| min | 0.00013ms |
| max | 0.0011ms |
| total | 0.03ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.921)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00012ms | 0.00013ms | -0.0000099ms | -7.89% |
| p50 | 0.00015ms | 0.00013ms | +0.000028ms | +22.32% |
| p95 | 0.00015ms | 0.00029ms | -0.00014ms | -47.32% |
| p99 | 0.00081ms | 0.0022ms | -0.0014ms | -63.62% |
| mean | 0.00015ms | 0.00023ms | -0.000072ms | -31.69% |
| min | 0.00012ms | 0.00013ms | -0.0000099ms | -7.89% |
| max | 0.0010ms | 0.0057ms | -0.0047ms | -81.85% |
| total | 0.03ms | 0.05ms | -0.01ms | -31.69% |

### webAuthnAuthenticatorList

# Perf Report — webAuthnAuthenticatorList.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.0018ms |
| p99 | 0.0040ms |
| mean | 0.00039ms |
| stdev | 0.00079ms |
| min | 0.00013ms |
| max | 0.0060ms |
| total | 0.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.912)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00011ms | 0.00013ms | -0.000011ms | -8.83% |
| p50 | 0.00015ms | 0.00013ms | +0.000027ms | +21.80% |
| p95 | 0.0017ms | 0.00025ms | +0.0014ms | +569.56% |
| p99 | 0.0037ms | 0.0018ms | +0.0019ms | +110.53% |
| mean | 0.00036ms | 0.00020ms | +0.00015ms | +74.12% |
| min | 0.00011ms | 0.00013ms | -0.000011ms | -8.83% |
| max | 0.0055ms | 0.0047ms | +0.00080ms | +17.21% |
| total | 0.07ms | 0.04ms | +0.03ms | +74.12% |

### passkeyListAuthenticators

# Perf Report — passkeyListAuthenticators.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00029ms |
| p99 | 0.0017ms |
| mean | 0.00024ms |
| stdev | 0.00020ms |
| min | 0.00017ms |
| max | 0.0018ms |
| total | 0.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.922)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00015ms | 0.00017ms | -0.000012ms | -7.23% |
| p50 | 0.00019ms | 0.00017ms | +0.000025ms | +14.85% |
| p95 | 0.00027ms | 0.0019ms | -0.0016ms | -85.96% |
| p99 | 0.0015ms | 0.0063ms | -0.0047ms | -75.40% |
| mean | 0.00022ms | 0.00041ms | -0.00018ms | -45.16% |
| min | 0.00015ms | 0.00013ms | +0.000028ms | +22.46% |
| max | 0.0017ms | 0.0072ms | -0.0055ms | -76.40% |
| total | 0.04ms | 0.08ms | -0.04ms | -45.16% |

### oauth21CreatePkceChallenge

# Perf Report — oauth21CreatePkceChallenge.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0044ms |
| p50 | 0.0050ms |
| p95 | 0.06ms |
| p99 | 5.86ms |
| mean | 0.19ms |
| stdev | 1.55ms |
| min | 0.0040ms |
| max | 19.36ms |
| total | 37.63ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.905)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0037ms | +0.00025ms | +6.69% |
| p50 | 0.0045ms | 0.0044ms | +0.00011ms | +2.46% |
| p95 | 0.06ms | 0.01ms | +0.04ms | +336.20% |
| p99 | 5.30ms | 0.02ms | +5.28ms | +23491.97% |
| mean | 0.17ms | 0.0057ms | +0.16ms | +2912.24% |
| min | 0.0037ms | 0.0035ms | +0.00020ms | +5.80% |
| max | 17.53ms | 0.03ms | +17.50ms | +65016.41% |
| total | 34.05ms | 1.13ms | +32.92ms | +2912.24% |

### oidcDiscoveryFetch

# Perf Report — oidcDiscoveryFetch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00033ms |
| p99 | 0.0013ms |
| mean | 0.00032ms |
| stdev | 0.00027ms |
| min | 0.00025ms |
| max | 0.0032ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.921)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00023ms | 0.00025ms | -0.000020ms | -7.91% |
| p50 | 0.00027ms | 0.00025ms | +0.000019ms | +7.56% |
| p95 | 0.00031ms | 0.0028ms | -0.0025ms | -88.90% |
| p99 | 0.0012ms | 0.0062ms | -0.0049ms | -80.01% |
| mean | 0.00030ms | 0.00057ms | -0.00027ms | -47.92% |
| min | 0.00023ms | 0.00021ms | +0.000022ms | +10.68% |
| max | 0.0030ms | 0.0080ms | -0.0050ms | -62.79% |
| total | 0.06ms | 0.11ms | -0.05ms | -47.92% |

