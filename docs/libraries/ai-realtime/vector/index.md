# Vector

`@kiwa-lab/vector` はベクトルの保存と類似検索をプロバイダー共通の API で扱います。

## 検証する流れ

![vectorをnamespaceへupsertし検索結果をrankingして次元不一致は拒否する流れ](/images/kiwa-docs/ai-realtime/vector-overview.png)

`dimension` は record の `upsert` 時に検証されます。Pinecone、Weaviate、Qdrant、pgvector 形状の client で record を追加、取得、削除し、cosine、euclidean、dot のいずれかで近傍検索します。metric は ranking の assertion と同じ値を指定してください。cosine と dot は大きい score が先頭になり、euclidean は小さい距離が先頭になります。

## 境界

provider ごとの SDK や index server は使わず、client 内の Map に record を保持します。query vector の次元不一致は distance 計算で throw します。upsert は record ごとに処理するため、途中の record で失敗すると前の record は残ります。namespace は結果に記録されますが、同じ client 内に namespace ごとの分離 store は作りません。

## 使う場面

RAG や意味検索のランキングを、ベクトルデータベースなしでテストするときに使います。

## 読み進める

[Quickstart](./quickstart) で nearest neighbor を検索し、[使い方](./how-to) で順位、metadata filter、次元不一致、削除を一つの test file にまとめます。text 検索は [Search](/libraries/ai-realtime/search/)、検索結果を LLM に渡す処理は [AI LLM](/libraries/ai-realtime/ai-llm/) を参照してください。distance API は [リファレンス](./reference) にあります。
