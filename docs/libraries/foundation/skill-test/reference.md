# Skill Test リファレンス

`@kiwa-lab/skill-test` はツール呼び出しの assertion を提供します。

## 公開 API

- `createToolSpy`
- `assertToolCalled`
- `assertToolNotCalled`
- `assertToolCalledWith`
- `assertToolCallOrder`

## 設定

`ToolSpy.record` はtool名と引数文字列を受け取ります。引数がJSONなら `assertToolCalledWith` でobjectとして検証できます。JSONとしてparseできない文字列はraw stringとして比較するため、CLI引数のような非JSON値も `expectedArgs` に同じ文字列を渡せば検証できます。

## 後始末

`ToolSpy.reset()` は記録と順序カウンターを初期化します。

## assertion の厳密さ

`assertToolCalled(spy, name, { times })` は回数を指定しないと少なくとも一回を確認します。`times` を渡すと厳密な回数一致です。`assertToolCalledWith` は同じtoolのいずれか一回が期待引数と深い値比較で一致すればpassします。`assertToolCallOrder` は期待tool名の順序をsubsequenceとして確認し、同じtoolが余分に呼ばれたかは回数assertionも併用して判定します。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>assertToolCalled: expected tool "$&#123;toolName&#125;" to be called at least once, but it was never invoked. actual calls = &#91;$&#123;describeCalls(spy)&#125;&#93;</code> | [packages/skill-test/src/index.ts](https://github.com/cardene777/kiwa/blob/main/packages/skill-test/src/index.ts#L101) |
| <code v-pre>assertToolNotCalled: expected tool "$&#123;toolName&#125;" to be never called, but it was invoked $&#123;matches.length&#125; time(s). actual calls = &#91;$&#123;describeCalls(spy)&#125;&#93;</code> | [packages/skill-test/src/index.ts](https://github.com/cardene777/kiwa/blob/main/packages/skill-test/src/index.ts#L115) |
| <code v-pre>assertToolCalledWith: tool "$&#123;toolName&#125;" was never called (expected args $&#123;JSON.stringify(expectedArgs)&#125;). actual calls = &#91;$&#123;describeCalls(spy)&#125;&#93;</code> | [packages/skill-test/src/index.ts](https://github.com/cardene777/kiwa/blob/main/packages/skill-test/src/index.ts#L137) |
| <code v-pre>assertToolCalledWith: tool "$&#123;toolName&#125;" was called $&#123;matches.length&#125; time(s) but no call matched expected args $&#123;JSON.stringify(expectedArgs)&#125;. observed args = &#91;$&#123;observed&#125;&#93;</code> | [packages/skill-test/src/index.ts](https://github.com/cardene777/kiwa/blob/main/packages/skill-test/src/index.ts#L148) |
| <code v-pre>assertToolCallOrder: expected order $&#123;JSON.stringify(expectedOrder)&#125; not found as subsequence in actual calls $&#123;JSON.stringify(actualNames)&#125;. matched up to index $&#123;cursor&#125;.</code> | [packages/skill-test/src/index.ts](https://github.com/cardene777/kiwa/blob/main/packages/skill-test/src/index.ts#L170) |
| <code v-pre>assertToolCalled: expected tool "$&#123;toolName&#125;" to be called $&#123;opts.times&#125; time(s), observed $&#123;matches.length&#125;. actual calls = &#91;$&#123;describeCalls(spy)&#125;&#93;</code> | [packages/skill-test/src/index.ts](https://github.com/cardene777/kiwa/blob/main/packages/skill-test/src/index.ts#L94) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/skill-test/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [index.ts](./api/index) | 5 | 2 |

<!-- kiwa-public-api:end -->
