---
name: kiwa-review
description: |
  kiwa skill chain で生成された test 仕様書 (`/kiwa-design` 出力) と test code (`/kiwa-forge` `/kiwa-hardhat` `/kiwa-play` 出力) を review する skill。
  3 mode — `spec-review` (生成 spec の 11 観点網羅 / 優先度妥当性 / 不足観点を判定) / `test-review` (spec vs 実装 test の整合 / 観点別 cover 率 / 追加すべき test を提案) / `result-review` (test 実行結果 / coverage 数値 / flaky 検出 / 統合 report 全体を集約 review)。
  3 言語 (TypeScript / Python / Solidity) の spec と test の整合 review を統一経路で扱う。
  単体起動 + 他 kiwa skill (kiwa-design / kiwa-forge / kiwa-hardhat / kiwa-play / kiwa-test) の完了 step から自動呼出。 report は `tests/reports/review/` に Write。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write
---

# /kiwa-review — kiwa test 仕様書 + test code review skill

`/kiwa-design` 出力 spec と Layer 2 (`/kiwa-forge` / `/kiwa-hardhat` / `/kiwa-play`) 出力 test の品質を independent agent として review し、 不足観点 / 優先度妥当性 / spec vs 実装整合を判定して改善提案を report 化する。 kiwa 11 観点 catalog を SSOT として参照、 外部 skill (例 `/critique`) には依存しない (kiwa repo 内で完結、 OSS user がそのまま使える)。

## 前提

- 対象 spec が `kiwa layers` の返す `spec_path` に存在 (`/kiwa-design` で生成済)。 **dir 名は layer 名と一致しない** = 20 layer 中 16 で `spec_dir` が layer id と別で、 file 名の suffix も layer id と違うものがある
- test-review mode の場合は 対応 test file が存在。 どこを見るかは `kiwa layers` が返すため本 file では列挙しない (§ test code の path も CLI から受け取る)
- 出力先 `tests/reports/review/` への Write 権限

## ユーザーのリクエスト

$ARGUMENTS

## オプション

- `--mode {spec-review|test-review|result-review}` — review mode (必須)
- `--module {name}` — 対象 module 名 (spec / test file の特定キー)
<!-- kiwa-layers:review-enum:start -->

- `--layer {contract|e2e|e2e-generic|a11y|integration|api|ui|data|cli|unit|orm-query|nextjs-server-action|nextjs-middleware|nextjs-rsc|nextjs-parallel-route|nextjs-rsc-streaming|edge-handler|auth|job-queue|cache|all}` — review 対象の layer を指定 (default `all`)。
  値は `kiwa-design` の enum と同一で、どちらも `docs/layers.json` から生成される。

<!-- kiwa-layers:review-enum:end -->
- `--spec-path {path}` — spec file path を明示指定 (`--module` の代替)
- `--test-path {path}` — test code path を明示指定 (test-review mode のみ、 省略時は `kiwa layers` が返す `test_paths.files` を使う)
- `--integrated-report {path}` — result-review mode で読む統合 report の exact path (必須、 writer の `/kiwa-test` が渡す)
- `--producer {skill}` — `kiwa layers --producer` にそのまま渡す `test_outputs` の鍵 (test-review mode で `--test-path` を省く時は必須、 鍵が 2 つある layer では省略不可)
- `--project-root {path}` — 生成先 (`{example}/...`) の起点。 `kiwa layers --project-root` にそのまま渡す (省略時は cwd)
- `--out {path}` — report 出力先を明示指定 (省略時は Step 0 の既定 path)。 `tests/reports/review/` 配下に限る
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

#### 同じ `--module` で 2 回呼ぶ時は `--out` が要る

**既定の名前は `{mode}` と `{module}` と言語しか区別しない**。 1 つの run で contract の test-review と e2e の test-review を同じ `--module` で回すと、 2 枚目が 1 枚目を上書きする。

区別するのは呼出側の責務で、 本 skill は渡された `--out` に書く。 呼出側だけが「この run で何回呼ぶか」 と「どう名付けたいか」 を知っているため、 runner 名や layer 名を本 skill が推測して足すことはしない (`/kiwa-observe` が `--out` で同じ形を採っている)。

`--out` は `tests/reports/review/` 配下に限る。 外を指す値は中断する = report path は `kiwa layers` の検査を通らないため、 起点の外に出る値をここで弾かないと誰も弾かない。

**呼出側が `--out` を渡さないまま同じ `--module` で 2 回呼んだ場合、 後勝ちになることを report と chain return に明記する**。 黙って上書きすると、 統合 report には 2 件の review が載っているのに実 file は 1 枚という状態になる。

### 入力 spec の path は CLI から受け取る

`--spec-path` を省略した時、 **自前で組み立てず `kiwa layers` に訊く**。 本 skill は `--layer` を引数で受けるため、 対象 layer はその値をそのまま渡す。

```bash
pnpm exec kiwa layers --json --layer "$LAYER" --lang "$DOC_LANG" --module "$MODULE" \
  --project-root "$PROJECT_ROOT"
```

返る `spec_path` は言語と module 名まで解決済 (`packages/cli/src/detect/layers.ts` の `withLangSuffix` / `withModule`)。 skill 側で `sed` を挟まない = module 名に separator が入ると path が spec directory の外を指す (`test-spec-../../etc/passwd.ui.md` を実測)。 CLI が `[a-z0-9-]` 1-32 字を強制して弾く。

#### 2 つの path は起点が違う

**`spec_path` は `--project-root` 起点、 `test_paths.files` は cwd 起点**。 同じ応答の中で基準が分かれているので、 同列に「返った値を Read する」 と読むと spec だけ外す。

| field | 起点 | Read する時 |
|---|---|---|
| `spec_path` | `--project-root` (省略時は cwd) | `$PROJECT_ROOT` を前置して開く |
| `test_paths.patterns` / `test_paths.files` | cwd | そのまま開く |

CLI 側は `spec_path` に lang と module しか差し込まず (`applyLang`)、 `test_paths` だけ `relativeTo(cwd, join(projectRoot, …))` で cwd 基準に直している。 宣言の出所が `docs/layers.json` と生成先で違うためで、 揃える先は skill ではなく CLI にあるが、 **読む側が起点を知らないまま使うと必ず外す**。

実測 (`examples/react-component-poc`、 ui layer / module `counter`、 cwd = repo root)。

```bash
pnpm exec kiwa layers --json --layer ui --lang en --module counter \
  --producer kiwa-ui --project-root examples/react-component-poc
# spec_path       = tests/spec/integration/test-spec-counter.ui.md      ← project-root 起点
# test_paths.files = examples/react-component-poc/tests/counter.test.tsx ← cwd 起点
```

この応答は下の検証表を全行 pass する。 そのまま `spec_path` を開くと `No such file or directory` になり、 test 側だけ読めた状態で「spec が無い」 と報告することになる。

`--project-root` を省いた (= `.`) 呼出では 2 つの起点が一致するため差が出ない。 **差が出ないことと、 起点が同じであることは別**。 Layer 2 skill は対象 project を cwd にして `--project-root .` で呼ぶためこの経路を踏まないが、 単体起動で repo root から `--project-root examples/<name>` を渡すと踏む。

`$DOC_LANG` は skill 引数の `--lang`。 **`LANG` を使わない** = shell の locale 変数で `ja_JP.UTF-8` 等が入っており、 CLI が ISO 639-1 でないとして拒否する。

`$MODULE` は skill 引数の `--module`。 必須で、 推測しない。

`$PROJECT_ROOT` は skill 引数の `--project-root` (省略時は `.`)。 **spec-review mode でも渡す** = 返る `spec_path` はこれを起点にするため、 省くと example 配下の spec を repo root から探すことになる。

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

最後から 2 行目を置くのは、 **上の全行を pass した応答でも Read が落ちる**から。 検査が「応答の形」 までで止まっていると、 起点違いも spec 未生成も同じ「spec が無い」 に潰れる。 開いた path を添えれば、 どちらなのかが report を読む側で分かる。

`.layers[] | select(.id == "<layer>")` で先に絞ってから、 取れた 1 件を見る。 **`.layers[0]` を取らない** = `--layer` を省いた応答では別 layer の 1 件目が返る。

`jq` が無い環境では `--json` の出力をそのまま読む。 `jq` は整形の手段であって、 解決の一部ではない。

#### 解決した値の扱い

自前で suffix を組むと 2 経路になり、 CLI 側の規約が変わった時に取り残される。 本 skill が唯一 suffix を知っている consumer だった状態がまさにその結果で、 `--lang ja` を付けると他の consumer が spec を見つけられなかった (#1855)。

**report path は本節の対象外**。 `tests/reports/review/` 配下は `kiwa layers` が解決する先ではなく、 別の場所の別の規約で決まる。

SKILL.md 内の `{lang}.md` 表記は上の解決結果に読み替える。 spec path 表記は説明のための例示で、 解決の指示ではない。

### test code の path も CLI から受け取る

test-review mode で `--test-path` を省略した時、 **同じ呼出に `--producer` と `--project-root` を足して `test_paths` を受け取る**。 表から自分で選ばない。

```bash
pnpm exec kiwa layers --json --layer "$LAYER" --lang "$DOC_LANG" --module "$MODULE" \
  --producer "$PRODUCER" --project-root "$PROJECT_ROOT"
```

返る `test_paths` の中身。

| field | 内容 |
|---|---|
| `producer` | 実際に読んだ `test_outputs` の鍵 |
| `anchor` | `project` (生成先) / `fixtures` (退避先) / `null` (どちらも 0 件) |
| `patterns` | 探した先。 0 件だった時に「どこを見たか」 を report に残すために使う |
| `files` | review 対象の test file 全件 |

**本 file に対応表を持たない**。 以前は `docs/layers.json` から生成した 21 行の表を持っていたが、 表が持つのは宣言だけで、 2 形のどちらを採るか / placeholder をどう埋めるか / 起点の外を指す値をどう扱うか / symlink を辿るかは呼出側の判断に残っていた。 その判断が skill の散文にしか無かった間に 2 つの欠陥が 8 round の review を通り抜けている (#1896)。 解決は `packages/cli/src/detect/layers.ts` の `resolveTestPaths` 1 箇所に閉じ、 本 skill は返った値を使う (#1899 / #1902)。

`$PRODUCER` は skill 引数の `--producer`。 どの生成元の成果物を review するかを知っているのは呼出側だけで、 **`consumer_skill` から引かない** = `contract` の `consumer_skill` は常に `kiwa-forge` で `kiwa-hardhat` は `also_consumed_by` 側にあり、 Hardhat の test を review する時も Foundry の `.t.sol` を探して 0 件になる。

`$PROJECT_ROOT` は skill 引数の `--project-root`。 Layer 2 skill は対象 project を cwd にして本 skill を呼ぶため、 通常は `.`。 省略時も cwd。

**`--test-path` は CLI を通らない**。 起点の外を指す値の拒否も、 symlink を辿らない照合も、 matcher 構文の検査も `kiwa layers` 側にあるため、 明示した path はそのまま Read される。 生成直後の exact path を渡す時に使い、 **推測した値を入れて検査を省く経路として使わない**。

失敗時の扱いは § 解決に失敗したら止める と同じ。 加えて `test_paths.files` が空なら中断し、 理由に `test_paths.patterns` を添える (観測対象が無いことと、 探す先が誤っていることを report で区別する)。

### Step 1: mode 判定 + 入力読込

`--mode` 引数で 3 分岐。 spec-review / test-review / result-review いずれかを必ず実行 (mode 未指定時はエラー停止 + AskUserQuestion で確認)。

#### 1A: spec-review mode

入力:
- spec file (§ 入力 spec の path は CLI から受け取る で解決した path) を Read
- 対象 contract / app / 仕様書 (任意、 spec の「対象機能」 section から path 抽出)

#### 1B: test-review mode

入力:
- spec file を Read
- 対応 test file は **`kiwa layers` に訊く**。 § test code の path も CLI から受け取る で解決する。
- 11 観点 catalog (`.claude/skills/kiwa-design/references/viewpoints-catalog.md`) を Read
- layer 別の専用観点を持つ 2 layer
  - `e2e-generic`: 9 column (Mode `static`/`fetch`/`node`/`ssr` + Route + Given + When + Then) を Layer 2 mapping と照合
  - `a11y`: 9 column (Mode `jsdom`/`playwright` + Component + WCAG-rule + Severity) を axe-core rule 適用率で照合

  列名の SSOT は `/kiwa-design` の `#### {layer} layer 専用 column` 節。 ここに挙げるのは
  照合に使う列だけで、 9 件全部は写さない (写すほど drift 面が増える)。 挙げた列名は宣言に
  実在するものに限る。

#### 1C: result-review mode

入力:
- `--integrated-report` で渡された統合 report を Read (`/kiwa-test` 完了時に生成済)。 **path は組み立てない** = `example` / `module` / `target` / 言語をすべて知る writer 側 (`/kiwa-test` § Step 5 統合 report Write) が exact path を渡す。 未指定、 path が repo 相対でない、 `tests/reports/integrated/` の外、 file が存在しない、 のいずれかなら開いた path を添えて中断する
- 各子 report も Read:
  - coverage report: **統合 report Section 2 の「coverage report」 行に載っている path を開く**。 file 名を組み立てない (Foundry / Hardhat 別 round 履歴も含む)
  - spec-review / test-review report: **統合 report Section 2 の「review report」 行に載っている path を開く**。 file 名を組み立てない (下記 § 子 review report の path)
- test 実行結果数値 (passing / failing / skipped / 各 round timing / flaky 指標)
- observe dashboard (`tests/reports/observe/dashboard-{example}-{layer}.{lang}.md`) を統合 report の Section 2 に載っている分だけ Read。 `/kiwa-test` Step 5a が layer ごとに書く。 **Section 2 が「observe 失敗」 や「observe skip」 と書いている行は読まない** = file が無い。 dashboard が 1 枚も無い場合も軸 3 (flaky 兆候) は従来どおり実行結果数値から判定する
- spec file の 「不足している仕様」 section (後追い項目の存在 check)

##### 子 review report の path

**`{example}` から file 名を組み立てない**。 Step 3 が書く名前は `--module` の値で決まり、 result-review を呼ぶ `/kiwa-test` が渡す `--module` は example 名なので、 module と example が違う layer (`ui` / `api` / `data` / `cli` / `unit` ...) では両者が食い違う。 組み立てた側は毎回外す。

読む先は統合 report Section 2 の「review report」 行で、 そこに載るのは各子 review が chain return した実 path (§ Step 4)。 observe dashboard と同じ経路にする = 観測対象の一覧は書いた側が持ち、 読む側は列挙を受け取るだけにする。

**載っていない / 載っているが実在しない場合は開いた path を控えて未測定に落とす**。 推定値で埋めるのは禁止で、 扱いは `references/result-review-axes.md` § 読めなかった時に推定で埋めない が SSOT。

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

`--out` が指定されていればその path、 省略時は Step 0 の言語別出力 path に 5 section format で Write。 **書いた path は Step 4 の chain return に載せる** (下流はこの値でしか report の在処を知れない)。

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
| **Weighted Score** | **{N.N}/10** | 1.00 | (7.0 以上で PASS。 未生成 TC / 未測定軸が 1 件でもあれば score に関わらず CONDITIONAL) |

未測定軸は score 欄に `—`、 重み付き欄に `0.00` を書く。 **weight 欄と分母は変えない** = 測れなかった軸を分母から外すと、 残りの軸だけで割り直して score が上がる。

**判定 — ✅ PASS / ⚠️ CONDITIONAL / ❌ FAIL** ({reason})

判定は 3 値で、 優先順位がある。

| 条件 | 判定 |
|---|---|
| 未解決の指摘がある | ❌ FAIL |
| 未生成 TC が 1 件以上ある | ⚠️ CONDITIONAL (score に関わらず) |
| 入力が無く未測定 (`—`) の軸がある | ⚠️ CONDITIONAL (score に関わらず) |
| 上記いずれも無く score 7.0 以上 | ✅ PASS |

CONDITIONAL は score より優先する。 score だけで決めると、 未生成 TC を分母から外した分だけ cover 率が上がって PASS に届く = gate を通すほど成績が良くなる。

未測定軸を同じ扱いにするのは、 **推定で埋めれば score が付いてしまう**から。 実測では result-review の軸 4 (weight 0.20) が 5 件中 5 件とも子 report 0 件のまま「推定」 で 9/10 を計上していた。 未測定軸は score 欄を `—`、 重み付き欄を `0.00` とし、 **分母は 1.00 のまま再正規化しない** (詳細 `references/result-review-axes.md` § 読めなかった時に推定で埋めない)。

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
- CONDITIONAL (未生成 TC あり / 未測定軸あり) → 呼出元の chain は継続する。 併せて未検証の観点と次の手 (どの module に何を export すれば生成できるか / どの report を先に作れば軸が埋まるか) を return し、 呼出元は統合 report にそのまま載せる
- FAIL critical あり → 呼出元に critical 指摘の summary を return、 user に AskUserQuestion で「無視して継続 / spec or test 修正 / chain 中断」を選ばせる

**3 値のいずれでも Step 3 で書いた report path を return に含める**。 呼出元 (`/kiwa-test`) は統合 report Section 2 にその path を書き、 後段の result-review が軸 4 でそれを読む。 return しないと下流は file 名を組み立てるしかなくなり、 module と example が違う layer で必ず外して軸 4 が未測定に落ちる (§ 子 review report の path)。

CONDITIONAL で chain を止めないのは、 未生成 TC が **生成器の判断であって欠陥ではない**から。 止めると「mock でもいいから足せ」 に戻る圧力になる。 一方で PASS と同じ扱いにすると未検証の観点が消えるので、 return と report に残す。

**呼出元は 3 値を受ける**。 PASS だけを継続条件にしている呼出元は CONDITIONAL を FAIL と解釈して止まり、 FAIL 以外を継続にしている呼出元は未検証の観点を落とす。 どちらも 3 値契約が end-to-end で成立しない。

`--no-auto-call` 指定時は chain return せず report Write だけで終了。

#### result-review mode: 軸 5 = 0 (後追い項目残存) 検出時の自動 Issue 化 (改善 3 / Issue #226)

`--mode result-review` で軸 5 (後追い項目 = spec の「不足している仕様」 bullet の Issue / TODO 紐付け率) の score = 0 を検出した場合、 後追い bullet が放置されている。 Step 4 で AskUserQuestion を強制発火する。

判定 logic。

1. spec file (§ 入力 spec の path は CLI から受け取る で解決した path) の「不足している仕様」 section から bullet 一覧を抽出
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

- Step 0 の言語別出力 path が 5 section format で Write 済
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
