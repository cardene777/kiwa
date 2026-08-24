---
name: kiwa-nextjs
description: |
  Layer 1 spec (`tests/spec/integration/test-spec-{module}.nextjs.md` / `.middleware.md` / `.rsc.md` / `.parallel.md`) を Next.js App Router の 4 mode (Server Actions + middleware + RSC + Parallel Routes + Intercepting Routes) test (Vitest + @kiwa-lab/nextjs) に変換する Layer 2 skill。
  Server Actions (`'use server'`) は `invokeServerAction` で direct invoke、 middleware は `invokeMiddleware` で simulated request 経由で捕捉、 RSC は `renderServerComponent` で async server component を await + element tree を `findAll` / `textContent` で検証、 Parallel Routes は `invokeParallelRoutes` で全 slot 並列 await + per-slot error isolation + Intercepting variant 切替を捕捉、 全 mode で redirect / not-found / forbidden の throw signal も捕捉する。
  `/kiwa-design --layer nextjs-server-action` / `--layer nextjs-middleware` / `--layer nextjs-rsc` / `--layer nextjs-parallel-route` が出力する 9 column 表を `@kiwa-lab/nextjs` v1.0.4+ の API に機械的に変換する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-nextjs — Next.js Server Actions + middleware test 生成 (Layer 2)

`/kiwa-design --layer nextjs-server-action` または `/kiwa-design --layer nextjs-middleware` が出力した 9 column 表を、 `@kiwa-lab/nextjs` v1.0+ の `invokeServerAction` / `invokeMiddleware` を使った Vitest test に機械変換する。

対象は以下 5 mode ...

- **Server Actions** (`'use server'` directive) ... `--layer nextjs-server-action`、 `tests/spec/integration/test-spec-{module}.nextjs.md`
- **middleware.ts** ... `--layer nextjs-middleware` (Issue #495)、 `tests/spec/integration/test-spec-{module}.middleware.md`
- **React Server Components (RSC)** ... `--layer nextjs-rsc` (Issue #494、 v1.0.3+)、 `tests/spec/integration/test-spec-{module}.rsc.md`
- **Parallel Routes + Intercepting Routes** ... `--layer nextjs-parallel-route` (Issue #523、 v1.0.4+)、 `tests/spec/integration/test-spec-{module}.parallel.md`
- **RSC streaming + Suspense boundary** ... `--layer nextjs-rsc-streaming` (Issue #558、 v1.1+)、 `tests/spec/integration/test-spec-{module}.rsc-streaming.md`

## 前提

- 対象 example / project に Next.js App Router が存在 (`app/` directory)
- Layer 1 spec (`tests/spec/integration/test-spec-{module}.nextjs.md`) が存在 (`/kiwa-design --layer nextjs-server-action` で生成)
- `@kiwa-lab/nextjs` v1.0+ が install 済 (`pnpm add -D @kiwa-lab/nextjs`)
- vitest + tsx + typescript の standard 開発環境

## オプション

- `--module {name}` — spec / test の module 名キー (1 起動 = 1 module)
- `--input-spec {path}` — Layer 1 spec の path (省略時は下記 § 入力 spec の path は CLI から受け取る で解決)
- `--project-root {path}` — 生成先 (`{example}/...`) の起点。 `kiwa layers --project-root` にそのまま渡す (省略時は cwd)
- `--output {path}` — 生成 test の path (省略時は `tests/integration/{module}.nextjs.test.ts`)

### mode 別の生成先

`--output` 省略時の生成先は layer ごとに違う。 入力 spec の suffix をそのまま写した形で、
5 mode を 1 file に上書きしないための分離。

| layer | 入力 spec の suffix | 生成 test |
|---|---|---|
| `nextjs-server-action` | `.nextjs.md` | `tests/integration/{module}.nextjs.test.ts` |
| `nextjs-middleware` | `.middleware.md` | `tests/integration/{module}.middleware.test.ts` |
| `nextjs-rsc` | `.rsc.md` | `tests/integration/{module}.rsc.test.ts` |
| `nextjs-parallel-route` | `.parallel.md` | `tests/integration/{module}.parallel.test.ts` |
| `nextjs-rsc-streaming` | `.rsc-streaming.md` | `tests/integration/{module}.rsc-streaming.test.ts` |

以前は 5 layer とも `{module}.nextjs.test.ts` に書いており、 順に起動すると最後の 1 つしか
残らなかった。 入力は suffix で分かれているのに出力が分かれていない形だった。
- `--lang {ja|en|<ISO 639-1>}` — 生成 test 内コメント言語 (省略時は起動元が渡した値、 単体起動なら `ja`)
- `--no-review` — Step 6 の `/kiwa-review` 自動呼出を skip

### 入力 spec の path は CLI から受け取る

`--input-spec` を省略した時、 **自前で組み立てず `kiwa layers` に訊く**。 本 skill は 5 mode = 5 layer を扱うので、 **どの mode で起動されたかが layer を決める**。

| mode | layer |
|---|---|
| Server Actions | `nextjs-server-action` |
| middleware | `nextjs-middleware` |
| RSC | `nextjs-rsc` |
| Parallel Routes | `nextjs-parallel-route` |
| RSC streaming | `nextjs-rsc-streaming` |

```bash
pnpm exec kiwa layers --json --layer "$LAYER" --lang "$DOC_LANG" --module "$MODULE" \
  --project-root "$PROJECT_ROOT"
```

`$LAYER` は起動元 (`/kiwa-app` 等) が指定した mode から決まる。 **単体起動で判らない時は user に確認する**。 推測で 1 つ目を選ぶと、 別 mode の spec を読んで別 helper 向けの test を生成する。

5 mode を順に回す時は `--layer` を省けば全 layer が 1 回で返る。 `.layers[] | select(.id == "...")`
で必要なものを取り出す。

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

### Step 1: Layer 1 spec の読込 + 9 column 表 parse

§ 入力 spec の path は CLI から受け取る で解決した path を Read し、 「テストケース一覧」 section の 9 column 表を行単位で配列に展開する。

期待する 9 column (`/kiwa-design --layer nextjs-server-action` の SSOT):

列の定義は `/kiwa-design` が持つ (`.claude/skills/kiwa-design/SKILL.md` §
`#### nextjs-server-action layer 専用 column`)。 **ここに写しを置かない** = 写しは片方だけ
直った時に気付けない。

### Step 2: action の依存を 2 軸で確認する

対象 Server Action の export を探す。 **path を推測せず project 全体を走査する**。

```bash
find . \
  \( -type d \( -name node_modules -o -name .git -o -name .next -o -name dist -o -name build -o -name coverage \) -prune \) -o \
  \( -type f \( -name '*.ts' -o -name '*.tsx' \) -print0 \) |
  xargs -0 grep -nHE "^[[:space:]]*(export[[:space:]]+(default[[:space:]]+)?async[[:space:]]+function|['\"]use server['\"])"
```

置き場所は project ごとに違う。 `app/actions.ts` / `lib/actions/*.ts` を挙げるだけでは
**`src/` に置く project を 1 件も拾えない** (実測 = `examples/nextjs-server-actions-poc` の
action は `src/login-action.ts`)。 `/kiwa-design` Step 2 と同じ走査形にして、 file:行番号 つきで
候補を出す。 `node_modules` と生成物は候補に混ぜず、 件数で打ち切らない。先頭だけに絞ると、
生成 file や別 action が多い project で対象 action が候補から消える。

確認するのは 2 軸で、 **止める軸と seed する軸が違う**。

| 軸 | 対象 | 未整備の時 |
|---|---|---|
| env seam | `redirect` / `cookies` / `revalidatePath` への依存 | **test 生成を中断する** |
| data seam | action が import する module 直下の可変 state | **生成は続け、 seed 経路を test に入れる** |

#### env seam (中断する軸)

redirect / cookies / revalidatePath への依存は **injectable seam (parameter / module setter)** で書き換える必要がある (production の `redirect()` import を直接 throw する形では unit test 不可)。

seam 未整備の action を検出したら test 生成を中断し、 user に「Server Action を `(formData, env?)` 形式に refactor が必要」 を返す。 詳細パターンは `references/server-action-seam.md` 参照。

#### data seam (seed する軸)

**本節は 5 mode 共通**。 helper が seed するのは自分の env だけで、 対象が読み書きする data 層はどの mode でも入らない。

| mode | helper | helper が seed するもの |
|---|---|---|
| Server Actions | `invokeServerAction` | `formData` / `args` / `cookies` / `headers` |
| middleware | `invokeMiddleware` | `url` / `method` / `headers` / `cookies` / `geo` |
| RSC | `renderServerComponent` | `props` |
| Parallel Routes | `invokeParallelRoutes` | `children` / `childrenProps` / `slots` |
| RSC streaming | `setupNextRscEnv` | `dataSource` / `suspenseFallback` / `props` |

seed しないと先行 case の書込が後続 case に残り、 重複検出 / 冪等性 / 状態遷移の TC が互いを倒す。

対象 (action / middleware / component / layout / dataSource) が import する module を辿り、 **module 直下の可変 state** を列挙する。 探す形は 4 つ。

| 形 | 例 |
|---|---|
| `let` 宣言 | `let current: User \| null = null` |
| `new Map` / `new Set` | `const store = new Map<string, User>()` |
| 配列リテラル | `const rows: Row[] = []` |
| 可変 object リテラル | `const cache: Record<string, T> = {}` |

```bash
# 候補を粗く拾う。 これは絞り込みであって判定ではない
grep -nE "^[[:space:]]*(export[[:space:]]+)?(let[[:space:]]|const[[:space:]])" lib/users.ts
```

**grep の結果で 0 件と決めない**。 上の regex は有効な TypeScript の一部しか拾えず、 実際に落ちる形がある。

| 落ちる形 | 例 |
|---|---|
| factory 経由 | `const pool = createPool()` (右辺が呼出) |
| 分割代入 | `const { cache } = makeDeps()` |
| class の static | `class Store { static rows = new Map() }` |
| 別名 re-export の先 | `export { store } from './inner'` |

候補を拾った後は **対象 file を Read して確かめる**。 判定材料は「top-level に束縛されているか」 と「その値が可変か」 の 2 点で、 宣言の書き方ではない。

##### 辿る範囲

import graph は無制限に辿らない。

| 項目 | 値 |
|---|---|
| 対象 | 相対 import と project の alias (`@/` 等) のみ。 `node_modules` は辿らない |
| 再訪防止 | 解決後の絶対 path で visited set を持つ (循環 import で止まらなくなる) |
| 上限 | 深さ 5 または file 50 件のいずれか先に達した方 |
| 上限に達した時 | **0 件ではなく「未確認」** として扱う |

`export { x } from './y'` の再 export と、 literal 引数の動的 import (`await import('./users')`) は辿る。 変数を渡す動的 import は解決できないため「未確認」 に落とす。

##### 判定は 3 値

**「無い」 と「確かめられなかった」 を分ける**。 混ぜると、 走査が途中で止まった app で seed が省かれる。

| 結果 | Step 3 の扱い |
|---|---|
| 1 件以上 | seed 経路を入れる |
| 0 件 (全 import を確認済) | seed 経路を入れない |
| 未確認 (上限到達 / 解決不能な import) | **seed 経路を入れ、 生成 test の冒頭に未確認だった旨を書く** |

0 件で seed を入れないのは、 無条件に mock を挟むと生成 test が実装を一切通らず「pass しているが何も検証していない」 状態になるため。 未確認を 0 件に倒すと、 その安全側の判断が裏返る。

##### seed の仕方は実装を通す方を優先する

| # | 選択 | 条件 |
|---|---|---|
| 1 | reset / seed の export を呼ぶ | module がそれを export している |
| 2 | `vi.resetModules()` + action を動的 import | export は無いが module が副作用を持たない |
| 3 | `vi.mock` で module ごと差し替える | 1 と 2 が使えない |

**3 は最後**。 module ごと差し替えると、 その module が担う検証 (重複判定 / 権限 / 一意性) が mock 側の実装を測るだけになり、 本番の欠陥を隠したまま security の TC が通る。

##### 差し替えた module に答えを預けた TC は生成しない

**本節は 5 mode 共通**。

差し替えた module が答えを持つ TC は、 mock を通した pass が **何も証明しない**。 通っているのは mock 側の実装で、 本番の欠陥はそこに現れない。

そういう TC は**生成しない**。 記録だけ残して生成すると、 緑の test が証拠として読まれる。 落ちようのない test は、 無い test より悪い。

###### 判定は script に委ねる

判定を散文で書くと、 適用したかどうかを誰も確かめられない。 **`scripts/decide-generation.mjs` を呼び、 出力の `generate` に従う**。

```bash
node .claude/skills/kiwa-nextjs/scripts/decide-generation.mjs '{
  "mockedExports": ["findUserByEmail", "createUser"],
  "passthroughExports": ["normaliseEmail"],
  "cases": [
    {"id": "T-001", "dependsOn": ["createUser"], "answeredBy": "action-branch"}
  ]
}'
```

`{ generated: [...], omitted: [...] }` が返る。 `omitted` がそのまま § 生成しなかった TC を返す の対象になる。

###### script に渡す前に決めること

判断が要るのは入力を作るところまで。 そこから先は機械的で、 判定の一貫性は script が持つ。

| 入力 | 決め方 |
|---|---|
| `mockedExports` | `vi.mock` の factory が値を返している export 名 |
| `passthroughExports` | factory が `importOriginal()` から素通ししている export 名 |
| `dependsOn` | TC の `Given` / `Then` が到達する export 名 |
| `answeredBy` | 下表の 4 値から 1 つ |

`answeredBy` は **`Then` の期待値を決めているのが誰か**を表す。

| 値 | 意味 | 例 |
|---|---|---|
| `mocked-export-logic` | 差し替えた export の実装そのものが決める | 大文字小文字を無視して重複を見つけるのは module の仕事 |
| `passthrough-export-logic` | 素通しした export の実装が決める。 本番実装をそのまま通る | 部分 mock で差し替えなかった正規化関数 |
| `action-branch` | action 自身の分岐が決める。 差し替えた export は入力を供給するだけ | 既存 row があった時に `already-registered` を返すのは action の分岐 |
| `seeded-env` | helper が seed した `cookies` / `headers` / `formData` / `args` が決める | 入力の検証で弾く |
| `unknown` | 決められない | |

**申告と依存が食い違う入力は script が例外で止める**。 `mocked-export-logic` を選びながら差し替えた export に届かない形と、 `passthrough-export-logic` を選びながら素通しした export に届かない形の 2 つ。 `dependsOn` の書き漏れか `answeredBy` の誤りのどちらかで、 どちらなのかは script に判らない。 生成可否に畳むと、 書き漏れただけで mock 依存の TC が生成される (前者) か、 mock を測る test が「本番実装を通る」 と記録される (後者)。

###### script が持つ規則

3 点あり、 いずれも散文で書いていた時に外していた。

**差し替えに届かない TC は生成する**。 部分 mock (`importOriginal()` で一部だけ差し替える形) で素通しした export しか触らない TC は、 実装をそのまま通る。 module 単位で落とすと過剰除外になる。

**`action-branch` と `seeded-env` は生成する**。 差し替えた export が入力を供給するだけなら、 test は action 側の振る舞いを測れる。 module 自身の正しさは測れないので、 その旨が `reason` に残る。

初版は「差し替えた module が答えを持つなら生成しない」 とだけ書いており、 action と module が共同で結果を作る TC が「決められない」 に落ちて大量に未生成になった。 正常系も状態遷移も store を通るので、 ほとんど残らない。

**`unknown` は生成しない**。 落ちない test が緑で残るより、 未生成として報告される方がよい。 誤りの向きが違う。

判定は **到達の有無より先に** `unknown` を見る。 後ろに置くと、 `dependsOn` の書き漏れだけで「差し替えに届かない」 に落ちて生成される (fail-open)。

###### 観点名で判定してはいけない

初版は「権限 / 冪等性 / セキュリティ の 3 観点を落とす」 だった。 3 方向すべてで外れる。

| 理由 | 例 |
|---|---|
| 同じ観点でも依存が違う | 「権限」 が `headers.authorization` だけを見る TC は mock と無関係 = 生成できる |
| 観点名は mode ごとに違う | middleware は `auth gate` / `geo block`、 RSC は `notFound` / `props 分岐` で、 5 mode 共通の語彙が無い |
| 1 TC に複数観点が書かれる | 「権限 / セキュリティ」 のような複合表記を名前一致で捌けない |

これらは**依存が生じやすい観点**ではあるが、 判定の条件ではない。

###### 差し替えたかどうかは生成物から判る

gate が効くのは 選択 3 を採った時だけ。 その判定は申告ではなく、 **生成 test に `vi.mock('<state module>')` があるか**で決まる。

申告に頼ると、 選択 1 と書いて `vi.mock` を書く形が通る。 生成物を見れば食い違いようがない。

factory を読めない形 (動的に組み立てる等) では `mockedExports` を決められないので、 全 export を `mockedExports` として扱う (fail-closed)。

##### 生成しなかった TC を返す

Step 4 の実行結果とは別に、 生成しなかった TC を報告する。 黙って落とすと、 spec の行数と生成された `it` の数が合わない理由が誰にも分からない。

| 項目 | 内容 |
|---|---|
| TC ID | spec の 9 column 表の ID |
| `Observation` | 生成しない判断の根拠になった観点 |
| module | 実装を通せなかった module の path |
| 次の手 | その module に reset か seed を export すれば生成できる旨 |

3 を採る時は生成 test の冒頭にも **差し替えた export 名** と **生成しなかった TC の ID** を書く。 報告は流れるが、 生成物は残る。

冒頭に書くのは記録のためだけではない。 Step 6 の `/kiwa-review --mode test-review` は観点別 cover 率を出し、 **各観点 100% を実装漏れの基準にする**。 生成しなかった TC はそのままだと実装漏れとして数えられ、 「mock でもいいから足せ」 という圧力になって gate が元に戻る。

`/kiwa-review` は生成 test 冒頭の `// 未生成:` を読み、 該当 TC を実装漏れと分けて数える (`skills/kiwa-review/SKILL.md` § 2B)。 記録が無いと分けられないので、 **冒頭の 2 行は省略できない**。

##### `Given` の data 部分を seed する

9 column 表の `Given` は env (`cookies` / `headers`) と data (既存 row / fixture) が混ざっている。 **data 側は clear した後に入れ直す**。

clear だけを書くと、 既存 row を前提にする TC (重複検出 / 状態遷移 / 権限) が空 state で走り、 期待値と噛み合わない。 `beforeEach` は state を空に戻すところまでで、 case ごとの前提はそこから積む。

### Step 3: vitest test の生成

各 9 column 行を以下 template で test ブロックに変換 ...

`{data seam}` の block は Step 2 の判定が「1 件以上」 か「未確認」 の時だけ出す。 「0 件」 なら 2 block とも省き、 `vitest` の import から `beforeEach` / `vi` を外す。

```ts
{data seam / 選択 3 のみ — 何を差し替え、 何を生成しなかったかを file 冒頭に残す}
// mock: {差し替えた STATE_MODULE の export 名を列挙}
// 未生成: {生成しなかった TC の ID を列挙}。 {STATE_MODULE} に reset か seed を export すれば生成できる

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invokeServerAction, REDIRECT_SYMBOL } from '@kiwa-lab/nextjs';
{選択 2 では action を it の中で動的 import するので、 この行は出さない}
import { {ACTION} } from '{ACTION_PATH}';

{data seam / 選択 1 — reset か seed を export している module。 実装をそのまま通す}
import { {RESET_EXPORT} } from '{STATE_MODULE}';

{data seam / 選択 3 — module ごと差し替える。 state は必ず vi.hoisted に置く}
const {STATE_NAME} = vi.hoisted(() => ({ {STATE_FIELD}: {STATE_INITIALIZER} }));
vi.mock('{STATE_MODULE}', () => ({
  {STATE_MODULE の各 export を {STATE_NAME}.{STATE_FIELD} 経由の実装に差し替える},
}));

{data seam — 判定が 0 件でない時のみ}
beforeEach(() => {
  {選択 1 なら {RESET_EXPORT}();、 選択 2 なら vi.resetModules();、 選択 3 なら {STATE_NAME}.{STATE_FIELD} を空に戻す}
});

describe('{MODULE} server action', () => {
  it('{ID} {Observation}', async () => {
    {data seam / Given.data がある行のみ — clear の後に入れ直す}
    {Given.data を 選択 1 なら seed export 呼出、 選択 3 なら {STATE_NAME}.{STATE_FIELD} への書込に展開}

    {data seam / 選択 2 のみ — reset 後の module を掴み直す}
    const { {ACTION} } = await import('{ACTION_PATH}');

    const fd = new FormData();
    {FormData の各 entry を fd.set(key, value) に展開}
    const { result, error, env } = await invokeServerAction({
      action: {ACTION},
      formData: fd,
      cookies: {Given.cookies を object に展開},
      headers: {Given.headers を object に展開},
      args: {Args を配列に展開},
    });
    {Then を expect(...).toBe(...) 等に展開}
  });
});
```

##### 展開例 (release-smoke が実際に走らせる)

template を選択 3 (module ごと差し替え) で展開した形。 **`tests/release-smoke/tests/nextjs-data-seam.test.ts` がこの block を抜き出して fixture に書き、 Vitest で実行する**。 template を壊すとこの block も壊れ、 test が落ちる。

placeholder のままだと実行できないので、 具体的な module 名で書く。 判定材料は形であって名前ではない。

<!-- kiwa-nextjs:worked-example:start -->
```ts
// mock: store, findUserByEmail, createUser
// 未生成: T-070, T-071 (セキュリティ / 冪等性)。 ./users.js に reset か seed を export すれば生成できる

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signup } from './signup.js';

const seam = vi.hoisted(() => ({ users: new Map() }));
vi.mock('./users.js', () => ({
  // store を値として返す export。 factory の実行時に seam を参照するので、
  // vi.hoisted に置いていないとここで初期化前参照になる。
  store: seam.users,
  findUserByEmail: async (email) => seam.users.get(email) ?? null,
  createUser: async (input) => {
    const user = { id: `u_${seam.users.size + 1}`, email: input.email };
    seam.users.set(input.email, user);
    return user;
  },
}));

beforeEach(() => {
  seam.users.clear();
});

function formData(entries) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

describe('signup server action', () => {
  it('T-001 登録できる', async () => {
    const result = await signup(formData({ email: 'a@b', password: 'abcd1234' }));
    expect(result).toMatchObject({ ok: true });
  });

  it('T-002 Given の既存 row を seed してから重複を検出する', async () => {
    // Given の data 部分は clear の後に入れ直す。 clear だけだと空 state で走る。
    seam.users.set('a@b', { id: 'u_seed', email: 'a@b' });
    const result = await signup(formData({ email: 'a@b', password: 'abcd1234' }));
    expect(result).toEqual({ ok: false, error: 'already-registered' });
  });

  it('T-003 前の case の seed が残っていない', async () => {
    const result = await signup(formData({ email: 'a@b', password: 'abcd1234' }));
    expect(result).toMatchObject({ ok: true });
  });
});
```
<!-- kiwa-nextjs:worked-example:end -->

`vi.hoisted` を外して素の `const seam = { users: new Map() }` にすると `ReferenceError: Cannot access 'seam' before initialization` で **1 件も実行されない**。 `vi.mock` は巻き上げられるので、 factory が走る時点で `seam` はまだ初期化されていない。

分かれ目は **factory の実行時に `seam` を読むかどうか**で、 export の種類ではない。

| 形 | 例 | factory 実行時に読むか |
|---|---|---|
| 値として返す | `store: seam.users` | 読む |
| 値から導く | `size: seam.users.size` / `rows: [...seam.users]` | 読む |
| 既定値に使う | `limit: seam.config.limit ?? 10` | 読む |
| 関数本体の中で読む | `find: async (k) => seam.users.get(k)` | 読まない (呼出時まで遅れる) |

上の `store: seam.users` は 1 行目。 `findUserByEmail` は 4 行目で、 `vi.hoisted` が無くても動く。

両方の形が同じ factory に同居するのが普通なので、 **形で場合分けせず常に `vi.hoisted` に置く**。 場合分けすると、 後から export を 1 つ足しただけで test が全滅する。

### Step 4: test 実行 + 結果取得

**依存 package を build してから** vitest を起動する。 出力先は § mode 別の生成先 で layer ごとに
違うので、 生成した path をそのまま渡す。

```bash
KIWA_REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [ -n "$KIWA_REPO_ROOT" ] \
  && [ -f "$KIWA_REPO_ROOT/scripts/build-deps.mjs" ] \
  && grep -Eq '"name"[[:space:]]*:[[:space:]]*"@kiwa-lab/nextjs"' "$KIWA_REPO_ROOT/packages/nextjs/package.json" 2>/dev/null; then
  node "$KIWA_REPO_ROOT/scripts/build-deps.mjs" @kiwa-lab/nextjs @kiwa-lab/core
fi
pnpm vitest run <解決した出力先> --environment node
```

Kiwa monorepo checkout 内では build を飛ばすと **`dist/` が無い / 古い環境で解決に失敗する**。
`@kiwa-lab/nextjs` は `dist/index.js` を entry にしており、 `build-deps.mjs` の docstring も
「単独で走らせる時はこれが要る (依存の `dist/` が古いと型定義が合わない)」 と書く。 実測で、
`test` script を持つ example 137 件のうち 131 件が先に `build-deps.mjs` を呼ぶ。

一方、 通常の利用者 project には Kiwa repo 専用の `scripts/build-deps.mjs` は無い。 published
package は `dist/` を同梱するので、 script と `@kiwa-lab/nextjs` workspace の両方を確認できる
Kiwa checkout だけ build し、 それ以外は install 済 package をそのまま使う。存在確認なしで
repo 専用 script を起動すると、 test 本体へ到達する前に正常な consumer project を落とす。

fail 行を spec の対応 TC ID と紐付けて report する。

**生成しなかった TC を pass 件数と並べて報告する** (§ 生成しなかった TC を返す)。 spec の TC 数と実行された `it` の数は一致しないので、 差の理由を同じ場所に置く。

```
25 TC 中 22 件を生成、 22 passed。
生成しなかった 3 件 (選択 3 = ./lib/users.ts を vi.mock で差し替えたため):
  T-NA-050 冪等性 / T-NA-070 セキュリティ / T-NA-071 セキュリティ
  → ./lib/users.ts に reset か seed を export すれば生成できる
```

「22 passed」 だけを返すと、 3 件が最初から無かったように読める。

### Step 5: result-review 用 metadata の Write

`tests/reports/result/{module}.nextjs.{lang}.md` に以下を Write ...

- 実行日時 (skill 引数で渡された ISO 8601)
- spec 由来 TC 件数 / pass 件数 / fail 件数
- **未生成 TC** ... ID / `Observation` / 差し替えた module / 次の手 (§ 生成しなかった TC を返す)。 報告と生成物の冒頭に加えてここにも書くのは、 下流が読むのがこの file だから。 0 件なら「0 件」 と明記する (項目ごと省くと、 gate が働いていない run と区別できない)
- coverage (v8 で collect、 invokeServerAction の呼出有無で判定可能)
- 各 fail TC の Then 期待 vs 実際の env state diff

### Step 6: kiwa-review 自動呼出

`--no-review` 指定がなければ `/kiwa-review --mode test-review --layer <起動時の layer> --module {module} --test-path <解決した出力先> --lang $DOC_LANG` を起動して 11 観点の cover 率を判定する。 5 mode それぞれ別の layer / 別の生成先なので、 `nextjs-server-action` に固定すると他 4 mode の review が別 layer の spec と突き合わされる。

## 11 観点 → invokeServerAction mapping

| 観点 | helper の使い方 |
|---|---|
| 正常系 | `formData` + `cookies` を seed → `result` が期待値 |
| 異常系 | 不正 `formData` → `error` instanceof Error + message check |
| 境界値 | FormData の値で boundary を試行 → `result` or `error` |
| 状態遷移 | `cookies` で state を表現 → action 後の `env.cookies.get(...)` で遷移を assert |
| 権限 | `headers.authorization` seed → action が `error` を throw or `result` が `unauthorized` |
| 入力バリデーション | 空 FormData → `error.message === 'required'` 等 |
| 冪等性 | 同 action を 2 回呼んで `env` 差分が 0 |
| 並行処理 | `Promise.all([invokeServerAction(...), ...])` で race 検出 |
| 性能 | `performance.now()` で wrap、 100ms 等の上限 assert |
| セキュリティ | CSRF token 不在 / 改竄 → `error` |
| 回帰 | 既知 bug 再現 FormData → `result` が正しい値 |

## 完了条件

- 解決済み出力先の test file が Write され、 spec の Automation=yes 全 TC が変換済
- `pnpm vitest run <解決した出力先> --environment node` が exit 0
- result report が指定 path に Write 済
- 遅い test の上位を確認済 = `/kiwa-observe` の dashboard `Execution time` section (または runner の実行時間出力) を読み、遅い test に対処したか、対処しない理由を report に記録 (#2186)

## 既存 test の再利用

Layer 1 (`/kiwa-design`) が仕様書に書く `## 既存 test との対応` を読み、 **`未覆` / `不明` の TC だけ** を書く。
`既覆 (候補)` の TC は候補として挙がった test を Read し、 TC の入力と期待を実際に走らせているかを確かめてから決める (名前の一致は中身の一致を意味しない)。
section を持たない仕様書は全 TC を `不明` として扱う。

既存 test file があればそこに追記し、 無ければ本 skill の既定出力先へ新規 Write する。
**既存 test の削除と期待値の書き換えは行わない**。

判定の読み方 / 追記先の決め方 / 禁止事項の全文は `.claude/skills/kiwa-design/references/existing-test-reuse.md` を Read する。

## 関連

- 上流 (Layer 1) ... `/kiwa-design --layer nextjs-server-action`
- runtime fixture ... `@kiwa-lab/nextjs` v1.0+ (`packages/nextjs/`)
- 下流 (review) ... `/kiwa-review --layer <起動時の layer>` (5 mode それぞれ別 layer)
- 統合 chain ... 無し。 `/kiwa-test` に nextjs 専用 Step が無いため、 本 skill は単体起動する (#1809)
- RSC test ... 下記 § RSC mode (#494、 v1.0.3+ 対応済)
- middleware test ... 下記 § middleware mode (#495、 v1.0.2+ 対応済)
- PoC ... `examples/nextjs-server-actions-poc/`、 `examples/nextjs-middleware-poc/`、 `examples/nextjs-rsc-poc/`

---

## middleware mode (Issue #495、 v1.0.2+)

App Router の `middleware.ts` を `invokeMiddleware({ middleware, url, method, headers, cookies, geo })` で simulated request 経由で invoke + outgoing response headers / cookies / action (`next` / `redirect` / `rewrite` / `json`) を捕捉する。

### 9 column 拡張表 (`/kiwa-design --layer nextjs-middleware`)

列の定義は `/kiwa-design` が持つ (`.claude/skills/kiwa-design/SKILL.md` §
`#### nextjs-middleware layer 専用 column`)。 **ここに写しを置かない** = 写しは片方だけ
直った時に気付けない。

### action helper

middleware は `NextResponse.redirect()` 等を直接 import せず、 kiwa の `middlewareActions.{next,redirect,rewrite,json}()` を return する形に refactor 済みであることが前提 (Pattern A 同等)。 これにより production code と test の両方で同 shape の return value が成立する。

### test 生成 template

```ts
import { invokeMiddleware, middlewareActions } from '@kiwa-lab/nextjs';
import { middleware } from '../middleware.js';

it('{ID} {Observation}', async () => {
  const { env, error } = await invokeMiddleware({
    middleware,
    url: '{Given.url}',
    method: '{Method}',
    headers: {Headers を object に展開},
    cookies: {Given.cookies を object に展開},
    geo: {Given.geo を object に展開},
  });
  {Then を expect(env.action.kind).toBe(...) 等に展開}
});
```


本 mode も **data seam の確認を省かない**。 対象が import する module 直下の可変 state を § data seam (seed する軸) に従って調べ、 同節の判定と seed の仕方をそのまま適用する。 **条件も手順も本節には書き写さない** = 書き写すと共有節を直した時に取り残される。

出力 path 規約 ... `tests/spec/integration/test-spec-{module}.middleware.md`。

---

## RSC mode (Issue #494、 v1.0.3+)

App Router の async React Server Components (`async function Page(props): Promise<JSX.Element>`) を `renderServerComponent({ component, props })` で direct await + return tree を捕捉する。 jsx-runtime や React import は不要、 element を `{ type, props, key }` 形式の plain object として扱う軽量 helper (full RSC flight payload format は対象外、 server component の return value semantics のみ検証する)。

### 9 column 拡張表 (`/kiwa-design --layer nextjs-rsc`)

列の定義は `/kiwa-design` が持つ (`.claude/skills/kiwa-design/SKILL.md` §
`#### nextjs-rsc layer 専用 column`)。 **ここに写しを置かない** = 写しは片方だけ
直った時に気付けない。

### signal helper

`next/navigation` の `notFound()` / `forbidden()` / `redirect()` を直接 import せず、 kiwa の signal symbol (`NOT_FOUND_SYMBOL` / `FORBIDDEN_SYMBOL` / `RSC_REDIRECT_SYMBOL`) を持つ object を throw する形に refactor 済みであることが前提 (Pattern A 同等)。

### test 生成 template

```ts
import { renderServerComponent, findAll, textContent, NOT_FOUND_SYMBOL } from '@kiwa-lab/nextjs';
import { UserPage } from '../app/users/[slug]/page.js';

it('{ID} {Observation}', async () => {
  const { tree, signal, error } = await renderServerComponent({
    component: UserPage,
    props: {Props を展開},
  });
  {Then を expect(textContent(tree)).toBe(...) や findAll(tree, ...).length === N に展開}
  {Signal が "notFound" なら expect(signal?.[NOT_FOUND_SYMBOL]).toBe(true)、 "redirect" なら expect(signal.url).toBe('/login') 等}
});
```


本 mode も **data seam の確認を省かない**。 対象が import する module 直下の可変 state を § data seam (seed する軸) に従って調べ、 同節の判定と seed の仕方をそのまま適用する。 **条件も手順も本節には書き写さない** = 書き写すと共有節を直した時に取り残される。

出力 path 規約 ... `tests/spec/integration/test-spec-{module}.rsc.md`。

## Parallel Routes mode (Issue #523、 v1.0.4+)

App Router の Parallel Routes (`layout({ children, @modal, @sidebar })`) と Intercepting Routes (`(.)` / `(..)` / `(...)`) を `invokeParallelRoutes({ layout, children, slots })` で render する。 全 slot は `Promise.all` で並列 await (slow slot が fast slot を block しない)、 per-slot error は `slotResults[]` に capture (broken slot が layout 全体を倒さない)。 Intercepting Routes の soft-vs-hard navigation 切替は `intercepting: { variant: 'intercepted' | 'default', url, distance }` で表現、 `variant: 'default'` 時は `defaultFallback` を強制 render する (hard-nav 経路を test 内で再現)。

### 9 column 拡張表 (`/kiwa-design --layer nextjs-parallel-route`)

列の定義は `/kiwa-design` が持つ (`.claude/skills/kiwa-design/SKILL.md` §
`#### nextjs-parallel-route layer 専用 column`)。 **ここに写しを置かない** = 写しは片方だけ
直った時に気付けない。

列を `@kiwa-lab/nextjs` の `invokeParallelRoutes` のどの引数へ渡すかは本 skill の mapping 節が持つ。

### Intercepting Routes 対応

`intercepting.variant === 'intercepted'` → component を render しつつ `InterceptionMatch` を `slotResults[].interception` に capture (soft-nav 経路の test)。 `intercepting.variant === 'default'` → component を無視して `defaultFallback` を強制 render (hard-nav 経路 = full-page reload で `default.tsx` が選ばれる動作を test)。 `distance` は `'sibling'` (default) / `'parent'` / `'root'` で URL match の階層を表現。

### test 生成 template

```ts
import { invokeParallelRoutes, PARALLEL_INTERCEPTION_SYMBOL } from '@kiwa-lab/nextjs';
import DashboardLayout from '../app/dashboard/layout.js';
import PhotoModal from '../app/dashboard/@modal/photo/page.js';
import Sidebar from '../app/dashboard/@sidebar/page.js';
import PostsPage from '../app/dashboard/posts/page.js';

it('{ID} {Observation}', async () => {
  const { tree, slotResults, childrenError, layoutError } = await invokeParallelRoutes({
    layout: DashboardLayout,
    children: PostsPage,
    childrenProps: {Children.props を展開},
    slots: [
      { slot: 'modal', component: PhotoModal{Variant が intercepted/default なら intercepting field 追加} },
      { slot: 'sidebar', component: Sidebar },
    ],
  });
  {Then を expect(slotResults[0].tree).toBeDefined() や expect(slotResults[0].interception?.variant).toBe('intercepted') 等に展開}
});
```

### 11 観点 → invokeParallelRoutes mapping

| 観点 | 使い方 |
|---|---|
| 正常系 | 全 slot 正常 component → `slotResults.every(s => s.error === undefined)` |
| 異常系 | broken slot 注入 → `slotResults[idx].error` 捕捉、 他 slot は影響なし |
| 境界値 | zero slots / null component + defaultFallback / empty children |
| 状態遷移 | intercepting.variant 切替で soft-vs-hard nav の render result 差分検証 |
| 並行処理 | slow + fast slot 混在 → 完了順を sequence で記録、 fast が先 (parallel 確認) |
| 入力バリデーション | defaultFallback 無しで component=null → `error` 捕捉 |
| 性能 | slow slot wall time を `performance.now()` で計測、 sequential なら sum、 parallel なら max |
| 回帰 | Intercepting Routes 既知 bug 再現 URL → expected variant + distance |


本 mode も **data seam の確認を省かない**。 対象が import する module 直下の可変 state を § data seam (seed する軸) に従って調べ、 同節の判定と seed の仕方をそのまま適用する。 **条件も手順も本節には書き写さない** = 書き写すと共有節を直した時に取り残される。

出力 path 規約 ... `tests/spec/integration/test-spec-{module}.parallel.md`。

## RSC streaming + Suspense boundary 拡張 (`--layer nextjs-rsc-streaming`、 Issue #558)

RSC streaming chunk + Suspense boundary 遷移を `setupNextRscEnv({ component?, dataSource?, suspenseFallback?, streamingTimeout?, injectError?, props? })` で test する。 既存 `renderServerComponent` (leaf-level + signal capture) の補完で、 streaming + Suspense に焦点を絞る。

### 9 column 拡張表 (`/kiwa-design --layer nextjs-rsc-streaming`)

列の定義は `/kiwa-design` が持つ (`.claude/skills/kiwa-design/SKILL.md` §
`#### nextjs-rsc-streaming layer 専用 column`)。 **ここに写しを置かない** = 写しは片方だけ
直った時に気付けない。

列を `@kiwa-lab/nextjs` の `setupNextRscEnv` のどの引数へ渡すかは本 skill の mapping 節が持つ。

### test 生成 template

```ts
import { setupNextRscEnv, RSC_ERROR_BOUNDARY_SYMBOL } from '@kiwa-lab/nextjs';
import { streamItems, itemsSkeleton } from '../app/items/_kiwa/items-streaming.js';

it('{ID} {Observation}', async () => {
  const env = await setupNextRscEnv({
    dataSource: streamItems({Source の引数を展開}),
    suspenseFallback: itemsSkeleton(),
    streamingTimeout: {Timeout},
    {ErrorMode==='injectError' なら injectError: new Error('...') を追加},
  });
  {Then を expect(env.chunks).toHaveLength(N) や expect(env.resolved).toEqual(...) 等に展開}
});
```

### 11 観点 → setupNextRscEnv mapping

| 観点 | 使い方 |
|---|---|
| 正常系 | dataSource yields → `env.errorBoundary===null` + `env.resolved` 一致 |
| 異常系 | dataSource throw / component throw / injectError → `env.errorBoundary?.error` 検証 |
| 境界値 | empty stream (yield 0 times) → `env.resolved===null` / `chunks===[fallback]` |
| 状態遷移 | fallback → resolved 遷移は `chunks[0]===fallback` + `chunks[N-1]===resolved` |
| 並行処理 | streamingTimeout で wall clock 上限制約、 hung stream に test が止まらない |
| 入力バリデーション | no component + no dataSource → empty env (`chunks===[]`) |
| 性能 | streamingTimeout で SLA 上限 enforcement、 `timedOut===true` を assertion |
| 回帰 | 既知 streaming bug 再現 source → expected chunk 配列 |


本 mode も **data seam の確認を省かない**。 対象が import する module 直下の可変 state を § data seam (seed する軸) に従って調べ、 同節の判定と seed の仕方をそのまま適用する。 **条件も手順も本節には書き写さない** = 書き写すと共有節を直した時に取り残される。

出力 path 規約 ... `tests/spec/integration/test-spec-{module}.rsc-streaming.md`。
