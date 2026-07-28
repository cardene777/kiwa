# Search

`@kiwa-lab/search` は Meilisearch、Algolia、Typesense を対象にしたインメモリ検索モックです。

## 検証する流れ

<img src="/images/kiwa-docs/ai-realtime/search-overview.webp" alt="文書をindexへ追加してqueryとfilterからranking済みのhitsを返す流れ" width="1672" height="941" loading="lazy" decoding="async">

index operation と search option を分けて渡します。文書を追加、更新、削除した後、offset、limit、filter、facet、sort を指定して検索します。hits だけではなく、filter 後の facet、sort を優先した順位、factory ごとの typo tolerance を確認できるため、検索 UI に渡す結果を安定させられます。

## 境界

すべての mock は共有の in-memory word-overlap engine を使い、各 SaaS の ranking や DSL を完全には再現しません。filter は strict equality、facet は filter 後の文書から作ります。sort を指定すると score より sort を優先し、同値なら score を使います。real backend は `KIWA_MODE=real` を明示した統合テストだけで使ってください。

## 使う場面

検索画面や絞り込みのテストを、検索サービスなしで実行するときに使います。

## 読み進める

[Quickstart](./quickstart) で文書を登録して検索し、[使い方](./how-to) で filter、更新、削除を同じ test file に追加します。embedding の近傍検索は [Vector](/libraries/ai-realtime/vector/)、LLM へ渡す検索結果は [AI LLM](/libraries/ai-realtime/ai-llm/) と組み合わせます。adapter API は [リファレンス](./reference) にあります。
