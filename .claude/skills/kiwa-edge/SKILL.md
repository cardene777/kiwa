---
name: kiwa-edge
description: |
  Layer 1 spec (`tests/spec/integration/test-spec-{module}.edge.md`) を Edge runtime (Cloudflare Workers / Vercel Edge / 汎用 ESM fetch handler) の test (Vitest + @kiwa-lab/edge) に変換する Layer 2 skill。
  `fetch(request, env, ctx)` を `invokeEdgeHandler({ handler, url, method, headers, formData, jsonBody, env })` 経由で direct invoke、 env binding (KV / R2 / D1 / vars) を test ごとに seed、 ExecutionContext の `waitUntil` / `passThroughOnException` を捕捉する。
  KV namespace は `createKvNamespace(initial)` の純 JS mock を提供 (Miniflare / workerd 不要)、 R2 / D1 / DurableObject は test 側で必要に応じて mock 投入。
  `/kiwa-design --layer edge-handler` が出力する 9 column 表を `@kiwa-lab/edge` の API に機械的に変換する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-edge — Edge runtime fetch handler test 生成 (Layer 2)

`/kiwa-design --layer edge-handler` が出力した 9 column 表を、 `@kiwa-lab/edge` v1.0+ の `invokeEdgeHandler` を使った Vitest test に機械変換する。


## 前提

- Edge runtime project (Cloudflare Workers / Vercel Edge / etc) が存在
- Layer 1 spec が存在
- `@kiwa-lab/edge` v1.0+ install 済 (`pnpm add -D @kiwa-lab/edge`)
- vitest standard 開発環境
- 出力先 `tests/{module}.edge.test.ts` への Write 権限

## オプション

本 skill は `/kiwa-app` や `/kiwa-test` から起動される。 起動側は spec の場所と module 名を
渡す必要があるので、 受ける口をここで宣言する。

- `--module {name}` — spec / test file 名に入る module 名。 `--input-spec` を省略した時の path はこれを CLI に渡して解決する
- `--input-spec {path}` — Layer 1 spec の path (省略時は § 入力 spec の path は CLI から受け取る で解決)。 `/kiwa-design --layer edge-handler` が書く場所で、 `docs/layers.json` の `spec_path` がその宣言
- `--project-root {path}` — 生成先 (`{example}/...`) の起点。 `kiwa layers --project-root` にそのまま渡す (省略時は cwd)
- `--lang {ja|en|<ISO 639-1>}` — spec の言語 (省略時は起動元が渡した値、 単体起動なら `ja`)
- `--no-review` — 生成後の kiwa-review 自動呼出を skip (CI / 自動化用)

### 入力 spec の path は CLI から受け取る

`--input-spec` を省略した時、 **自前で組み立てず `kiwa layers` に訊く**。 本 skill が扱う layer は `edge-handler` の 1 つ。

```bash
pnpm exec kiwa layers --json --layer edge-handler --lang "$DOC_LANG" --module "$MODULE" \
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


Cloudflare Workers / Vercel Edge / 汎用 ESM fetch handler の違いは spec の中身に現れる選択で、 path には影響しない。 3 種とも同じ `edge-handler` layer の spec を読む。

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

`--no-review` 未指定なら、 生成後に `/kiwa-review --mode test-review --layer edge-handler --module {module} --lang $DOC_LANG --producer kiwa-edge --project-root .` を呼ぶ。 `--producer` と `--project-root` は review 側が test file を `kiwa layers` に訊くために要る (#1902)。

**同じ layer と同じ `--lang` を渡す**。 渡さないと review が別の spec を読み、 生成した test と突き合わせる相手が変わる。

自前で suffix を組むと 2 経路になり、 CLI 側の規約が変わった時に取り残される。 `--lang ja` を付けると Layer 1 が書いた file を Layer 2 が探せなかったのがこの形 (#1855 / #1861)。

本 SKILL.md 内の spec path 表記は説明のための例示で、 解決の指示ではない。

## 9 column 拡張表 (`/kiwa-design --layer edge-handler`)

| 項目 | 内容 |
|---|---|
| ID | `T-EDGE-001` 等の連番 |
| Observation | 観点 (正常 / GET / POST / KV read / KV write / waitUntil / redirect / 異常系 / passThroughOnException 等) |
| Given | URL + method + headers + body + env bindings seed (`{ MY_KV: createKvNamespace({...}), API_KEY: 'secret' }`) |
| Method | `GET` / `POST` / `PUT` / `DELETE` / `PATCH` |
| Then | 期待 (`response.status===200` / `await response.json()===...` / `ctx.waitedPromises.length===1` / `redirect.url==='/login'` / `await env.MY_KV.get('foo')==='bar'` 等) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Handler | 対象 edge handler の identifier (`export default` / `worker.fetch` 等) |
| Bindings | 使用 env binding (`KV: MY_KV` / `R2: BUCKET` / `D1: DB` / `var: API_KEY` 等) |

## test 生成 template

```ts
import { invokeEdgeHandler, createKvNamespace, type EdgeFetchHandler } from '@kiwa-lab/edge';
import worker from '../src/index.ts';

it('{ID} {Observation}', async () => {
  const kv = createKvNamespace({Given.kv 初期 entries});
  const { response, redirect, ctx, error } = await invokeEdgeHandler({
    handler: worker.fetch as EdgeFetchHandler,
    url: 'https://{Given.host}{Given.path}',
    method: '{Method}',
    headers: {Given.headers},
    formData: {Given.formData},  // or jsonBody
    env: {
      MY_KV: kv,
      ...{Given.env vars / bindings},
    },
  });
  {Then を expect(response.status).toBe(...) や expect(ctx.waitedPromises.length).toBe(N) に展開}
});
```

## 既存 test の再利用

Layer 1 (`/kiwa-design`) が仕様書に書く `## 既存 test との対応` を読み、 **`未覆` / `不明` の TC だけ** を書く。
`既覆 (候補)` の TC は候補として挙がった test を Read し、 TC の入力と期待を実際に走らせているかを確かめてから決める (名前の一致は中身の一致を意味しない)。
section を持たない仕様書は全 TC を `不明` として扱う。

既存 test file があればそこに追記し、 無ければ本 skill の既定出力先へ新規 Write する。
**既存 test の削除と期待値の書き換えは行わない**。

判定の読み方 / 追記先の決め方 / 禁止事項の全文は `.claude/skills/kiwa-design/references/existing-test-reuse.md` を Read する。

## 関連

- 上流 ... `/kiwa-design --layer edge-handler`
- runtime fixture ... `@kiwa-lab/edge` v1.0+ (`packages/edge/`)
- 下流 ... `/kiwa-review --layer edge-handler`
- Next.js Edge runtime ... `/kiwa-nextjs` (middleware mode) を併用

## Out of scope (本 v1.0 では未対応、 需要次第で別 Issue)

- R2 bucket binding mock (file blob 操作)
- D1 database binding mock (SQL execute)
- Durable Object binding mock (state coordination)
- Queue producer / consumer binding mock
- Service binding (other Worker calls)
- Hyperdrive binding

これらは test 側で `vi.fn()` 等で都度 mock 投入してください。
