# doc-language-selection — 文書生成言語選択 共通 SSOT

`/kiwa-design` / `/kiwa-forge` / `/kiwa-hardhat` / `/kiwa-play` の文書生成 step 前に挿入する **言語選択 step (Step 0)** の共通 rule SSOT。 4 skill が同 reference を読んで同じ挙動を保つ (kiwa-design / kiwa-hardhat / kiwa-play は symlink で参照、 もしくは同 path に置く)。

## Step 0: 文書生成言語の選択 (skill 起動時 1 回)

skill 起動の最初に AskUserQuestion で文書生成言語を user に確認する。 選択結果は skill 内変数 `$DOC_LANG` に保持し、 以降の Write 系 step (spec / report / docstring 等) で参照する。

### AskUserQuestion 仕様

```text
question: "生成する文書 (test 仕様書 / coverage report 等) の言語を選択してください"
header: "文書生成言語"
multiSelect: false

選択肢:
- label: "🇯🇵 日本語 (ja) (Recommended)"
  description: "理由 — kiwa repo は日本語 docs が main、 既存 test 仕様書 / report も日本語形式。 file 名は `{name}.ja.md` (もしくは `.md` 単独で日本語のみ)。 ⭐⭐⭐⭐⭐"
- label: "🇬🇧 English (en)"
  description: "理由 — OSS 公開向け、 国際 contributor / 海外 user 向け。 file 名は `{name}.md`。 ja 版未生成の状態で en のみ生成すると ja 版が後追いになる点に注意。 ⭐⭐⭐⭐"
- label: "🌏 その他多言語 (free input、 zh / ko / es 等)"
  description: "理由 — 多言語 dApp チーム向け、 free text で ISO 639-1 言語コード (例 zh / ko / es) を渡す。 file 名は `{name}.{lang_code}.md`。 生成品質が言語ごとにブレるリスク + reference (foundry-mapping / coverage-classify 等) は英語のみなので翻訳不完全になる可能性あり。 ⭐⭐⭐"
```

skip 条件 — skill 引数に `--lang {code}` が明示されている場合は AskUserQuestion を skip して引数値を採用 (CI / 自動化用、 ただし default skill 起動経路では引数なしが想定なので AskUserQuestion は出る)。

### 言語コード → file 名規約

| 選択 | `$DOC_LANG` | spec / report file 名 | 例 |
|---|---|---|---|
| 🇯🇵 日本語 | `ja` | `{name}.ja.md` (英語版なし) or `{name}.md` (日本語のみで運用) | `test-spec-nft-marketplace.ja.md` / `coverage-report-nft-marketplace.ja.md` |
| 🇬🇧 English | `en` | `{name}.md` (英語が default、 ISO 慣習) | `test-spec-nft-marketplace.md` / `coverage-report-nft-marketplace.md` |
| 🌏 その他 (free input) | `{lang_code}` (ISO 639-1) | `{name}.{lang_code}.md` | `test-spec-nft-marketplace.zh.md` / `coverage-report-nft-marketplace.ko.md` |

**default は `ja`** (kiwa repo は日本語 docs が main、 user 環境変数 / settings 未対応の状態では ja 選択がもっとも安全)。

### 出力 path 規約 (skill 別)

| skill | 文書 | path |
|---|---|---|
| `/kiwa-design` | test 仕様書 | `tests/spec/{layer}/test-spec-{module}.{$DOC_LANG}.md` (ja の場合は `.ja.md`、 en は `.md`) |
| `/kiwa-forge` | coverage report | `tests/reports/contract/coverage-report-{module}.{$DOC_LANG}.md` (canonical) + round 別 |
| `/kiwa-hardhat` | coverage report | 同上 (両 skill で同一 path、 後勝ち上書き or `.foundry.` / `.hardhat.` で suffix 区別) |
| `/kiwa-play` | e2e test spec docstring | `tests/{module}.spec.ts` 内コメント (header に `// Language: {$DOC_LANG}` 注記) |

### section 見出し言語規約

各 skill の文書 template で section 見出し (例 「対象機能」 / 「Target feature」) は **$DOC_LANG に応じて切り替える**。

| `$DOC_LANG` | section 見出し参照 SSOT |
|---|---|
| `ja` | `docs/SKILL-DESIGN.ja.md` (日本語 SSOT) |
| `en` | `docs/SKILL-DESIGN.md` (英語 SSOT) |
| その他 (zh / ko 等) | 英語 SSOT (`docs/SKILL-DESIGN.md`) を参考に、 該当言語で意訳 (品質ブレリスク注記を文書末尾に付与) |

### user 起動時の体験

skill 起動例:

```text
user> /kiwa-design --layer contract --module nft-marketplace --input contracts/

skill> [Step 0: 言語選択]
        生成する文書の言語を選択してください
        ⭐⭐⭐⭐⭐ 🇯🇵 日本語 (ja) (Recommended)
        ⭐⭐⭐⭐ 🇬🇧 English (en)
        ⭐⭐⭐ 🌏 その他多言語 (free input)

user> ja

skill> 文書言語を ja で確定、 Step 1 に進む
        出力先 — tests/spec/contract/test-spec-nft-marketplace.ja.md
        ...
```

### skill 引数で skip する場合

```text
/kiwa-design --layer contract --module nft-marketplace --input contracts/ --lang en
```

`--lang en` 引数が渡された場合は AskUserQuestion を skip して即 Step 1 へ。 file 名は `test-spec-nft-marketplace.md` (英語が default suffix なし)。

## 引数仕様 (4 skill 共通)

| 引数 | 型 | default | 説明 |
|---|---|---|---|
| `--lang {code}` | string | (AskUserQuestion 経由で確定) | ja / en / その他 ISO 639-1 言語コード。 指定時は AskUserQuestion を skip |

## 関連

- 親 SKILL: `.claude/skills/kiwa-{design,forge,hardhat,play}/SKILL.md` (各 skill の Step 0 で本 reference を参照)
- 文書言語 SSOT: `docs/SKILL-DESIGN.ja.md` (日本語) / `docs/SKILL-DESIGN.md` (英語)
- 親方針 (rules): `rules/response-style.md` (応答言語 = 日本語、 ただし文書生成 = user 選択)
