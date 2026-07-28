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

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/skill-test/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>assertToolCalled</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/skill-test/src/index.ts#L86) <code v-pre>packages/skill-test/src/index.ts</code>

指定 tool が **少なくとも 1 回** 呼ばれたことを assertion する。 `opts.times` を渡した 場合はその回数と厳密一致を要求する。

```ts
export declare function assertToolCalled(spy: ToolSpy, toolName: string, opts?: {
    times?: number;
}): void;
```

#### <code v-pre>assertToolCalledWith</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/skill-test/src/index.ts#L130) <code v-pre>packages/skill-test/src/index.ts</code>

指定 tool が **想定引数で呼ばれたか** を assertion する。 引数一致は `JSON.parse(record.arguments)` と `expectedArgs` を deepStrictEqual で比較する。 「呼ばれた + そのうち 1 回でも引数一致」 で pass、 全呼出の引数一致は要求しない。 「全呼出で同引数」 を要求したければ caller 側で loop する。

```ts
export declare function assertToolCalledWith(spy: ToolSpy, toolName: string, expectedArgs: unknown): void;
```

#### <code v-pre>assertToolCallOrder</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/skill-test/src/index.ts#L162) <code v-pre>packages/skill-test/src/index.ts</code>

tool 呼出の **順序** を assertion する。 `expectedOrder` に列挙した tool 名が、 spy に記録された順序と subsequence として一致することを要求する (間に他 tool 挟むのは可)。 「厳密同順」 (間に他 tool 混入も許さない) を要求したい場合は `spy.getCalls().map(c =&gt; c.name)` を直接 assert する。

```ts
export declare function assertToolCallOrder(spy: ToolSpy, expectedOrder: string[]): void;
```

#### <code v-pre>assertToolNotCalled</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/skill-test/src/index.ts#L112) <code v-pre>packages/skill-test/src/index.ts</code>

指定 tool が **一度も呼ばれてない** ことを assertion する。 negative test 用。

```ts
export declare function assertToolNotCalled(spy: ToolSpy, toolName: string): void;
```

#### <code v-pre>createToolSpy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/skill-test/src/index.ts#L62) <code v-pre>packages/skill-test/src/index.ts</code>

新規 tool spy を作成する。 各 test で fresh spy を使うのが基本。

```ts
export declare function createToolSpy(): ToolSpy;
```

### 型

#### <code v-pre>ToolCallRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/skill-test/src/index.ts#L35) <code v-pre>packages/skill-test/src/index.ts</code>

`@kiwa-lab/skill-test` — Skill 発火 assertion primitive。 # 用途 kiwa の agent / mcp / cli / assistant 系 lib が実装する skill / tool 呼出 logic に対して、 「想定 tool が実際に呼ばれたか」 「順序」 「回数」 「引数」 を behavior test で検証する 経路 SSOT。 test-taxonomy.md § skill 準拠。 # 使い方 (基本 flow) ```ts import { createToolSpy, assertToolCalled, assertToolCallOrder } from '@kiwa-lab/skill-test'; const spy = createToolSpy(); // 対象 lib の tool 呼出 interceptor に spy を注入する経路 const agent = createAgent({ onToolCall: (name, args) =&gt; spy.record(name, args) }); await agent.run('do the thing'); assertToolCalled(spy, 'Read'); assertToolCallOrder(spy, ['Read', 'Bash']); ``` # 設計方針 - **spy = 蓄積のみ**、 assertion は別 primitive 経由。 test 側で自由に組合せる。 - **assertion は throw**、 vitest の `expect` と同じ contract (test body で自然に fail する)。 - **順序 / 回数 / 引数 は独立**。 「呼ばれたか」 だけの緩い test も、 「順序まで」 の厳密 test も 同じ spy に対して重ねられる。 - **agent / tool 型に非依存**。 tool 名 + 引数 JSON string の 2 要素だけで抽象化、 OpenAI 形式 の tool_calls / MCP tools / CLI arg parser など任意 skill 実装に配線できる。

```ts
export interface ToolCallRecord {
    /** 呼ばれた tool 名 (例 'Read' / 'Bash' / 'search_docs')。 */
    name: string;
    /**
     * 引数の JSON string。 OpenAI 形式の `tool_calls[].function.arguments` に整合。
     * 型付き引数は caller 側で `JSON.parse(rec.arguments)` してから assertion する。
     */
    arguments: string;
    /**
     * insertion order を保持する連番 (0 起点)。 Date.now() を使わない理由 = test 実行内で
     * 同 ms に複数 tool が呼ばれると順序 assertion が壊れるため、 spy 内 counter で単調保証する。
     */
    order: number;
}
```

#### <code v-pre>ToolSpy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/skill-test/src/index.ts#L50) <code v-pre>packages/skill-test/src/index.ts</code>

```ts
export interface ToolSpy {
    /** 呼出を記録する。 skill/agent 実装の tool 呼出 interceptor から呼ぶ。 */
    record(name: string, argumentsJson: string): void;
    /** これまでの全 tool 呼出。 */
    getCalls(): ToolCallRecord[];
    /** 指定 tool 名に一致する呼出のみ。 */
    getCallsFor(toolName: string): ToolCallRecord[];
    /** 呼出 counter を 0 に戻す (test 間で spy を使い回す時)。 */
    reset(): void;
}
```
<!-- kiwa-public-api:end -->
