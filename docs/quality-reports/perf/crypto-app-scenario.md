# Perf Suite — crypto-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.07ms | 0.17ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.04ms | 0.05ms | 200ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| kdf_password_batch (5 pbkdf2 derive+verify) | 0.85ms | 0.93ms | 1000ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.03ms | 0.05ms | 100ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 1.01ms | 1.35ms | 500ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | cpu | 0.08ms | 0.09ms | 0.07ms | 0.902 | 0.928 | 0.07ms | 0.08ms |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | cpu | 0.08ms | 0.09ms | 0.04ms | 0.438 | 0.449 | 0.04ms | 0.04ms |
| kdf_password_batch (5 pbkdf2 derive+verify) | cpu | 0.08ms | 0.11ms | 0.85ms | 10.142 | 9.793 | 0.84ms | 0.81ms |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | cpu | 0.09ms | 0.10ms | 0.03ms | 0.370 | 0.377 | 0.03ms | 0.03ms |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | cpu | 0.08ms | 0.11ms | 1.01ms | 12.472 | 12.596 | 1.01ms | 1.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.31ms | 200ms | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.19ms | 400ms | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 3.81ms | 2000ms | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.17ms | 200ms | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 4.92ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | -19944 B | 0 B | 102400 B | yes | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | -5584 B | 6000 B | 102400 B | yes | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 744 B | -8352 B | 102400 B | yes | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 648 B | -11888 B | 102400 B | yes | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | -8928 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### auth_token_workflow (10 sign+verify+hash)

# Perf Report — auth_token_workflow (10 sign+verify+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.07ms |
| p50 | 0.09ms |
| p95 | 0.17ms |
| p99 | 0.19ms |
| mean | 0.10ms |
| stdev | 0.03ms |
| min | 0.07ms |
| max | 0.20ms |
| total | 1.96ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.996)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.07ms | 0.08ms | -0.0021ms | -2.80% |
| p50 | 0.09ms | 0.10ms | -0.0080ms | -8.35% |
| p95 | 0.17ms | 0.17ms | +0.0045ms | +2.64% |
| p99 | 0.19ms | 0.25ms | -0.06ms | -25.18% |
| mean | 0.10ms | 0.11ms | -0.0077ms | -7.29% |
| min | 0.07ms | 0.07ms | +0.00031ms | +0.44% |
| max | 0.20ms | 0.28ms | -0.08ms | -29.42% |
| total | 1.95ms | 2.11ms | -0.15ms | -7.29% |

### data_encryption_batch (5 aes-gcm encrypt+decrypt+hash)

# Perf Report — data_encryption_batch (5 aes-gcm encrypt+decrypt+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.0039ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.81ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.978)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.00085ms | -2.33% |
| p50 | 0.04ms | 0.04ms | -0.00042ms | -1.07% |
| p95 | 0.04ms | 0.05ms | -0.0036ms | -7.51% |
| p99 | 0.05ms | 0.05ms | -0.0022ms | -4.26% |
| mean | 0.04ms | 0.04ms | -0.00065ms | -1.61% |
| min | 0.03ms | 0.04ms | -0.00095ms | -2.67% |
| max | 0.05ms | 0.05ms | -0.0018ms | -3.49% |
| total | 0.79ms | 0.81ms | -0.01ms | -1.61% |

### kdf_password_batch (5 pbkdf2 derive+verify)

# Perf Report — kdf_password_batch (5 pbkdf2 derive+verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.85ms |
| p50 | 0.89ms |
| p95 | 0.93ms |
| p99 | 0.96ms |
| mean | 0.89ms |
| stdev | 0.04ms |
| min | 0.82ms |
| max | 0.96ms |
| total | 17.75ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.997)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.84ms | 0.81ms | +0.03ms | +3.56% |
| p50 | 0.89ms | 0.89ms | +0.00060ms | +0.07% |
| p95 | 0.93ms | 1.26ms | -0.33ms | -26.50% |
| p99 | 0.95ms | 1.36ms | -0.40ms | -29.69% |
| mean | 0.88ms | 0.96ms | -0.07ms | -7.59% |
| min | 0.81ms | 0.80ms | +0.01ms | +1.79% |
| max | 0.96ms | 1.38ms | -0.42ms | -30.42% |
| total | 17.69ms | 19.14ms | -1.45ms | -7.59% |

### stream_cipher_batch (5 chacha20 encrypt+decrypt)

# Perf Report — stream_cipher_batch (5 chacha20 encrypt+decrypt).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.08ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.09ms |
| total | 0.82ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.874)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00061ms | -1.97% |
| p50 | 0.03ms | 0.04ms | -0.0021ms | -6.12% |
| p95 | 0.05ms | 0.09ms | -0.05ms | -49.76% |
| p99 | 0.07ms | 0.11ms | -0.04ms | -35.10% |
| mean | 0.04ms | 0.04ms | -0.0062ms | -14.69% |
| min | 0.03ms | 0.03ms | -0.00036ms | -1.20% |
| max | 0.08ms | 0.11ms | -0.04ms | -32.16% |
| total | 0.72ms | 0.84ms | -0.12ms | -14.69% |

### ed25519_batch (5 sign+verify + 5 RSA sig error)

# Perf Report — ed25519_batch (5 sign+verify + 5 RSA sig error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 1.01ms |
| p50 | 1.07ms |
| p95 | 1.35ms |
| p99 | 1.40ms |
| mean | 1.13ms |
| stdev | 0.13ms |
| min | 0.99ms |
| max | 1.41ms |
| total | 22.64ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.998)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.01ms | 1.02ms | -0.01ms | -0.98% |
| p50 | 1.07ms | 1.06ms | +0.0080ms | +0.75% |
| p95 | 1.35ms | 1.20ms | +0.15ms | +12.69% |
| p99 | 1.40ms | 1.22ms | +0.18ms | +14.81% |
| mean | 1.13ms | 1.09ms | +0.04ms | +3.56% |
| min | 0.99ms | 1.00ms | -0.0097ms | -0.97% |
| max | 1.41ms | 1.22ms | +0.19ms | +15.34% |
| total | 22.60ms | 21.82ms | +0.78ms | +3.56% |

