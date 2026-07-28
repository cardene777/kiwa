# @kiwa-lab/query

`@kiwa-lab/query` は、データ取得 cache を React の render なしで検証する in-memory harness です。TanStack Query、SWR、urql、Apollo を provider 名で選び、query key、stale 判定、mutation 後の invalidation、listener 通知をテストできます。

<img src="/images/kiwa-docs/application/query-overview.webp" alt="取得結果を cache し、更新後に対象 key を無効化する流れ" width="1200" height="675" loading="lazy" decoding="async">

## 検証する流れ

同じ query key を再取得したとき、値が stale になるまでは query function を呼ばず cache を返します。stale になった場合、または `force` を指定した場合だけ function を再実行します。mutation は成功したときだけ指定 key を invalid にするため、成功と失敗で次の fetch 回数が異なることをテストできます。

`loading`、`success`、`error`、`idle` の変化は listener へ通知されます。infinite query、optimistic update、prefetch、retry はこの基本状態に追加する補助機能です。画面が何回 render されたかではなく、アプリケーションがどの key を無効化し、どの値を表示用 state に渡すかを確認してください。

## provider の意味

`provider` は `tanstack`、`swr`、`urql`、`apollo` のいずれかです。現在の harness が provider ごとの差として保持するのは選択値であり、実際の React hook、urql exchange、Apollo normalized cache は起動しません。provider 固有の UI 統合は、それぞれの SDK を使う component または統合テストで確認してください。

## 使う場面

取得回数、cache hit、更新後の再取得、失敗時の cache state を高速にテストするときに使います。HTTP endpoint の正しさは `@kiwa-lab/api`、画面上の loading 表示や再描画は UI test で分けて扱います。

## 読み進める

[Quickstart](./quickstart) では同じ key を二回取得して cache hit を確認します。[使い方](./how-to) では mutation、invalidation、listener、optimistic update を扱います。公開 API と既定値は [リファレンス](./reference) を参照してください。
