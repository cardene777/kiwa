# Mobile リファレンス

`@kiwa-lab/mobile` の root entry point は semantics と adapters を再公開します。以下は主要 API の責務と境界です。詳細な型は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/index.ts) から確認できます。

## 共通の型

`MobileTarget` は `ios`、`android`、`web` です。`MobileAxis` は React Native、Expo、Metro、navigation、Reanimated、storage、New Architecture の11領域を表します。

操作の戻り値である `AxisStep` には、共通名 `neutralEvent`、platform 別名 `providerEvent`、遷移後の `state`、補助情報 `metadata` が含まれます。session にはすべての step が `history` に蓄積されます。

## React Native

| API | 役割 | 主な失敗条件 |
| --- | --- | --- |
| `mountReactNativeComponent` | `mounted` session を作る | 空の `componentId` |
| `invokeNativeModule` | native invocation を記録する | unmount 済み session |
| `recognizeGesture` | `tap`、`pan`、`pinch`、`rotation`、`swipe` を記録する | unmount 済み session |
| `unmountReactNativeComponent` | session を `unmounted` にする | 二重 unmount |

これらは実 JSX や native module を実行しません。

## navigation と storage

`initNavigation` は idle session を作ります。`pushNavigationStack`、`switchNavigationTab`、`openNavigationModal`、`navigateDeepLink` は入力値を履歴に追加します。空の ID や URL は失敗しますが、route の存在確認や実際の画面遷移は行いません。

`initAsyncStorage` は memory 上の store を作ります。`setAsyncStorageItem`、`readAsyncStorageItem`、`removeAsyncStorageItem`、`flushAsyncStorageBatch` は操作数と hit、remove 結果を記録します。実 AsyncStorage や secure storage の永続化、暗号化、認証は扱いません。

## CLI adapter

`invokeMobileCli` は既定の Node.js spawn を使います。テストでは `invokeMobileCliWith` に spawn function を注入できます。許可される command は `expo build`、`metro bundle`、`codegen run`、`react-native start`、`pod install`、`gradle build` です。

実行には `KIWA_MOBILE_MODE=real` が必要です。`KIWA_MOBILE_SPAWN=dry-run` を指定すると外部 command を起動せず、`SpawnResult` の shape を返します。実 spawn は既定で 60 秒の timeout と 10 MiB の stdout、stderr 上限を適用します。buffer を超えると process を停止し、出力に marker を追加します。

`sanitizeEnv` は command 別 allowlist にある非空の環境変数だけを返します。`buildSpawnInvocation` は省略時に現在の process 環境を入力に使いますが、実際の spawn へは sanitize 後の値だけが渡ります。

## real driver

`readMobileRealDriverEnv` は `KIWA_MOBILE_MODE=real` のときだけ設定を読みます。`assertMobileRealDriverAvailable` は axis に対応した URL があることを確認します。

| axis | 必要な環境変数 |
| --- | --- |
| `expo-eas` | `KIWA_EXPO_EAS_URL` |
| `metro` | `KIWA_METRO_URL` |
| `navigation` | `KIWA_NAVIGATION_URL` |
| `reanimated` | `KIWA_REANIMATED_URL` |
| `async-storage` | `KIWA_ASYNC_STORAGE_URL` |
| `secure-storage` | `KIWA_SECURE_STORAGE_URL` |

この確認は endpoint の疎通や実 device の状態までは検証しません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>mobile real driver requested for $&#123;axis&#125; but KIWA&#95;MOBILE&#95;MODE!=='real'</code> | [packages/mobile/src/adapters/real-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/real-driver.ts#L56) |
| <code v-pre>mobile $&#123;axis&#125; URL env ($&#123;String(envKey)&#125;) not set; real driver unavailable</code> | [packages/mobile/src/adapters/real-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/real-driver.ts#L63) |
| <code v-pre>invokeMobileCli($&#123;inv.command&#125;): KIWA&#95;MOBILE&#95;MODE must be 'real'</code> | [packages/mobile/src/adapters/spawn-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L73) |
| <code v-pre>invokeMobileCli($&#123;inv.command&#125;): args exceeds max 32 ($&#123;inv.args.length&#125;)</code> | [packages/mobile/src/adapters/spawn-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L78) |
| <code v-pre>splitCommand: unable to derive executable from $&#123;command&#125;</code> | [packages/mobile/src/adapters/spawn-executor.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-executor.ts#L59) |
| <code v-pre>initAsyncStorage: storeId must not be empty</code> | [packages/mobile/src/semantics/async-storage.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L37) |
| <code v-pre>setAsyncStorageItem: key must not be empty</code> | [packages/mobile/src/semantics/async-storage.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L52) |
| <code v-pre>initCodegen: packageName must not be empty</code> | [packages/mobile/src/semantics/codegen.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L40) |
| <code v-pre>loadCodegenSchema: schemaHash must not be empty</code> | [packages/mobile/src/semantics/codegen.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L55) |
| <code v-pre>generateSpec: session is $&#123;session.state&#125;</code> | [packages/mobile/src/semantics/codegen.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L66) |
| <code v-pre>generateSpec: specCount must be &gt; 0</code> | [packages/mobile/src/semantics/codegen.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L68) |
| <code v-pre>emitCodegenType: filePath must not be empty</code> | [packages/mobile/src/semantics/codegen.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L77) |
| <code v-pre>completeCodegenBuild: session is $&#123;session.state&#125;</code> | [packages/mobile/src/semantics/codegen.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L88) |
| <code v-pre>loadExpoBuildConfig: appSlug must not be empty</code> | [packages/mobile/src/semantics/expo.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L44) |
| <code v-pre>loadExpoBuildConfig: configHash must not be empty</code> | [packages/mobile/src/semantics/expo.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L47) |
| <code v-pre>resolveDeepLink: build config must be loaded first</code> | [packages/mobile/src/semantics/expo.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L67) |
| <code v-pre>receivePushNotification: build config must be loaded first</code> | [packages/mobile/src/semantics/expo.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L84) |
| <code v-pre>completeExpoBuild: build config must be loaded first</code> | [packages/mobile/src/semantics/expo.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L99) |
| <code v-pre>initFabric: rootId must not be empty</code> | [packages/mobile/src/semantics/fabric.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L37) |
| <code v-pre>commitShadowTree: session is $&#123;session.state&#125;</code> | [packages/mobile/src/semantics/fabric.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L62) |
| <code v-pre>commitShadowTree: nodeCount must be &gt;= 0</code> | [packages/mobile/src/semantics/fabric.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L64) |
| <code v-pre>completeFabricMount: session is $&#123;session.state&#125;</code> | [packages/mobile/src/semantics/fabric.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L81) |
| <code v-pre>startMetroBundle: bundleId must not be empty</code> | [packages/mobile/src/semantics/metro.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L42) |
| <code v-pre>resolveMetroModule: bundle must be started first</code> | [packages/mobile/src/semantics/metro.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L61) |
| <code v-pre>applyMetroHmr: bundle must be started first</code> | [packages/mobile/src/semantics/metro.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L76) |
| <code v-pre>completeMetroBundle: bundle must be started first</code> | [packages/mobile/src/semantics/metro.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L90) |
| <code v-pre>initNavigation: navigatorId must not be empty</code> | [packages/mobile/src/semantics/navigation.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L39) |
| <code v-pre>pushNavigationStack: screenName must not be empty</code> | [packages/mobile/src/semantics/navigation.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L52) |
| <code v-pre>switchNavigationTab: tabName must not be empty</code> | [packages/mobile/src/semantics/navigation.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L59) |
| <code v-pre>openNavigationModal: modalId must not be empty</code> | [packages/mobile/src/semantics/navigation.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L66) |
| <code v-pre>navigateDeepLink: url must not be empty</code> | [packages/mobile/src/semantics/navigation.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L73) |
| <code v-pre>initNewArchitecture: appName must not be empty</code> | [packages/mobile/src/semantics/new-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L40) |
| <code v-pre>startNewArchInit: session is $&#123;session.state&#125;</code> | [packages/mobile/src/semantics/new-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L53) |
| <code v-pre>enableConcurrentReact: session is $&#123;session.state&#125;</code> | [packages/mobile/src/semantics/new-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L63) |
| <code v-pre>bridgeLegacyModule: session is $&#123;session.state&#125;</code> | [packages/mobile/src/semantics/new-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L75) |
| <code v-pre>bridgeLegacyModule: moduleName must not be empty</code> | [packages/mobile/src/semantics/new-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L77) |
| <code v-pre>markNewArchReady: session is $&#123;session.state&#125;</code> | [packages/mobile/src/semantics/new-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L90) |
| <code v-pre>mountReactNativeComponent: componentId must not be empty</code> | [packages/mobile/src/semantics/react-native.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L42) |
| <code v-pre>invokeNativeModule: component is unmounted</code> | [packages/mobile/src/semantics/react-native.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L61) |
| <code v-pre>recognizeGesture: component is unmounted</code> | [packages/mobile/src/semantics/react-native.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L76) |
| <code v-pre>unmountReactNativeComponent: already unmounted</code> | [packages/mobile/src/semantics/react-native.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L90) |
| <code v-pre>initReanimated: animationId must not be empty</code> | [packages/mobile/src/semantics/reanimated.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L37) |
| <code v-pre>executeWorklet: workletName must not be empty</code> | [packages/mobile/src/semantics/reanimated.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L62) |
| <code v-pre>startReanimatedAnimation: durationMs must be &gt;= 0</code> | [packages/mobile/src/semantics/reanimated.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L75) |
| <code v-pre>completeReanimatedAnimation: session is $&#123;session.state&#125;</code> | [packages/mobile/src/semantics/reanimated.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L85) |
| <code v-pre>initSecureStorage: vaultId must not be empty</code> | [packages/mobile/src/semantics/secure-storage.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L38) |
| <code v-pre>storeCredential: key must not be empty</code> | [packages/mobile/src/semantics/secure-storage.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L53) |
| <code v-pre>initTurboModules: moduleName must not be empty</code> | [packages/mobile/src/semantics/turbo-modules.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L41) |
| <code v-pre>registerTurboSpec: methods must not be empty</code> | [packages/mobile/src/semantics/turbo-modules.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L57) |
| <code v-pre>bindJsiRuntime: session is $&#123;session.state&#125;</code> | [packages/mobile/src/semantics/turbo-modules.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L68) |
| <code v-pre>invokeTurboMethod: session is $&#123;session.state&#125;, jsi not bound</code> | [packages/mobile/src/semantics/turbo-modules.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L80) |
| <code v-pre>invokeTurboMethod: $&#123;methodName&#125; not in registered methods</code> | [packages/mobile/src/semantics/turbo-modules.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L83) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>applyMetroHmr</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L71) <code v-pre>packages/mobile/src/semantics/metro.ts</code>

```ts
export declare function applyMetroHmr(session: MetroSession, moduleId: string): AxisStep<MetroState>;
```

#### <code v-pre>assertMobileRealDriverAvailable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/real-driver.ts#L51) <code v-pre>packages/mobile/src/adapters/real-driver.ts</code>

```ts
export declare function assertMobileRealDriverAvailable(axis: MobileRealDriverAxis, env: MobileRealDriverEnv | null): void;
```

#### <code v-pre>bindJsiRuntime</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L66) <code v-pre>packages/mobile/src/semantics/turbo-modules.ts</code>

```ts
export declare function bindJsiRuntime(session: TurboModulesSession): AxisStep<TurboModulesState>;
```

#### <code v-pre>bridgeLegacyModule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L70) <code v-pre>packages/mobile/src/semantics/new-architecture.ts</code>

```ts
export declare function bridgeLegacyModule(session: NewArchitectureSession, moduleName: string): AxisStep<NewArchitectureState>;
```

#### <code v-pre>buildSpawnInvocation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L118) <code v-pre>packages/mobile/src/adapters/spawn-driver.ts</code>

```ts
export declare function buildSpawnInvocation(input: {
    command: MobileCliCommand;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
}): SpawnInvocation;
```

#### <code v-pre>challengeBiometric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L71) <code v-pre>packages/mobile/src/semantics/secure-storage.ts</code>

```ts
export declare function challengeBiometric(session: SecureStorageSession, input: {
    method: 'face-id' | 'touch-id' | 'fingerprint' | 'webauthn';
    success: boolean;
}): AxisStep<SecureStorageState>;
```

#### <code v-pre>cliForAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L114) <code v-pre>packages/mobile/src/adapters/spawn-driver.ts</code>

```ts
export declare function cliForAxis(axis: MobileAxis): MobileCliCommand | null;
```

#### <code v-pre>collectFidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fidelity.ts#L87) <code v-pre>packages/mobile/src/semantics/fidelity.ts</code>

```ts
export declare function collectFidelityCoverage(providers?: MobileTarget[]): FidelityCoverage;
```

#### <code v-pre>commitShadowTree</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L57) <code v-pre>packages/mobile/src/semantics/fabric.ts</code>

```ts
export declare function commitShadowTree(session: FabricSession, input: {
    nodeCount: number;
}): AxisStep<FabricState>;
```

#### <code v-pre>completeCodegenBuild</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L86) <code v-pre>packages/mobile/src/semantics/codegen.ts</code>

```ts
export declare function completeCodegenBuild(session: CodegenSession): AxisStep<CodegenState>;
```

#### <code v-pre>completeExpoBuild</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L95) <code v-pre>packages/mobile/src/semantics/expo.ts</code>

```ts
export declare function completeExpoBuild(session: ExpoSession): AxisStep<ExpoState>;
```

#### <code v-pre>completeFabricMount</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L79) <code v-pre>packages/mobile/src/semantics/fabric.ts</code>

```ts
export declare function completeFabricMount(session: FabricSession): AxisStep<FabricState>;
```

#### <code v-pre>completeMetroBundle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L86) <code v-pre>packages/mobile/src/semantics/metro.ts</code>

```ts
export declare function completeMetroBundle(session: MetroSession): AxisStep<MetroState>;
```

#### <code v-pre>completeReanimatedAnimation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L83) <code v-pre>packages/mobile/src/semantics/reanimated.ts</code>

```ts
export declare function completeReanimatedAnimation(session: ReanimatedSession): AxisStep<ReanimatedState>;
```

#### <code v-pre>emitCodegenType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L73) <code v-pre>packages/mobile/src/semantics/codegen.ts</code>

```ts
export declare function emitCodegenType(session: CodegenSession, filePath: string): AxisStep<CodegenState>;
```

#### <code v-pre>enableConcurrentReact</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L59) <code v-pre>packages/mobile/src/semantics/new-architecture.ts</code>

```ts
export declare function enableConcurrentReact(session: NewArchitectureSession): AxisStep<NewArchitectureState>;
```

#### <code v-pre>executeSpawn</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-executor.ts#L64) <code v-pre>packages/mobile/src/adapters/spawn-executor.ts</code>

```ts
export declare function executeSpawn(input: SpawnExecutorInput, spawnFn?: SpawnFn): Promise<SpawnExecutorResult>;
```

#### <code v-pre>executeWorklet</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L61) <code v-pre>packages/mobile/src/semantics/reanimated.ts</code>

```ts
export declare function executeWorklet(session: ReanimatedSession, workletName: string): AxisStep<ReanimatedState>;
```

#### <code v-pre>flushAsyncStorageBatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L79) <code v-pre>packages/mobile/src/semantics/async-storage.ts</code>

```ts
export declare function flushAsyncStorageBatch(session: AsyncStorageSession): AxisStep<AsyncStorageState>;
```

#### <code v-pre>generateSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L61) <code v-pre>packages/mobile/src/semantics/codegen.ts</code>

```ts
export declare function generateSpec(session: CodegenSession, input: {
    specCount: number;
}): AxisStep<CodegenState>;
```

#### <code v-pre>initAsyncStorage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L36) <code v-pre>packages/mobile/src/semantics/async-storage.ts</code>

```ts
export declare function initAsyncStorage(input: {
    target: MobileTarget;
    storeId: string;
}): AsyncStorageSession;
```

#### <code v-pre>initCodegen</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L36) <code v-pre>packages/mobile/src/semantics/codegen.ts</code>

```ts
export declare function initCodegen(input: {
    target: MobileTarget;
    packageName: string;
}): CodegenSession;
```

#### <code v-pre>initFabric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L36) <code v-pre>packages/mobile/src/semantics/fabric.ts</code>

```ts
export declare function initFabric(input: {
    target: MobileTarget;
    rootId: string;
}): FabricSession;
```

#### <code v-pre>initNavigation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L38) <code v-pre>packages/mobile/src/semantics/navigation.ts</code>

```ts
export declare function initNavigation(input: {
    target: MobileTarget;
    navigatorId: string;
}): NavigationSession;
```

#### <code v-pre>initNewArchitecture</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L36) <code v-pre>packages/mobile/src/semantics/new-architecture.ts</code>

```ts
export declare function initNewArchitecture(input: {
    target: MobileTarget;
    appName: string;
}): NewArchitectureSession;
```

#### <code v-pre>initReanimated</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L36) <code v-pre>packages/mobile/src/semantics/reanimated.ts</code>

```ts
export declare function initReanimated(input: {
    target: MobileTarget;
    animationId: string;
}): ReanimatedSession;
```

#### <code v-pre>initSecureStorage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L37) <code v-pre>packages/mobile/src/semantics/secure-storage.ts</code>

```ts
export declare function initSecureStorage(input: {
    target: MobileTarget;
    vaultId: string;
}): SecureStorageSession;
```

#### <code v-pre>initTurboModules</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L37) <code v-pre>packages/mobile/src/semantics/turbo-modules.ts</code>

```ts
export declare function initTurboModules(input: {
    target: MobileTarget;
    moduleName: string;
}): TurboModulesSession;
```

#### <code v-pre>invokeMobileCli</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L59) <code v-pre>packages/mobile/src/adapters/spawn-driver.ts</code>

v0.6 実 spawn 実行 = env-gate 通過確認 + args 上限 32 + 実 child_process.spawn 実行。 `KIWA_MOBILE_MODE=real` + 対応 axis env 未設定なら throw で fail-closed。 `KIWA_MOBILE_SPAWN=dry-run` の時は v0.5 stub 相当の shape 契約を返す (実 CLI 未 install 環境向け backward compat 経路)。

```ts
export declare function invokeMobileCli(inv: SpawnInvocation): Promise<SpawnResult>;
```

#### <code v-pre>invokeMobileCliWith</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L67) <code v-pre>packages/mobile/src/adapters/spawn-driver.ts</code>

DI 経路 = spawnFn を注入可能、 test で dummy spawn を差し込んで 決定的挙動を検証できる。 default は nodeSpawn。

```ts
export declare function invokeMobileCliWith(inv: SpawnInvocation, spawnFn: SpawnFn): Promise<SpawnResult>;
```

#### <code v-pre>invokeNativeModule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L56) <code v-pre>packages/mobile/src/semantics/react-native.ts</code>

```ts
export declare function invokeNativeModule(session: ReactNativeSession, moduleName: string): AxisStep<ReactNativeState>;
```

#### <code v-pre>invokeTurboMethod</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L75) <code v-pre>packages/mobile/src/semantics/turbo-modules.ts</code>

```ts
export declare function invokeTurboMethod(session: TurboModulesSession, methodName: string): AxisStep<TurboModulesState>;
```

#### <code v-pre>loadCodegenSchema</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L51) <code v-pre>packages/mobile/src/semantics/codegen.ts</code>

```ts
export declare function loadCodegenSchema(session: CodegenSession, schemaHash: string): AxisStep<CodegenState>;
```

#### <code v-pre>loadExpoBuildConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L38) <code v-pre>packages/mobile/src/semantics/expo.ts</code>

```ts
export declare function loadExpoBuildConfig(input: {
    target: MobileTarget;
    appSlug: string;
    configHash: string;
}): ExpoSession;
```

#### <code v-pre>makeMockAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/mock-factory.ts#L215) <code v-pre>packages/mobile/src/adapters/mock-factory.ts</code>

```ts
export declare function makeMockAdapter(axis: MobileAxis): MobileAdapter;
```

#### <code v-pre>makeRealAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/mock-factory.ts#L225) <code v-pre>packages/mobile/src/adapters/mock-factory.ts</code>

```ts
export declare function makeRealAdapter(axis: MobileAxis): MobileAdapter;
```

#### <code v-pre>markNewArchReady</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L86) <code v-pre>packages/mobile/src/semantics/new-architecture.ts</code>

```ts
export declare function markNewArchReady(session: NewArchitectureSession): AxisStep<NewArchitectureState>;
```

#### <code v-pre>MOBILE&#95;AXIS&#95;TO&#95;EVENTS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fidelity.ts#L16) <code v-pre>packages/mobile/src/semantics/fidelity.ts</code>

```ts
export declare const MOBILE_AXIS_TO_EVENTS: Record<MobileAxis, NeutralEventName[]>;
```

#### <code v-pre>MOCK&#95;ADAPTERS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/mock-factory.ts#L236) <code v-pre>packages/mobile/src/adapters/mock-factory.ts</code>

```ts
export declare const MOCK_ADAPTERS: Record<MobileAxis, MobileAdapter>;
```

#### <code v-pre>mountReactNativeComponent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L37) <code v-pre>packages/mobile/src/semantics/react-native.ts</code>

```ts
export declare function mountReactNativeComponent(input: {
    target: MobileTarget;
    componentId: string;
}): ReactNativeSession;
```

#### <code v-pre>navigateDeepLink</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L72) <code v-pre>packages/mobile/src/semantics/navigation.ts</code>

```ts
export declare function navigateDeepLink(session: NavigationSession, url: string): AxisStep<NavigationState>;
```

#### <code v-pre>openNavigationModal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L65) <code v-pre>packages/mobile/src/semantics/navigation.ts</code>

```ts
export declare function openNavigationModal(session: NavigationSession, modalId: string): AxisStep<NavigationState>;
```

#### <code v-pre>providerEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/types.ts#L230) <code v-pre>packages/mobile/src/semantics/types.ts</code>

```ts
export declare function providerEventName(target: MobileTarget, neutral: NeutralEventName): string;
```

#### <code v-pre>pushNavigationStack</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L51) <code v-pre>packages/mobile/src/semantics/navigation.ts</code>

```ts
export declare function pushNavigationStack(session: NavigationSession, screenName: string): AxisStep<NavigationState>;
```

#### <code v-pre>readAsyncStorageItem</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L59) <code v-pre>packages/mobile/src/semantics/async-storage.ts</code>

```ts
export declare function readAsyncStorageItem(session: AsyncStorageSession, key: string): AxisStep<AsyncStorageState>;
```

#### <code v-pre>readMobileRealDriverEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/real-driver.ts#L39) <code v-pre>packages/mobile/src/adapters/real-driver.ts</code>

```ts
export declare function readMobileRealDriverEnv(env?: NodeJS.ProcessEnv): MobileRealDriverEnv | null;
```

#### <code v-pre>REAL&#95;ADAPTERS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/mock-factory.ts#L250) <code v-pre>packages/mobile/src/adapters/mock-factory.ts</code>

```ts
export declare const REAL_ADAPTERS: Record<MobileAxis, MobileAdapter>;
```

#### <code v-pre>receivePushNotification</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L79) <code v-pre>packages/mobile/src/semantics/expo.ts</code>

```ts
export declare function receivePushNotification(session: ExpoSession, input: {
    notificationId: string;
    category: string;
}): AxisStep<ExpoState>;
```

#### <code v-pre>recognizeGesture</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L71) <code v-pre>packages/mobile/src/semantics/react-native.ts</code>

```ts
export declare function recognizeGesture(session: ReactNativeSession, gesture: 'tap' | 'pan' | 'pinch' | 'rotation' | 'swipe'): AxisStep<ReactNativeState>;
```

#### <code v-pre>registerTurboSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L53) <code v-pre>packages/mobile/src/semantics/turbo-modules.ts</code>

```ts
export declare function registerTurboSpec(session: TurboModulesSession, methods: string[]): AxisStep<TurboModulesState>;
```

#### <code v-pre>removeAsyncStorageItem</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L69) <code v-pre>packages/mobile/src/semantics/async-storage.ts</code>

```ts
export declare function removeAsyncStorageItem(session: AsyncStorageSession, key: string): AxisStep<AsyncStorageState>;
```

#### <code v-pre>removeCredential</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L84) <code v-pre>packages/mobile/src/semantics/secure-storage.ts</code>

```ts
export declare function removeCredential(session: SecureStorageSession, key: string): AxisStep<SecureStorageState>;
```

#### <code v-pre>resolveDeepLink</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L62) <code v-pre>packages/mobile/src/semantics/expo.ts</code>

```ts
export declare function resolveDeepLink(session: ExpoSession, input: {
    scheme: string;
    path: string;
}): AxisStep<ExpoState>;
```

#### <code v-pre>resolveMetroModule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L56) <code v-pre>packages/mobile/src/semantics/metro.ts</code>

```ts
export declare function resolveMetroModule(session: MetroSession, modulePath: string): AxisStep<MetroState>;
```

#### <code v-pre>retrieveCredential</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L62) <code v-pre>packages/mobile/src/semantics/secure-storage.ts</code>

```ts
export declare function retrieveCredential(session: SecureStorageSession, key: string): AxisStep<SecureStorageState>;
```

#### <code v-pre>runFidelityCheck</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/fidelity-harness.ts#L18) <code v-pre>packages/mobile/src/adapters/fidelity-harness.ts</code>

```ts
export declare function runFidelityCheck(axes: MobileAxis[], targets?: MobileTarget[]): Promise<FidelityDiff[]>;
```

#### <code v-pre>sanitizeEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-executor.ts#L43) <code v-pre>packages/mobile/src/adapters/spawn-executor.ts</code>

```ts
export declare function sanitizeEnv(command: MobileCliCommand, env: Record<string, string>): Record<string, string>;
```

#### <code v-pre>scheduleFabricRender</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L48) <code v-pre>packages/mobile/src/semantics/fabric.ts</code>

```ts
export declare function scheduleFabricRender(session: FabricSession, priority: 'discrete' | 'continuous' | 'idle'): AxisStep<FabricState>;
```

#### <code v-pre>setAsyncStorageItem</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L48) <code v-pre>packages/mobile/src/semantics/async-storage.ts</code>

```ts
export declare function setAsyncStorageItem(session: AsyncStorageSession, input: {
    key: string;
    value: string;
}): AxisStep<AsyncStorageState>;
```

#### <code v-pre>startMetroBundle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L37) <code v-pre>packages/mobile/src/semantics/metro.ts</code>

```ts
export declare function startMetroBundle(input: {
    target: MobileTarget;
    bundleId: string;
}): MetroSession;
```

#### <code v-pre>startNewArchInit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L51) <code v-pre>packages/mobile/src/semantics/new-architecture.ts</code>

```ts
export declare function startNewArchInit(session: NewArchitectureSession): AxisStep<NewArchitectureState>;
```

#### <code v-pre>startReanimatedAnimation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L71) <code v-pre>packages/mobile/src/semantics/reanimated.ts</code>

```ts
export declare function startReanimatedAnimation(session: ReanimatedSession, input: {
    durationMs: number;
    easing: 'linear' | 'ease' | 'spring';
}): AxisStep<ReanimatedState>;
```

#### <code v-pre>storeCredential</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L49) <code v-pre>packages/mobile/src/semantics/secure-storage.ts</code>

```ts
export declare function storeCredential(session: SecureStorageSession, input: {
    key: string;
    encryptedValue: string;
    requireBiometric?: boolean;
}): AxisStep<SecureStorageState>;
```

#### <code v-pre>summarizeFidelity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/fidelity-harness.ts#L46) <code v-pre>packages/mobile/src/adapters/fidelity-harness.ts</code>

```ts
export declare function summarizeFidelity(diffs: FidelityDiff[]): {
    total: number;
    matched: number;
    mismatched: number;
    perAxis: Array<{
        axis: MobileAxis;
        matched: number;
        total: number;
    }>;
};
```

#### <code v-pre>switchNavigationTab</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L58) <code v-pre>packages/mobile/src/semantics/navigation.ts</code>

```ts
export declare function switchNavigationTab(session: NavigationSession, tabName: string): AxisStep<NavigationState>;
```

#### <code v-pre>unmountReactNativeComponent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L86) <code v-pre>packages/mobile/src/semantics/react-native.ts</code>

```ts
export declare function unmountReactNativeComponent(session: ReactNativeSession): AxisStep<ReactNativeState>;
```

#### <code v-pre>unregisterTurboModule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L93) <code v-pre>packages/mobile/src/semantics/turbo-modules.ts</code>

```ts
export declare function unregisterTurboModule(session: TurboModulesSession): AxisStep<TurboModulesState>;
```

#### <code v-pre>updateFabricPriority</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L70) <code v-pre>packages/mobile/src/semantics/fabric.ts</code>

```ts
export declare function updateFabricPriority(session: FabricSession, priority: 'discrete' | 'continuous' | 'idle'): AxisStep<FabricState>;
```

#### <code v-pre>updateSharedValue</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L48) <code v-pre>packages/mobile/src/semantics/reanimated.ts</code>

```ts
export declare function updateSharedValue(session: ReanimatedSession, input: {
    name: string;
    value: number;
}): AxisStep<ReanimatedState>;
```

### 型

#### <code v-pre>AdapterInvocation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/types.ts#L21) <code v-pre>packages/mobile/src/adapters/types.ts</code>

```ts
export interface AdapterInvocation {
    scanId: string;
    target: MobileTarget;
    mode: AdapterMode;
    metadata?: Record<string, string | number | boolean>;
}
```

#### <code v-pre>AdapterMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/types.ts#L11) <code v-pre>packages/mobile/src/adapters/types.ts</code>

```ts
export type AdapterMode = 'mock' | 'real';
```

#### <code v-pre>AdapterResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/types.ts#L28) <code v-pre>packages/mobile/src/adapters/types.ts</code>

```ts
export interface AdapterResult {
    axis: MobileAxis;
    target: MobileTarget;
    mode: AdapterMode;
    completed: boolean;
    eventCount: number;
    durationMs: number;
    history: AxisStep<string>[];
    neutralEvents: NeutralEventName[];
}
```

#### <code v-pre>AsyncStorageSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L8) <code v-pre>packages/mobile/src/semantics/async-storage.ts</code>

```ts
export interface AsyncStorageSession {
    target: MobileTarget;
    storeId: string;
    state: AsyncStorageState;
    items: Map<string, string>;
    operations: number;
    history: AxisStep<AsyncStorageState>[];
}
```

#### <code v-pre>AsyncStorageState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L6) <code v-pre>packages/mobile/src/semantics/async-storage.ts</code>

v1.51 async-storage axis — AsyncStorage / MMKV / web localStorage。

```ts
export type AsyncStorageState = 'idle' | 'set' | 'read' | 'removed' | 'batch-flushed';
```

#### <code v-pre>AxisStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/types.ts#L82) <code v-pre>packages/mobile/src/semantics/types.ts</code>

```ts
export interface AxisStep<TState extends string> {
    neutralEvent: NeutralEventName;
    providerEvent: string;
    state: TState;
    metadata: Record<string, string | number | boolean>;
}
```

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

#### <code v-pre>ExpoSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L9) <code v-pre>packages/mobile/src/semantics/expo.ts</code>

```ts
export interface ExpoSession {
    target: MobileTarget;
    appSlug: string;
    state: ExpoState;
    resolvedLinks: string[];
    pushNotifications: string[];
    configHash: string | null;
    history: AxisStep<ExpoState>[];
}
```

#### <code v-pre>ExpoState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L7) <code v-pre>packages/mobile/src/semantics/expo.ts</code>

Expo axis — build config load + deep link resolve + push notification + build complete の 4 step deterministic state machine。

```ts
export type ExpoState = 'idle' | 'config-loaded' | 'link-resolved' | 'push-received' | 'build-completed';
```

#### <code v-pre>FabricSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L8) <code v-pre>packages/mobile/src/semantics/fabric.ts</code>

```ts
export interface FabricSession {
    target: MobileTarget;
    rootId: string;
    state: FabricState;
    scheduledPriority: 'discrete' | 'continuous' | 'idle' | null;
    shadowNodeCount: number;
    history: AxisStep<FabricState>[];
}
```

#### <code v-pre>FabricState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L6) <code v-pre>packages/mobile/src/semantics/fabric.ts</code>

v1.52 fabric axis — React Native 0.76+ Fabric renderer (concurrent + priority + shadow tree)。

```ts
export type FabricState = 'idle' | 'scheduled' | 'shadow-committed' | 'priority-updated' | 'mounted';
```

#### <code v-pre>FidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fidelity.ts#L10) <code v-pre>packages/mobile/src/semantics/fidelity.ts</code>

```ts
export interface FidelityCoverage {
    providers: MobileTarget[];
    axes: MobileAxis[];
    rows: FidelityRow[];
}
```

#### <code v-pre>FidelityDiff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/fidelity-harness.ts#L9) <code v-pre>packages/mobile/src/adapters/fidelity-harness.ts</code>

```ts
export interface FidelityDiff {
    axis: MobileAxis;
    target: MobileTarget;
    neutralEventsMatch: boolean;
    completedMatch: boolean;
    mockNeutralEvents: string[];
    realNeutralEvents: string[];
}
```

#### <code v-pre>FidelityRow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fidelity.ts#L3) <code v-pre>packages/mobile/src/semantics/fidelity.ts</code>

```ts
export interface FidelityRow {
    provider: MobileTarget;
    axis: MobileAxis;
    neutralEvents: NeutralEventName[];
    providerEvents: string[];
}
```

#### <code v-pre>MetroSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L9) <code v-pre>packages/mobile/src/semantics/metro.ts</code>

```ts
export interface MetroSession {
    target: MobileTarget;
    bundleId: string;
    state: MetroState;
    resolvedModules: string[];
    hmrUpdateCount: number;
    history: AxisStep<MetroState>[];
}
```

#### <code v-pre>MetroState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L7) <code v-pre>packages/mobile/src/semantics/metro.ts</code>

Metro axis — bundle start + module resolve + HMR + bundle complete の 4 step deterministic state machine。

```ts
export type MetroState = 'idle' | 'bundling' | 'resolved' | 'hmr-applied' | 'completed';
```

#### <code v-pre>MobileAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/types.ts#L39) <code v-pre>packages/mobile/src/adapters/types.ts</code>

```ts
export interface MobileAdapter {
    axis: MobileAxis;
    scan(input: AdapterInvocation): Promise<AdapterResult>;
}
```

#### <code v-pre>MobileAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/types.ts#L10) <code v-pre>packages/mobile/src/semantics/types.ts</code>

```ts
export type MobileAxis = 'react-native' | 'expo' | 'metro' | 'navigation' | 'reanimated' | 'async-storage' | 'secure-storage' | 'fabric' | 'turbo-modules' | 'codegen' | 'new-architecture';
```

#### <code v-pre>MobileCliCommand</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L14) <code v-pre>packages/mobile/src/adapters/spawn-driver.ts</code>

```ts
export type MobileCliCommand = 'expo build' | 'metro bundle' | 'codegen run' | 'react-native start' | 'pod install' | 'gradle build';
```

#### <code v-pre>MobileRealDriverAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/real-driver.ts#L12) <code v-pre>packages/mobile/src/adapters/real-driver.ts</code>

Mobile real driver env-gate (v0.2)。 v1.51 で real CLI (Expo EAS + Metro real bundle + React Navigation deep link verify + Reanimated JSI worklet + AsyncStorage / MMKV native + Keychain / Keystore native) 呼出を stub 経由で隠蔽する契約。 env `KIWA_MOBILE_MODE=real` + 対応 URL env が全揃った時のみ real 呼出。 それ以外は explicit throw で fail-closed。

```ts
export type MobileRealDriverAxis = 'expo-eas' | 'metro' | 'navigation' | 'reanimated' | 'async-storage' | 'secure-storage';
```

#### <code v-pre>MobileRealDriverEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/real-driver.ts#L20) <code v-pre>packages/mobile/src/adapters/real-driver.ts</code>

```ts
export interface MobileRealDriverEnv {
    mode: 'real';
    expoEasUrl?: string;
    metroUrl?: string;
    navigationUrl?: string;
    reanimatedUrl?: string;
    asyncStorageUrl?: string;
    secureStorageUrl?: string;
}
```

#### <code v-pre>MobileTarget</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/types.ts#L8) <code v-pre>packages/mobile/src/semantics/types.ts</code>

```ts
export type MobileTarget = 'ios' | 'android' | 'web';
```

#### <code v-pre>NavigationSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L9) <code v-pre>packages/mobile/src/semantics/navigation.ts</code>

```ts
export interface NavigationSession {
    target: MobileTarget;
    navigatorId: string;
    state: NavigationState;
    stackHistory: string[];
    activeTab: string | null;
    activeModals: string[];
    history: AxisStep<NavigationState>[];
}
```

#### <code v-pre>NavigationState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L7) <code v-pre>packages/mobile/src/semantics/navigation.ts</code>

v1.51 navigation axis — React Navigation / Expo Router を統一。 stack push + tab switch + modal open + deep link navigate。

```ts
export type NavigationState = 'idle' | 'stack-pushed' | 'tab-switched' | 'modal-opened' | 'deep-linked';
```

#### <code v-pre>NeutralEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/types.ts#L25) <code v-pre>packages/mobile/src/semantics/types.ts</code>

```ts
export type NeutralEventName = 'rn.component_mounted' | 'rn.native_module_invoked' | 'rn.gesture_recognized' | 'rn.component_unmounted' | 'expo.build_config_loaded' | 'expo.deep_link_resolved' | 'expo.push_notification_received' | 'expo.build_completed' | 'metro.bundle_started' | 'metro.module_resolved' | 'metro.hmr_applied' | 'metro.bundle_completed' | 'navigation.stack_pushed' | 'navigation.tab_switched' | 'navigation.modal_opened' | 'navigation.deep_link_navigated' | 'reanimated.shared_value_updated' | 'reanimated.worklet_executed' | 'reanimated.animation_started' | 'reanimated.animation_completed' | 'async-storage.item_set' | 'async-storage.item_read' | 'async-storage.item_removed' | 'async-storage.batch_flushed' | 'secure-storage.credential_stored' | 'secure-storage.credential_retrieved' | 'secure-storage.biometric_challenged' | 'secure-storage.credential_removed' | 'fabric.render_scheduled' | 'fabric.shadow_tree_committed' | 'fabric.priority_updated' | 'fabric.mount_completed' | 'turbo-modules.spec_registered' | 'turbo-modules.jsi_bound' | 'turbo-modules.method_invoked' | 'turbo-modules.unregistered' | 'codegen.schema_loaded' | 'codegen.spec_generated' | 'codegen.type_emitted' | 'codegen.build_completed' | 'new-architecture.init_started' | 'new-architecture.concurrent_enabled' | 'new-architecture.interop_bridged' | 'new-architecture.ready';
```

#### <code v-pre>NewArchitectureSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L8) <code v-pre>packages/mobile/src/semantics/new-architecture.ts</code>

```ts
export interface NewArchitectureSession {
    target: MobileTarget;
    appName: string;
    state: NewArchitectureState;
    concurrentEnabled: boolean;
    bridgedLegacyModules: string[];
    history: AxisStep<NewArchitectureState>[];
}
```

#### <code v-pre>NewArchitectureState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L6) <code v-pre>packages/mobile/src/semantics/new-architecture.ts</code>

v1.52 new-architecture axis — React Native 0.76+ New Architecture (async init + concurrent React + interop layer)。

```ts
export type NewArchitectureState = 'idle' | 'initializing' | 'concurrent-enabled' | 'interop-bridged' | 'ready';
```

#### <code v-pre>ReactNativeSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L9) <code v-pre>packages/mobile/src/semantics/react-native.ts</code>

```ts
export interface ReactNativeSession {
    target: MobileTarget;
    componentId: string;
    state: ReactNativeState;
    nativeModuleInvocations: number;
    gesturesRecognized: string[];
    history: AxisStep<ReactNativeState>[];
}
```

#### <code v-pre>ReactNativeState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L7) <code v-pre>packages/mobile/src/semantics/react-native.ts</code>

React Native axis — component mount + native module invocation + gesture recognition + unmount の 4 step deterministic state machine。

```ts
export type ReactNativeState = 'idle' | 'mounted' | 'native-invoked' | 'gesture-recognized' | 'unmounted';
```

#### <code v-pre>ReanimatedSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L8) <code v-pre>packages/mobile/src/semantics/reanimated.ts</code>

```ts
export interface ReanimatedSession {
    target: MobileTarget;
    animationId: string;
    state: ReanimatedState;
    sharedValueUpdates: number;
    workletExecutions: number;
    history: AxisStep<ReanimatedState>[];
}
```

#### <code v-pre>ReanimatedState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L6) <code v-pre>packages/mobile/src/semantics/reanimated.ts</code>

v1.51 reanimated axis — Reanimated 3 shared value + worklet + animation。

```ts
export type ReanimatedState = 'idle' | 'value-updated' | 'worklet-run' | 'animating' | 'completed';
```

#### <code v-pre>SecureStorageSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L9) <code v-pre>packages/mobile/src/semantics/secure-storage.ts</code>

```ts
export interface SecureStorageSession {
    target: MobileTarget;
    vaultId: string;
    state: SecureStorageState;
    credentials: Map<string, string>;
    biometricChallenges: number;
    history: AxisStep<SecureStorageState>[];
}
```

#### <code v-pre>SecureStorageState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L7) <code v-pre>packages/mobile/src/semantics/secure-storage.ts</code>

v1.51 secure-storage axis — iOS Keychain / Android Keystore / web CredMgmt API。 biometric challenge (Face ID / Touch ID / Fingerprint / WebAuthn) 込み。

```ts
export type SecureStorageState = 'idle' | 'stored' | 'retrieved' | 'biometric-challenged' | 'removed';
```

#### <code v-pre>SpawnExecutorInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-executor.ts#L20) <code v-pre>packages/mobile/src/adapters/spawn-executor.ts</code>

```ts
export interface SpawnExecutorInput {
    command: MobileCliCommand;
    args: string[];
    env: Record<string, string>;
    cwd?: string;
    timeoutMs?: number;
    maxBufferBytes?: number;
}
```

#### <code v-pre>SpawnExecutorResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-executor.ts#L11) <code v-pre>packages/mobile/src/adapters/spawn-executor.ts</code>

```ts
export interface SpawnExecutorResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    signal: NodeJS.Signals | null;
    timedOut: boolean;
    durationMs: number;
}
```

#### <code v-pre>SpawnFn</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-executor.ts#L29) <code v-pre>packages/mobile/src/adapters/spawn-executor.ts</code>

```ts
export type SpawnFn = typeof nodeSpawn;
```

#### <code v-pre>SpawnInvocation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L22) <code v-pre>packages/mobile/src/adapters/spawn-driver.ts</code>

```ts
export interface SpawnInvocation {
    command: MobileCliCommand;
    args: string[];
    env: Record<string, string>;
    cwd?: string;
}
```

#### <code v-pre>SpawnResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L29) <code v-pre>packages/mobile/src/adapters/spawn-driver.ts</code>

```ts
export interface SpawnResult {
    command: MobileCliCommand;
    args: string[];
    invoked: boolean;
    exitCode: number | null;
    stdout: string;
    stderr: string;
    durationMs: number;
}
```

#### <code v-pre>TurboModulesSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L8) <code v-pre>packages/mobile/src/semantics/turbo-modules.ts</code>

```ts
export interface TurboModulesSession {
    target: MobileTarget;
    moduleName: string;
    state: TurboModulesState;
    registeredMethods: string[];
    methodInvocations: number;
    jsiBound: boolean;
    history: AxisStep<TurboModulesState>[];
}
```

#### <code v-pre>TurboModulesState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L6) <code v-pre>packages/mobile/src/semantics/turbo-modules.ts</code>

v1.52 turbo-modules axis — React Native 0.76+ TurboModules (typed native module + JSI + spec generation)。

```ts
export type TurboModulesState = 'idle' | 'spec-registered' | 'jsi-bound' | 'method-invoked' | 'unregistered';
```
<!-- kiwa-public-api:end -->
