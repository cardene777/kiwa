# Perf Suite — auth

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| nextAuthProviderLookup | 0.00013ms | 0.0020ms | 5ms | 0.00040ms | PASS | stable (検知には +0.00040ms (baseline 比 +316%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| luciaSessionIdGenerate | 0.00013ms | 0.00025ms | 5ms | 0.00036ms | PASS | stable (検知には +0.00036ms (baseline 比 +288%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| betterAuthProviderLookup | 0.00013ms | 0.00033ms | 5ms | 0.00040ms | PASS | stable (検知には +0.00040ms (baseline 比 +323%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| clerkUsersCreateAccessor | 0.00013ms | 0.00021ms | 5ms | 0.00041ms | PASS | stable (検知には +0.00041ms (baseline 比 +326%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| auth0RulesActionsAccessor | 0.00013ms | 0.0022ms | 5ms | 0.00041ms | PASS | stable (検知には +0.00041ms (baseline 比 +330%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| supabaseAuthEnvAccessor | 0.00013ms | 0.00042ms | 5ms | 0.00037ms | PASS | stable (検知には +0.00037ms (baseline 比 +293%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| webAuthnAuthenticatorList | 0.00013ms | 0.00025ms | 5ms | 0.00038ms | PASS | stable (検知には +0.00038ms (baseline 比 +305%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| passkeyListAuthenticators | 0.00021ms | 0.00033ms | 5ms | 0.00038ms | PASS | stable (検知には +0.00038ms (baseline 比 +232%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| oauth21CreatePkceChallenge | 0.0038ms | 0.01ms | 10ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| oidcDiscoveryFetch | 0.00029ms | 0.0015ms | 5ms | 0.00038ms | PASS | stable (検知には +0.00038ms (baseline 比 +152%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| nextAuthProviderLookup | cpu | 0.09ms | 0.10ms | 0.00013ms | 0.001 | 0.002 | 0.00012ms | 0.00013ms |
| luciaSessionIdGenerate | cpu | 0.09ms | 0.10ms | 0.00013ms | 0.001 | 0.002 | 0.00011ms | 0.00013ms |
| betterAuthProviderLookup | cpu | 0.08ms | 0.10ms | 0.00013ms | 0.002 | 0.002 | 0.00012ms | 0.00013ms |
| clerkUsersCreateAccessor | cpu | 0.08ms | 0.10ms | 0.00013ms | 0.002 | 0.002 | 0.00012ms | 0.00013ms |
| auth0RulesActionsAccessor | cpu | 0.08ms | 0.13ms | 0.00013ms | 0.002 | 0.002 | 0.00012ms | 0.00013ms |
| supabaseAuthEnvAccessor | cpu | 0.09ms | 0.10ms | 0.00013ms | 0.001 | 0.002 | 0.00011ms | 0.00013ms |
| webAuthnAuthenticatorList | cpu | 0.09ms | 0.09ms | 0.00013ms | 0.001 | 0.002 | 0.00011ms | 0.00013ms |
| passkeyListAuthenticators | cpu | 0.09ms | 0.10ms | 0.00021ms | 0.002 | 0.002 | 0.00019ms | 0.00017ms |
| oauth21CreatePkceChallenge | cpu | 0.08ms | 0.10ms | 0.0038ms | 0.046 | 0.046 | 0.0038ms | 0.0037ms |
| oidcDiscoveryFetch | cpu | 0.09ms | 0.11ms | 0.00029ms | 0.003 | 0.003 | 0.00027ms | 0.00025ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| nextAuthProviderLookup | 0.01ms | 10ms | PASS |
| luciaSessionIdGenerate | 0.01ms | 10ms | PASS |
| betterAuthProviderLookup | 0.00ms | 10ms | PASS |
| clerkUsersCreateAccessor | 0.00ms | 10ms | PASS |
| auth0RulesActionsAccessor | 0.00ms | 10ms | PASS |
| supabaseAuthEnvAccessor | 0.00ms | 10ms | PASS |
| webAuthnAuthenticatorList | 0.00ms | 10ms | PASS |
| passkeyListAuthenticators | 0.00ms | 10ms | PASS |
| oauth21CreatePkceChallenge | 0.09ms | 20ms | PASS |
| oidcDiscoveryFetch | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| nextAuthProviderLookup | 24 B | 0 B | 102400 B | yes | PASS |
| luciaSessionIdGenerate | -216 B | 0 B | 102400 B | yes | PASS |
| betterAuthProviderLookup | -13504 B | 0 B | 102400 B | yes | PASS |
| clerkUsersCreateAccessor | -312 B | 0 B | 102400 B | yes | PASS |
| auth0RulesActionsAccessor | 4232 B | 0 B | 102400 B | yes | PASS |
| supabaseAuthEnvAccessor | 2680 B | 0 B | 102400 B | yes | PASS |
| webAuthnAuthenticatorList | 4256 B | 0 B | 102400 B | yes | PASS |
| passkeyListAuthenticators | -249432 B | 0 B | 102400 B | yes | PASS |
| oauth21CreatePkceChallenge | -20928 B | -62408 B | 102400 B | yes | PASS |
| oidcDiscoveryFetch | 5696 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### nextAuthProviderLookup

# Perf Report — nextAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.0020ms |
| p99 | 0.0039ms |
| mean | 0.00048ms |
| stdev | 0.0016ms |
| min | 0.00013ms |
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.951)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00012ms | 0.00013ms | -0.0000061ms | -4.91% |
| p50 | 0.00016ms | 0.00013ms | +0.000033ms | +26.28% |
| p95 | 0.0019ms | 0.0016ms | +0.00031ms | +20.25% |
| p99 | 0.0037ms | 0.0035ms | +0.00028ms | +8.03% |
| mean | 0.00045ms | 0.00038ms | +0.000074ms | +19.43% |
| min | 0.00012ms | 0.000083ms | +0.000036ms | +43.20% |
| max | 0.02ms | 0.02ms | +0.0039ms | +24.08% |
| total | 0.09ms | 0.08ms | +0.01ms | +19.43% |

### luciaSessionIdGenerate

# Perf Report — luciaSessionIdGenerate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00025ms |
| p99 | 0.0013ms |
| mean | 0.00022ms |
| stdev | 0.00046ms |
| min | 0.00013ms |
| max | 0.0048ms |
| total | 0.04ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.865)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00011ms | 0.00013ms | -0.000017ms | -13.50% |
| p50 | 0.00014ms | 0.00013ms | +0.000019ms | +15.57% |
| p95 | 0.00022ms | 0.00025ms | -0.000034ms | -13.50% |
| p99 | 0.0011ms | 0.00077ms | +0.00038ms | +49.34% |
| mean | 0.00019ms | 0.00018ms | +0.000012ms | +6.66% |
| min | 0.00011ms | 0.00013ms | -0.000017ms | -13.50% |
| max | 0.0042ms | 0.0040ms | +0.00014ms | +3.46% |
| total | 0.04ms | 0.04ms | +0.0024ms | +6.66% |

### betterAuthProviderLookup

# Perf Report — betterAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00033ms |
| p99 | 0.0040ms |
| mean | 0.00038ms |
| stdev | 0.0019ms |
| min | 0.000083ms |
| max | 0.03ms |
| total | 0.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.969)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00012ms | 0.00013ms | -0.0000038ms | -3.07% |
| p50 | 0.00016ms | 0.00013ms | +0.000036ms | +28.72% |
| p95 | 0.00032ms | 0.00021ms | +0.00011ms | +54.46% |
| p99 | 0.0039ms | 0.0038ms | +0.000080ms | +2.07% |
| mean | 0.00037ms | 0.00029ms | +0.000073ms | +24.75% |
| min | 0.000080ms | 0.000083ms | -0.0000026ms | -3.07% |
| max | 0.02ms | 0.02ms | +0.0044ms | +21.96% |
| total | 0.07ms | 0.06ms | +0.01ms | +24.75% |

### clerkUsersCreateAccessor

# Perf Report — clerkUsersCreateAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.0026ms |
| mean | 0.00023ms |
| stdev | 0.00044ms |
| min | 0.00013ms |
| max | 0.0043ms |
| total | 0.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.980)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00012ms | 0.00013ms | -0.0000025ms | -1.97% |
| p50 | 0.00016ms | 0.00013ms | +0.000038ms | +30.19% |
| p95 | 0.00021ms | 0.00021ms | -0.0000011ms | -0.53% |
| p99 | 0.0026ms | 0.0021ms | +0.00045ms | +21.17% |
| mean | 0.00022ms | 0.00020ms | +0.000021ms | +10.47% |
| min | 0.00012ms | 0.000083ms | +0.000040ms | +47.64% |
| max | 0.0042ms | 0.0078ms | -0.0036ms | -46.53% |
| total | 0.04ms | 0.04ms | +0.0042ms | +10.47% |

### auth0RulesActionsAccessor

# Perf Report — auth0RulesActionsAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.0022ms |
| p99 | 0.0042ms |
| mean | 0.00037ms |
| stdev | 0.00076ms |
| min | 0.00013ms |
| max | 0.0048ms |
| total | 0.07ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.992)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00012ms | 0.00013ms | -9.4e-7ms | -0.75% |
| p50 | 0.00017ms | 0.00017ms | -2.6e-7ms | -0.16% |
| p95 | 0.0022ms | 0.00034ms | +0.0018ms | +536.33% |
| p99 | 0.0042ms | 0.0026ms | +0.0016ms | +63.18% |
| mean | 0.00037ms | 0.00026ms | +0.00010ms | +39.49% |
| min | 0.00012ms | 0.00013ms | -9.4e-7ms | -0.75% |
| max | 0.0048ms | 0.0050ms | -0.00016ms | -3.26% |
| total | 0.07ms | 0.05ms | +0.02ms | +39.49% |

### supabaseAuthEnvAccessor

# Perf Report — supabaseAuthEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00042ms |
| p99 | 0.0034ms |
| mean | 0.00029ms |
| stdev | 0.00077ms |
| min | 0.00013ms |
| max | 0.0092ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.882)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00011ms | 0.00013ms | -0.000015ms | -11.83% |
| p50 | 0.00015ms | 0.00013ms | +0.000022ms | +17.79% |
| p95 | 0.00037ms | 0.00029ms | +0.000081ms | +27.79% |
| p99 | 0.0030ms | 0.0022ms | +0.00076ms | +34.44% |
| mean | 0.00025ms | 0.00023ms | +0.000026ms | +11.67% |
| min | 0.00011ms | 0.00013ms | -0.000015ms | -11.83% |
| max | 0.0081ms | 0.0057ms | +0.0024ms | +42.20% |
| total | 0.05ms | 0.05ms | +0.0053ms | +11.67% |

### webAuthnAuthenticatorList

# Perf Report — webAuthnAuthenticatorList.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00025ms |
| p99 | 0.0017ms |
| mean | 0.00020ms |
| stdev | 0.00032ms |
| min | 0.00013ms |
| max | 0.0039ms |
| total | 0.04ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.918)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00011ms | 0.00013ms | -0.000010ms | -8.24% |
| p50 | 0.00015ms | 0.00013ms | +0.000027ms | +21.86% |
| p95 | 0.00023ms | 0.00025ms | -0.000021ms | -8.24% |
| p99 | 0.0016ms | 0.0018ms | -0.00018ms | -10.51% |
| mean | 0.00018ms | 0.00020ms | -0.000021ms | -10.40% |
| min | 0.00011ms | 0.00013ms | -0.000010ms | -8.24% |
| max | 0.0036ms | 0.0047ms | -0.0011ms | -23.81% |
| total | 0.04ms | 0.04ms | -0.0043ms | -10.40% |

### passkeyListAuthenticators

# Perf Report — passkeyListAuthenticators.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00033ms |
| p99 | 0.0027ms |
| mean | 0.00032ms |
| stdev | 0.00074ms |
| min | 0.00017ms |
| max | 0.0083ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.924)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00019ms | 0.00017ms | +0.000026ms | +15.83% |
| p50 | 0.00019ms | 0.00017ms | +0.000025ms | +15.13% |
| p95 | 0.00031ms | 0.0019ms | -0.0016ms | -83.95% |
| p99 | 0.0025ms | 0.0063ms | -0.0037ms | -59.55% |
| mean | 0.00030ms | 0.00041ms | -0.00011ms | -26.69% |
| min | 0.00015ms | 0.00013ms | +0.000028ms | +22.76% |
| max | 0.0077ms | 0.0072ms | +0.00050ms | +6.96% |
| total | 0.06ms | 0.08ms | -0.02ms | -26.69% |

### oauth21CreatePkceChallenge

# Perf Report — oauth21CreatePkceChallenge.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0038ms |
| p50 | 0.0046ms |
| p95 | 0.01ms |
| p99 | 0.04ms |
| mean | 0.0067ms |
| stdev | 0.0080ms |
| min | 0.0035ms |
| max | 0.08ms |
| total | 1.35ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.982)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0038ms | 0.0037ms | +0.000058ms | +1.55% |
| p50 | 0.0045ms | 0.0044ms | +0.00013ms | +2.87% |
| p95 | 0.01ms | 0.01ms | +0.0014ms | +10.27% |
| p99 | 0.04ms | 0.02ms | +0.02ms | +78.42% |
| mean | 0.0066ms | 0.0057ms | +0.00098ms | +17.25% |
| min | 0.0034ms | 0.0035ms | -0.000020ms | -0.57% |
| max | 0.08ms | 0.03ms | +0.05ms | +204.16% |
| total | 1.33ms | 1.13ms | +0.20ms | +17.25% |

### oidcDiscoveryFetch

# Perf Report — oidcDiscoveryFetch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00029ms |
| p95 | 0.0015ms |
| p99 | 0.0094ms |
| mean | 0.00068ms |
| stdev | 0.0019ms |
| min | 0.00021ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.916)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00027ms | 0.00025ms | +0.000016ms | +6.57% |
| p50 | 0.00027ms | 0.00025ms | +0.000017ms | +6.93% |
| p95 | 0.0014ms | 0.0028ms | -0.0014ms | -50.99% |
| p99 | 0.0086ms | 0.0062ms | +0.0025ms | +40.05% |
| mean | 0.00062ms | 0.00057ms | +0.000049ms | +8.46% |
| min | 0.00019ms | 0.00021ms | -0.000018ms | -8.45% |
| max | 0.02ms | 0.0080ms | +0.0073ms | +91.17% |
| total | 0.12ms | 0.11ms | +0.0097ms | +8.46% |

