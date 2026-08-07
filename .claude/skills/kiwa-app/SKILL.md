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
kiwa layers --json ${LAYER:+--layer "$LAYER"}
```

判定を本 skill 側に書かない。 優先順位と陳腐化の判定は CLI 側 1 箇所に閉じており、 複製すると
同じ契約が再び散る (#1807 / #1809 / #1810)。

`--layer` を渡さずに `source` だけ見て自前で絞ると、 `--layer all` が「全 layer を対象」 では
なく「絞れなかった」 と同じ扱いになり、 明示指定が効かなくなる。

返る `source` で分岐する。

| `source` | 意味 | 振る舞い |
|---|---|---|
| `flag` | `--layer` で明示された | その layer だけを対象にする |
| `detected` | 検出で絞れた | 返った layer を対象にする |
| `all` | 検出が無い / 使えない / 絞れなかった | **生成せず理由を報告して終了** |

`all` で全 layer を生成しない。 30 layer 分の spec が出て、 その大半は project と無関係になる。
「絞れなかった」 は「全部要る」 ではない。

報告には `kiwa layers --json` が stderr に出した warning をそのまま載せる。 なぜ絞れなかったかは
そこに書いてある (manifest が無い / 探索が終わらなかった / recording が古い)。

## Step 3: 生成できる layer を選ぶ

`layers[].test_outputs` の path には 3 つの形が混ざっている。 実測した内訳。

| 形 | 件数 | 意味 | 本 skill の扱い |
|---|---|---|---|
| `{example}/...` | 22 | project root 起点 | **対象**。 `{example}` を `.` に解決する |
| `examples/{example}/...` | 10 | kiwa repo の example 配下 | 対象外。 利用者 project に `examples/` は無い |
| `tests/fixtures/{example}/...` | 3 | kiwa 内部の fixture | 対象外。 利用者の成果物ではない |

1 つ目を 1 件でも持つ layer が対象になる。 3 layer (`contract` / `e2e`) は 1 つ目と 3 つ目を
同時に持つが、 これは同じ producer が「利用者側の test」 と「kiwa 側の fixture 複製」 を書く
形なので異常ではない。 利用者 project では 1 つ目だけを使う。

1 つ目を 1 件も持たない layer は生成先を決められないので飛ばす。 飛ばしたことは報告に残す。
無言で `examples/tests/...` のような場所に書くより、 書かずに言う方がよい。

### Rust と Go は現状書けない

実測すると 30 layer 中 20 が利用者 project に書け、 書けない 10 は rust 5 + go 5 の全てだった。

| 対象外の layer |
|---|
| `rust-unit` / `rust-integration` / `rust-axum` / `rust-actix-web` / `rust-tower-http` |
| `go-unit` / `go-integration` / `go-gin` / `go-echo` / `go-fiber` |

いずれも `test_outputs` が `examples/{example}/tests/...` の形で kiwa 自身の dir を綴っている。
`{example}` を置換しても `examples/` の 1 段が残るため、 利用者 project には置けない。

**検出は効いている**。 `Cargo.toml` を持つ project ならこれらの layer は検出され、 Layer 1 の
spec も生成される。 置けないのは Layer 2 の test file だけで、 報告にそう書く。

`{module}` は `--module` の値に、 `{Contract}` は対象 contract 名に解決する。

## Step 4: layer ごとに 2 段起動する

対象になった layer それぞれについて、 Layer 1 → Layer 2 の順に起動する。

```text
[Layer 1] /kiwa-design --layer {id} --module {module} --lang {lang} [--mode {mode}]
              ↓ spec_path の {module} を解決した path
[Layer 2] /{consumer_skill} --layer {id} --module {module} [--mode {mode}]
              ↓ test_outputs の path (置換済)
```

`consumer_skill` は `layers[].consumer_skill` が持つ。 対応表を本 skill に書かない。

**`--layer` を Layer 2 にも渡す**。 1 つの consumer_skill が複数の layer を受け持つためで、
`kiwa-nextjs` は 5 layer (`nextjs-server-action` / `nextjs-middleware` / `nextjs-rsc` /
`nextjs-parallel-route` / `nextjs-rsc-streaming`) の consumer になっている。 `--module` だけ
渡すと 5 回同じ起動になり、 どの mode を変換すればよいか決まらない。

`spec_path` は layer ごとに suffix が違う (`.nextjs.md` / `.middleware.md` / `.rsc.md` /
`.parallel.md` / `.rsc-streaming.md`)。 Layer 2 はこの suffix で入力 spec を見分けるので、
Layer 1 の出力先も `spec_path` から組む。 `{spec_dir}` を自前で組み立てない。

`mode` を持つ layer (30 中 6) はそれも渡す。 `also_consumed_by` を持つ layer は、 主 consumer の
後に副次 consumer も同じ引数で起動する。

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
