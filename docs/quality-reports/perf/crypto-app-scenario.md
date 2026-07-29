# Perf Suite — crypto-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.10ms | 0.14ms | 100ms | 0.0012ms | PASS | regressed — gate 無効 (regressionGate=false) |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.04ms | 0.06ms | 200ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| kdf_password_batch (5 pbkdf2 derive+verify) | 0.93ms | 1.06ms | 1000ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.04ms | 0.06ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 1.17ms | 1.36ms | 500ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.44ms | 200ms | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.35ms | 400ms | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 3.74ms | 2000ms | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.16ms | 200ms | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 5.77ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | -20064 B | 0 B | 102400 B | yes | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | -4256 B | -32584 B | 102400 B | yes | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 712 B | 176 B | 102400 B | yes | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 712 B | -27404 B | 102400 B | yes | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | -8960 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### auth_token_workflow (10 sign+verify+hash)

# Perf Report — auth_token_workflow (10 sign+verify+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.10ms |
| p50 | 0.12ms |
| p95 | 0.14ms |
| p99 | 0.17ms |
| mean | 0.12ms |
| stdev | 0.02ms |
| min | 0.09ms |
| max | 0.18ms |
| total | 2.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.08ms | +0.03ms | +38.36% |
| p50 | 0.12ms | 0.11ms | +0.01ms | +10.64% |
| p95 | 0.14ms | 0.25ms | -0.11ms | -43.03% |
| p99 | 0.17ms | 0.33ms | -0.16ms | -47.71% |
| mean | 0.12ms | 0.13ms | -0.0077ms | -5.96% |
| min | 0.09ms | 0.07ms | +0.02ms | +32.68% |
| max | 0.18ms | 0.35ms | -0.17ms | -48.52% |
| total | 2.42ms | 2.58ms | -0.15ms | -5.96% |

### data_encryption_batch (5 aes-gcm encrypt+decrypt+hash)

# Perf Report — data_encryption_batch (5 aes-gcm encrypt+decrypt+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.06ms |
| mean | 0.05ms |
| stdev | 0.0057ms |
| min | 0.04ms |
| max | 0.06ms |
| total | 0.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.0064ms | +17.45% |
| p50 | 0.05ms | 0.04ms | +0.0022ms | +5.01% |
| p95 | 0.06ms | 0.06ms | -0.0050ms | -8.26% |
| p99 | 0.06ms | 0.06ms | +0.00056ms | +0.91% |
| mean | 0.05ms | 0.04ms | +0.0032ms | +7.08% |
| min | 0.04ms | 0.04ms | +0.0059ms | +16.24% |
| max | 0.06ms | 0.06ms | +0.0020ms | +3.17% |
| total | 0.96ms | 0.90ms | +0.06ms | +7.08% |

### kdf_password_batch (5 pbkdf2 derive+verify)

# Perf Report — kdf_password_batch (5 pbkdf2 derive+verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.93ms |
| p50 | 0.94ms |
| p95 | 1.06ms |
| p99 | 2.09ms |
| mean | 1.01ms |
| stdev | 0.31ms |
| min | 0.92ms |
| max | 2.34ms |
| total | 20.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.93ms | 0.82ms | +0.11ms | +12.93% |
| p50 | 0.94ms | 0.83ms | +0.11ms | +12.95% |
| p95 | 1.06ms | 1.02ms | +0.04ms | +4.20% |
| p99 | 2.09ms | 1.09ms | +1.00ms | +92.42% |
| mean | 1.01ms | 0.86ms | +0.15ms | +17.11% |
| min | 0.92ms | 0.81ms | +0.11ms | +14.16% |
| max | 2.34ms | 1.10ms | +1.24ms | +112.83% |
| total | 20.25ms | 17.30ms | +2.96ms | +17.11% |

### stream_cipher_batch (5 chacha20 encrypt+decrypt)

# Perf Report — stream_cipher_batch (5 chacha20 encrypt+decrypt).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.20ms |
| mean | 0.05ms |
| stdev | 0.04ms |
| min | 0.04ms |
| max | 0.23ms |
| total | 0.99ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.03ms | +0.0049ms | +15.35% |
| p50 | 0.04ms | 0.04ms | +0.0034ms | +9.65% |
| p95 | 0.06ms | 0.09ms | -0.03ms | -29.62% |
| p99 | 0.20ms | 0.18ms | +0.01ms | +7.68% |
| mean | 0.05ms | 0.05ms | +0.0017ms | +3.61% |
| min | 0.04ms | 0.03ms | +0.0050ms | +16.81% |
| max | 0.23ms | 0.21ms | +0.02ms | +11.56% |
| total | 0.99ms | 0.96ms | +0.03ms | +3.61% |

### ed25519_batch (5 sign+verify + 5 RSA sig error)

# Perf Report — ed25519_batch (5 sign+verify + 5 RSA sig error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 1.17ms |
| p50 | 1.19ms |
| p95 | 1.36ms |
| p99 | 1.36ms |
| mean | 1.23ms |
| stdev | 0.07ms |
| min | 1.15ms |
| max | 1.37ms |
| total | 24.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.17ms | 1.04ms | +0.13ms | +12.30% |
| p50 | 1.19ms | 1.18ms | +0.0091ms | +0.77% |
| p95 | 1.36ms | 1.45ms | -0.09ms | -6.41% |
| p99 | 1.36ms | 1.67ms | -0.31ms | -18.42% |
| mean | 1.23ms | 1.21ms | +0.02ms | +1.47% |
| min | 1.15ms | 1.04ms | +0.11ms | +10.24% |
| max | 1.37ms | 1.73ms | -0.36ms | -20.94% |
| total | 24.51ms | 24.16ms | +0.36ms | +1.47% |

