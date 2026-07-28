# @kiwa-lab/agent

`@kiwa-lab/agent` は、LangGraph 型の状態グラフと OpenAI Assistants 型の run lifecycle をプロセス内で再現する test harness です。LLM の出力そのものを評価するのではなく、state の更新、tool request による停止、tool output 後の再開、handler 失敗を決定的に検証します。

## 検証する流れ

<img src="/images/kiwa-docs/ai-realtime/agent-overview.webp" alt="状態グラフを実行してtool outputの後に完了するagentの流れ" width="1672" height="941" loading="lazy" decoding="async">

状態グラフは node と edge を compile してから実行します。`invoke` は最後の state を、`stream` は途中の更新を返します。node が返す部分 state は shallow merge されるため、どの node がどの値を変えたかをテストできます。

Assistants 形式では thread を作り run を開始し、`requires_action` になった run へ tool output を渡して再開します。tool output を渡す前に completed にならないこと、handler の失敗が failed として記録されることを、外部実行環境なしで確認できます。

## 使う場面

外部の agent 実行環境を呼ばずに、分岐、停止、tool 呼び出しを test するときに使います。StateGraph は無条件 edge と shallow merge だけを扱い、conditional routing、reducer、checkpoint、human-in-the-loop は実装しません。

## グラフを compile できる条件

graph には一つだけ START edge が必要です。START の遷移先とすべての edge の両端は登録済み node でなければならず、各 node は最終的に END へ続く outgoing edge を持つ必要があります。これらを満たさない `compile()` は `GraphCompileError` になります。実行時には同じ node を繰り返すことを agent loop として解釈せず、`maxSteps` を越えると停止します。

## 外部実行との境界

`AssistantsClient` は in-memory mock です。LLM、OpenAI API、tool、streaming SSE、vector store、file search、code interpreter を実行しません。handler が返す結果と、呼び出し側が渡す tool output だけで run 状態を進めます。tool output の ID、個数、JSON schema の検証も application 側の責務です。

## 読み進める

[Quickstart](./quickstart) では状態グラフを一つ作り、保存した test file を実行します。[使い方](./how-to) では tool output を渡して run を再開する経路、handler failure、中止を一つの file で確認します。LLM の SDK 境界は [AI LLM](/libraries/ai-realtime/ai-llm/)、MCP tool は [MCP](/libraries/ai-realtime/mcp/) を使います。run status と API の全項目は [リファレンス](./reference) にあります。
