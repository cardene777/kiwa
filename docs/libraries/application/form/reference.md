# @kiwa-lab/form リファレンス

## client と field

`createFormClient(options)` は `provider`、`defaultValues`、`now`、`idSeed` を受け取ります。provider の既定値は `react-hook-form` です。`registerField` は rule と default value を登録し、既に同名の値があれば default value で上書きしません。

client の `setValue`、`getValues`、`getSchema`、`getLastErrors`、`listSubmitted`、`clear` は in-memory の状態を扱います。`getFieldError(client, field)` は error がなければ `undefined` ではなく `null` を返します。

## validation

`validateSchema(schema, values, provider)` は `ValidateResult` を返します。field rule は次を組み合わせられます。

| rule | 対象 | error code |
| --- | --- | --- |
| `required` | `undefined` `null` 空文字 | `required` |
| `min` | string の長さまたは number | `min` |
| `max` | string の長さまたは number | `max` |
| `pattern` | string | `pattern` |
| `custom` | 任意の値 | `custom` |

`custom` は error message または `null` を返します。未登録 field、value が undefined または null の required ではない field は、min、max、pattern の検証を通過します。

## submit

`client.submit({ onSubmit, onError })` は validation 後に `SubmitResult` を返します。失敗時は `onError` を呼び、成功時だけ `onSubmit` を await します。どちらの結果も `listSubmitted` へ記録されます。

`submitForm(client, options)` は `overrideValues` をセットしてから `client.submit` を呼ぶ convenience API です。

## 拡張 API

`validateAsync` は validator を並列または直列に実行します。`createFieldArray` は array mutation、`validateDependentFields` は条件付き field validation を扱います。

`retryWithBackoff`、`withTimeout`、`createObservabilityHook` は Promise の失敗制御と観測を扱う汎用 helper です。これらの state はテストごとに作ってください。

<!-- kiwa-public-api:start -->

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/form/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [client.ts](./api/client) | 1 | 6 |
| [extensions.ts](./api/extensions) | 6 | 9 |
| [fields.ts](./api/fields) | 2 | 0 |
| [submitter.ts](./api/submitter) | 1 | 1 |
| [validator.ts](./api/validator) | 1 | 3 |

<!-- kiwa-public-api:end -->
