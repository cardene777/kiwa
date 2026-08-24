---
name: kiwa-auth
description: |
  /kiwa-design (Layer 1) が出力した `tests/spec/integration/test-spec-{module}.auth.md` を入力に、 `@kiwa-lab/auth` を使う `test/*.auth.test.ts` を Write して `vitest` で動作確認する Layer 2 auth test skill。
  11 観点 (正常系 / 異常系 / 境界値 / 状態遷移 / 権限 / 入力バリデーション / 冪等性 / 並行処理 / 性能 / セキュリティ / 回帰) を 5 provider (`setupNextAuthEnv` NextAuth v5 / `setupLuciaEnv` Lucia v3 / `setupBetterAuthEnv` Better Auth / `setupClerkEnv` Clerk / `setupAuth0Env` Auth0) に変換し、 session mock + OAuth provider mock + email/password + magic link + 2FA + passkey + organizations + Clerk orgs + Auth0 tenant + rules + Management API mock の sub-feature を 1 spec で cover する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-auth — Layer 2 auth test skill

`/kiwa-design` (Layer 1) の `--layer auth` 出力を `test/*.auth.test.ts` に変換し、 `vitest` で動作確認する。 NextAuth v5 (Auth.js) / Lucia v3 / Better Auth の 3 backend を統一 surface で cover する Layer 2 skill。

`@kiwa-lab/auth` v0.1 (v1.8-1〜v1.8-3、 Issue #637 / #638 / #639) の 3 factory (`setupNextAuthEnv` / `setupLuciaEnv` / `setupBetterAuthEnv`) を Layer 1 spec の観点別 TC 表から自動的に選択し、 session mock + provider mock + database adapter mock を組み立てる。

## 前提

- `@kiwa-lab/auth` v0.1.0+ が devDependency に入っている (`pnpm add -D @kiwa-lab/auth`)
- 対象の auth backend (NextAuth v5 / Lucia v3 / Better Auth) が peer dependency として入っている、 または backend 未指定なら 3 backend 全て試行
- Layer 1 spec (`tests/spec/integration/test-spec-{module}.auth.md`) が存在

## ユーザーのリクエスト

$ARGUMENTS

## オプション

- `--module {name}` — Layer 1 spec の module 名。 path は § 入力 spec の path は CLI から受け取る で解決する
- `--project-root {path}` — 生成先 (`{example}/...`) の起点。 `kiwa layers --project-root` にそのまま渡す (省略時は cwd)
- `--spec-path {path}` — Layer 1 spec の path を明示 (`--module` の代替)
- `--provider {nextauth|lucia|better-auth|clerk|auth0|all}` — 生成対象 provider (default `all`、 v1.9-1/-2 で `clerk` / `auth0` 追加、 5 provider 全てを 1 test file で cover)
- `--output {path}` — test file 出力先 (default `tests/{module}.auth.test.ts`)
- `--lang {ja|en|<ISO 639-1>}` — spec の言語と report の生成言語 (省略時は起動元が渡した値、 単体起動なら `ja`)
- `--no-run` — `vitest` 実行を skip (Write のみ)
- `--no-review` — Step 4 の kiwa-review 自動呼出 (test-review) を skip (CI / 自動化用)

### 入力 spec の path は CLI から受け取る

`--spec-path` を省略した時、 **自前で組み立てず `kiwa layers` に訊く**。 本 skill が扱う layer は `auth` の 1 つ。

```bash
pnpm exec kiwa layers --json --layer auth --lang "$DOC_LANG" --module "$MODULE" \
  --project-root "$PROJECT_ROOT"
```

返る `spec_path` は言語と module 名まで解決済 (`packages/cli/src/detect/layers.ts` の `withLangSuffix` / `withModule`)。 skill 側で `sed` を挟まない = module 名に separator が入ると path が spec directory の外を指す (`test-spec-../../etc/passwd.ui.md` を実測)。 CLI が `[a-z0-9-]` 1-32 字を強制して弾く。

`$DOC_LANG` は skill 引数の `--lang`。 **`LANG` を使わない** = shell の locale 変数で `ja_JP.UTF-8` 等が入っており、 CLI が ISO 639-1 でないとして拒否する。 `--lang` 省略時の既定は起動元が渡した値、 単体起動なら `ja`。

`$MODULE` は skill 引数の `--module`。 必須で、 推測しない。

`$PROJECT_ROOT` は skill 引数の `--project-root` (省略時は `.`)。 **返る `spec_path` はこれを起点にする**ため、 省くと example 配下の spec を repo root から探すことになる。

#### 2 つの path は起点が違う

**`spec_path` は `--project-root` 起点、 `test_paths.files` は cwd 起点**。 同じ応答の中で基準が分かれているので、 同列に「返った値を Read する」 と読むと spec だけ外す。

| field | 起点 | Read する時 |
|---|---|---|
| `spec_path` | `--project-root` (省略時は cwd) | `$PROJECT_ROOT` を前置して開く |
| `test_paths.patterns` / `test_paths.files` | cwd | そのまま開く |

CLI 側は `spec_path` に lang と module しか差し込まず (`applyLang`)、 `test_paths` だけ `relativeTo(cwd, join(projectRoot, …))` で cwd 基準に直している。 宣言の出所が `docs/layers.json` と生成先で違うためで、 揃える先は skill ではなく CLI にあるが、 **読む側が起点を知らないまま使うと必ず外す** (`skills/kiwa-review/SKILL.md` § 2 つの path は起点が違う SSOT)。

実測 (cwd = repo root、 `examples/cli-poc` の `cli` layer)。 応答は下の検証表を全行 pass するが、 そのまま `spec_path` を開くと `No such file or directory` になる。


`--provider` は spec の中身の選択で、 path には影響しない。 5 provider は 1 つの `auth` layer が持つ選択肢で、 spec は provider ごとに分かれない。

#### 解決に失敗したら止める

**exit code を見る。 0 でなければ中断して user に返す**。 pipeline で握り潰すと、 空 path を Read しようとして「spec が無い」 と報告することになり、 本当の原因 (layer 名の誤り / 不正な module / CLI 未 install) が消える。

判定は **件数ではなく「必要な layer が取れたか」**で行う。 `--layer` を省くと 30 件返るので、 件数で判定すると全 layer を一度に解決する経路が「異常」 に落ちる。

**「読める」 と「期待した形をしている」 を分ける**。 JSON として parse できることは、 中身が使える形だと言っていない。

| 結果 | 扱い |
|---|---|
| exit != 0 | stderr をそのまま user に返して中断 |
| stdout が JSON として読めない | 中断 (CLI 未 install / 別 command の出力) |
| `layers` が配列でない | 中断 (応答が壊れている) |
| 必要な `id` が `layers` に無い | layer 名が誤り。 中断 |
| 同じ `id` が 2 件以上ある | どちらを使うか決められない。 中断 |
| その layer の `spec_path` が文字列でない、 または空 | spec を持たないか応答が壊れている。 中断 |
| `spec_path` に `{module}` が残っている | `--module` が効いていない。 中断 |
| `$PROJECT_ROOT` を前置した path に file が無い | spec が未生成か `--project-root` が誤り。 **開いた path をそのまま添えて中断** |
| 上記いずれでもない | その `spec_path` を `$PROJECT_ROOT` 起点で開く |

「解決先に file が無い」 行を置くのは、 **上の全行を pass した応答でも Read が落ちる**から。 検査が「応答の形」 までで止まっていると、 起点違いも spec 未生成も同じ「spec が無い」 に潰れる。

`.layers[] | select(.id == "<layer>")` で先に絞ってから、 取れた 1 件を見る。

`jq` が無い環境では `--json` の出力をそのまま読む。 `jq` は整形の手段であって、 解決の一部ではない。

#### 解決した値を下流に渡す

Step の最後で `/kiwa-review` を呼ぶ時、 **同じ layer と同じ `--lang` を渡す**。 渡さないと review が別の spec を読み、 生成した test と突き合わせる相手が変わる。

自前で suffix を組むと 2 経路になり、 CLI 側の規約が変わった時に取り残される。 `--lang ja` を付けると Layer 1 が書いた file を Layer 2 が探せなかったのがこの形 (#1855 / #1861)。

本 SKILL.md 内の spec path 表記は説明のための例示で、 解決の指示ではない。

## 実行フロー

### Step 0: 文書生成言語の決定 (skill 起動時 1 回)

`--lang` が渡っていればそれを使う。 渡っていなければ **起動元が渡した値、 単体起動なら `ja`** を既定にする (option 宣言と同じ規則)。

`/kiwa-app` から起動される経路では常に値が渡るため、 尋ねる契機は単体起動に限られる。 その場合も既定があるので **AskUserQuestion は出さない** = 既定が決まっている問いを毎回聞くと chain が止まる。

### Step 1: Layer 1 spec 読込 + provider / flow 判定

`--spec-path` が渡っていればその path、 無ければ § 入力 spec の path は CLI から受け取る で解決した path を Read、 各 TC の `Provider` + `Flow` column (列の定義は `/kiwa-design` の § `#### auth layer 専用 column`) から 5 provider のどれを、 どの認証 flow で組み立てるか判定する。 `Provider` 未指定の TC は `--provider` の既定に従う。

**`backend` ではなく `provider` と呼ぶ**。 `docs/layers.json` の `providers` 宣言と `--provider` flag と `selected_by` の 3 箇所が `provider` で揃っているため、 呼び分けると spec の書き手がどちらを書くか迷う (#2067)。

#### Provider / Flow mapping

| Provider | Flow | helper への mapping |
|---|---|---|
| `nextauth` | `email` / `google` / `github` | `setupNextAuthEnv({ providers: [flow] })` + `env.signIn(flow, input)` |
| `lucia` | `password` | `setupLuciaEnv()` + `env.signUpWithPassword` / `env.signInWithPassword` |
| `lucia` | `google` / `github` | `setupLuciaEnv({ providers: [flow] })` + `env.signInWithOAuth(flow, input)` |
| `better-auth` | `password` / `magic-link` / `two-factor` / `passkey` / `organization` | 順に `emailAndPassword` / `magicLink` / `twoFactor` / `passkey` / `organizations` を `plugins` に渡し、 flow に対応する env method を呼ぶ |
| `better-auth` | `google` / `github` | `setupBetterAuthEnv({ providers: [flow] })` + `env.signInWithOAuth(flow, input)` |
| `clerk` | `session` / `external-account` / `organization` | `setupClerkEnv` の `tokens` / `users[].externalAccounts` / `orgs` に Given を変換し、 `env.signIn` または各 resource API を呼ぶ |
| `auth0` | `password` / `google` / `github` | `setupAuth0Env` の user connection を順に `Username-Password-Authentication` / `google-oauth2` / `github` へ変換し、 `env.authenticate` を呼ぶ |
| `auth0` | `rules` / `actions` / `management-api` | `setupAuth0Env({ rules, actions })` または `env.users` の Management API surface に変換する |

### Step 2: test code 生成

TC 表を describe / it に落とす。 各 TC で `setupNextAuthEnv` / `setupLuciaEnv` / `setupBetterAuthEnv` / `setupClerkEnv` / `setupAuth0Env` のうち該当 factory を呼び、 Provider / Flow mapping に従って操作と期待結果を `expect()` にマッピングする。

生成テンプレ (backend = NextAuth v5、 session mock を通したい TC の場合):

```ts
import { setupNextAuthEnv } from "@kiwa-lab/auth";
import { afterEach, describe, expect, it } from "vitest";

const envs: Array<{ stop(): Promise<void> }> = [];
afterEach(async () => {
  while (envs.length > 0) await envs.pop()!.stop();
});

describe("{module} — auth", () => {
  it("T-AUTH-001 authorises a valid session", async () => {
    const env = await setupNextAuthEnv({ providers: ["github"] });
    envs.push(env);
    const session = await env.signIn("github", { email: "alice@example.test" });
    expect(session.user.email).toBe("alice@example.test");
  });
});
```

### Step 3: vitest 実行

`pnpm vitest run {output_path}` で走らせる。 flaky 検出時は 3 回まで自動 rerun。

### Step 4: /kiwa-review test-review 自動呼出

`--no-review` 未指定なら `/kiwa-review --mode test-review --layer auth --module {module} --lang $DOC_LANG --producer kiwa-auth --project-root .` を chain 呼出。 `--producer` と `--project-root` は review 側が test file を `kiwa layers` に訊くために要る (#1902)。

## 完了条件

- test file が `{output}` に Write されている
- `vitest run` が exit 0
- kiwa-review test-review report が生成されている (`--no-review` 未指定時)
- 遅い test の上位を確認済 = `/kiwa-observe` の dashboard `Execution time` section (または runner の実行時間出力) を読み、遅い test に対処したか、対処しない理由を report に記録 (#2186)

## 他 kiwa skill との chain 連携

- 上流 ... `/kiwa-design --layer auth` (Layer 1 spec 生成)
- 下流 ... `/kiwa-review --mode test-review --layer auth` (test 品質 review)
- 統合 ... 無し。 `/kiwa-test` に `auth` の Step が無いため、 本 skill は単体起動する (#1809)

## 既存 test の再利用

Layer 1 (`/kiwa-design`) が仕様書に書く `## 既存 test との対応` を読み、 **`未覆` / `不明` の TC だけ** を書く。
`既覆 (候補)` の TC は候補として挙がった test を Read し、 TC の入力と期待を実際に走らせているかを確かめてから決める (名前の一致は中身の一致を意味しない)。
section を持たない仕様書は全 TC を `不明` として扱う。

既存 test file があればそこに追記し、 無ければ本 skill の既定出力先へ新規 Write する。
**既存 test の削除と期待値の書き換えは行わない**。

判定の読み方 / 追記先の決め方 / 禁止事項の全文は `.claude/skills/kiwa-design/references/existing-test-reuse.md` を Read する。

## 関連

- `@kiwa-lab/auth` v0.1 (v1.8-1〜v1.8-3、 Issue #637 / #638 / #639) SSOT
- `packages/auth/README.md` — 3 factory の API リファレンス
