# @kiwa-lab/chart

`@kiwa-lab/chart` は、chart spec から生成する軽量な SVG 風 tree を検証する in-memory harness です。Recharts、Chart.js、D3、Visx を provider 名で表し、系列、軸、凡例、tooltip、drill-down を DOM や canvas なしで確かめられます。

<img src="/images/kiwa-docs/application/chart-overview.webp" alt="chart spec から描画 tree、軸、凡例、tooltip を作る流れ" width="1200" height="675" loading="lazy" decoding="async">

## 検証する流れ

chart spec を `renderChart` へ渡すと、bar、line、pie、scatter を表す tree node が返ります。hidden series は node と凡例の両方から除外されます。これにより、API から受け取った series をどの条件で表示から外すかを、DOM や canvas を使わずに固定できます。

axis は指定した scale と tick count から値を作り、tooltip は pointer に最も近い data node を返します。drill-down は series と data index で対象を選びます。座標計算や描画品質ではなく、表示に渡すデータと利用者操作に対して選ぶデータが正しいかを検証してください。

## 使わない場面

provider 名は実際の Recharts、Chart.js、D3、Visx を起動する指定ではありません。canvas 描画、SVG layout、text measurement、a11y、browser pointer event、pixel regression は対象外です。描画の見た目は component test または visual regression test で確認してください。

値の y 座標はこの mock では百を基準に計算されます。実際の domain scaling を検証するための chart engine ではありません。

## 読み進める

[Quickstart](./quickstart) で client から bar chart を描画します。[使い方](./how-to) では hidden series、axis、tooltip、drill-down を扱います。tree と補助 API の仕様は [リファレンス](./reference) にあります。
