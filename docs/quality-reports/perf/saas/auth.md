# Perf Suite — auth

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| nextAuthProviderLookup | 0.00013ms | 0.0016ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +268%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| luciaSessionIdGenerate | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| betterAuthProviderLookup | 0.00013ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +262%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| clerkUsersCreateAccessor | 0.00013ms | 0.00025ms | 5ms | 0.00032ms | PASS | stable (検知には +0.00032ms (baseline 比 +255%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| auth0RulesActionsAccessor | 0.00013ms | 0.00059ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +261%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| supabaseAuthEnvAccessor | 0.00013ms | 0.00025ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +268%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| webAuthnAuthenticatorList | 0.00013ms | 0.0021ms | 5ms | 0.00032ms | PASS | stable (検知には +0.00032ms (baseline 比 +259%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| passkeyListAuthenticators | 0.00017ms | 0.0010ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +196%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| oauth21CreatePkceChallenge | 0.0037ms | 0.02ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| oidcDiscoveryFetch | 0.00025ms | 0.00033ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +132%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| nextAuthProviderLookup | cpu | 0.08ms | 0.00013ms | 0.002 | 0.002 | 0.00013ms | 0.00013ms |
| luciaSessionIdGenerate | cpu | 0.08ms | 0.00013ms | 0.002 | 0.002 | 0.00013ms | 0.00013ms |
| betterAuthProviderLookup | cpu | 0.08ms | 0.00013ms | 0.002 | 0.002 | 0.00012ms | 0.00013ms |
| clerkUsersCreateAccessor | cpu | 0.08ms | 0.00013ms | 0.002 | 0.002 | 0.00012ms | 0.00013ms |
| auth0RulesActionsAccessor | cpu | 0.08ms | 0.00013ms | 0.002 | 0.002 | 0.00012ms | 0.00013ms |
| supabaseAuthEnvAccessor | cpu | 0.08ms | 0.00013ms | 0.002 | 0.002 | 0.00013ms | 0.00013ms |
| webAuthnAuthenticatorList | cpu | 0.08ms | 0.00013ms | 0.002 | 0.002 | 0.00012ms | 0.00013ms |
| passkeyListAuthenticators | cpu | 0.08ms | 0.00017ms | 0.002 | 0.002 | 0.00016ms | 0.00017ms |
| oauth21CreatePkceChallenge | cpu | 0.08ms | 0.0037ms | 0.046 | 0.049 | 0.0037ms | 0.0040ms |
| oidcDiscoveryFetch | cpu | 0.08ms | 0.00025ms | 0.003 | 0.003 | 0.00025ms | 0.00025ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| nextAuthProviderLookup | 0.00ms | 10ms | PASS |
| luciaSessionIdGenerate | 0.00ms | 10ms | PASS |
| betterAuthProviderLookup | 0.00ms | 10ms | PASS |
| clerkUsersCreateAccessor | 0.00ms | 10ms | PASS |
| auth0RulesActionsAccessor | 0.00ms | 10ms | PASS |
| supabaseAuthEnvAccessor | 0.01ms | 10ms | PASS |
| webAuthnAuthenticatorList | 0.07ms | 10ms | PASS |
| passkeyListAuthenticators | 0.00ms | 10ms | PASS |
| oauth21CreatePkceChallenge | 0.06ms | 20ms | PASS |
| oidcDiscoveryFetch | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| nextAuthProviderLookup | -9104 B | 0 B | 102400 B | yes | PASS |
| luciaSessionIdGenerate | -15104 B | 0 B | 102400 B | yes | PASS |
| betterAuthProviderLookup | 2776 B | 0 B | 102400 B | yes | PASS |
| clerkUsersCreateAccessor | 744 B | 0 B | 102400 B | yes | PASS |
| auth0RulesActionsAccessor | 976 B | 0 B | 102400 B | yes | PASS |
| supabaseAuthEnvAccessor | 1360 B | 0 B | 102400 B | yes | PASS |
| webAuthnAuthenticatorList | 64 B | 0 B | 102400 B | yes | PASS |
| passkeyListAuthenticators | 1368 B | 0 B | 102400 B | yes | PASS |
| oauth21CreatePkceChallenge | -21392 B | 0 B | 102400 B | yes | PASS |
| oidcDiscoveryFetch | 48 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### nextAuthProviderLookup

# Perf Report — nextAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.0016ms |
| p99 | 0.0030ms |
| mean | 0.00034ms |
| stdev | 0.00089ms |
| min | 0.00013ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.0016ms | 0.0013ms | +0.00029ms | +22.58% |
| p99 | 0.0030ms | 0.0047ms | -0.0017ms | -36.36% |
| mean | 0.00034ms | 0.00038ms | -0.000041ms | -10.57% |
| min | 0.00013ms | 0.000083ms | +0.000042ms | +50.60% |
| max | 0.01ms | 0.01ms | -0.0020ms | -16.11% |
| total | 0.07ms | 0.08ms | -0.0081ms | -10.57% |

### luciaSessionIdGenerate

# Perf Report — luciaSessionIdGenerate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.00071ms |
| mean | 0.00015ms |
| stdev | 0.000096ms |
| min | 0.000083ms |
| max | 0.0011ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00017ms | 0.00021ms | -0.000039ms | -18.73% |
| p99 | 0.00071ms | 0.00054ms | +0.00017ms | +30.86% |
| mean | 0.00015ms | 0.00015ms | -0.0000033ms | -2.16% |
| min | 0.000083ms | 0.00013ms | -0.000042ms | -33.60% |
| max | 0.0011ms | 0.0025ms | -0.0014ms | -55.92% |
| total | 0.03ms | 0.03ms | -0.00067ms | -2.16% |

### betterAuthProviderLookup

# Perf Report — betterAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00025ms |
| p99 | 0.0031ms |
| mean | 0.00029ms |
| stdev | 0.0015ms |
| min | 0.000083ms |
| max | 0.02ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00025ms | 0.00026ms | -0.000010ms | -3.99% |
| p99 | 0.0031ms | 0.0038ms | -0.00076ms | -19.80% |
| mean | 0.00029ms | 0.00033ms | -0.000036ms | -10.95% |
| min | 0.000083ms | 0.000083ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | +0.0041ms | +23.33% |
| total | 0.06ms | 0.07ms | -0.0071ms | -10.95% |

### clerkUsersCreateAccessor

# Perf Report — clerkUsersCreateAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00025ms |
| p99 | 0.0015ms |
| mean | 0.00019ms |
| stdev | 0.00029ms |
| min | 0.00013ms |
| max | 0.0035ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00025ms | 0.00021ms | +0.000039ms | +18.46% |
| p99 | 0.0015ms | 0.0014ms | +0.00013ms | +9.51% |
| mean | 0.00019ms | 0.00017ms | +0.000011ms | +6.57% |
| min | 0.00013ms | 0.000084ms | +0.000041ms | +48.81% |
| max | 0.0035ms | 0.0036ms | -0.000083ms | -2.29% |
| total | 0.04ms | 0.03ms | +0.0023ms | +6.57% |

### auth0RulesActionsAccessor

# Perf Report — auth0RulesActionsAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00059ms |
| p99 | 0.0021ms |
| mean | 0.00025ms |
| stdev | 0.00033ms |
| min | 0.00013ms |
| max | 0.0026ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00013ms | +0.000042ms | +33.60% |
| p95 | 0.00059ms | 0.00021ms | +0.00038ms | +183.23% |
| p99 | 0.0021ms | 0.0013ms | +0.00087ms | +69.90% |
| mean | 0.00025ms | 0.00017ms | +0.000074ms | +42.83% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0026ms | 0.0024ms | +0.00021ms | +8.61% |
| total | 0.05ms | 0.03ms | +0.01ms | +42.83% |

### supabaseAuthEnvAccessor

# Perf Report — supabaseAuthEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00025ms |
| p99 | 0.0023ms |
| mean | 0.00020ms |
| stdev | 0.00037ms |
| min | 0.00013ms |
| max | 0.0039ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00025ms | 0.00021ms | +0.000042ms | +20.16% |
| p99 | 0.0023ms | 0.0022ms | +0.000036ms | +1.64% |
| mean | 0.00020ms | 0.00019ms | +0.0000012ms | +0.64% |
| min | 0.00013ms | 0.000083ms | +0.000042ms | +50.60% |
| max | 0.0039ms | 0.0043ms | -0.00038ms | -8.82% |
| total | 0.04ms | 0.04ms | +0.00025ms | +0.64% |

### webAuthnAuthenticatorList

# Perf Report — webAuthnAuthenticatorList.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.0021ms |
| p99 | 0.0035ms |
| mean | 0.00059ms |
| stdev | 0.0013ms |
| min | 0.00013ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00013ms | +0.000042ms | +33.60% |
| p95 | 0.0021ms | 0.00025ms | +0.0018ms | +724.74% |
| p99 | 0.0035ms | 0.0024ms | +0.0010ms | +43.28% |
| mean | 0.00059ms | 0.00022ms | +0.00037ms | +170.80% |
| min | 0.00013ms | 0.000083ms | +0.000042ms | +50.60% |
| max | 0.01ms | 0.0045ms | +0.01ms | +230.32% |
| total | 0.12ms | 0.04ms | +0.07ms | +170.80% |

### passkeyListAuthenticators

# Perf Report — passkeyListAuthenticators.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.0010ms |
| p99 | 0.0053ms |
| mean | 0.00038ms |
| stdev | 0.00099ms |
| min | 0.00017ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00017ms | +0.000041ms | +24.55% |
| p95 | 0.0010ms | 0.00029ms | +0.00072ms | +247.94% |
| p99 | 0.0053ms | 0.0028ms | +0.0024ms | +86.35% |
| mean | 0.00038ms | 0.00028ms | +0.00010ms | +37.47% |
| min | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| max | 0.01ms | 0.0071ms | +0.0036ms | +50.60% |
| total | 0.08ms | 0.06ms | +0.02ms | +37.47% |

### oauth21CreatePkceChallenge

# Perf Report — oauth21CreatePkceChallenge.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0037ms |
| p50 | 0.0044ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.0069ms |
| stdev | 0.0086ms |
| min | 0.0034ms |
| max | 0.08ms |
| total | 1.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0040ms | -0.00025ms | -6.34% |
| p50 | 0.0044ms | 0.0046ms | -0.00017ms | -3.64% |
| p95 | 0.02ms | 0.02ms | -0.0014ms | -7.94% |
| p99 | 0.05ms | 0.06ms | -0.0091ms | -16.32% |
| mean | 0.0069ms | 0.0071ms | -0.00014ms | -2.00% |
| min | 0.0034ms | 0.0036ms | -0.00021ms | -5.74% |
| max | 0.08ms | 0.07ms | +0.0068ms | +9.16% |
| total | 1.39ms | 1.41ms | -0.03ms | -2.00% |

### oidcDiscoveryFetch

# Perf Report — oidcDiscoveryFetch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00025ms |
| p95 | 0.00033ms |
| p99 | 0.0011ms |
| mean | 0.00028ms |
| stdev | 0.00022ms |
| min | 0.00021ms |
| max | 0.0030ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p50 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p95 | 0.00033ms | 0.00038ms | -0.000042ms | -11.19% |
| p99 | 0.0011ms | 0.0036ms | -0.0025ms | -69.88% |
| mean | 0.00028ms | 0.00037ms | -0.000085ms | -22.97% |
| min | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| max | 0.0030ms | 0.0075ms | -0.0046ms | -60.78% |
| total | 0.06ms | 0.07ms | -0.02ms | -22.97% |

