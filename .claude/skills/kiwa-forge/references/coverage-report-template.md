# coverage-report-template — coverage report 4 section format SSOT

`/kiwa-forge` / `/kiwa-hardhat` の Step 5c で `tests/reports/contract/coverage-report-{module}.md` を Write する際の 4 section format template。 両 skill から参照される (skill 違いを吸収して同一 report format で出力)。

## template 全体

以下 4 section を順序固定で出力。 各 placeholder ({...}) は skill が auto 埋め込み。

```markdown
# Contract Coverage Report — {module}

Generated: {ISO8601_timestamp}
Skill: /kiwa-forge | Run: round {N} (final)
Loop terminated: {production_100_achieved | residual_uncoverable | stalled_2round}

## 1. 判定サマリ

| 結果 | production target | Total |
|---|---|---|
| Lines | {production_lines_status} {pct}% ({covered}/{total}) | {total_pct}% ({total_covered}/{total_total}) |
| Statements | {production_stmts_status} {pct}% ({covered}/{total}) | {total_pct}% ({total_covered}/{total_total}) |
| Branches | {production_branches_status} {pct}% ({covered}/{total}) | {total_pct}% ({total_covered}/{total_total}) |
| Functions | {production_funcs_status} {pct}% ({covered}/{total}) | {total_pct}% ({total_covered}/{total_total}) |

**判定 — {PASS_or_FAIL}** ({judgement_reason})

## 2. file 別 coverage 内訳 (production / test / mock 分類)

| File | カテゴリ | Lines | Stmts | Branches | Funcs | threshold 対象? |
|---|---|---|---|---|---|---|
| {file_path_1} | {category} | {lines_pct}% | {stmts_pct}% | {branches_pct}% | {funcs_pct}% | {target_status} |
| {file_path_2} | ... | ... | ... | ... | ... | ... |

(全 file を 1 行ずつ列挙、 production → test 自身 → mock helper → deploy script の順)

## 3. 未到達 line の分類と判断

### {file_path} - {N} line uncovered

- L{line_range} {function_name} — 分類: {削除候補 | defensive | 外部依存 | 計測除外 | 真の未踏}
  - **判断**: {具体理由}

(全 uncovered を file ごとに集約して列挙、 file path 内で line 順)

## 4. Layer 1 spec への書き戻し提案

| 項目 | 反映先 section | 形式 |
|---|---|---|
| {提案項目} | {spec section} | {形式} |

> 注 — 本 skill (Layer 2) は spec を **書き換えず**、 上記提案を report に列挙のみ。 spec への反映は user 手動 or `/kiwa-design --mode update` (別 Issue 検討予定)。
```

## section ごとの placeholder 仕様

### Section header (file 冒頭)

| placeholder | source |
|---|---|
| `{module}` | skill 引数 `--module` の値 |
| `{ISO8601_timestamp}` | `date -Iseconds` |
| `/kiwa-forge` or `/kiwa-hardhat` | skill 名 (Hardhat 用は `/kiwa-hardhat`) |
| `{N}` | auto loop の最終 round 番号 |
| `{loop_terminated}` | 終了条件 — `production_100_achieved` / `residual_uncoverable` / `stalled_2round` のいずれか |

### Section 1: 判定サマリ

| placeholder | source |
|---|---|
| `{production_*_status}` | ✅ if pct == 100% else ❌ |
| `{covered}` / `{total}` | lcov / json output から file 分類 rule で production 限定集計 |
| `{total_covered}` / `{total_total}` | 同 output の全 file 合算 (test/mock 含む) |
| `{PASS_or_FAIL}` | production 全 4 metric 100% or 「不可能」分類完了で PASS、 それ以外 FAIL |
| `{judgement_reason}` | 例: `production target 100% 達成、 SKILL threshold クリア` / `production Lines 95% < 100%、 残 uncovered は全て defensive code で test 不可能` |

### Section 2: file 別内訳

| placeholder | source |
|---|---|
| `{file_path}` | lcov / json output の file path |
| `{category}` | `references/coverage-classify.md` § 1 file 分類 rule で判定 |
| `{lines_pct}` etc | lcov / json から file 単位で抽出 |
| `{target_status}` | ✅ 対象 if production else ❌ 対象外 |

### Section 3: 未到達 line 分類

| placeholder | source |
|---|---|
| `{file_path}` | lcov で uncovered を持つ file ごとに sub-section 化 |
| `{line_range}` | lcov の DA: / BRDA: 行から uncovered の line 番号を range 化 |
| `{function_name}` | contract source を該当 line で Read して enclosing function 名抽出 |
| `分類` | `references/coverage-classify.md` § 2 uncovered 5 分類 rule で判定 |
| `具体理由` | 分類に応じた reason (例 削除候補なら 「grep で他 test から参照 0 件、 cleanup 候補」、 defensive なら 「require(false) で到達不能」) |

### Section 4: Layer 1 spec 書き戻し提案

| placeholder | source |
|---|---|
| `{提案項目}` | auto loop で skill が抽出した知見 (例: 計測除外スコープ / mock 未使用 API / 追加 TC-NNN / invariant 計測注意) |
| `{spec section}` | 「不足している仕様」 / 「テストケース一覧」 / 「テスト観点一覧」 のいずれか (項目内容で判定) |
| `{形式}` | bullet 追加 / 9 column 表に追加 / sub-section 追加 のいずれか |

## round 別 report との関係

auto loop の各 round で `coverage-report-{module}-round-{N}.md` を本 template で Write し、 final round の内容を canonical `coverage-report-{module}.md` に複製。

round 別 report は累積保存 (履歴として残す)、 canonical は最終 round のみ。 user が「どの round で何の test が追加されたか」を追えるようにする。

## 関連

- 親 SKILL: `.claude/skills/kiwa-forge/SKILL.md` § Step 5c / `.claude/skills/kiwa-hardhat/SKILL.md` § Step 5c
- 並立 reference: `references/coverage-classify.md` (本 template の Section 2 / Section 3 で使う分類 rule)
- 親 Issue: #222 (本 template の motivation、 実装計画)
