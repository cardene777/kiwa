---
name: kiwa-test
description: |
  kiwa の skill chain (kiwa-design → kiwa-forge / kiwa-hardhat / kiwa-play → kiwa-review) を 1 コマンドで一括実行する統合フロー skill。
  contract test / dApp e2e test / 両方 を user に選ばせ、 指定 example で 0 から spec 生成 → test code 生成 → 実走 → review → 統合 report Write まで一気通貫。
  repo root から `/kiwa-test --example {name}` で起動、 内部で cwd 切替 + 子 skill 起動を行う。 report は `tests/reports/integrated/{example}-{target}.{lang}.md` に Write。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write
---

# /kiwa-test — kiwa skill chain 統合フロー skill

`/kiwa-design` → `/kiwa-forge` / `/kiwa-hardhat` / `/kiwa-play` → `/kiwa-review` を 1 コマンドで一括実行する orchestrator。 contract test / dApp e2e test / 両方 を user に選ばせ、 全 step を順次起動して最後に統合 report を Write する。 個別 skill を user が手動で順次叩く負担を解消、 OSS user が「とりあえず /kiwa-test --example X で全部走る」状態を実現。

## 前提

- repo root で起動 (cwd = kiwa repo root)
- 対象 example が `examples/{example}/` に存在 (`--example` 引数で指定)
- `examples/{example}/contracts/` (contract target 時) / `examples/{example}/app/` (dapp target 時) が存在
- pnpm install 済 + Foundry / Node.js 22+ / Playwright chromium install 済 (環境依存は子 skill 側で check)

## ユーザーのリクエスト

$ARGUMENTS

## オプション

- `--example {name}` — 対象 example 名 (必須、 `examples/{name}/` を参照)
- `--target {contract|dapp|both}` — 実行範囲 (省略時は Step 1 で AskUserQuestion)
- `--mode {sequential|parallel}` — target=both 時の実行順 (default `sequential`、 contract → dapp)
- `--lang {ja|en|<ISO 639-1>}` — 文書生成言語 (省略時は Step 0 で AskUserQuestion、 全子 skill に伝播)
- `--no-review` — 子 skill の review step (kiwa-review) を skip (全子 skill に `--no-review` を渡す)
- `--no-coverage-loop` — coverage auto loop を skip (kiwa-forge / kiwa-hardhat の auto loop を 1 round で終わる)
- `--no-codex` — kiwa-play の Codex 委譲を skip (test 件数 1-2 のみ推奨)
- `--rounds {N}` — Playwright 4 round 連続 PASS 検証の round 数 (default 4、 kiwa-play に伝播)
- `--auto-cleanup` — Step 2.5 既存 test 検出時の AskUserQuestion を skip + 自動削除 (CI / 自動化用)
- `--no-auto-fix` — Step 5c auto-fix loop を skip (review FAIL でも修正試行せず終了、 CI / 単発確認用)

## 実行フロー

### Step 0: 文書生成言語の選択 (skill 起動時 1 回)

AskUserQuestion で文書生成言語を user に確認。 `--lang {code}` 引数指定時は skip。 詳細仕様は `references/doc-language-selection.md`。

確定後 `$DOC_LANG` を全子 skill に `--lang $DOC_LANG` で渡す。

### Step 1: target 選択 (skill 起動時 1 回)

`--target` 引数指定時は skip、 省略時は AskUserQuestion で確認:

```text
question: "実行する test 範囲を選択してください"
header: "test 範囲"
multiSelect: false

選択肢:
- label: "🔷 contract のみ (Foundry + Hardhat) (Recommended)"
  description: "理由 — 小規模 dApp / contract 中心の変更時。 kiwa-design (--layer contract) → kiwa-forge → kiwa-hardhat → kiwa-review の 4 step。 実行時間目安 5-10 分。 ⭐⭐⭐⭐⭐"
- label: "🌐 dApp e2e のみ (Playwright)"
  description: "理由 — UI / wallet flow 中心の変更時。 kiwa-design (--layer e2e) → kiwa-play → kiwa-review の 3 step。 実行時間目安 5-10 分。 ⭐⭐⭐⭐"
- label: "🔷+🌐 両方 (contract + dApp)"
  description: "理由 — full coverage check。 contract → dApp の順で順次実行 (--mode sequential が default)。 実行時間目安 15-25 分。 ⭐⭐⭐⭐"
```

確定後 `$TARGET` を skill 内変数に保持 (`contract` / `dapp` / `both`)。

### Step 2: 環境 + dir check

```bash
cd /Users/cardene/Desktop/projects/kiwa    # repo root に確実に移動 (caller cwd 依存防止)

# example dir 存在 check
[ -d "examples/$EXAMPLE" ] || { echo "ERROR: examples/$EXAMPLE が存在しません"; exit 1; }

# contract target check
if [ "$TARGET" = "contract" ] || [ "$TARGET" = "both" ]; then
  [ -d "examples/$EXAMPLE/contracts" ] || { echo "ERROR: examples/$EXAMPLE/contracts/ が存在しません"; exit 1; }
fi

# dapp target check
if [ "$TARGET" = "dapp" ] || [ "$TARGET" = "both" ]; then
  [ -d "examples/$EXAMPLE/app" ] || { echo "ERROR: examples/$EXAMPLE/app/ が存在しません (dapp target は app/ が必要)"; exit 1; }
fi

# 環境 check
forge --version || echo "WARN: Foundry 未 install"
node --version
```

エラー時は skill 停止 + 原因 + 解決方法を user に return。

### Step 2.5: 既存 test 検出 + 削除確認

retrofit walkthrough は examples 側を空 dir 状態から開始するため、 既存 test (`examples/{example}/test/` `hardhat-test/` `tests/`) が存在する場合は user に削除確認する。

```bash
# 検出ロジック
EXISTING=()
[ "$TARGET" != "dapp" ] && [ -d "examples/$EXAMPLE/test" ] && [ -n "$(ls -A examples/$EXAMPLE/test 2>/dev/null)" ] && EXISTING+=("examples/$EXAMPLE/test")
[ "$TARGET" != "dapp" ] && [ -d "examples/$EXAMPLE/hardhat-test" ] && [ -n "$(ls -A examples/$EXAMPLE/hardhat-test 2>/dev/null)" ] && EXISTING+=("examples/$EXAMPLE/hardhat-test")
[ "$TARGET" != "contract" ] && [ -d "examples/$EXAMPLE/tests" ] && [ -n "$(ls -A examples/$EXAMPLE/tests 2>/dev/null)" ] && EXISTING+=("examples/$EXAMPLE/tests")
# spec 既存 check
[ -f "tests/spec/contract/test-spec-${EXAMPLE}.${DOC_LANG}.md" ] && EXISTING+=("tests/spec/contract/test-spec-${EXAMPLE}.${DOC_LANG}.md")
[ -f "tests/spec/e2e/test-spec-${EXAMPLE}.${DOC_LANG}.md" ] && EXISTING+=("tests/spec/e2e/test-spec-${EXAMPLE}.${DOC_LANG}.md")
```

既存 file / dir 検出時は AskUserQuestion で 3 択:

```text
question: "examples/{example}/ と tests/spec/ に既存 file が検出されました。 どう処理しますか?"
header: "既存 test 処理"
multiSelect: false

選択肢:
- label: "🗑️ 削除して 0 から再生成 (Recommended)"
  description: "理由 — skill chain を clean state で再走、 retrofit walkthrough と同じ条件。 既存 test の影響を完全排除。 削除対象 file が user に列挙される (列挙後 user 最終確認なしで削除実行)。 ⭐⭐⭐⭐⭐"
- label: "📝 上書き許可 (skill の判定に委ねる)"
  description: "理由 — kiwa-design は spec を新規 file で衝突回避 (-2.md として連番)、 kiwa-forge / kiwa-hardhat / kiwa-play は既存 test を上書き or extend mode に切替。 既存 test と新規 test が並立する可能性、 chain の途中で意図しない state になるリスク。 ⭐⭐⭐"
- label: "🛑 skill chain を中断"
  description: "理由 — 既存 test の処理方針を一旦保留し /kiwa-test を中断。 user が手動でリセットしてから再起動。 リセットコマンドは tests/docs/run-tests.ja.md Step 0 を参照。 ⭐⭐"
```

🗑️ 選択時は以下を実行 (cwd 問わず動く):

```bash
ROOT=$(git rev-parse --show-toplevel)
for path in "${EXISTING[@]}"; do
  if [ -d "$ROOT/$path" ]; then
    rm -rf "$ROOT/$path"
    echo "🗑️ removed dir: $path"
  elif [ -f "$ROOT/$path" ]; then
    rm -f "$ROOT/$path"
    echo "🗑️ removed file: $path"
  fi
done

# 関連 cache / report も削除 (再走時の混乱防止)
[ "$TARGET" != "dapp" ] && rm -rf "$ROOT/examples/$EXAMPLE"/{forge-out,hardhat-cache,hardhat-artifacts,cache,coverage,coverage.json}
[ "$TARGET" != "contract" ] && rm -rf "$ROOT/examples/$EXAMPLE"/{test-results,playwright-report,.next}
rm -rf "$ROOT/tests/reports"/{contract,e2e,review,integrated}/*${EXAMPLE}* 2>/dev/null || true
```

📝 上書き許可選択時は何もせず Step 3 へ進む。 🛑 中断選択時は skill を停止 + リセットコマンドを return。

`--auto-cleanup` 引数 (kiwa-test 引数追加予定) で AskUserQuestion を skip + 自動削除も可能 (CI / 自動化用)。

### Step 3: contract test chain 実行 (target=contract or both)

`examples/{example}/` に cd した状態で子 skill を内部呼出。

```text
[Step 3a] /kiwa-design --layer contract --module {example} --input contracts/ --lang $DOC_LANG [--no-review]
  ↓ spec 生成 (Step 6 で kiwa-review --mode spec-review 自動呼出)
  ↓ tests/spec/contract/test-spec-{example}.{lang}.md が Write される

[Step 3b] /kiwa-forge --module {example} --gas-report --lang $DOC_LANG [--no-review] [--no-coverage-loop で auto loop を 1 round 化]
  ↓ test/{Contract}.t.sol 生成 + forge test 全 PASS + coverage 100% 到達 (auto loop)
  ↓ Step 5c で tests/reports/contract/coverage-report-{example}.{lang}.md Write
  ↓ Step 6 で kiwa-review --mode test-review 自動呼出
  ↓ tests/reports/review/test-review-{example}.{lang}.md Write

[Step 3c] /kiwa-hardhat --module {example} --gas-report --lang $DOC_LANG [--no-review] [--no-coverage-loop]
  ↓ hardhat-test/{Contract}.test.cjs 生成 + hardhat test 4 round PASS + coverage 100%
  ↓ 同様の review + report
```

各 step の結果 (PASS / FAIL / report path / 件数) を skill 内変数に集約。

### Step 4: dApp e2e test chain 実行 (target=dapp or both)

target=both の場合、 Step 3 完了後に実行。 mode=sequential (default) なら 3 完了待ち、 mode=parallel なら 3 と並走 (ただし parallel は port 衝突リスクあるため非推奨)。

```text
[Step 4a] /kiwa-design --layer e2e --module {example} --input app/ --lang $DOC_LANG [--no-review]
  ↓ spec 生成 (Step 6 で spec-review 自動呼出)
  ↓ tests/spec/e2e/test-spec-{example}.{lang}.md Write

[Step 4b] /kiwa-play --mode new --rounds {N} --lang $DOC_LANG [--no-review] [--no-codex]
  ↓ tests/{example}.spec.ts + helper 生成
  ↓ playwright test 4 round PASS (flaky 0 検証)
  ↓ Step 9 で kiwa-review --mode test-review 自動呼出
  ↓ tests/reports/review/test-review-{example}.{lang}.md Write (contract と同 path、 後勝ち or suffix 区別)
```

### Step 5: 統合 report Write

全 step 完了後、 `tests/reports/integrated/{example}-{target}.{$DOC_LANG}.md` に統合 report を Write。

```markdown
# Integrated Test Report — {example} ({target})

Generated: {ISO8601}
Skill: /kiwa-test --example {example} --target {target} --lang {lang}
Total duration: {sec} 秒

## 1. 実行サマリ

| 段階 | skill | 結果 | 件数 / score |
|---|---|---|---|
| 1. spec 生成 (contract) | /kiwa-design (Layer 1) | ✅ PASS | TC 13 件 / spec-review 8.2/10 |
| 2. Foundry test | /kiwa-forge | ✅ PASS | 27/27 / coverage 100% / test-review 7.8/10 |
| 3. Hardhat test | /kiwa-hardhat | ✅ PASS | 24/24 × 4 round / coverage 100% / test-review 7.8/10 |
| 4. spec 生成 (e2e) | /kiwa-design (Layer 1) | ✅ PASS | TC 13 件 / spec-review 8.0/10 |
| 5. Playwright test | /kiwa-play | ✅ PASS | 12 passed / 1 skipped / 4 round / test-review 7.5/10 |

**判定 — ✅ ALL PASS** ({reason}) / **⚠️ PARTIAL FAIL** ({failed_step}) / **❌ FAIL** ({failed_step})

## 2. 生成 file 一覧

| file | path | 用途 |
|---|---|---|
| spec (contract) | tests/spec/contract/test-spec-{example}.{lang}.md | Layer 1 出力 |
| spec (e2e) | tests/spec/e2e/test-spec-{example}.{lang}.md | Layer 1 出力 |
| Foundry test | examples/{example}/test/{Contract}.t.sol | Layer 2 出力 |
| Hardhat test | examples/{example}/hardhat-test/{Contract}.test.cjs | Layer 2 出力 |
| Playwright spec | examples/{example}/tests/{example}.spec.ts | Layer 2 出力 |
| coverage report (contract) | tests/reports/contract/coverage-report-{example}.{lang}.md | auto loop 結果 |
| review report (spec / test) | tests/reports/review/{spec\|test}-review-{example}.{lang}.md | reviewer 判定 |

## 3. critical / major 指摘 (review 集約)

各子 review report から critical / major 指摘を集約。

### 1. {severity}: {issue}
- **source**: {review report path}
- **詳細**: {issue}
- **改善案**: {suggestion}

## 4. 次アクション

- ✅ ALL PASS → docs 更新 + PR 起票推奨
- ⚠️ PARTIAL FAIL → 失敗 step の修正 (spec 修正 / test 追加 / coverage 未達対応)
- ❌ FAIL → critical 修正必須、 該当子 skill を再起動 (`/kiwa-{forge|hardhat|play} --module {example}`)

## 5. 各子 skill report への link

- spec-review (contract): `tests/reports/review/spec-review-{example}-contract.{lang}.md`
- spec-review (e2e): `tests/reports/review/spec-review-{example}-e2e.{lang}.md`
- test-review (Foundry / Hardhat / Playwright): `tests/reports/review/test-review-{example}-{tool}.{lang}.md`
- coverage report: `tests/reports/contract/coverage-report-{example}.{lang}.md` / `tests/reports/e2e/coverage-report-{example}.{lang}.md`
```

### Step 5b: kiwa-review 自動呼出 (result-review mode)

Step 5 で統合 report Write 完了後、 test 実行結果の総合品質を独立 review する。 `/kiwa-review --mode result-review --module {example}` を内部呼出し、 coverage 達成度 / passing 件数 / flaky 兆候 / 子 review 集約 / 後追い項目 を 5 軸で判定。

呼出例:
```text
/kiwa-review --mode result-review --module {example} --lang $DOC_LANG
```

review 結果:
- PASS (weighted_score >= 7.0) → Step 6 へ
- FAIL → Step 5c (auto-fix loop) へ

report 出力先: `tests/reports/review/result-review-{example}.{$DOC_LANG}.md`

`--no-review` 引数で本 step を skip 可能 (CI 用、 skip 時は Step 5c も skip して Step 6 へ)。

### Step 5c: auto-fix loop (review FAIL 時の自走修正、 上限なし)

result-review or 子 review (spec-review / test-review) が FAIL の場合、 review 指摘を元に spec / test code を再生成して再 test。 上限なしで loop、 以下 3 条件のいずれかで終了。

| 終了条件 | アクション |
|---|---|
| **PASS** (result-review weighted_score >= 7.0 + critical 0) | Step 6 へ完了 |
| **停滞** (連続 2 round で result-review weighted_score delta 0) | loop 終了、 user 介入を AskUserQuestion (継続 / 諦めて完了 / 中断) |
| **critical 検出** (security / 設計根本問題、 自動修正不可) | loop 即停止、 user 介入必須 (修正方針を user 判断) |

#### loop 内部 flow

各 round で以下を実行:

1. **failure 分類** — どの review が FAIL したか + 指摘内容を分類:
   - `spec-review` FAIL (観点漏れ / 優先度ミス / 抽象表現過多) → spec 再生成
   - `test-review` FAIL (TC mapping 漏れ / assertion 抽象化 / 追加 test 提案) → test code 再生成
   - `result-review` FAIL (coverage 未達 / flaky 兆候 / 後追い項目残存) → 対応する Layer 2 skill 再走 (coverage 不足は kiwa-forge auto loop、 flaky は該当 Layer 2 を再生成)

2. **対応 skill 再走** — review 指摘を prompt に含めて該当 skill を再起動:
   ```text
   # spec-review FAIL の場合
   /kiwa-design --layer {layer} --module {module} --input {input} --lang $DOC_LANG
     "[前 round review 指摘] {critical / major bullets を貼付}、 これを反映して spec を再生成してください"

   # test-review FAIL の場合
   /kiwa-forge --module {module} --gas-report --lang $DOC_LANG
     "[前 round review 指摘] {bullets}、 不足 TC を追加 + assertion 具体化してください"

   # result-review FAIL (coverage 不足) の場合
   /kiwa-forge --module {module} --gas-report --lang $DOC_LANG
     (coverage auto loop が真の未踏 line を追加 test で cover、 #222 ロジックに従う)
   ```

3. **再 test + 再 review** — Layer 2 完了後に再度 review chain (spec-review / test-review / result-review) を回す

4. **round 別 report 累積** — `tests/reports/integrated/{example}-{target}-round-{N}.md` を round ごとに保存、 canonical report は最終 round の内容で上書き

5. **改善判定** — 前 round と result-review weighted_score を比較:
   - 改善あり (delta > 0) → 次 round 継続
   - 改善なし (delta 0) が 2 round 連続 → 停滞判定で終了

#### critical 検出時の挙動

以下 5 種の critical は **auto-fix 不可** として user 介入必須:

| critical 種別 | 理由 |
|---|---|
| security 関連 (signature replay / access control bypass 等) | 自動修正で security hole を埋めるのは危険、 設計判断必須 |
| 設計根本問題 (spec の「対象機能」 が contract / app と不一致) | spec 設計段階の根本誤り、 user の機能要件確認必要 |
| contract 未実装 function に対する test 提案 | test 追加でなく contract 実装が必要、 別 issue |
| `forge build` / `hardhat compile` 失敗 (環境 / 依存問題) | skill 修正でなく環境調査必要 |
| UI 不在で UI 起点 test 不可能 (e2e で app/ 欠落) | skill では実装不可、 user が UI 実装 or target 変更必要 |

検出時は `AskUserQuestion` で「修正方針を入力 / 中断 / 無視して完了 (critical 残存)」 を選択。

### Step 6: 完了 summary を user に return

```text
🎉 /kiwa-test 完了 — {example} ({target})

判定: ✅ ALL PASS / ⚠️ PARTIAL FAIL / ❌ FAIL

実行サマリ:
- contract: Foundry 27/27 + Hardhat 24/24 × 4 / coverage 100%
- dapp e2e: Playwright 12/13 PASS (1 skip) / 4 round flaky 0

統合 report: tests/reports/integrated/{example}-{target}.{lang}.md

次アクション: {recommend}
```

## エラー時の挙動

- 子 skill が FAIL → 該当 step で停止、 user に AskUserQuestion で「skip して次 step / 中断 / 個別 debug」 を選択
- example dir or contracts/ or app/ 不在 → 即停止、 解決方法を return (例 「examples/X/app/ がない、 UI を持つ別 example を選んでください」)
- spec 生成失敗 → Layer 2 へ進めない、 中断
- test 実行 PASS だが review FAIL critical → 警告 + 修正必須を summary に明示、 next action に修正手順

## chain 連携 (子 skill が auto 呼出する skill)

`/kiwa-test` から見ると以下の chain が一括で起動される (各子 skill 内部で更に sub-skill が auto 呼出される)。

```mermaid
graph TD
    A["/kiwa-test"] --> B{Step 1 target 選択}
    B -->|contract| C1["/kiwa-design --layer contract"]
    B -->|dapp| D1["/kiwa-design --layer e2e"]
    B -->|both| C1
    B -->|both| D1
    C1 -->|Step 6| R1["/kiwa-review --mode spec-review"]
    R1 --> C2["/kiwa-forge"]
    C2 -->|Step 6| R2["/kiwa-review --mode test-review"]
    R2 --> C3["/kiwa-hardhat"]
    C3 -->|Step 6| R3["/kiwa-review --mode test-review"]
    D1 -->|Step 6| R4["/kiwa-review --mode spec-review"]
    R4 --> D2["/kiwa-play --mode new"]
    D2 -->|Step 9| R5["/kiwa-review --mode test-review"]
    R3 --> E["Step 5 統合 report"]
    R5 --> E
    E --> R6["/kiwa-review --mode result-review (Step 5b)"]
    R6 -->|PASS| F["Step 6 user に summary return"]
    R6 -->|FAIL| L["Step 5c auto-fix loop"]
    L -->|spec-review FAIL| C1
    L -->|test-review FAIL| C2
    L -->|coverage 不足| C2
    L -->|critical 検出 or 停滞 2 round| F2["AskUserQuestion 介入"]
```

## 完了条件

- `--target` で指定された範囲 (contract / dapp / both) の全 step が PASS or 意図的 skip
- `tests/reports/integrated/{example}-{target}.{$DOC_LANG}.md` が Write 済
- 各子 skill の report path が integrated report 内に link 集約

## references

- `references/doc-language-selection.md` — 文書生成言語選択 共通 SSOT (5 kiwa skill 共用、 symlink で参照)

## 関連

- 子 skill: `.claude/skills/kiwa-{design,forge,hardhat,play,review}/SKILL.md`
- 観点 SSOT: `.claude/skills/kiwa-design/references/viewpoints-catalog.md` (11 観点)
- 親 Issue (本 skill の motivation): #215 (mint-nft fixtures 化 docs 検証で gap 発見、 1 コマンド化要望)
