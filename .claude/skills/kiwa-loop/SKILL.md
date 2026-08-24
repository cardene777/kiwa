---
name: kiwa-loop
description: |
  カバレッジ 100% / 実行時間 budget へ 1 歩ずつ寄せる収束ループ skill。
  測る (/kiwa-gap) → 一番安い 1 件を埋める (生成 skill) → 再測 を回し、停止条件で必ず止まる。
  100% に届かなかった場合は /kiwa-verdict の分類を添えて **user に判断を仰ぐ**。
  AI が「これは埋められない」 と自分で決めて先へ進むことはしない。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, AskUserQuestion
---

# /kiwa-loop — 未達を 1 歩ずつ埋める収束ループ

ratchet が単調性を保証するので、**1 round で 1 件でも埋めれば戻らない**。
このループは「毎回 1 歩進む」 ことだけを担い、100% への到達はその積み上げで起きる。

止まり方が設計の芯。 無限に回らないことと、届かなかった時に黙って先へ進まないことを両立させる。

## 前提

- `/kiwa-gap` が未達を返せる状態にある (coverage なら `coverage-final.json` が現行 source で測られている)
- test を書くのは生成 skill (`/kiwa-vitest` / `/kiwa-forge` / `/kiwa-hardhat` / `/kiwa-api` 等)。
  本 skill は呼ぶだけで自分では書かない
- `--metric duration` の 1 歩は「lever に沿って test の書き方を変える」 こと。 閾値も並列度も変えない

## ユーザーのリクエスト

$ARGUMENTS

## オプション

- `--metric {coverage|duration}` — 何を詰めるか (省略時は `coverage`)
- `--package {path}` — 対象 package (`--metric coverage` では必須)
- `--report {path}` — vitest の json report (`--metric duration` では必須)
- `--max-rounds {N}` — round 上限 (省略時は 5、**縮める方向にしか変えない**)
- `--dry-run` — 1 round 目の gap を見せて終了する。 埋めない

## 実行フロー

### Step 0 — 引数を確定する

`--metric coverage` で `--package` が無ければ止める。 全 package を 1 ループで回すと、
どの package の何が進んだのか round ごとに追えなくなる。

`--metric duration` で `--report` が無ければ止める (`/kiwa-gap` と同じ理由)。

### Step 1 — 測る

```bash
/kiwa-gap --metric <metric> [--package <pkg>] [--report <path>] --json
```

返り値を **round 0 の値** として記録する。 metric で見るものが違う。

| metric | 記録する値 | 達成の条件 |
|---|---|---|
| coverage | `uncovered` (残り件数) | `uncovered === 0` |
| duration | 遅い順の並びと lever 別の偏り | **持たない** |

**duration に達成条件は無い** (Issue #2196)。 wall time の絶対値が判定材料にならないことを
実測で確かめた = 同じ code で 11.5 / 29.9 / 30.6 / 69.9 秒と 6 倍振れる。

したがって duration では **1 round だけ回して止まる**。 gap の先頭 1 件を直し、
何をどう変えたかを report に書いて終わる。 「速くなったか」 は測らない。

coverage が達成済なら Step 5 へ飛ぶ。

### Step 2 — 一番安い 1 件を埋める

gap の先頭 1 件だけを対象にする。 **まとめて埋めない**。

| target | 1 歩の内容 | 呼ぶ skill |
|---|---|---|
| coverage | 先頭 file の未覆行を通す test を追加する | その package の生成 skill |
| duration | 先頭 file の lever に沿って書き方を変える | 生成 skill (test を書き換える) |

生成 skill の選び方は package の言語で決まる。

| 対象 | 生成 skill |
|---|---|
| `packages/*` の TypeScript | `/kiwa-vitest` |
| Solidity (foundry) | `/kiwa-forge` |
| Solidity (hardhat) | `/kiwa-hardhat` |
| API の結合 | `/kiwa-api` |
| dApp の e2e | `/kiwa-play` |

**既存 test を削除しない / 期待値を書き換えない**。 詳細は
`references/existing-test-reuse.md` が SSOT (実体は `/kiwa-design` 側)。

### Step 3 — 再測する

**測定 file を作り直してから** Step 1 と同じ command を回す。
作り直さないと同じ値が返り、進んだのに進んでいないと判定する。

| metric | 作り直すもの |
|---|---|
| coverage | `<pkg>` の `test:cov` を走らせて `coverage-final.json` を更新する |
| duration | vitest を `--reporter=json --outputFile=<新しい path>` で走らせ、**その path を渡す** |

duration で report を作り直さないのは特に見落としやすい。 `/kiwa-gap` は test を走らせない
ので、Step 2 で test を書き換えても `--report` が指す JSON は**前 round のまま**になる。
毎 round 新しい path に出し、その path を渡す。

前 round との差を記録する。

| 差 | 扱い |
|---|---|
| 減った | 1 歩進んだ。 round を進めて Step 2 へ |
| 変わらない | 改善 0。 連続回数を +1 |
| 増えた | 悪化。 その round の変更を見直す (test を消していないか確認する) |

### Step 4 — 停止条件を見る

`references/loop-stop-conditions.md` が SSOT。 3 条件のいずれかで止める。

| # | 条件 | 次の動き |
|---|---|---|
| 1 | coverage は `uncovered === 0` / duration は 1 round 完了 | Step 5 |
| 2 | 改善 0 が 2 round 連続 | Step 6 (判断を仰ぐ) |
| 3 | round が上限 (既定 5) に達した | Step 6 (判断を仰ぐ) |

条件 2 を「1 round」 にしない。 1 round の改善 0 は、埋め方を変えれば進むことがある。
2 round 続いたら機械的にはこれ以上進めないとみなす。

### Step 5 — 達成した場合

ratchet を更新する。

```bash
node scripts/check-coverage-gates.mjs --update-high-water   # coverage のみ
```

**duration には ratchet が無い**。 更新するものが無いので何も実行しない。

round ごとの経過表を report に書き、応答にも出す。

### Step 6 — 届かなかった場合 (判断を仰ぐ)

**AI が「これは埋められない」 と決めて先へ進まない**。 残った未達を `/kiwa-verdict` に渡して
分類を得て、その分類を添えて user に判断を仰ぐ。

```
/kiwa-verdict --metric <metric> --input <gap json>
```

`/kiwa-verdict` は分類を **提案するだけ**で、実装削除も除外宣言も行わない。

user に出すのは 3 点。

| 項目 | 内容 |
|---|---|
| 何が残ったか | 件数と、file / 行番号 (または遅い file と lever) |
| なぜ止まったか | 停止条件 (2 または 3) と round ごとの経過 |
| 分類と提案 | `/kiwa-verdict` の 4 分類と、それぞれの対処案 |

AskUserQuestion で選択肢を出す。 分類ごとに採否が違うため、**分類単位で聞く**。

#### `/auto` 実行中は聞かない

`/auto` は AskUserQuestion を抑止する。 その場合は聞かずに次の 2 つを行う。

1. 残った未達と分類を follow-up Issue として起票する (`mcp__linear__save_issue` 直接呼出)
2. その Issue 番号を応答に列挙する

**判断はその Issue 上で行う**。 黙って落とすことはしない (`/auto` の scope-out 規約と同じ)。

## round ごとの経過表 (report に必須)

```markdown
| round | 未達 | 差 | 埋めた対象 |
|---|---|---|---|
| 0 | 58 | — | (測定のみ) |
| 1 | 52 | -6 | `src/passkey/setup-passkey-env.ts` の 6 行 |
| 2 | 52 | 0 | `src/oauth21/types.ts` — 型 gate で入力を組めず |
| 3 | 52 | 0 | 同上 (改善 0 が 2 round 連続 → 停止) |
```

差の列を必ず書く。 未達の値だけを並べると「進んだ round」 と「進まなかった round」 が
読み取れず、停止条件の判定を後から検証できない。

## 責務外

- **測らない**。 gap の算出は `/kiwa-gap`
- **書かない**。 test を書くのは生成 skill。 本 skill は呼ぶだけ
- **仕分けない**。 分類は `/kiwa-verdict`
- **実装を消さない**。 dead code と分類されても削除は user の判断
- **閾値を変えない**。 `THRESHOLDS` (90/80) / `MARGIN` (30%) / `--max-rounds` の上限は動かさない
- **並列度と timeout を変えない**。 duration の 1 歩は test の書き方を変えることに限る

## 完了条件

- 停止条件 3 つのいずれかで止まっている (無限に回っていない)
- round ごとの経過表に「未達」「差」「埋めた対象」 の 3 列が揃っている
- 達成した場合、ratchet を更新済
- 届かなかった場合、`/kiwa-verdict` の分類を添えて user に判断を仰いだ
  (`/auto` 中は follow-up Issue を起票し、番号を応答に列挙した)
- 既存 test を 1 件も削除 / 書き換えていない
- 各 round で埋めた対象が 1 件に絞られている (まとめて埋めていない)

## references

- `references/loop-stop-conditions.md` — 停止条件と 4 分類 (`/kiwa-verdict` 共用 SSOT)
- `references/existing-test-reuse.md` — 既存 test の再利用 (生成 skill に課す契約、`/kiwa-design` 実体)

## 関連

- 上流 = 生成 skill の完了条件が本 skill の起動を促す
- 下流 = `/kiwa-gap` (毎 round) / `/kiwa-verdict` (停止時) / 生成 skill (1 歩ごと)
- 起点 = Issue #2193
