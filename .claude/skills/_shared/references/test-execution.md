# test の実行契約

skill が test を走らせる / test の出力を読む時に前提にしてよいことの SSOT。

2026-08 の速度改善で契約が変わった。 変わる前の前提を書いた skill が 1 件、
**存在しない検査を 0 件として数える command を案内していた** (#2224)。
新しい skill を書く時と、既存 skill の実行手順を直す時はここを読む。

## 1. Vitest target の `pnpm -F <pkg> test` は source を直接走らせる

Vitest を runner にする target には compile 段が無い。 vitest が esbuild で transform して
`tests/` をそのまま実行する。

```
"test": "vitest run tests --exclude '**/.vitest-dist/**' --environment node"
```

`tsc -p tsconfig.vitest.json && vitest run .vitest-dist/tests` の形は #2205 / #2207 で
全 target から外した。 固定費が 1 target あたり 1.6 秒あり、全 sweep で 45 分 → 20.7 分になった。

**型検査は `typecheck` が持つ**。 test は型を見ない。

Playwright / Hardhat などを runner にする target はこの節の対象外。 `pnpm test` が各 target の
runner を起動するので、Vitest に置き換えない。

## 2. `.vitest-dist` は「あるかもしれない残骸」

作るのは **`tsconfig.vitest.json` を emit 有効の `tsc` に渡す script を持つ target だけ** で、
現在 27 件 (主に `test:cov`)。 それ以外に残るものは #2205 以前の残骸で、内容が古い。

| 判定 | 意味 |
|---|---|
| その target に `tsc -p ...vitest...` を含む script がある | `.vitest-dist` は作り直される |
| `--noEmit` 付きの `tsc -p ...vitest...` しかない | 出力しないため残骸 |
| 無い | 残骸。 **走らせてはいけない** |

**skill が `.vitest-dist` を走らせる形を案内しない**。 `tests/release-smoke` は後者で、
実測で 5 件が source より古く 3 件は copy が存在しなかった。 その状態で走らせると、
新しく足した検査を 0 件として数え、古い copy の所要を今の値として報告する。

`tests/release-smoke/tests/skill-test-execution.test.ts` がこの形を検査で止める。

## 3. `test:fast` は filter であって gate ではない

変更に関係する test だけを走らせる。 基準は `KIWA_FAST_BASE` (既定 `main`)。

```
"test:fast": "vitest run tests --changed ${KIWA_FAST_BASE:-main} ..."
```

**「`test:fast` が緑」 は「test が緑」 ではない**。 走っていない test があるので、
gate の判定材料にしない。 手元の往復を短くするためのもの。

`scripts/sync-test-fast.mjs` が `test` から機械的に導出するので、手で編集しない。

## 4. `pnpm test:all` は全 target を回して全部の失敗を報告する

`pnpm -r test` は最初の失敗で止まるため、赤が何件あるか分からない。

| flag | 意味 |
|---|---|
| `--jobs N` | N 件を同時に回す。 既定は 1 |
| `--only <substr>` | path が一致する target だけ |
| `--no-prebuild` | 前段の workspace build を省く (`--jobs` が 2 以上だと exit 4) |
| `--verbose` | 失敗行を全部出す |

| exit | 意味 |
|---|---|
| 0 | 全 target が緑 |
| 1 | 赤 / blocked / 汚れ があった |
| 4 | 使い方が誤っていた |

**並列時は「どの target が repo を汚したか」 を言えない**。 帰属は target ごとの前後
`git status` から来るため。 犯人を知りたい時は `--jobs 1` で回し直す。

前段 build は `--jobs` と独立に回る (#2220)。 全件 sweep では回り、`--only` では回らない。

## 5. coverage の行番号は target によって意味が違う

`.vitest-dist` を作る 27 件では compile 後の行番号になり、`tsconfig.vitest.json` が
sourceMap を出さないので source の行には正確に戻せない。 file path だけ source に戻す。

作らない target では source の行番号がそのまま出る。

**どちらかを決め打たない**。 その target が `.vitest-dist` を作るかで分岐する。

## 6. `examples/nextjs-*` は `.next` を再利用する

`playwright.config.ts` の `webServer` が `scripts/next-build-cached.mjs` を経由し、
入力が前回と同じなら `next build` を省く (#2222)。

入力は 3 系統。 tracked な内容 (例 / `packages` / lockfile)、gitignore された env file
(`.env*` と `.context/*.env`)、process env の全 key。

判定できない時は build する (記録が無い / 読めない / schema を知らない / git が指紋を作れない)。
skip したか build したかは必ず 1 行出る。

**`.next` の中身を skill が直接読む時は、それが今回の build とは限らない**ことに注意する。

## 参照している skill

| skill | 何のために |
|---|---|
| `/kiwa-gap` | coverage / duration の report をどの経路で作るか (§ 1 / § 2 / § 5) |
| `/kiwa-observe` | 走査対象から build 出力を除く条件 (§ 2) |
| `/kiwa-play` | Playwright 系 example の `pnpm test` が何をするか (§ 6) |
| `/kiwa-ui` | vitest の環境指定がどこで決まるか (§ 1) |
| `/kiwa-plan-run` | `test:all` の flag と直列車線の床 (§ 4) |
