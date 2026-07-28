---
title: "@kiwa-lab/mobile semantics-codegen の API 契約"
---

# <code v-pre>@kiwa-lab/mobile</code> <code v-pre>semantics-codegen</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>completeCodegenBuild</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L86) <code v-pre>packages/mobile/src/semantics/codegen.ts</code>

```ts
export declare function completeCodegenBuild(session: CodegenSession): AxisStep<CodegenState>;
```

#### <code v-pre>emitCodegenType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L73) <code v-pre>packages/mobile/src/semantics/codegen.ts</code>

```ts
export declare function emitCodegenType(session: CodegenSession, filePath: string): AxisStep<CodegenState>;
```

#### <code v-pre>generateSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L61) <code v-pre>packages/mobile/src/semantics/codegen.ts</code>

```ts
export declare function generateSpec(session: CodegenSession, input: {
    specCount: number;
}): AxisStep<CodegenState>;
```

#### <code v-pre>initCodegen</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L36) <code v-pre>packages/mobile/src/semantics/codegen.ts</code>

```ts
export declare function initCodegen(input: {
    target: MobileTarget;
    packageName: string;
}): CodegenSession;
```

#### <code v-pre>loadCodegenSchema</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L51) <code v-pre>packages/mobile/src/semantics/codegen.ts</code>

```ts
export declare function loadCodegenSchema(session: CodegenSession, schemaHash: string): AxisStep<CodegenState>;
```

### 型

#### <code v-pre>CodegenSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L8) <code v-pre>packages/mobile/src/semantics/codegen.ts</code>

```ts
export interface CodegenSession {
    target: MobileTarget;
    packageName: string;
    state: CodegenState;
    schemaHash: string | null;
    emittedFiles: string[];
    history: AxisStep<CodegenState>[];
}
```

#### <code v-pre>CodegenState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L6) <code v-pre>packages/mobile/src/semantics/codegen.ts</code>

v1.52 codegen axis — React Native 0.76+ Codegen (typed bridge + schema-first + type generation)。

```ts
export type CodegenState = 'idle' | 'schema-loaded' | 'spec-generated' | 'type-emitted' | 'build-completed';
```
