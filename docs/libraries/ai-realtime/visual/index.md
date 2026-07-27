# Visual

`@kiwa-lab/visual` は2つの PNG buffer を decode し、pixelmatch で画素差を数えるテスト用ライブラリです。比較結果には差分画素数、全画素に対する比率、合否、任意の差分 PNG が含まれます。

![baselineとactualのPNGを比較してpassまたはdiff buffer付きfailを返す流れ](/images/kiwa-docs/ai-realtime/visual-overview.png)

## 何を検証できるか

`comparePngBuffers` は baseline と actual を PNG として読み込みます。幅または高さが異なると、比較を始める前に reject します。同じサイズなら pixelmatch が差分画素数を返し、`diffPixels / width / height` を `diffRatio` として計算します。

`maxDiffRatio` 以下なら `ok` は true です。既定の上限は 0.005 で、全画素の 0.5 % です。浮動小数点誤差を吸収する小さな余裕を加えて判定します。

## 使う場面

E2E テストが取得した screenshot と、レビュー済み baseline を比較する場面に向いています。テーマやレイアウトを変更したときは、まず差分 PNG を CI artifact として確認し、意図しない要素の欠落や崩れがないことを確認します。そのうえで UI 変更を承認するなら baseline を更新します。

`maxDiffRatio` を上げるのは、差分を画像として確認した後です。閾値を大きくしてテストを通すことは、未知の画面崩れまで許容することになり得ます。フォント、viewport、device scale factor を固定できない環境では、まず screenshot を安定化し、どうしても残る差だけを根拠とともに許容します。

## 前提と境界

このライブラリは browser を起動せず、screenshot も取得しません。入力は完成した PNG buffer です。Playwright などで画像を取得し、テスト側で `Buffer` にしてから渡してください。

`pixelmatch` と `pngjs` は動的に読み込まれます。いずれかがインストールされていない場合、`comparePngBuffers` は追加方法を含むエラーで reject します。

## インストール

```sh
pnpm add -D @kiwa-lab/visual pixelmatch pngjs
```

## 読み進め方

[導入](./quickstart) では PNG を比較して合否を確認します。差分を画像として残し、baseline 更新を判断する手順は [差分画像を保存する](./how-to) にあります。全オプションとエラー条件は [リファレンス](./reference) を参照してください。

## 関連ライブラリ

画面操作と screenshot の取得は [E2E](/libraries/foundation/e2e/) を使います。画面の見た目とは別に、操作可能な名前や role を確認する場合は [A11y](/libraries/quality/a11y/) を組み合わせてください。
