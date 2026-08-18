# 検査を書く時の既定手順

`tests/release-smoke/` に検査を足す時、 **「検査が減っただけ」 で緑になる形** を作らないための手順。

本 file は 6 回の実測から書いた。 いずれも変異試験で初めて判明し、 通常の実行では 1 度も落ちていない。
落ちないことが問題で、 **検査が何も見ていない状態と、 見た上で問題が無い状態が同じ結果になる**。

## 2 つの形

### 形 1 — 0 件でも通る

対象の一覧が空になると、 検査本体が 1 度も走らずに緑になる。

| 書き方 | 空の時に起きること |
|---|---|
| `it.each(list)` | test が 1 件も生成されない |
| `for (const x of list) { expect(...) }` | ループ本体が 1 度も走らない |
| `expect(list.filter(...)).toEqual([])` | 元が空なら常に成立する |

**対処** — 一覧が空でないことを別に確かめる。

```ts
// it.each に渡す一覧
expect(targets.length).toBeGreaterThan(0);
it.each(targets)('%s ...', (t) => { ... });

// for で回す一覧は、 読めた件数を独立に数えて突き合わせる
const rows = parseRows(section);
const literal = section.split('\n').filter((line) => line.startsWith('|')).length;
expect(rows.length).toBe(literal);
```

**`length` の確認は対象を名指しで、 `it.each` とは独立した test に書く**。 別名の局所変数に
代入した確認や、 一覧が空なら実行されない `it.each` 自身の callback 内の確認は、 保証として
扱わない (`check-authoring.test.ts` は AST で対象と実行位置を照合する)。

直接要素を持つ配列 literal は静的に非空なので別の確認を要求しない。 `[]` と `[...derived]` は
0 件になり得るため、 実行時導出の一覧と同じく非空を確かめる。

### 形 2 — 集合を畳むと片側の欠落が消える

複数の実行単位を 1 つの集合にまとめて比べると、 片方から要素が落ちても集合が変わらない。

実測した 3 件。

| 何を畳んだか | 落ちなかった変異 |
|---|---|
| 2 段の `find` の glob を fence 全体で集める | 1 段目だけから `*.spec.tsx` を落とす |
| 2 段の `find` の prune を fence 全体で見る | 1 段目だけから `-prune` を落とす |
| runner 2 種の期待を runtime 単位で束ねる | 片方の runner の探索を削る |

**対処** — 実行単位ごとに比べる。

```ts
// 悪い: fence 全体の集合
expect(globsIn(fence)).toEqual(FOUR_GLOBS);

// 良い: find 起動ごと
const commands = findCommands(fence);
expect(commands.length).toBe(2);
for (const command of commands) expect(globsIn(command)).toEqual(FOUR_GLOBS);
```

単位が対で意味を持つ場合 (列挙と抽出など) は、 **対の一致** も見る。

```ts
for (let i = 0; i < commands.length; i += 2) {
  expect(globsIn(commands[i]!)).toEqual(globsIn(commands[i + 1]!));
}
```

## 機械で止める範囲

| 形 | 機械化 | 理由 |
|---|---|---|
| `it.each` に渡す一覧が空 | **する** (`check-authoring.test.ts`) | 対象を静的に特定でき、 literal を除けば誤検出しない |
| `for` が 0 行 | しない | どの式が「対象の一覧」 かを静的に決められない |
| 集合を畳む | しない | 畳んでよい場合と悪い場合を式から判定できない |

機械化しない 2 形は **変異試験で拾う**。 検査を書いたら、 その検査が守る規約を 1 箇所ずつ壊し、
落ちることを確かめる (`rules` 側の 5 条件目と同じ手順)。

**「壊すと落ちる」 だけでは足りない**。 修正を入れた時は、 その修正を守る検査があるかも確かめる =
実測で「修正は入ったが、 それを戻す変異が素通りする」 状態が 1 度あった。

## 変異試験を回す時の注意

TypeScript の検査を変異させる場合、 **compile 済 JS を走らせても効かない**。
`tests/release-smoke/.vitest-dist/` の JS が対象なので、 変異のたびに `tsc` を通す。

markdown を変異させる場合は実行時に読むため、 compile は要らない。

この違いで **変異が届いていないことを等価変異と誤読しかけた**ことがある。
生存した変異は、 等価だと結論する前に「その変異が実際に届いているか」 を確かめる。

## 関連

- `tests/release-smoke/tests/check-authoring.test.ts` — 形 1 の機械検査
- `docs/quality/release-gate.md` — release gate の閾値
