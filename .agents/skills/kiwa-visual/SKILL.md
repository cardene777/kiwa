---
name: kiwa-visual
description: @kiwa-lab/visual を使い、レビュー済みの PNG baseline と実際の screenshot の差分を検証する test を作成する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# kiwa visual

`@kiwa-lab/visual` で PNG buffer を比較し、画面変更が意図したものかを確認する test を作ります。この skill は screenshot の意味や UI 変更の承認を自動判定しません。baseline の作成と更新は、画像をレビューした後に利用者が判断します。

## 入力

`$ARGUMENTS` で対象 module または仕様 file を受け取ります。対象画面、固定する viewport、表示 state、動的に変化する要素、許容する差分を先に確認します。これらが不足している場合は、baseline を推測して作らず確認を求めます。

## 作成する test

対象 project の Playwright または既存の screenshot runner を使い、actual PNG を取得します。baseline PNG を読み、`await comparePngBuffers(baseline, actual, options)` を呼びます。差分が上限を超えたときだけ `result.diffBuffer` を artifact path に保存し、`expectNoVisualDiff(result, expect)` で test を失敗させます。

test file は baseline、actual、diff の path を明示します。たとえば checkout を対象にする場合、baseline は `tests/visual/__snapshots__/baseline/checkout-default.png`、actual は `tests/visual/__snapshots__/actual/checkout-default.png`、失敗時の diff は `tests/visual/__snapshots__/diff/checkout-default.png` に置きます。actual と diff は CI artifact として扱い、baseline はレビュー済みのものだけ version control に入れます。

## 安定した比較にする

viewport、device scale factor、browser version、font、表示 state を固定します。時刻、乱数、広告、進行中 animation のように画面の本質でない要素だけを mask または固定します。商品画像、error message、chart、主要な action は mask しません。

`threshold` は一画素の色差に対する感度で、既定値は `0.1` です。`maxDiffRatio` は画面全体で許容する差分比率で、既定値は `0.005` です。値を大きくして test を通す前に diff PNG を確認し、変更の理由を残します。完全一致が必要な場合は `threshold: 0`、`includeAA: true`、`maxDiffRatio: 0` を使いますが、OS と font の差で不安定になりやすくなります。

## 実行して確認する

生成した file だけを実行します。たとえば出力先が `tests/visual/checkout.spec.ts` なら、次を実行します。

```bash
pnpm exec playwright test tests/visual/checkout.spec.ts
```

baseline がない場合は、画面をレビューしてから baseline として保存します。比較が失敗した場合は diff PNG を確認し、意図しない欠落やレイアウト崩れがないことを確認してから baseline を更新します。PNG のサイズが異なる error は、比較前の viewport または device scale factor が揃っていないことを示します。

## 実環境の境界

この skill は PNG 比較だけを行います。browser の navigation、ネットワーク、font の配布、accessibility、実利用者の操作は screenshot runner または別の E2E、A11y test で確認します。
