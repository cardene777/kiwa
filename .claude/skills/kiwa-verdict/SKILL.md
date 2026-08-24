---
name: kiwa-verdict
description: |
  埋まらなかった未達を 4 分類に仕分けて **提案する** skill。
  「できません」 で終わらせず、直せるもの / 直せないもの / 実装の欠陥 / 未着手 を分ける。
  分類は提案に留め、実装削除も除外宣言も行わない。 採否は user が決める。
  /kiwa-loop が停止した時に呼ばれるが、現状把握のために単体起動もできる。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write
---

# /kiwa-verdict — 埋まらなかったものを仕分ける

`/kiwa-loop` が止まった時、残った未達を「埋められない」 の一語で片付けない。

**理由がどこにあるかで対処が変わる**。 実装を直すべきものと、覆えないと明記して残すものと、
別の gate が覆っているものを混ぜると、直すべき欠陥が受容される。

これは変異試験の 4 分類 (`rules/quality.md § test-passed marker 発行前提` の 5 条件目) と
同じ構造にしてある。 運用を 1 つに揃えるため。

## 前提

- 入力は `/kiwa-gap` の JSON 出力。 単体起動なら自分で `/kiwa-gap` を呼ぶ
- **判定材料を実物から取る**。 分類の根拠は source を読んで書く。 推測で分類しない
- 分類は提案。 実装削除 / `--coverage.exclude` の追加 / 閾値の変更は一切行わない

## ユーザーのリクエスト

$ARGUMENTS

## オプション

- `--metric {coverage|duration}` — 何を仕分けるか (省略時は `coverage`)
- `--input {path}` — `/kiwa-gap --json` の出力 file (省略時は自分で `/kiwa-gap` を呼ぶ)
- `--package {path}` — 対象 package (`--input` 省略時に `/kiwa-gap` へ渡す)
- `--out {path}` — report の書き出し先 (省略時は `tests/reports/gap/verdict-{target}[-{pkg}].md`)

## 4 分類 (coverage)

`references/loop-stop-conditions.md` が SSOT。 判定は上から順に試す。

| # | 分類 | 判定の仕方 | 提案する対処 |
|---|---|---|---|
| 1 | 別の gate が覆っている | その行を変異させて `check-mutation-gates.mjs` が落ちるか確かめる | 変異試験が覆っていることを code comment に書いて残す |
| 2 | 実装が到達不能 | 入力は組めるのに、手前の条件でその分岐へ制御が渡らない | **実装を直す**。 到達しない分岐は検査の穴ではなく実装の欠陥 |
| 3 | 入力を組めない | 防御的分岐で、型 / 引数の制約から到達する入力を作れない | 覆えないことを code に明記して残す |
| 4 | 単に書いていない | 上の 3 つに当たらない | 書く。 これが gap の本体 |

### 2 と 3 を混ぜない

どちらも「入力で通せない」 に見えるが、**2 は入力を組めるのに実装が到達しないので直せる**、
3 は入力そのものを組めないので直せない。

混ぜると対処が「明記して残す」 に倒れ、直すべき欠陥が受容される。
切り分けは「その分岐に届く入力を組めるか」 → 組めるなら「その入力で実際に制御が渡るか」 の順。

### 1 を「他が見てるから不要」 と読まない

分類 1 は「変異試験が同じ欠陥を捕まえる」 という事実の記録で、
その行を覆う必要が無いという判断ではない。 変異試験の threshold が下がれば覆いが外れる。

## 4 分類 (duration)

lever ごとに「直せるか」 の判定が違う。

| # | 分類 | 判定の仕方 | 提案する対処 |
|---|---|---|---|
| 1 | 書き方で直せる | lever が `subprocess` / `compile` / `filesystem` / `wall-clock` | lever の直し方に沿って書き換える |
| 2 | 検証対象そのものが遅い | lever が `real-io` で、実 driver の挙動を検証している | budget に計上して記録する |
| 3 | 分類できていない | lever が `inherent` | source を読んで lever を特定するか、lever 一覧に追加する |
| 4 | 既に直っている | baseline より速い | 何もしない。 `--update-baseline` の対象 |

分類 3 を放置しない。 `inherent` は「直し方が無い」 ではなく「まだ調べていない」。
実測で `tests/release-smoke` の `inherent` は 22 file / 合計 1.3 秒だったので、
件数は多いが総量は小さい = 優先度は低いが「不明」 のまま残す。

## 実行フロー

### Step 1 — 入力を得る

`--input` があれば読む。 無ければ `/kiwa-gap` を呼ぶ。

入力が空 (未達 0 件) なら「仕分ける対象なし」 として終了する。

### Step 2 — 1 件ずつ判定する

**上限 20 件**。 それ以上ある場合は残り量の大きい順に 20 件を仕分け、
打ち切った件数を report に書く (no silent caps)。

各件について source を読む。 分類の根拠に **実際の code 抜粋 3-15 行** を添える。
`file:line` 単独参照は禁止 (`rules/writing-style.md`)。

分類 1 を主張する場合は、その行を変異させて別の gate が落ちることを **実際に確かめる**。
確かめずに「変異試験が覆っている」 と書かない。

### Step 3 — report を書く

`--out` に Markdown を書く。 4 分類ごとに節を分け、各件に「対象」「根拠」「提案」 を書く。

### Step 4 — 呼出元に返す

`/kiwa-loop` から呼ばれた場合は分類結果を返す。 単体起動なら応答に分類別の件数と、
分類 2 (実装の欠陥) があればそれを先頭に書く。

**分類 2 を最後に書かない**。 直すべき欠陥が「その他」 の中に埋もれる。

## 責務外

- **実装を消さない**。 分類 2 / dead code と判定しても削除しない。 採否は user
- **除外を宣言しない**。 `--coverage.exclude` の追加は Issue #1939 が禁じた経路
- **閾値を変えない**。 `THRESHOLDS` / `MARGIN` は script 側の SSOT
- **test を書かない**。 分類 4 (単に書いていない) の実施は生成 skill
- **測らない**。 gap の算出は `/kiwa-gap`
- **ループを回さない**。 収束は `/kiwa-loop`

## 完了条件

- 入力の各件が 4 分類のいずれかに割り当てられている (未分類が 0 件)
- 各件に「対象」「根拠」「提案」 の 3 点が書かれている
- 根拠に code 抜粋 3-15 行が inline で示されている (`file:line` 単独参照が無い)
- 分類 1 を主張した件について、変異させて別の gate が落ちることを実際に確かめた
- 分類 2 (実装の欠陥) が応答の先頭に書かれている (該当があれば)
- 20 件で打ち切った場合、打ち切った件数を report に明記した
- 実装 file を 1 行も変更していない
- `coverage-high-water.json` / `test-duration-baseline.json` を書き換えていない

## references

- `references/loop-stop-conditions.md` — 停止条件と 4 分類 (`/kiwa-loop` 共用 SSOT)

## 関連

- 上流 = `/kiwa-loop` が停止時に呼ぶ
- 上流 = `/kiwa-gap` の出力を入力にする
- 同型 = 変異試験の 4 分類 (`rules/quality.md § test-passed marker 発行前提` 5 条件目)
- 起点 = Issue #2193
