---
title: "@kiwa-lab/lean v0.2 verify integration SSOT"
---

# @kiwa-lab/lean v0.2 verify integration SSOT

## What this covers

v2.14 で追加した `@kiwa-lab/lean` v0.1 spec generator を v0.2 で `verifyLeanSpec` 統合、 生成 Lean file を **実際に Lean toolchain で検証** する Level 2 layer 追加。 kiwa 全体 branding「testing + 形式検証」 の pipeline を完成、 systematic pattern 57 度目。

## Level 1 vs Level 2

| Layer | v0.1 | v0.2 |
|---|---|---|
| generateLeanSpec | ✅ Lean source 生成 | ✅ 変更 0 (shape preserving) |
| generateLakeProject | ✅ Lake scaffold 生成 | ✅ v0.3 で修正 (下記) |
| verifyLeanSpec | ❌ | ✅ 新規 = 実 toolchain 呼出 (`lean <file>`) |

## verifyLeanSpec API SSOT

```ts
verifyLeanSpec(specs: readonly LeanSpecOutput[], opts?: VerifyOptions): VerifyResult;
```

### 3 経路 (VerifyStatus)

| status | 発火条件 |
|---|---|
| `ok` | Lean install 済 + 全 spec の elaboration 成功 |
| `verification-failed` | Lean install 済 + いずれかの spec の elaboration 失敗 (`diagnostics` に Lean の出力を添付) |
| `lean-not-installed` | Lean toolchain 未 install (throw なし return) |
| `skipped-by-env` | `KIWA_LEAN_SKIP_VERIFY=1` env or `opts.skip=true` |

### Lake project は何も建てていなかった (v0.3 で修正)

生成される `lakefile.lean` の `lean_lib` に `@[default_target]` が無く、 `lake build` は対象を 1 つも持たなかった。 spec に型エラーがあっても `Build completed successfully` と表示して 0 で終了する。 さらに根 module が spec を `import` せず、 `globs` も無いため、 仮に対象があっても spec file は 1 度もコンパイルされなかった。

v0.3 は `@[default_target]` と `globs := #[.andSubmodules \`<rootNamespace>]` を出し、 `modules` を渡すと根 module が各 spec を `import` する。 壊れた spec を置いて `lake build` が落ちることを test で固定した。

`verifyLeanSpec` は Lake project を書かない。 書いて `lake` を呼ばないのが v0.2 までの姿で、 `lakefile.lean` は何にも影響していなかった。 影響しているのは `lean-toolchain` だけで、 `elan` がこの file を作業 directory から読んで実行する Lean の版を決める。 生成 spec は何も `import` しないので、 検査に build system は要らない。

### 対応する Lean の版 (v0.3 で実測)

生成 source を v4.12.0 / v4.15.0 / v4.23.0 / v4.31.0 の 4 版で検証した。 4 版とも完全な表を受理し、 同じ壊れ方を拒否する。 診断の文言は版で変わる (`missing cases` → `Missing cases` が v4.23) ので、 test は Lean が echo し返す識別子で判定する。

`verifyLeanSpec` は既定で版を固定しない。 machine の Lean が検査する。 `leanToolchain` を渡した時だけ `lean-toolchain` を書き、 `elan` がその版を走らせる。

### 起動形と診断の出所 (v0.3 で修正)

Lean に `--check` flag は存在しない。 file を elaborate すること自体が検査で、 証明の失敗も網羅性の欠落も非零終了になる。 v0.2 は `lean --check <file>` を実行しており、 Lean は `unrecognized option` で常に非零終了していた。 つまり Lean が入っている環境では、 正しい spec も壊れた spec も等しく `verification-failed` を返していた。 toolchain を入れて実行する test が 1 件も無かったため、 誰も気付けなかった。

Lean は診断を **stdout** に書く。 `stderr` は空になる。 v0.2 の `VerifyResult.stderr` は常に空文字列で、 「検証に失敗した」 とだけ告げて理由を落としていた。 v0.3 は `diagnostics` に実際に喋った側の stream を載せる。

### 決定的 CI 動作

Lean toolchain 未 install 環境 (CI default / offline / sandbox) は `lean-not-installed` で throw なし return、 CI が Lean install を待つ必要なし。 `KIWA_LEAN_SKIP_VERIFY=1` で 明示 skip 可能、 test suite 決定性維持。

## 5 lifecycle-orchestrator の 2 軸融合仕様駆動開発 pipeline

```
OrchestratorSpec (SSOT)
    ├─► generateLeanSpec → Lean 4 source
    │       └─► verifyLeanSpec → lean <file> → { status: 'ok' }
    └─► TypeScript impl → vitest runtime testing
```

同 SSOT (5 state / 8 event / 40 セル) を 両層で駆動、 Lean 側で網羅性 (catch-all 不在の match) と定理 (`<state>_absorbing` / `<state>_has_exit`) を検査、 TS 側で 実行時挙動 verify。

## v2.15 milestone signal

- 60 milestone streak (v1.23-v2.15)
- 4 PR rhythm 14 milestone 目 (v2.1-v2.15)
- backward compat 絶対維持 23 milestone 連続 (v1.61-v2.15)
- systematic pattern 57 度目 = Lean toolchain 統合
- kiwa 全体 pipeline = testing + spec 生成 + spec 検証 の 3 段 完成
- @kiwa-lab org 42 package 維持 (lean 既存 の minor 拡張)
