# Perf Suite — auth

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| nextAuthProviderLookup | 0.00017ms | 0.00080ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +200%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| luciaSessionIdGenerate | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| betterAuthProviderLookup | 0.00013ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| clerkUsersCreateAccessor | 0.00013ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (差 0.00017ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| auth0RulesActionsAccessor | 0.00033ms | 0.00042ms | 5ms | 0.00033ms | PASS | stable (差 0.00021ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| supabaseAuthEnvAccessor | 0.00017ms | 0.00046ms | 5ms | 0.00033ms | PASS | stable (差 0.000042ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| webAuthnAuthenticatorList | 0.00017ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| passkeyListAuthenticators | 0.00021ms | 0.00033ms | 5ms | 0.00033ms | PASS | stable (差 0.000041ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| oauth21CreatePkceChallenge | 0.0042ms | 0.02ms | 10ms | 0.00033ms | PASS | stable (p10 +16% (閾値未満)、 p95 +78% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| oidcDiscoveryFetch | 0.00025ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| nextAuthProviderLookup | 0.01ms | 10ms | PASS |
| luciaSessionIdGenerate | 0.00ms | 10ms | PASS |
| betterAuthProviderLookup | 0.01ms | 10ms | PASS |
| clerkUsersCreateAccessor | 0.00ms | 10ms | PASS |
| auth0RulesActionsAccessor | 0.01ms | 10ms | PASS |
| supabaseAuthEnvAccessor | 0.00ms | 10ms | PASS |
| webAuthnAuthenticatorList | 0.00ms | 10ms | PASS |
| passkeyListAuthenticators | 0.00ms | 10ms | PASS |
| oauth21CreatePkceChallenge | 0.16ms | 20ms | PASS |
| oidcDiscoveryFetch | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| nextAuthProviderLookup | -2064 B | 0 B | 102400 B | yes | PASS |
| luciaSessionIdGenerate | -225312 B | 0 B | 102400 B | yes | PASS |
| betterAuthProviderLookup | -344 B | 0 B | 102400 B | yes | PASS |
| clerkUsersCreateAccessor | 672 B | 0 B | 102400 B | yes | PASS |
| auth0RulesActionsAccessor | 944 B | 0 B | 102400 B | yes | PASS |
| supabaseAuthEnvAccessor | 5776 B | 0 B | 102400 B | yes | PASS |
| webAuthnAuthenticatorList | -864 B | 0 B | 102400 B | yes | PASS |
| passkeyListAuthenticators | 136 B | 0 B | 102400 B | yes | PASS |
| oauth21CreatePkceChallenge | -22368 B | -69276 B | 102400 B | yes | PASS |
| oidcDiscoveryFetch | 16 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### nextAuthProviderLookup

# Perf Report — nextAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00080ms |
| p99 | 0.0017ms |
| mean | 0.00029ms |
| stdev | 0.00057ms |
| min | 0.00013ms |
| max | 0.0063ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p95 | 0.00080ms | 0.00059ms | +0.00022ms | +37.14% |
| p99 | 0.0017ms | 0.0014ms | +0.00031ms | +22.76% |
| mean | 0.00029ms | 0.00026ms | +0.000026ms | +10.02% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0063ms | 0.0060ms | +0.00033ms | +5.55% |
| total | 0.06ms | 0.05ms | +0.0053ms | +10.02% |

### luciaSessionIdGenerate

# Perf Report — luciaSessionIdGenerate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.00088ms |
| mean | 0.00058ms |
| stdev | 0.0060ms |
| min | 0.00013ms |
| max | 0.09ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00017ms | 0.00021ms | -0.000042ms | -20.10% |
| p99 | 0.00088ms | 0.00067ms | +0.00021ms | +31.08% |
| mean | 0.00058ms | 0.00015ms | +0.00043ms | +275.91% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.09ms | 0.00075ms | +0.08ms | +11311.20% |
| total | 0.12ms | 0.03ms | +0.09ms | +275.91% |

### betterAuthProviderLookup

# Perf Report — betterAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.0014ms |
| mean | 0.00026ms |
| stdev | 0.0011ms |
| min | 0.00013ms |
| max | 0.02ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00013ms | +0.000042ms | +33.60% |
| p95 | 0.00021ms | 0.00017ms | +0.000041ms | +24.55% |
| p99 | 0.0014ms | 0.00071ms | +0.00067ms | +94.09% |
| mean | 0.00026ms | 0.00021ms | +0.000058ms | +27.94% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0046ms | +43.19% |
| total | 0.05ms | 0.04ms | +0.01ms | +27.94% |

### clerkUsersCreateAccessor

# Perf Report — clerkUsersCreateAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.0012ms |
| mean | 0.00018ms |
| stdev | 0.00019ms |
| min | 0.00013ms |
| max | 0.0022ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00029ms | -0.00017ms | -57.04% |
| p50 | 0.00017ms | 0.00033ms | -0.00017ms | -49.85% |
| p95 | 0.00021ms | 0.00038ms | -0.00017ms | -44.27% |
| p99 | 0.0012ms | 0.0022ms | -0.0010ms | -46.07% |
| mean | 0.00018ms | 0.00040ms | -0.00022ms | -54.35% |
| min | 0.00013ms | 0.00029ms | -0.00017ms | -57.04% |
| max | 0.0022ms | 0.01ms | -0.0092ms | -80.43% |
| total | 0.04ms | 0.08ms | -0.04ms | -54.35% |

### auth0RulesActionsAccessor

# Perf Report — auth0RulesActionsAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.00042ms |
| p99 | 0.0019ms |
| mean | 0.00040ms |
| stdev | 0.00040ms |
| min | 0.00033ms |
| max | 0.0052ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00013ms | +0.00021ms | +166.40% |
| p50 | 0.00033ms | 0.00013ms | +0.00021ms | +167.20% |
| p95 | 0.00042ms | 0.00017ms | +0.00025ms | +149.70% |
| p99 | 0.0019ms | 0.00075ms | +0.0012ms | +155.36% |
| mean | 0.00040ms | 0.00016ms | +0.00024ms | +154.69% |
| min | 0.00033ms | 0.000083ms | +0.00025ms | +301.20% |
| max | 0.0052ms | 0.0014ms | +0.0038ms | +278.84% |
| total | 0.08ms | 0.03ms | +0.05ms | +154.69% |

### supabaseAuthEnvAccessor

# Perf Report — supabaseAuthEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00033ms |
| p95 | 0.00046ms |
| p99 | 0.0043ms |
| mean | 0.00082ms |
| stdev | 0.0053ms |
| min | 0.00017ms |
| max | 0.07ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00013ms | +0.000042ms | +33.60% |
| p50 | 0.00033ms | 0.00013ms | +0.00021ms | +166.40% |
| p95 | 0.00046ms | 0.00017ms | +0.00029ms | +174.28% |
| p99 | 0.0043ms | 0.00054ms | +0.0038ms | +699.34% |
| mean | 0.00082ms | 0.00015ms | +0.00067ms | +455.37% |
| min | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| max | 0.07ms | 0.00075ms | +0.07ms | +9638.80% |
| total | 0.16ms | 0.03ms | +0.13ms | +455.37% |

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
| mean | 0.00018ms |
| stdev | 0.00016ms |
| min | 0.00013ms |
| max | 0.0022ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p50 | 0.00017ms | 0.00013ms | +0.000042ms | +33.60% |
| p95 | 0.00021ms | 0.00017ms | +0.000041ms | +24.55% |
| p99 | 0.00071ms | 0.00055ms | +0.00016ms | +29.63% |
| mean | 0.00018ms | 0.00015ms | +0.000028ms | +18.20% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0022ms | 0.0014ms | +0.00087ms | +63.64% |
| total | 0.04ms | 0.03ms | +0.0056ms | +18.20% |

### passkeyListAuthenticators

# Perf Report — passkeyListAuthenticators.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.00033ms |
| p99 | 0.0013ms |
| mean | 0.00027ms |
| stdev | 0.00019ms |
| min | 0.00021ms |
| max | 0.0022ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00017ms | +0.000041ms | +24.55% |
| p50 | 0.00025ms | 0.00021ms | +0.000042ms | +20.19% |
| p95 | 0.00033ms | 0.00025ms | +0.000083ms | +33.22% |
| p99 | 0.0013ms | 0.0015ms | -0.00017ms | -11.63% |
| mean | 0.00027ms | 0.00024ms | +0.000026ms | +10.96% |
| min | 0.00021ms | 0.00017ms | +0.000042ms | +25.30% |
| max | 0.0022ms | 0.0037ms | -0.0016ms | -42.24% |
| total | 0.05ms | 0.05ms | +0.0053ms | +10.96% |

### oauth21CreatePkceChallenge

# Perf Report — oauth21CreatePkceChallenge.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0042ms |
| p50 | 0.0046ms |
| p95 | 0.02ms |
| p99 | 0.08ms |
| mean | 0.0083ms |
| stdev | 0.02ms |
| min | 0.0038ms |
| max | 0.13ms |
| total | 1.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0042ms | 0.0036ms | +0.00058ms | +16.11% |
| p50 | 0.0046ms | 0.0040ms | +0.00065ms | +16.22% |
| p95 | 0.02ms | 0.0089ms | +0.0069ms | +77.64% |
| p99 | 0.08ms | 0.02ms | +0.07ms | +443.91% |
| mean | 0.0083ms | 0.0049ms | +0.0033ms | +68.16% |
| min | 0.0038ms | 0.0034ms | +0.00042ms | +12.24% |
| max | 0.13ms | 0.03ms | +0.11ms | +420.52% |
| total | 1.65ms | 0.98ms | +0.67ms | +68.16% |

### oidcDiscoveryFetch

# Perf Report — oidcDiscoveryFetch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00025ms |
| p95 | 0.00029ms |
| p99 | 0.0011ms |
| mean | 0.00029ms |
| stdev | 0.00023ms |
| min | 0.00025ms |
| max | 0.0031ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p50 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p95 | 0.00029ms | 0.00034ms | -0.000044ms | -13.11% |
| p99 | 0.0011ms | 0.00089ms | +0.00020ms | +22.11% |
| mean | 0.00029ms | 0.00030ms | -0.000010ms | -3.46% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.0031ms | 0.0028ms | +0.00029ms | +10.31% |
| total | 0.06ms | 0.06ms | -0.0021ms | -3.46% |

