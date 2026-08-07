---
name: kiwa-review
description: |
  kiwa skill chain で生成された test 仕様書 (`/kiwa-design` 出力) と test code (`/kiwa-forge` `/kiwa-hardhat` `/kiwa-play` `/kiwa-rust` `/kiwa-go` 出力) を review する skill。
  3 mode — `spec-review` (生成 spec の 11 観点網羅 / 優先度妥当性 / 不足観点を判定) / `test-review` (spec vs 実装 test の整合 / 観点別 cover 率 / 追加すべき test を提案) / `result-review` (test 実行結果 / coverage 数値 / flaky 検出 / 統合 report 全体を集約 review)。
  v1.4-6 (Issue #581) で polyglot 4 layer (rust-unit / rust-integration / go-unit / go-integration) 対応追加、 v1.5-6 (Issue #597) で polyglot 縦深化 4 layer (rust-axum / rust-actix-web / go-gin / go-echo) 対応追加、 v1.7-6 (Issue #627) で polyglot 継続深化 2 layer (rust-tower-http / go-fiber) 対応追加、 5 言語 (TS / Python / Solidity / Rust / Go) + 6 web framework (axum / actix-web / tower-http / gin / echo / fiber) の spec vs test 整合 review を統一経路で扱う。
  単体起動 + 他 kiwa skill (kiwa-design / kiwa-forge / kiwa-hardhat / kiwa-play / kiwa-rust / kiwa-go / kiwa-test) の完了 step から自動呼出。 report は `tests/reports/review/` に Write。
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
<!-- kiwa-layers:review-enum:start -->

- `--layer {contract|e2e|e2e-generic|a11y|integration|api|ui|data|cli|unit|orm-query|nextjs-server-action|nextjs-middleware|nextjs-rsc|nextjs-parallel-route|nextjs-rsc-streaming|edge-handler|auth|job-queue|cache|rust-unit|rust-integration|rust-axum|rust-actix-web|rust-tower-http|go-unit|go-integration|go-gin|go-echo|go-fiber|all}` — review 対象の layer を指定 (default `all`)。
  値は `kiwa-design` の enum と同一で、どちらも `docs/layers.json` から生成される。

<!-- kiwa-layers:review-enum:end -->
- `--spec-path {path}` — spec file path を明示指定 (`--module` の代替)
- `--test-path {path}` — test code path を明示指定 (test-review mode のみ、 default は spec から推定)
- `--lang {ja|en|<ISO 639-1>}` — report 生成言語 (省略時は Step 0 で AskUserQuestion、 詳細 `references/doc-language-selection.md`)
- `--no-auto-call` — 他 skill からの自動呼出ではなく単体起動として動作 (chain effect 抑制)
- `--no-issue-create` — result-review 軸 5 = 0 検出時の自動 Issue 化 AskUserQuestion を skip (CI / 自動化用、 改善 3 / Issue #226)

## 実行フロー

### Step 0: 文書生成言語の選択 (skill 起動時 1 回)

AskUserQuestion で review report の生成言語を確認。 `--lang {code}` 引数指定時は skip。

選択肢 — 🇯🇵 日本語 (ja、 Recommended) / 🇬🇧 English (en) / 🌏 その他多言語 (free input)。 詳細 `references/doc-language-selection.md`。

確定後の言語 `$DOC_LANG` は Step 3 (report Write) で参照。 出力 path (Issue #341 SSOT):
- ja → `tests/reports/review/{mode}-review-{module}.ja.md`
- en → `tests/reports/review/{mode}-review-{module}.md`
- その他 → `tests/reports/review/{mode}-review-{module}.{lang_code}.md`

#### lang suffix 規約 (SSOT)

producer (`/kiwa-design`) と consumer (`/kiwa-test` / `/kiwa-review`) の file 名規約一致:

**path は CLI から受け取る。 自前で組み立てない。**

```bash
kiwa layers --json --layer "$LAYER" --lang "$DOC_LANG" \
  | jq -r '.layers[0].spec_path' \
  | sed "s/{module}/$MODULE/"
```

返る `spec_path` は言語込みで解決済 (`packages/cli/src/detect/layers.ts` の `withLangSuffix`)。 en と省略は suffix なし、 ja は `.ja`、 その他 ISO 639-1 は `.{code}` で、 layer suffix (`.api` 等) とは直交して言語が常に末尾に来る。

`$DOC_LANG` は skill 引数の `--lang`。 **`LANG` を使わない** = shell の locale 変数で `ja_JP.UTF-8` 等が入っており、 CLI が ISO 639-1 でないとして拒否する。

自前で `LANG_SUFFIX` を組むと 2 経路になり、 CLI 側の規約が変わった時に取り残される。 本 skill が唯一 suffix を知っている consumer だった状態がまさにその結果で、 `--lang ja` を付けると他の consumer が spec を見つけられなかった (#1855)。

SKILL.md 内の `{lang}.md` 表記は上の解決結果に読み替える。

### Step 1: mode 判定 + 入力読込

`--mode` 引数で 3 分岐。 spec-review / test-review / result-review いずれかを必ず実行 (mode 未指定時はエラー停止 + AskUserQuestion で確認)。

#### 1A: spec-review mode

入力:
- spec file (`tests/spec/{layer}/test-spec-{module}.{lang}.md`) を Read
- 対象 contract / app / 仕様書 (任意、 spec の「対象機能」 section から path 抽出)

#### 1B: test-review mode

入力:
- spec file を Read
- 対応 test file は下表で特定する (`docs/layers.json` から生成)。

<!-- kiwa-layers:resolver:start -->

| layer | 書き手 | 対応 test file |
|---|---|---|
| `contract` | `/kiwa-forge` | `{example}/test/*.t.sol` または `tests/fixtures/{example}/contract-test/{Contract}.t.sol` |
| `contract` | `/kiwa-hardhat` | `{example}/test/*.test.ts` または `tests/fixtures/{example}/hardhat-test/{Contract}.test.cjs` |
| `e2e` | `/kiwa-play` | `{example}/tests/*.spec.ts` または `tests/fixtures/{example}/e2e-test/{example}.spec.ts` |
| `e2e-generic` | `/kiwa-e2e` | `{example}/tests/e2e/{module}.spec.ts` |
| `a11y` | `/kiwa-a11y` | `{example}/tests/a11y/{module}.test.tsx` または `{example}/tests/a11y/{module}.spec.ts` |
| `integration` | `/kiwa-api` | `{example}/test/integration/{module}.test.ts` |
| `api` | `/kiwa-api` | `{example}/test/integration/{module}.api.test.ts` |
| `ui` | `/kiwa-ui` | `{example}/tests/{module}.test.tsx` |
| `data` | `/kiwa-data` | `{example}/tests/{module}.data.test.ts` |
| `cli` | `/kiwa-cli-test` | `{example}/tests/{module}.cli.test.ts` |
| `unit` | `/kiwa-vitest` | `{example}/test/unit/{module}.test.{ts,tsx}` |
| `orm-query` | `/kiwa-orm` | `{example}/tests/{module}.orm.test.ts` |
| `nextjs-server-action` | `/kiwa-nextjs` | `{example}/tests/integration/{module}.nextjs.test.ts` |
| `nextjs-middleware` | `/kiwa-nextjs` | `{example}/tests/integration/{module}.middleware.test.ts` |
| `nextjs-rsc` | `/kiwa-nextjs` | `{example}/tests/integration/{module}.rsc.test.ts` |
| `nextjs-parallel-route` | `/kiwa-nextjs` | `{example}/tests/integration/{module}.parallel.test.ts` |
| `nextjs-rsc-streaming` | `/kiwa-nextjs` | `{example}/tests/integration/{module}.rsc-streaming.test.ts` |
| `edge-handler` | `/kiwa-edge` | `{example}/tests/{module}.edge.test.ts` |
| `auth` | `/kiwa-auth` | `{example}/tests/{module}.auth.test.ts` |
| `job-queue` | `/kiwa-queue` | `{example}/tests/{module}.queue.test.ts` |
| `cache` | `/kiwa-cache` | `{example}/tests/{module}.cache.test.ts` |
| `rust-unit` | `/kiwa-rust` | `{example}/tests/{module}.rs` |
| `rust-integration` | `/kiwa-rust` | `{example}/tests/{module}.rs` |
| `rust-axum` | `/kiwa-rust` | `{example}/tests/{module}_axum.rs` |
| `rust-actix-web` | `/kiwa-rust` | `{example}/tests/{module}_actix.rs` |
| `rust-tower-http` | `/kiwa-rust` | `{example}/tests/{module}_tower_http.rs` |
| `go-unit` | `/kiwa-go` | `{example}/{module}_test.go` |
| `go-integration` | `/kiwa-go` | `{example}/integration/{module}_test.go` |
| `go-gin` | `/kiwa-go` | `{example}/{module}_gin_test.go` |
| `go-echo` | `/kiwa-go` | `{example}/{module}_echo_test.go` |
| `go-fiber` | `/kiwa-go` | `{example}/{module}_fiber_test.go` |

<!-- kiwa-layers:resolver:end -->
- 11 観点 catalog (`.claude/skills/kiwa-design/references/viewpoints-catalog.md`) を Read
- 新 3 layer 専用観点の追加 SSOT
  - `e2e-generic`: 9 column (Mode `static`/`fetch`/`node`/`ssr` + Route + Action + Expected) を Layer 2 mapping と照合
  - `a11y`: 9 column (Mode `jsdom`/`playwright` + Component + WCAG-rule + Severity) を axe-core rule 適用率で照合

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
| **TC ID mapping** | spec の全 TC ID が test code に存在 (1:1 mapping)、 spec にない test ID は許容するが flag。 意図的に生成しなかった TC は下記 § 未生成 TC の扱い に従って除く | spec TC 100% 実装 (未生成 TC を除く)、 余剰 test は別途記載 |
| **観点 grouping 一致** | test code の describe / コメント (`// 観点 N: {name}`) が spec の観点 grouping と一致 | 全観点 grouping が spec と同名 |
| **assertion 品質** | spec の「期待結果」 column と test の `expect()` / `assertEq()` が意味的に対応、 truthy 判定 (`toBeTruthy()`) ではなく具体値 assertion | 抽象 assertion (`toBeTruthy` 等) 0 件、 具体値検証 |
| **観点別 cover 率** | 観点ごとに spec TC が全件実装されているか (例 観点 5 権限が 5 TC 設計、 test に 3 件しかなければ 60%)。 未生成 TC は母数から除く | 各観点 100% (実装漏れなし、 未生成 TC を除く) |
| **追加すべき test 提案** | spec にも test にも無いが、 contract / UI 実装を見て「この観点 / 機能の test も追加すべき」 と判定 | 提案を report に列挙 (実装漏れと将来 enhancement を区別) |

各軸 0-10 score、 `weighted_score = (mapping 0.3 + grouping 0.15 + assertion 0.25 + cover 0.2 + 提案 0.1)` で総合判定。

##### 未生成 TC の扱い

Layer 2 は spec の TC を全件 test にするとは限らない。 生成しないと判断した TC は、 生成 test の **冒頭 2 行**に残っている。

```
// mock: store, findUserByEmail, createUser
// 未生成: T-NA-050, T-NA-070 (冪等性 / セキュリティ)。 ./lib/users.ts に reset か seed を export すれば生成できる
```

この 2 行があれば、 列挙された TC ID を **実装漏れと分けて数える**。 TC ID mapping の分母からも、 観点別 cover 率の分母からも除く。

**除くだけで済ませない**。 report には「未生成」 として別枠で列挙し、 冒頭行に書かれた次の手 (どの module に何を export すれば生成できるか) をそのまま載せる。 分母から消しただけだと、 検証されていない観点があることが report から消える。

理由は `skills/kiwa-nextjs/SKILL.md` § 差し替えた module に答えを預けた TC は生成しない にある。 module ごと差し替えた test は mock の実装を測るだけなので、 通っても何も証明しない。 それを実装漏れとして数えると「mock でもいいから足せ」 という圧力になり、 落ちようのない test が戻る。

冒頭 2 行が無い test は従来どおり全件を分母に入れる。 記録が無いことを「意図的に生成しなかった」 と解釈しない (fail-closed)。

**除外を score の得点に変えない**。 分母から外すと cover 率は上がる。 未生成 TC を持つ run が、 全件生成した run より高い `weighted_score` を出しうる = gate を通すほど成績が良くなる。

そのため未生成 TC が 1 件でもある場合、 総合判定は PASS にしない。 `CONDITIONAL` として返し、 未検証の観点と次の手を添える。 score は参考値として併記するが、 判定の根拠にしない。

判定を分けるのは、 「全件通った」 と「一部は測っていないが残りは通った」 が別の状態だから。 数字 1 つに畳むと後者が前者に見える。

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
| **Weighted Score** | **{N.N}/10** | 1.00 | (7.0 以上で PASS。 未生成 TC が 1 件でもあれば score に関わらず CONDITIONAL) |

**判定 — ✅ PASS / ⚠️ CONDITIONAL / ❌ FAIL** ({reason})

判定は 3 値で、 優先順位がある。

| 条件 | 判定 |
|---|---|
| 未解決の指摘がある | ❌ FAIL |
| 未生成 TC が 1 件以上ある | ⚠️ CONDITIONAL (score に関わらず) |
| 上記いずれも無く score 7.0 以上 | ✅ PASS |

CONDITIONAL は score より優先する。 score だけで決めると、 未生成 TC を分母から外した分だけ cover 率が上がって PASS に届く = gate を通すほど成績が良くなる。

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
- CONDITIONAL (未生成 TC あり) → 呼出元の chain は継続する。 併せて未検証の観点と次の手 (どの module に何を export すれば生成できるか) を return し、 呼出元は統合 report にそのまま載せる
- FAIL critical あり → 呼出元に critical 指摘の summary を return、 user に AskUserQuestion で「無視して継続 / spec or test 修正 / chain 中断」を選ばせる

CONDITIONAL で chain を止めないのは、 未生成 TC が **生成器の判断であって欠陥ではない**から。 止めると「mock でもいいから足せ」 に戻る圧力になる。 一方で PASS と同じ扱いにすると未検証の観点が消えるので、 return と report に残す。

**呼出元は 3 値を受ける**。 PASS だけを継続条件にしている呼出元は CONDITIONAL を FAIL と解釈して止まり、 FAIL 以外を継続にしている呼出元は未検証の観点を落とす。 どちらも 3 値契約が end-to-end で成立しない。

`--no-auto-call` 指定時は chain return せず report Write だけで終了。

#### result-review mode: 軸 5 = 0 (後追い項目残存) 検出時の自動 Issue 化 (改善 3 / Issue #226)

`--mode result-review` で軸 5 (後追い項目 = spec の「不足している仕様」 bullet の Issue / TODO 紐付け率) の score = 0 を検出した場合、 後追い bullet が放置されている。 Step 4 で AskUserQuestion を強制発火する。

判定 logic。

1. spec file (`tests/spec/{layer}/test-spec-{module}.{lang}.md`) の「不足している仕様」 section から bullet 一覧を抽出
2. 各 bullet について Issue 番号 (`#NNN`) / TODO 注記 (`TODO:` / `FIXME:`) の引用が末尾にあるか check
3. 引用率 = 0 (どの bullet にも紐付けがない) なら軸 5 = 0 critical 警告となる

検出時のアクション。

```text
question: "spec の「不足している仕様」 に {N} 件 bullet があるが、 Issue / TODO 紐付けが 0 件です。 どう処理しますか?"
header: "後追い項目"
multiSelect: false

選択肢:
- label: "🆕 全 {N} 件を別 Issue 化 (gh api で自動起票) (Recommended)"
  description: "理由 — spec の後追い項目を恒久的に追跡可能化、 result-review 軸 5 critical を解消。 1 bullet = 1 Issue で起票、 title は「feat-improve(spec): {module} の不足仕様『{bullet 1 行目 40 字}』 を解消」、 body は bullet + 関連 spec file path を含む。 ⭐⭐⭐⭐⭐"
- label: "📝 spec file に TODO 注記を追加 (各 bullet 末尾に TODO: 追記)"
  description: "理由 — Issue 化までは大げさだが追跡したい、 spec 内に TODO 注記を残す。 軸 5 = 部分 score (0.5 程度) に格上げ。 ⭐⭐⭐"
- label: "⏭️ そのまま完了 (軸 5 = 0 を許容)"
  description: "理由 — bullet は spec author の memo として後で読めば良い、 自動追跡は不要。 result-review weighted_score が落ちることを許容。 ⭐⭐"
```

`🆕` 選択時は `gh api repos/{owner}/{repo}/issues --method POST` で N 件並列起票 (template = `feat-improve`、 `Closes` は持たず、 PR 起票時に手動連携)。 起票後 spec file 内の対応 bullet 末尾に Issue 番号を `Edit` で書き戻し、 軸 5 を再計算する。

`📝` 選択時は spec file の各 bullet 末尾に ` (TODO: 後追い)` を追記し、 軸 5 を再計算。

`⏭️` 選択時は何もせず Step 4 を通常 chain return で終了。

`--no-issue-create` 引数 (新規追加予定) で本判定を skip 可能 (CI / 自動化用)。

## 完了条件

- `tests/reports/review/{mode}-review-{module}.{lang}.md` が 5 section format で Write 済
- weighted_score が計算されて判定 (PASS / CONDITIONAL / FAIL) 確定
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
