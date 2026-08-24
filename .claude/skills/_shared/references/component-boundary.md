# component の切り出し方

kiwa の skill 群で共通の中身を切り出す時、**skill にするか reference にするか** の判定と、
その置き場所の SSOT。

## 判定 — 動くのか、決めるのか

| 性質 | 切り出し先 | 呼ばれ方 |
|---|---|---|
| script を走らせる / 成果物を返す / file を書く | `<name>/SKILL.md` | 「起動する」 |
| 判定基準 / 契約 / 対応表 | `_shared/references/<name>.md` | 「が SSOT」「を Read する」 |

実例。

| 対象 | 切り出し先 | 理由 |
|---|---|---|
| `/kiwa-gap` | skill | script を走らせて report を返す |
| `/kiwa-loop` | skill | 測る、埋める、再測 を回す |
| `/kiwa-verdict` | skill | 入力を分類して report を書く |
| `loop-stop-conditions.md` | reference | 停止条件と 4 分類の判定基準 |
| `existing-test-reuse.md` | reference | 既存 test を再利用する時の契約 |
| `coverage-classify.md` | reference | file 分類の rule |

### 判定基準を skill にしない

読むだけのものを skill にすると 3 つ損をする。

| 項目 | 影響 |
|---|---|
| 起動の往復 | Skill tool 経由で別の turn になる。 読むだけなら往復が丸損 |
| `/` の名前空間 | user が打てる skill として並ぶ。 内部専用のものが混ざる |
| skill 数 | `plugin.json` / README / 検査がすべて追随する |

reference なら完了条件に 1 行書くだけで常に効き、読み込みは file 1 つで済む。

### 実行するものを reference にしない

手順を文章で書いても、引数を取らず成果物も返さないため、読み手が毎回組み立て直すことになる。
組み立て方が skill ごとにずれるので、SSOT を持つ意味が薄れる。

## 置き場所 — 参照数で決まる

| 参照する skill 数 | 置き場所 |
|---|---|
| 1 | `<skill>/references/<name>.md` (実体) |
| 2 以上 | `_shared/references/<name>.md` (実体) + 各 skill から相対 symlink |

**2 件目が現れた時点で `_shared/` へ移す**。 消費者の 1 つに実体を置いたままにすると、
その skill が概念の持ち主でないのに所有者に見える。

実際そうなっていた。 `doc-language-selection.md` は 8 skill が使うのに、実体は
`kiwa-forge` (Solidity の test skill) の中にあった。 共有の置き場所が無く、消費者の 1 つに
寄生させるしかなかったため。

### symlink は `_shared/` を直接指す

```
kiwa-vitest/references/existing-test-reuse.md -> ../../_shared/references/existing-test-reuse.md
```

**別の skill を経由させない**。 移設の途中で 2 段 hop
(`kiwa-vitest → kiwa-design → _shared`) が 14 件できたが、中間の skill を消すと全部壊れる。

## `_shared/` が skill に数えられない理由

skill の列挙は **`SKILL.md` の有無** で判定する (`scripts/rebuild-plugin-metadata.mjs` と
`tests/release-smoke/tests/*.test.ts` が同じ形)。

```js
.filter((e) => e.isDirectory())
.filter((name) => existsSync(resolve(..., name, 'SKILL.md')))
```

`_shared/` は `SKILL.md` を持たないので skill 数に影響しない。 `plugin.json` も README の
数字も変わらない。

**`_shared/` に `SKILL.md` を置かない**。 置いた瞬間 skill として数えられ、
`/` から起動できる空の skill が現れる。

## 分類 dir を切らない

`_shared/references/` は平置きにする。

| 件数 | 形 |
|---|---|
| 〜10 | 平置き 1 dir |
| 10 〜 | 分類 dir を検討する |

先に分類を作ると、どの dir に置くかの判断が追加のたびに発生する。 file 名で足りる間は
平置きにして、10 件を超えてから実物の偏りを見て切る。
