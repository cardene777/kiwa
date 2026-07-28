# @kiwa-lab/ai-llm

`@kiwa-lab/ai-llm` は、Anthropic、OpenAI、Vercel AI SDK、LangChain を使うコードを、実プロバイダーへ接続せずに検証するための LLM mock です。固定応答だけでなく stream、tool call、system prompt、画像と音声の入力、利用量を SDK ごとの操作面に合わせて返します。

<img src="/images/kiwa-docs/ai-realtime/ai-llm-overview.webp" alt="fixtureを使うprovider mockがcompletionまたはstreamを返し指標を記録する流れ" width="1672" height="941" loading="lazy" decoding="async">

## 対象にする境界

このパッケージが扱うのは、アプリケーションと LLM SDK の境界です。最後の user message をキーに fixture を選び、completion または stream を返します。テストでは応答本文だけでなく、chunk の順序、tool call、usage、cost、latency をアプリケーションがどう処理するかを確認します。

## 使う場面

CI で API key や外部ネットワークに依存せず、chat UI、RAG、agent、transcription の分岐を再現するときに使います。provider を変えても同じシナリオを確認したい場合は、利用中の SDK に対応する factory を選びます。

## 使わない場面

実モデルの回答品質、実際の tool 実行、provider 側の rate limit、モデル更新後の差分をこの mock だけで保証することはできません。mock と実 API の差を測りたい場合は `runFidelityCheck` を使い、実環境を明示した integration test を別に持ちます。

## SDK を選ぶ

| アプリケーションの SDK | factory | 主な確認対象 |
| --- | --- | --- |
| Anthropic Messages API | `createAnthropicMock` | `messages.create`、content、usage |
| OpenAI Chat Completions | `createOpenAIMock` | completion、async stream、transcription |
| Vercel AI SDK | `createVercelAiMock` | `generateText`、`streamText`、text stream |
| LangChain | `createLangchainMock` | `invoke`、stream、message metadata |

## 利用の流れ

アプリケーションが使う SDK に合わせて factory を選びます。Anthropic では Messages API の content、tool use、usage を、OpenAI では completion、async stream、transcription を、Vercel AI SDK では `generateText` と `streamText` を、LangChain では `invoke` と stream の message metadata を assertion します。同じ fixture でも SDK ごとの戻り値を混ぜず、実装が消費する形で test します。

[はじめる](./quickstart) では OpenAI completion を固定します。[使い方](./how-to) では chunk 順序、fixture miss、tool use、SDK ごとの response shape を扱います。[リファレンス](./reference) では設定、multimodal、fidelity report を確認します。実モデルの回答品質、tool 実行、provider の rate limit、料金、モデル更新との差は、mock test を置き換えず実 provider を接続した fidelity または integration test に追加してください。
