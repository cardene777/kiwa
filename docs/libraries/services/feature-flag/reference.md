# @kiwa-lab/feature-flag リファレンス

フラグ評価とルールの公開 API です。この page では、どの API が flag definition を変えるか、どの API が評価記録や cache を増やすかを確認します。最初の導入は [Quickstart](./quickstart)、rule の優先順と cache の扱いは [使い方](./how-to) を参照してください。

## 評価の入口

`createFlagClient` は flag definition、rule、評価記録を持つ client を作ります。`evaluateFlag` は一つの key を、`evaluateAllFlags` は登録済みの全 key を user に対して評価します。どちらも評価ごとに record を追加します。

`FlagClient.registerRule` は評価順の末尾に rule を追加します。`matchRule` は一つの rule と user を直接評価するときに使いますが、通常は `evaluateFlag` に rule の走査と既定値への fallback を任せます。`providerIdPrefix` と `normalizeProviderConfig` は provider を識別する記録や設定の補助であり、remote config の取得は行いません。

## 設定

`provider` は `growthbook`、`launchdarkly`、`posthog`、`unleash` から選びます。フラグには `key`、`variant`、`defaultValue` を指定します。未登録 flag の評価は boolean false と `flag-not-found` を返します。

## ルールと記録

targeting rule は user id、percentage rule は再現可能な hash bucket、attribute rule は user attributes を評価します。全 rule が一致しなければ default value です。`EvaluateFlagResult` は key、value、reason、評価記録を返します。

`clear` は `listEvaluated` の記録だけを消去します。flag と rule の設定を消す API はありません。

## evaluation helper

`evaluateAllFlags` は登録順の全flagを評価してresult arrayを返します。`evaluateBatch` はentriesのresultと `byKey` を返します。keyが重複するbatchの `byKey` は最後のresultを上書きします。

`evaluateIdempotent` は `(key, user.id)` でcacheし、cache hitではevaluation recordを追加しません。cacheはuser attributesやrule変更をkeyに含めません。

`evaluateWithRetry` はretry resultをthrowせず返します。既定の `isRetryable` はreasonが `error` の場合だけtrueですが、`evaluateFlag` の標準経路はerror reasonを作らないため、既定では一回でreturnします。

`createHookRegistry` と `evaluateObservable`、`createCircuitBreaker` はevaluationの周辺挙動をtestするutilityです。基本の `evaluateFlag` はhook、retry、cache、circuit breakerを自動で使用しません。

## 後始末

外部接続は作りません。テストごとに新しい client を作ります。

<!-- kiwa-public-api:start -->

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [batch.ts](./api/batch) | 1 | 1 |
| [circuit-breaker.ts](./api/circuit-breaker) | 1 | 3 |
| [client.ts](./api/client) | 1 | 8 |
| [evaluator.ts](./api/evaluator) | 2 | 2 |
| [idempotency.ts](./api/idempotency) | 2 | 1 |
| [observability.ts](./api/observability) | 2 | 4 |
| [provider.ts](./api/provider) | 2 | 1 |
| [retry.ts](./api/retry) | 1 | 1 |
| [rules.ts](./api/rules) | 2 | 5 |

<!-- kiwa-public-api:end -->
