---
name: kiwa-app
description: |
  利用者自身の project root で起動し、 その project が実際に依存しているものだけに合わせて
  テストを組み立てる入口 skill。 `kiwa layers --json` が返した layer それぞれについて
  Layer 1 (`/kiwa-design`) と Layer 2 (各 layer の `consumer_skill`) を順に起動し、
  spec と test file を利用者の project 内に生成する。
  `/kiwa-test` は kiwa repo の `examples/{name}/` を回す dogfood 駆動役で、 本 skill は
  利用者側の入口。 両者は呼び合わない。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-app — 利用者 project 向けの入口

利用者の project root で 1 コマンド叩くと、 **その project が実際に依存しているものだけ** の
spec と test file が生成される。 依存していない layer のテストは作らない。

`/kiwa-test` との違いは対象。 あちらは kiwa repo の `examples/{name}/` を回す dogfood 駆動役で、
`cwd = kiwa repo root` と `examples/{name}/` の存在を要求する。 本 skill は利用者の project で
動き、 `examples/` を前提にしない。

## 前提

- cwd が対象 project の root (`package.json` / `Cargo.toml` / `go.mod` のいずれかが存在)
- `kiwa` CLI が起動できる (`kiwa --help` が exit 0)
- 出力先 `tests/spec/` / `tests/reports/app/` および各 layer の `test_outputs` への Write 権限

kiwa repo の中で起動してもよいが、 その場合の対象は repo 自身であって `examples/` ではない。
`examples/` を回したい場合は `/kiwa-test --example {name}` を使う。

## 引数仕様

```text
/kiwa-app --module {name} [--layer L] [--lang ja|en] [--dry-run]

  --module {name}   spec / test file 名に入る module 名 (必須)
  --layer L         検出を使わず L だけを対象にする。 `all` は全 layer
  --lang ja|en      生成文書の言語 (既定 ja)
  --dry-run         生成せず、 何をするかだけ報告する
```

`--module` は必須にする。 project 名から推測すると、 単一 project に複数の対象がある場合に
無言で 1 つ目を選ぶことになる。

## Step 1: 検出を最新にする

`.kiwa/stack.json` は manifest より古いと使われない。 起動のたびに取り直す。

```bash
kiwa init --detect
```

書き込む先は `.kiwa/stack.json` だけで、 scaffold は行わない。 gitignore 対象の cache なので
上書きしてよい。 失敗しても止めない (次の Step が `all` に倒れて理由を報告する)。

## Step 2: 対象 layer を決める

```bash
# --layer が与えられていればそのまま渡す。 CLI 側が flag > detected > all の
# 優先順位を持っているので、 本 skill が先に分岐すると判定が 2 箇所になる。
#
# --lang も渡す。 返る spec_path が言語込みで解決されるので、 本 skill は suffix の
# 規約を知らなくてよい。
kiwa layers --json ${LAYER:+--layer "$LAYER"} ${LANG:+--lang "$LANG"}
```

判定を本 skill 側に書かない。 優先順位と陳腐化の判定は CLI 側 1 箇所に閉じており、 複製すると
同じ契約が再び散る (#1807 / #1809 / #1810)。

**`spec_path` に suffix を足さない**。 `--lang ja` を渡せば返り値が既に
`test-spec-{module}.nextjs.ja.md` になっている。 skill 側で足すと二重になる。

`--lang` を Layer 1 と Layer 2 の両方に渡す。 片方だけだと、 Layer 1 が書いた file を Layer 2 が
探せない (#1855 で実際にそうなっていた)。

`--layer` を渡さずに `source` だけ見て自前で絞ると、 `--layer all` が「全 layer を対象」 では
なく「絞れなかった」 と同じ扱いになり、 明示指定が効かなくなる。

返る `source` で分岐する。

| `source` | 意味 | 振る舞い |
|---|---|---|
| `flag` | `--layer {id}` で明示された | その layer だけを対象にする |
| `detected` | 検出で絞れた | 返った layer を対象にする |
| `all` | 下表で分岐 | — |

`all` で全 layer を生成しない。 30 layer 分の spec が出て、 その大半は project と無関係になる。
「絞れなかった」 は「全部要る」 ではない。

**ただし `source=all` は 2 つの別の答えを 1 語で返す**。 CLI は `--layer all` を受けた時も
`all` を返すため、 明示指定と fallback が `source` だけでは見分けられない。 見分けるのは
本 skill 側の引数で、 CLI の返り値ではない。

| 自分が受けた `--layer` | `source` | 振る舞い |
|---|---|---|
| `all` | `all` | **全 layer を対象にする** (user が明示した) |
| 無し | `all` | **生成せず理由を報告して終了** (絞れなかった) |

報告には `kiwa layers --json` が stderr に出した warning をそのまま載せる。 なぜ絞れなかったかは
そこに書いてある (manifest が無い / 探索が終わらなかった / recording が古い)。

## Step 3: 生成できる layer を選ぶ

`layers[].test_outputs` の path には 3 つの形が混ざっている。 実測した内訳。

| 形 | 件数 | 意味 | 本 skill の扱い |
|---|---|---|---|
| `{example}/...` | 32 | project root 起点 | **対象**。 `{example}` を `.` に解決する |
| `examples/{example}/...` | 0 | kiwa repo の example 配下 | 対象外。 利用者 project に `examples/` は無い |
| `tests/fixtures/{example}/...` | 3 | kiwa 内部の fixture | 対象外。 利用者の成果物ではない |

1 つ目を 1 件でも持つ layer が対象になる。 3 layer (`contract` / `e2e`) は 1 つ目と 3 つ目を
同時に持つが、 これは同じ producer が「利用者側の test」 と「kiwa 側の fixture 複製」 を書く
形なので異常ではない。 利用者 project では 1 つ目だけを使う。

1 つ目を 1 件も持たない layer は生成先を決められないので飛ばす。 現状そのような layer は無い。

以前は rust 5 + go 5 の計 10 layer が `examples/{example}/...` の形で kiwa 自身の dir を
綴っており、 置換しても `examples/` の 1 段が残るため利用者 project に置けなかった。 #1842 で
他の layer と同じ形に揃えたので、 30 layer すべてが対象になる。

`{module}` は `--module` の値に、 `{Contract}` は対象 contract 名に解決する。

## Step 4: layer ごとに 2 段起動する

対象になった layer それぞれについて、 Layer 1 → Layer 2 の順に起動する。

```text
[Layer 1] /kiwa-design --layer {id} --module {module} --lang {lang} [--mode {mode}]
              ↓ spec_path の {module} を解決した path
[Layer 2] /{consumer_skill} {相手が宣言している option 名で spec path を渡す} ...
              ↓ test_outputs の path (置換済)
```

`consumer_skill` は `layers[].consumer_skill` が持つ。 対応表を本 skill に書かない。

### 起動前に相手の option を読む

**Layer 2 の option 名は skill ごとに違う**。 決め打ちで渡すと、 受け取られないまま既定値で
動く。 起動前に `.claude/skills/{consumer_skill}/SKILL.md` の `## オプション` 節を読み、
そこに宣言されている名前で渡す。

実測した分布。

| option | 宣言している skill 数 | 備考 |
|---|---|---|
| `--module` | 17 | 全 consumer が受ける |
| `--input-spec` | 13 | spec path を渡す flag |
| `--spec-path` | 4 | 同じ役割で名前が違う (`auth` / `cache` / `forge` / `queue`) |
| `--layer` | **2** | `kiwa-rust` / `kiwa-go` のみ |
| `--provider` | 3 | `auth` / `cache` / `queue` |

`--layer` を全 consumer に渡してはいけない。 受けるのは 2 skill だけで、 `kiwa-nextjs` は
持たない。

`--module` は全 consumer が受ける。 `#1851` まで `kiwa-play` と `kiwa-edge` が受けておらず、
その 2 layer は起動を組み立てられずに飛ばされていた。

### 5 layer の見分けは spec path が担う

`kiwa-nextjs` は 5 layer の consumer だが `--layer` を受けない。 見分けるのは
`--input-spec` に渡す path の suffix で、 layer ごとに違う。

| layer | `spec_path` の suffix |
|---|---|
| `nextjs-server-action` | `.nextjs.md` |
| `nextjs-middleware` | `.middleware.md` |
| `nextjs-rsc` | `.rsc.md` |
| `nextjs-parallel-route` | `.parallel.md` |
| `nextjs-rsc-streaming` | `.rsc-streaming.md` |

つまり `spec_path` を解決して渡すことが、 そのまま layer の指定になる。 `{spec_dir}` から
path を組み立て直すと suffix が落ち、 5 layer が区別できなくなる。 宣言された `spec_path` を
そのまま使う。

### 出力先が衝突する組は 1 つだけ残っている

実測すると出力先を共有するのは 1 group。

| 共有される出力先 | 共有する layer | 性質 |
|---|---|---|
| `{example}/tests/{module}.rs` | `rust-unit` / `rust-integration` | **意図的**。 cargo は `tests/` 配下を integration test として扱い 1 file = 1 crate なので、 `kiwa-rust` が両 layer を 1 file に揃えている |

以前は 4 group あった。 nextjs 5 layer / `api` と `integration` / `cli` と `data` と
`orm-query` の 3 group は #1844 で分けた。 入力 spec の suffix を出力名に写す形で、
`{module}.rsc.test.ts` / `{module}.api.test.ts` / `{module}.orm.test.ts` のように分かれる。

残る 1 件は宣言の誤りではないので、 上書きを避ける必要がない。 それでも起動前に解決済み出力
path の重複は数える = 新しい衝突が入った時に黙って上書きしないため。

| 相手が `--output` を宣言している | 振る舞い |
|---|---|
| している | `spec_path` の suffix を出力名に写して衝突を解く |
| していない | その group は先頭 1 件だけ生成し、 残りを飛ばして報告に理由を残す |

**黙って上書きしない**。 5 回起動して 1 file しか残らない状態は、 4 layer 分の生成が失敗したのと
同じでありながら成功に見える。

`mode` を持つ layer (30 中 6) は、 相手が `--mode` を宣言していれば渡す。 `providers` を持つ
layer は `selected_by` と相手の option 宣言の両方が揃った時だけ渡す。

`also_consumed_by` を持つ layer は、 主 consumer の後に副次 consumer も同じ規則で起動する。
実測すると該当は `contract` 1 件で、 主 `kiwa-forge` / 副 `kiwa-hardhat`。

**`test_outputs` は consumer 別に鍵が分かれている**。 副次 consumer の出力先は自分の鍵の下に
あるので、 主 consumer の path を流用しない。 `contract` は `kiwa-forge` が `.t.sol` を、
`kiwa-hardhat` が `.test.ts` を書く = 同じ layer でも成果物が違う。

option も相手ごとに読む。 両者はたまたま同じ 9 option を宣言しているが、 それは確かめた結果で
あって前提ではない。

`providers` / `variants` を持つ layer は `selected_by` が選び方を宣言している。 その宣言に従う
だけで、 どれを選ぶかは決めない。

| `selected_by` の形 | 例 | 本 skill の振る舞い |
|---|---|---|
| flag を名指し | `kiwa-auth --provider` | user に選ばせて渡す |
| spec から判断 | `spec の記述から kiwa-orm が判断 (flag なし)` | 何も渡さない |
| `null` | `nextjs-rsc` | 何も渡さない |

依存から provider を絞る経路はまだ無い。 `docs/stack-signals.json` の generated 半分が空で、
`next-auth` を使っていることが検出に出ないため。 揃うまでは user に聞く。

## Step 5: 報告を残す

`tests/reports/app/{YYYYMMDD-HHMMSS}.md` に 1 表で書く。

| 列 | 内容 |
|---|---|
| layer | layer id |
| 検出根拠 | どの依存が効いたか (`detected` の場合) |
| Layer 1 | 生成した spec の path、 または飛ばした理由 |
| Layer 2 | 生成した test file の path、 または飛ばした理由 |

**飛ばした layer も行に残す**。 生成した分だけ並べると、 何が対象外だったかが読めない。

## 責務外

- **テスト実行の指揮** ... 本 skill は実行 step を持たない。 ただし **Layer 2 skill は自分が
  生成した test を自分で走らせる**。 実測すると `kiwa-forge` は `forge test`、 `kiwa-hardhat` は
  `npx hardhat test`、 `kiwa-vitest` は `vitest run` を起動する。 本 skill が別途 runner を
  起動しないという意味であって、 「実行が一切起きない」 という意味ではない。 起動した Layer 2 が
  test を走らせた場合、 その結果は報告の行に載せる
- **`layers.json` の解釈** ... layer の宣言を読むのは `kiwa layers` の責務。 本 skill は返って
  きた値を使うだけで、 判定を持たない
- **provider / variant の選択** ... `selected_by` が宣言する経路に従うだけ
- **`examples/` を回すこと** ... `/kiwa-test` の責務

## 失敗時

Layer 1 か Layer 2 が失敗した layer は、 その layer だけ飛ばして次に進む。 1 つの失敗で全体を
止めない。 失敗は報告の行に理由付きで残す。

`kiwa` CLI が起動できない場合は Step 1 で止める。 検出が無いまま進むと `source=all` になり、
どのみち生成しないため。
