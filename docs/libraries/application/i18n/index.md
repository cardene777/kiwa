# @kiwa-lab/i18n

`@kiwa-lab/i18n` は、翻訳 lookup、fallback、補間、複数形、数値と日付の locale 表示をテストする in-memory harness です。next-intl、vue-i18n、react-i18next、Lingui を provider 名で表し、メッセージと locale の契約を UI なしで検証します。

<img src="/images/kiwa-docs/application/i18n-overview.webp" alt="現在 locale の翻訳を探し、fallback と補間を適用する流れ" width="1200" height="675" loading="lazy" decoding="async">

## 検証する流れ

翻訳は現在の locale で key を探し、見つからないときだけ fallback locale、default message、missing の順に進みます。`&#123;&#123;name&#125;&#125;` のような補間値が足りなければ、返り値の `missing` で検出できます。表示文字列だけでなく、どの経路で選ばれたかを一緒に確認してください。翻訳 key の欠落を default message で隠していないかを判定できます。

plural は `Intl.PluralRules` の category を使い、数値と日時は client の locale で `Intl` に渡します。locale を変えたあとに同じ値を format し、期待した文字列へ変わることを検証します。timezone が結果に影響する date format では、Quickstart のように `timeZone` を固定してください。

## 使わない場面

provider の React component、SSR locale negotiation、翻訳ファイルのロード、翻訳管理サービスとの同期は対象外です。provider の SDK とブラウザーの locale 検出を含む処理は統合テストで確認してください。

`setLocale` は client の状態だけを変えます。ブラウザー URL、Cookie、router、サーバー request の locale は変更しません。

## 読み進める

[Quickstart](./quickstart) で primary、fallback、missing の結果を確認します。[使い方](./how-to) では補間と複数形を扱います。message の形と戻り値は [リファレンス](./reference) にまとめています。
