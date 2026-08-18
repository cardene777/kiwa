---
name: kiwa-cache
description: |
  /kiwa-design (Layer 1) が出力した `tests/spec/integration/test-spec-{module}.cache.md` を入力に、 `@kiwa-lab/cache` を使う `test/*.cache.test.ts` を Write して `vitest` で動作確認する Layer 2 cache test skill。
  11 観点 (正常系 / 異常系 / 境界値 / 状態遷移 / 権限 / 入力バリデーション / 冪等性 / 並行処理 / 性能 / セキュリティ / 回帰) を 3 provider (`setupCacheEnv` Redis / `setupMemcachedEnv` Memcached / `setupKeyDBEnv` KeyDB) × 2 backend (stub/in-memory + testcontainers) + client 選択 (ioredis / node-redis / memjs / memcached) に変換し、 get / set / delete / TTL / expiry / Pub/Sub / consistent-hash / multi-master の sub-feature を 1 spec で cover する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-cache — Layer 2 cache test skill

`/kiwa-design` (Layer 1) の `--layer cache` 出力を `test/*.cache.test.ts` に変換し、 `vitest` で動作確認する。 Redis (in-memory fake + testcontainers real) を統一 surface で cover する Layer 2 skill。

`@kiwa-lab/cache` v0.1 (v1.8-6、 Issue #642) の `setupCacheEnv` factory を Layer 1 spec の観点別 TC 表から自動的に選択し、 in-memory / testcontainers 2 backend + ioredis / node-redis 2 client を TC ごとに割当てる。

## 前提

- `@kiwa-lab/cache` v0.1.0+ が devDependency に入っている (`pnpm add -D @kiwa-lab/cache`)
- testcontainers mode 使用時は `testcontainers` + `ioredis` (default) または `redis` (node-redis) が peer dependency として入っている
- Layer 1 spec (`tests/spec/integration/test-spec-{module}.cache.md`) が存在

## ユーザーのリクエスト

$ARGUMENTS

## オプション

- `--module {name}` — Layer 1 spec の module 名。 path は § 入力 spec の path は CLI から受け取る で解決する
- `--spec-path {path}` — Layer 1 spec の path を明示 (`--module` の代替)
- `--provider {redis|memcached|keydb}` — cache provider 選択 (default `redis` = v1.8-6 setupCacheEnv、 v1.9-5 で `memcached`、 v1.9-6 で `keydb` 追加)
- `--mode {in-memory|stub|testcontainers|auto}` — backend 選択 (default `auto` = 高速 backend (Redis=in-memory、 Memcached/KeyDB=stub) を優先し、 spec が testcontainers を要求する TC のみ切替)
- `--client {ioredis|node-redis|memjs|memcached}` — testcontainers mode 時の client 選択 (default provider 依存 — redis/keydb=`ioredis`、 memcached=`memjs`)
- `--output {path}` — test file 出力先 (default `tests/{module}.cache.test.ts`)
- `--lang {ja|en|<ISO 639-1>}` — spec の言語と report の生成言語 (省略時は起動元が渡した値、 単体起動なら `ja`)
- `--no-run` — `vitest` 実行を skip (Write のみ)
- `--no-review` — Step 4 の kiwa-review 自動呼出 (test-review) を skip

### 入力 spec の path は CLI から受け取る

`--spec-path` を省略した時、 **自前で組み立てず `kiwa layers` に訊く**。 本 skill が扱う layer は `cache` の 1 つ。

```bash
pnpm exec kiwa layers --json --layer cache --lang "$DOC_LANG" --module "$MODULE"
```

返る `spec_path` は言語と module 名まで解決済 (`packages/cli/src/detect/layers.ts` の `withLangSuffix` / `withModule`)。 skill 側で `sed` を挟まない = module 名に separator が入ると path が spec directory の外を指す (`test-spec-../../etc/passwd.ui.md` を実測)。 CLI が `[a-z0-9-]` 1-32 字を強制して弾く。

`$DOC_LANG` は skill 引数の `--lang`。 **`LANG` を使わない** = shell の locale 変数で `ja_JP.UTF-8` 等が入っており、 CLI が ISO 639-1 でないとして拒否する。 `--lang` 省略時の既定は起動元が渡した値、 単体起動なら `ja`。

`$MODULE` は skill 引数の `--module`。 必須で、 推測しない。

`--provider` / `--mode` / `--client` は spec の中身の選択で、 path には影響しない。 3 provider は 1 つの `cache` layer が持つ選択肢で、 spec は provider ごとに分かれない。

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
| 上記いずれでもない | その `spec_path` を使う |

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

### Step 1: Layer 1 spec 読込 + provider / backend / client 判定

`--spec-path` が渡っていればその path、 無ければ § 入力 spec の path は CLI から受け取る で解決した path を Read、 各 TC の 「対象 provider」 (v1.9-6 追加) + 「対象 mode」 + 「対象 client」 column から `redis` vs `memcached` vs `keydb`、 fast backend (Redis=in-memory、 Memcached/KeyDB=stub) vs testcontainers、 client 選択を判定。

### Step 2: test code 生成 (provider 別 factory)

TC 表を describe / it に落とす。 provider ごとに使う factory が違う。

- **`--provider redis`** ... `setupCacheEnv` を呼び、 `env.set` / `env.get` / `env.assertTTL` / `env.subscribe` / `env.publish` / `env.assertPublished` を観点別に組合わせる (v1.8-6)。
- **`--provider memcached`** ... `setupMemcachedEnv` を呼び、 8 core command (get / set / delete / add / replace / increment / decrement / flush) + `env.assertTTL` + `env.serverFor` (consistent hashing) を組合わせる (v1.9-5)。
- **`--provider keydb`** ... `setupKeyDBEnv` を呼び、 Redis 互換 surface + multi-master (`{ master }` option) + Pub/Sub cross-region を組合わせる (v1.9-6)。

生成テンプレ (mode = in-memory、 TTL 検証 TC):

```ts
import { setupCacheEnv } from "@kiwa-lab/cache";
import { afterEach, describe, expect, it } from "vitest";

const envs: Array<{ stop(): Promise<void> }> = [];
afterEach(async () => {
  while (envs.length > 0) await envs.pop()!.stop();
});

describe("{module} — cache TTL", () => {
  it("T-CACHE-001 attaches a 60s TTL to a session key", async () => {
    const env = await setupCacheEnv();
    envs.push(env);
    await env.set("session:1", "user-1", { ttlSeconds: 60 });
    await env.assertTTL("session:1", { atLeast: 59, atMost: 60 });
  });
});
```

生成テンプレ (mode = in-memory、 Pub/Sub 検証 TC):

```ts
describe("{module} — cache pub/sub", () => {
  it("T-CACHE-002 delivers an invalidation event to a subscriber", async () => {
    const env = await setupCacheEnv();
    envs.push(env);
    const sub = await env.subscribe("session.invalidated");
    await env.publish("session.invalidated", '{"sessionId":"sess-1"}');
    const msg = await sub.next();
    expect(msg.message).toContain("sess-1");
    await sub.close();
  });
});
```

### Step 3: vitest 実行

`pnpm vitest run {output_path}` で走らせる。 testcontainers mode は Docker 起動時間を含めた 60s timeout を採用する。

### Step 4: /kiwa-review test-review 自動呼出

`--no-review` 未指定なら `/kiwa-review --mode test-review --layer cache --module {module} --lang $DOC_LANG --producer kiwa-cache --project-root .` を chain 呼出。 `--producer` と `--project-root` は review 側が test file を `kiwa layers` に訊くために要る (#1902)。

## 完了条件

- test file が `{output}` に Write されている
- `vitest run` が exit 0
- kiwa-review test-review report が生成されている (`--no-review` 未指定時)

## 他 kiwa skill との chain 連携

- 上流 ... `/kiwa-design --layer cache` (Layer 1 spec 生成)
- 下流 ... `/kiwa-review --mode test-review --layer cache` (test 品質 review)
- 統合 ... 無し。 `/kiwa-test` に `cache` の Step が無いため、 本 skill は単体起動する (#1809)

## 既存 test の再利用

Layer 1 (`/kiwa-design`) が仕様書に書く `## 既存 test との対応` を読み、 **`未覆` / `不明` の TC だけ** を書く。
`既覆 (候補)` の TC は候補として挙がった test を Read し、 TC の入力と期待を実際に走らせているかを確かめてから決める (名前の一致は中身の一致を意味しない)。
section を持たない仕様書は全 TC を `不明` として扱う。

既存 test file があればそこに追記し、 無ければ本 skill の既定出力先へ新規 Write する。
**既存 test の削除と期待値の書き換えは行わない**。

判定の読み方 / 追記先の決め方 / 禁止事項の全文は `.claude/skills/kiwa-design/references/existing-test-reuse.md` を Read する。

## 関連

- `@kiwa-lab/cache` v0.1 (v1.8-6、 Issue #642) SSOT
- `packages/cache/README.md` — API リファレンス
- `examples/cache-redis-poc/` — 実 test 例 (signup session 8 test)
