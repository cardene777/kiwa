---
name: kiwa-review
description: |
  kiwa skill chain で生成された test 仕様書 (`/kiwa-design` 出力) と test code (`/kiwa-forge` `/kiwa-hardhat` `/kiwa-play` 出力) を review する skill。
  3 mode — `spec-review` (生成 spec の 11 観点網羅 / 優先度妥当性 / 不足観点を判定) / `test-review` (spec vs 実装 test の整合 / 観点別 cover 率 / 追加すべき test を提案) / `result-review` (test 実行結果 / coverage 数値 / flaky 検出 / 統合 report 全体を集約 review)。
  単体起動 + 他 kiwa skill (kiwa-design / kiwa-forge / kiwa-hardhat / kiwa-play / kiwa-test) の完了 step から自動呼出。 report は `tests/reports/review/` に Write。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write
---

# /kiwa-review — kiwa test 仕様書 + test code review skill

`/kiwa-design` 出力 spec と Layer 2 (`/kiwa-forge` / `/kiwa-hardhat` / `/kiwa-play`) 出力 test の品質を independent agent として review し、 不足観点 / 優先度妥当性 / spec vs 実装整合を判定して改善提案を report 化する。 kiwa 11 観点 catalog を SSOT として参照、 外部 skill (例 `/critique`) には依存しない (kiwa repo 内で完結、 OSS user がそのまま使える)。

## 前提

- 対象 spec が `tests/spec/{layer}/test-spec-{module}.{lang}.md` に存在 (`/kiwa-design` で生成済)
- test-review mode の場合は 対応 test file が `examples/{X}/test/` `examples/{X}/hardhat-test/` `examples/{X}/tests/` または `tests/fixtures/{X}/...` に存在
- 出力先 `tests/reports/review/` への Write 権限

## ユーザーのリクエスト

$ARGUMENTS

## オプション

- `--mode {spec-review|test-review|result-review}` — review mode (必須)
- `--module {name}` — 対象 module 名 (spec / test file の特定キー)
- `--layer {contract|e2e|integration|unit|all}` — spec layer (default `all`、 spec path 解決に使用)
- `--spec-path {path}` — spec file path を明示指定 (`--module` の代替)
- `--test-path {path}` — test code path を明示指定 (test-review mode のみ、 default は spec から推定)
- `--lang {ja|en|<ISO 639-1>}` — report 生成言語 (省略時は Step 0 で AskUserQuestion、 詳細 `references/doc-language-selection.md`)
- `--no-auto-call` — 他 skill からの自動呼出ではなく単体起動として動作 (chain effect 抑制)

## 実行フロー

### Step 0: 文書生成言語の選択 (skill 起動時 1 回)

AskUserQuestion で review report の生成言語を確認。 `--lang {code}` 引数指定時は skip。

選択肢 — 🇯🇵 日本語 (ja、 Recommended) / 🇬🇧 English (en) / 🌏 その他多言語 (free input)。 詳細 `references/doc-language-selection.md`。

確定後の言語 `$DOC_LANG` は Step 3 (report Write) で参照。 出力 path:
- ja → `tests/reports/review/{mode}-review-{module}.ja.md`
- en → `tests/reports/review/{mode}-review-{module}.md`
- その他 → `tests/reports/review/{mode}-review-{module}.{lang_code}.md`

### Step 1: mode 判定 + 入力読込

`--mode` 引数で 3 分岐。 spec-review / test-review / result-review いずれかを必ず実行 (mode 未指定時はエラー停止 + AskUserQuestion で確認)。

#### 1A: spec-review mode

入力:
- spec file (`tests/spec/{layer}/test-spec-{module}.{lang}.md`) を Read
- 対象 contract / app / 仕様書 (任意、 spec の「対象機能」 section から path 抽出)

#### 1B: test-review mode

入力:
- spec file を Read
- 対応 test file を Glob で特定:
  - Foundry: `{example}/test/*.t.sol` or `tests/fixtures/{example}/contract-test/*.t.sol`
  - Hardhat: `{example}/hardhat-test/*.test.cjs` or `tests/fixtures/{example}/hardhat-test/*.test.cjs`
  - Playwright: `{example}/tests/*.spec.ts` or `tests/fixtures/{example}/e2e-test/*.spec.ts`
- 11 観点 catalog (`.claude/skills/kiwa-design/references/viewpoints-catalog.md`) を Read

#### 1C: result-review mode

入力:
- 統合 report (`tests/reports/integrated/{example}-{target}.{lang}.md`) を Read (`/kiwa-test` 完了時に生成済)
- 各子 report も Read:
  - coverage report: `tests/reports/contract/coverage-report-{example}.{lang}.md` (Foundry / Hardhat 別 round 履歴も含む)
  - spec-review report: `tests/reports/review/spec-review-{example}.{lang}.md`
  - test-review report: `tests/reports/review/test-review-{example}.{lang}.md`
- test 実行結果数値 (passing / failing / skipped / 各 round timing / flaky 指標)
- spec file の 「不足している仕様」 section (後追い項目の存在 check)

### Step 2: review 実行 (mode 別)

#### 2A: spec-review mode の review 観点 (5 軸)

| 軸 | 評価内容 | passing 基準 |
|---|---|---|
| **観点網羅** | 11 観点 catalog のうち、 spec が選択しなかった観点について「適用条件を満たすのに選択漏れ」が無いか判定 | 適用条件を満たす全観点が選択されている |
| **TC 件数妥当性** | 観点ごとに最低 1 件 (正常系は 1+)、 高リスク機能は 観点あたり 3+ 件 | 各観点で 1+ TC、 高リスク機能は密度高 |
| **優先度妥当性** | リスク表との整合、 「全 TC が低」 等の偏り検出 | リスク 5 基準と優先度判定が一致 |
| **入力 / 期待結果の具体性** | 抽象表現 (「適切に」「正しく」) 禁止、 具体値 / 具体 assertion | 全 TC で具体値、 abstract phrase 0 件 |
| **不足している仕様 section の使い方** | 仕様不明点が「不足している仕様」 に bullet 化されている、 spec が勝手に補完していない | 不明点が明示、 「(なし)」 は仕様完備の場合のみ |

各軸に 0-10 score を付与、 `weighted_score = (網羅 0.3 + 件数 0.2 + 優先度 0.2 + 具体性 0.2 + 不足明示 0.1)` で総合判定 (7.0 以上で PASS)。

#### 2B: test-review mode の review 観点 (5 軸)

| 軸 | 評価内容 | passing 基準 |
|---|---|---|
| **TC ID mapping** | spec の全 TC ID が test code に存在 (1:1 mapping)、 spec にない test ID は許容するが flag | spec TC 100% 実装、 余剰 test は別途記載 |
| **観点 grouping 一致** | test code の describe / コメント (`// 観点 N: {name}`) が spec の観点 grouping と一致 | 全観点 grouping が spec と同名 |
| **assertion 品質** | spec の「期待結果」 column と test の `expect()` / `assertEq()` が意味的に対応、 truthy 判定 (`toBeTruthy()`) ではなく具体値 assertion | 抽象 assertion (`toBeTruthy` 等) 0 件、 具体値検証 |
| **観点別 cover 率** | 観点ごとに spec TC が全件実装されているか (例 観点 5 権限が 5 TC 設計、 test に 3 件しかなければ 60%) | 各観点 100% (実装漏れなし) |
| **追加すべき test 提案** | spec にも test にも無いが、 contract / UI 実装を見て「この観点 / 機能の test も追加すべき」 と判定 | 提案を report に列挙 (実装漏れと将来 enhancement を区別) |

各軸 0-10 score、 `weighted_score = (mapping 0.3 + grouping 0.15 + assertion 0.25 + cover 0.2 + 提案 0.1)` で総合判定。

### Step 3: report Write

`tests/reports/review/{mode}-review-{module}.{$DOC_LANG}.md` に 5 section format で Write。

```markdown
# {Mode} Review Report — {module}

Generated: {ISO8601}
Skill: /kiwa-review --mode {mode}
Target: {spec_path} / {test_paths}

## 1. 判定サマリ

| 軸 | スコア | weight | 重み付き |
|---|---|---|---|
| {軸 1} | 8/10 | 0.30 | 2.40 |
| {軸 2} | ... | ... | ... |
| **Weighted Score** | **{N.N}/10** | 1.00 | (7.0 以上で PASS) |

**判定 — ✅ PASS / ❌ FAIL** ({reason})

## 2. critical / major 指摘

### 1. {severity}: {issue}
- **場所**: {spec section or test file:line}
- **詳細**: {issue}
- **改善案**: {suggestion}

### 2. ...

## 3. minor 指摘 (参考)

...

## 4. 追加すべき test 提案 (test-review mode のみ)

| 観点 | 提案 TC | 理由 |
|---|---|---|
| 11 回帰 | grantTimedAccess(addr, 0) で 0 秒 grant が即時 expire するか | spec に未設計、 contract 側 edge case |
| 4 状態遷移 | listing 中の NFT を seller が approve 取り消した場合 | spec の前提条件 column が薄い |

## 5. 総評

{3-5 文の総合評価、 spec / test code の強み・弱み・次のアクション推奨}
```

### Step 4: chain return

他 skill から自動呼出された場合 (例 `/kiwa-design` 完了後の auto call)、 review 結果を呼出元に return:
- PASS → 呼出元の chain 継続 (次 skill 起動)
- FAIL critical あり → 呼出元に critical 指摘の summary を return、 user に AskUserQuestion で「無視して継続 / spec or test 修正 / chain 中断」を選ばせる

`--no-auto-call` 指定時は chain return せず report Write だけで終了。

## 完了条件

- `tests/reports/review/{mode}-review-{module}.{lang}.md` が 5 section format で Write 済
- weighted_score が計算されて判定 (PASS / FAIL) 確定
- critical / major 指摘 + 追加 test 提案が列挙
- 自動呼出時は呼出元への chain return が正しく動作

## 他 kiwa skill との chain 連携

| 呼出元 skill | 呼出 mode | 呼出タイミング | 用途 |
|---|---|---|---|
| `/kiwa-design` Step 5 完了後 | `spec-review` | spec 生成完了、 Layer 2 へ進む前 | 観点漏れ / 優先度判定ミス を check |
| `/kiwa-forge` Step 5d 完了後 | `test-review` | Foundry test 生成 + auto loop 完了後 | spec vs test 整合、 追加 test 提案 |
| `/kiwa-hardhat` Step 5d 完了後 | `test-review` | Hardhat test 生成 + auto loop 完了後 | 同上 |
| `/kiwa-play` Step 9 完了後 | `test-review` | Playwright spec 生成 + 4 round PASS 後 | 同上、 UI 起点 e2e 整合 |
| `/kiwa-test` Step 5 完了後 | `result-review` | 統合 report 生成後、 全 chain 完了時 | coverage / passing / flaky / 子 review score を集約 review、 後追い項目を最終 check |

各 skill の SKILL.md には「完了 step の末尾で `/kiwa-review --mode {spec|test}-review --module {X}` を内部呼出」 と明記される (本 skill 新設に伴う SKILL.md 修正)。

## references

- `references/spec-review-axes.md` — spec-review mode の 5 軸詳細 + 評価例 + score 判定基準
- `references/test-review-axes.md` — test-review mode の 5 軸詳細 + 評価例 + score 判定基準
- `references/result-review-axes.md` — result-review mode の 5 軸詳細 + 評価例 + score 判定基準
- `references/doc-language-selection.md` — 文書生成言語選択 共通 SSOT (kiwa skill 共用、 symlink で参照)

## 関連

- 観点 SSOT: `.claude/skills/kiwa-design/references/viewpoints-catalog.md` (11 観点 catalog)
- spec format SSOT: `docs/SKILL-DESIGN.ja.md` (9 section 統一テンプレ)
- 親 Issue (本 skill の motivation): #215 (mint-nft fixtures 化 docs 検証で gap 発見、 reviewer agent 欠落を補完)
- 同並列 skill: `/kiwa-design` `/kiwa-forge` `/kiwa-hardhat` `/kiwa-play`
