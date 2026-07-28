# Agent リファレンス

## 状態グラフ

`StateGraph<TState>` に `addNode(name, handler)` と `addEdge(from, to)` を追加し、`compile()` 後に実行します。`invoke(state)` は完了時の state を返します。途中の node、patch、merge 後の state を確認したいときは `stream(state)` を非同期反復します。`START` と `END` は開始と終了を表す予約 node です。

コンパイル時には開始edge、存在しないnodeへの遷移、終了経路のないnode、複数の開始edgeを検証します。実行回数は `DEFAULT_MAX_STEPS` で制限され、超過時は `MaxStepsExceededError` になります。edgeは無条件で、同じnodeから複数の遷移先を選ぶrouterはありません。

## Assistants クライアント

`new AssistantsClient(config)` で in-memory client を作り、`createAssistant`、`createThread`、`createRun` の順で run を作成します。`poll(runId)` は queued run を一段階進めます。handler が message を返せば assistant message を thread に追加して completed になり、tool calls を返せば requires_action で停止します。`submitToolOutputs` は requires_action の run だけを queued に戻します。`cancel` は未完了 run を `lastError.code` が `cancelled` の failed state にします。`toolCall` は handler が返す tool call の arguments を JSON string へ整形する helper です。

`AssistantsClientConfig` の `idSeed` を指定すると、生成IDをテストで安定させられます。IDはclient内の連番で、clientを新しく作ると連番も最初から始まります。resourceを取得する `getAssistant`、`getThread`、`getRun` はtestとdebug用で、getRunはrunのshallow copyを返します。

`poll` はqueued runだけを進めます。requires_action、completed、failedはpollしても変化しません。`submitToolOutputs` はrequires_action以外でthrowし、tool outputの内容は検証しません。tool outputを受け取ったhandlerが再びtool callsを返せば、再度requires_actionになります。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>unknown assistant id: $&#123;assistantId&#125;</code> | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L101) |
| <code v-pre>unknown thread id: $&#123;threadId&#125;</code> | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L141) |
| <code v-pre>unknown thread id: $&#123;params.threadId&#125;</code> | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L167) |
| <code v-pre>unknown assistant id: $&#123;params.assistantId&#125;</code> | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L170) |
| <code v-pre>assistant $&#123;params.assistantId&#125; has no handler registered — call registerHandler() first</code> | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L173) |
| <code v-pre>unknown run id: $&#123;runId&#125;</code> | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L205) |
| <code v-pre>pollUntilFinal exceeded $&#123;maxAttempts&#125; attempts for run $&#123;runId&#125;</code> | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L227) |
| <code v-pre>unknown run id: $&#123;runId&#125;</code> | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L242) |
| <code v-pre>run $&#123;runId&#125; is not requires&#95;action (current: $&#123;run.status&#125;), cannot submit tool outputs</code> | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L245) |
| <code v-pre>unknown run id: $&#123;runId&#125;</code> | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L271) |
| <code v-pre>run $&#123;run.id&#125; references missing thread or handler</code> | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L303) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [langgraph.ts](./api/langgraph) | 2 | 0 |
| [openai-assistants.ts](./api/openai-assistants) | 2 | 1 |
| [state-machine.ts](./api/state-machine) | 4 | 1 |
| [types.ts](./api/types) | 2 | 17 |

<!-- kiwa-public-api:end -->
