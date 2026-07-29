# Perf Suite — auth

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| nextAuthProviderLookup | 0.00021ms | 0.00055ms | 5ms | 0.00042ms | PASS | stable (差 0.000042ms が下限 0.00042ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| luciaSessionIdGenerate | 0.00013ms | 0.00072ms | 5ms | 0.00042ms | PASS | stable (検知には +0.00042ms (baseline 比 +333%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| betterAuthProviderLookup | 0.00013ms | 0.00021ms | 5ms | 0.00042ms | PASS | stable (検知には +0.00042ms (baseline 比 +333%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| clerkUsersCreateAccessor | 0.00017ms | 0.00021ms | 5ms | 0.00042ms | PASS | stable (差 0.00013ms が下限 0.00042ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| auth0RulesActionsAccessor | 0.00017ms | 0.00025ms | 5ms | 0.00042ms | PASS | stable (差 0.000041ms が下限 0.00042ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| supabaseAuthEnvAccessor | 0.00029ms | 0.00038ms | 5ms | 0.00042ms | PASS | stable (差 0.00017ms が下限 0.00042ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| webAuthnAuthenticatorList | 0.00017ms | 0.00021ms | 5ms | 0.00042ms | PASS | stable (差 0.000041ms が下限 0.00042ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| passkeyListAuthenticators | 0.00025ms | 0.00033ms | 5ms | 0.00042ms | PASS | stable (差 0.000083ms が下限 0.00042ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| oauth21CreatePkceChallenge | 0.0047ms | 0.01ms | 10ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| oidcDiscoveryFetch | 0.00029ms | 0.00038ms | 5ms | 0.00042ms | PASS | stable (検知には +0.00042ms (baseline 比 +166%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| nextAuthProviderLookup | 0.00ms | 10ms | PASS |
| luciaSessionIdGenerate | 0.01ms | 10ms | PASS |
| betterAuthProviderLookup | 0.00ms | 10ms | PASS |
| clerkUsersCreateAccessor | 0.00ms | 10ms | PASS |
| auth0RulesActionsAccessor | 0.00ms | 10ms | PASS |
| supabaseAuthEnvAccessor | 0.01ms | 10ms | PASS |
| webAuthnAuthenticatorList | 0.00ms | 10ms | PASS |
| passkeyListAuthenticators | 0.03ms | 10ms | PASS |
| oauth21CreatePkceChallenge | 0.51ms | 20ms | PASS |
| oidcDiscoveryFetch | 0.10ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| nextAuthProviderLookup | 242264 B | 0 B | 102400 B | yes | PASS |
| luciaSessionIdGenerate | -13632 B | 0 B | 102400 B | yes | PASS |
| betterAuthProviderLookup | -344 B | 0 B | 102400 B | yes | PASS |
| clerkUsersCreateAccessor | 1688 B | 0 B | 102400 B | yes | PASS |
| auth0RulesActionsAccessor | 752 B | 0 B | 102400 B | yes | PASS |
| supabaseAuthEnvAccessor | 1328 B | 0 B | 102400 B | yes | PASS |
| webAuthnAuthenticatorList | 9280 B | 0 B | 102400 B | yes | PASS |
| passkeyListAuthenticators | 16 B | 0 B | 102400 B | yes | PASS |
| oauth21CreatePkceChallenge | -20960 B | -49084 B | 102400 B | yes | PASS |
| oidcDiscoveryFetch | 16 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### nextAuthProviderLookup

# Perf Report — nextAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00055ms |
| p99 | 0.0017ms |
| mean | 0.00030ms |
| stdev | 0.00046ms |
| min | 0.00017ms |
| max | 0.0058ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00017ms | +0.000042ms | +25.30% |
| p50 | 0.00021ms | 0.00017ms | +0.000042ms | +25.15% |
| p95 | 0.00055ms | 0.00059ms | -0.000035ms | -5.95% |
| p99 | 0.0017ms | 0.0014ms | +0.00029ms | +20.98% |
| mean | 0.00030ms | 0.00026ms | +0.000036ms | +13.92% |
| min | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| max | 0.0058ms | 0.0060ms | -0.00017ms | -2.78% |
| total | 0.06ms | 0.05ms | +0.0073ms | +13.92% |

### luciaSessionIdGenerate

# Perf Report — luciaSessionIdGenerate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00072ms |
| p99 | 0.0014ms |
| mean | 0.00022ms |
| stdev | 0.00025ms |
| min | 0.00013ms |
| max | 0.0018ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00013ms | +0.000042ms | +33.60% |
| p95 | 0.00072ms | 0.00021ms | +0.00051ms | +242.75% |
| p99 | 0.0014ms | 0.00067ms | +0.00075ms | +112.30% |
| mean | 0.00022ms | 0.00015ms | +0.000068ms | +44.14% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0018ms | 0.00075ms | +0.0011ms | +144.53% |
| total | 0.04ms | 0.03ms | +0.01ms | +44.14% |

### betterAuthProviderLookup

# Perf Report — betterAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.0011ms |
| mean | 0.00024ms |
| stdev | 0.00078ms |
| min | 0.00013ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00013ms | +0.000042ms | +33.60% |
| p95 | 0.00021ms | 0.00017ms | +0.000044ms | +26.38% |
| p99 | 0.0011ms | 0.00071ms | +0.00037ms | +52.44% |
| mean | 0.00024ms | 0.00021ms | +0.000029ms | +14.02% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00038ms | +3.50% |
| total | 0.05ms | 0.04ms | +0.0058ms | +14.02% |

### clerkUsersCreateAccessor

# Perf Report — clerkUsersCreateAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.00063ms |
| mean | 0.00019ms |
| stdev | 0.00016ms |
| min | 0.00013ms |
| max | 0.0022ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00029ms | -0.00013ms | -42.96% |
| p50 | 0.00017ms | 0.00033ms | -0.00017ms | -49.85% |
| p95 | 0.00021ms | 0.00038ms | -0.00017ms | -44.27% |
| p99 | 0.00063ms | 0.0022ms | -0.0015ms | -70.98% |
| mean | 0.00019ms | 0.00040ms | -0.00022ms | -53.22% |
| min | 0.00013ms | 0.00029ms | -0.00017ms | -57.04% |
| max | 0.0022ms | 0.01ms | -0.0093ms | -81.16% |
| total | 0.04ms | 0.08ms | -0.04ms | -53.22% |

### auth0RulesActionsAccessor

# Perf Report — auth0RulesActionsAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00025ms |
| p99 | 0.00088ms |
| mean | 0.00020ms |
| stdev | 0.00017ms |
| min | 0.00013ms |
| max | 0.0021ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p50 | 0.00017ms | 0.00013ms | +0.000042ms | +33.60% |
| p95 | 0.00025ms | 0.00017ms | +0.000083ms | +49.70% |
| p99 | 0.00088ms | 0.00075ms | +0.00013ms | +16.81% |
| mean | 0.00020ms | 0.00016ms | +0.000045ms | +28.74% |
| min | 0.00013ms | 0.000083ms | +0.000042ms | +50.60% |
| max | 0.0021ms | 0.0014ms | +0.00071ms | +51.49% |
| total | 0.04ms | 0.03ms | +0.0091ms | +28.74% |

### supabaseAuthEnvAccessor

# Perf Report — supabaseAuthEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00038ms |
| p99 | 0.0017ms |
| mean | 0.0010ms |
| stdev | 0.0091ms |
| min | 0.00029ms |
| max | 0.13ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00013ms | +0.00017ms | +133.60% |
| p50 | 0.00033ms | 0.00013ms | +0.00021ms | +166.40% |
| p95 | 0.00038ms | 0.00017ms | +0.00021ms | +124.55% |
| p99 | 0.0017ms | 0.00054ms | +0.0012ms | +216.70% |
| mean | 0.0010ms | 0.00015ms | +0.00085ms | +577.45% |
| min | 0.00029ms | 0.00013ms | +0.00017ms | +132.80% |
| max | 0.13ms | 0.00075ms | +0.13ms | +17088.93% |
| total | 0.20ms | 0.03ms | +0.17ms | +577.45% |

### webAuthnAuthenticatorList

# Perf Report — webAuthnAuthenticatorList.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.00071ms |
| mean | 0.00020ms |
| stdev | 0.00015ms |
| min | 0.00017ms |
| max | 0.0021ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p50 | 0.00017ms | 0.00013ms | +0.000042ms | +33.60% |
| p95 | 0.00021ms | 0.00017ms | +0.000042ms | +25.15% |
| p99 | 0.00071ms | 0.00055ms | +0.00016ms | +29.86% |
| mean | 0.00020ms | 0.00015ms | +0.000042ms | +27.09% |
| min | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| max | 0.0021ms | 0.0014ms | +0.00075ms | +54.55% |
| total | 0.04ms | 0.03ms | +0.0084ms | +27.09% |

### passkeyListAuthenticators

# Perf Report — passkeyListAuthenticators.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00025ms |
| p95 | 0.00033ms |
| p99 | 0.0021ms |
| mean | 0.00029ms |
| stdev | 0.00025ms |
| min | 0.00021ms |
| max | 0.0023ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00017ms | +0.000083ms | +49.70% |
| p50 | 0.00025ms | 0.00021ms | +0.000042ms | +20.19% |
| p95 | 0.00033ms | 0.00025ms | +0.000083ms | +33.20% |
| p99 | 0.0021ms | 0.0015ms | +0.00066ms | +45.24% |
| mean | 0.00029ms | 0.00024ms | +0.000049ms | +20.48% |
| min | 0.00021ms | 0.00017ms | +0.000042ms | +25.30% |
| max | 0.0023ms | 0.0037ms | -0.0015ms | -38.91% |
| total | 0.06ms | 0.05ms | +0.0099ms | +20.48% |

### oauth21CreatePkceChallenge

# Perf Report — oauth21CreatePkceChallenge.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0047ms |
| p50 | 0.0057ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0067ms |
| stdev | 0.0034ms |
| min | 0.0044ms |
| max | 0.03ms |
| total | 1.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0047ms | 0.0036ms | +0.0010ms | +28.74% |
| p50 | 0.0057ms | 0.0040ms | +0.0017ms | +42.40% |
| p95 | 0.01ms | 0.0089ms | +0.0041ms | +45.65% |
| p99 | 0.02ms | 0.02ms | +0.0044ms | +28.58% |
| mean | 0.0067ms | 0.0049ms | +0.0018ms | +35.76% |
| min | 0.0044ms | 0.0034ms | +0.00096ms | +28.07% |
| max | 0.03ms | 0.03ms | +0.0068ms | +26.93% |
| total | 1.33ms | 0.98ms | +0.35ms | +35.76% |

### oidcDiscoveryFetch

# Perf Report — oidcDiscoveryFetch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00038ms |
| p99 | 0.0015ms |
| mean | 0.00037ms |
| stdev | 0.00030ms |
| min | 0.00029ms |
| max | 0.0039ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00025ms | +0.000042ms | +16.80% |
| p50 | 0.00033ms | 0.00025ms | +0.000083ms | +33.20% |
| p95 | 0.00038ms | 0.00034ms | +0.000041ms | +12.20% |
| p99 | 0.0015ms | 0.00089ms | +0.00061ms | +68.63% |
| mean | 0.00037ms | 0.00030ms | +0.000070ms | +23.15% |
| min | 0.00029ms | 0.00025ms | +0.000041ms | +16.40% |
| max | 0.0039ms | 0.0028ms | +0.0011ms | +38.26% |
| total | 0.07ms | 0.06ms | +0.01ms | +23.15% |

