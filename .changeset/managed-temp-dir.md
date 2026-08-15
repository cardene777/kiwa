---
"@kiwa-lab/core": minor
"@kiwa-lab/cli-test": minor
"@kiwa-lab/orm": patch
"@kiwa-lab/perf-harness": patch
"@kiwa-lab/lean": patch
"@kiwa-lab/dapp": patch
---

一時 dir を `createManagedTempDir` に一本化し、異常終了で残った分を次回起動時に回収する。

後始末は従来 `finally` と `dispose` にしかなく、crash / Ctrl-C / SIGKILL / OOM で終わると到達しなかった。
残った dir を消す経路が存在せず、利用者の `$TMPDIR` が単調増加していた。

回収は `kiwa-<label>-<createdAt>-<pid>-<random>` の形で作った dir だけを対象にする。
名前を読めない dir は自分たちが作った物ではないため触らない。
作成した process が生きている間は、閾値を超えていても残す。

`@kiwa-lab/cli-test` の `setupCliEnv` に `label` option を追加した。
既存の `prefix` は非推奨だが引き続き動く。
temp dir の basename の形が `<prefix><random>` から `kiwa-<label>-<createdAt>-<pid>-<random>` に変わるため、
`env.tempDir` を path として使う code は影響を受けないが、dir 名に一致させている code は影響を受ける。
