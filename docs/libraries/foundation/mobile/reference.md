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
| `mobile real driver requested for ${axis} but KIWA_MOBILE_MODE!=='real'` | [packages/mobile/src/adapters/real-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/real-driver.ts#L56) |
| `mobile ${axis} URL env (${String(envKey)}) not set; real driver unavailable` | [packages/mobile/src/adapters/real-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/real-driver.ts#L63) |
| `invokeMobileCli(${inv.command}): KIWA_MOBILE_MODE must be 'real'` | [packages/mobile/src/adapters/spawn-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L73) |
| `invokeMobileCli(${inv.command}): args exceeds max 32 (${inv.args.length})` | [packages/mobile/src/adapters/spawn-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L78) |
| `splitCommand: unable to derive executable from ${command}` | [packages/mobile/src/adapters/spawn-executor.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-executor.ts#L59) |
| 'initAsyncStorage: storeId must not be empty' | [packages/mobile/src/semantics/async-storage.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L37) |
| 'setAsyncStorageItem: key must not be empty' | [packages/mobile/src/semantics/async-storage.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L52) |
| 'initCodegen: packageName must not be empty' | [packages/mobile/src/semantics/codegen.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L40) |
| 'loadCodegenSchema: schemaHash must not be empty' | [packages/mobile/src/semantics/codegen.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L55) |
| `generateSpec: session is ${session.state}` | [packages/mobile/src/semantics/codegen.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L66) |
| 'generateSpec: specCount must be > 0' | [packages/mobile/src/semantics/codegen.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L68) |
| 'emitCodegenType: filePath must not be empty' | [packages/mobile/src/semantics/codegen.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L77) |
| `completeCodegenBuild: session is ${session.state}` | [packages/mobile/src/semantics/codegen.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L88) |
| 'loadExpoBuildConfig: appSlug must not be empty' | [packages/mobile/src/semantics/expo.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L44) |
| 'loadExpoBuildConfig: configHash must not be empty' | [packages/mobile/src/semantics/expo.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L47) |
| 'resolveDeepLink: build config must be loaded first' | [packages/mobile/src/semantics/expo.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L67) |
| 'receivePushNotification: build config must be loaded first' | [packages/mobile/src/semantics/expo.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L84) |
| 'completeExpoBuild: build config must be loaded first' | [packages/mobile/src/semantics/expo.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L99) |
| 'initFabric: rootId must not be empty' | [packages/mobile/src/semantics/fabric.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L37) |
| `commitShadowTree: session is ${session.state}` | [packages/mobile/src/semantics/fabric.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L62) |
| 'commitShadowTree: nodeCount must be >= 0' | [packages/mobile/src/semantics/fabric.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L64) |
| `completeFabricMount: session is ${session.state}` | [packages/mobile/src/semantics/fabric.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L81) |
| 'startMetroBundle: bundleId must not be empty' | [packages/mobile/src/semantics/metro.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L42) |
| 'resolveMetroModule: bundle must be started first' | [packages/mobile/src/semantics/metro.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L61) |
| 'applyMetroHmr: bundle must be started first' | [packages/mobile/src/semantics/metro.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L76) |
| 'completeMetroBundle: bundle must be started first' | [packages/mobile/src/semantics/metro.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L90) |
| 'initNavigation: navigatorId must not be empty' | [packages/mobile/src/semantics/navigation.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L39) |
| 'pushNavigationStack: screenName must not be empty' | [packages/mobile/src/semantics/navigation.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L52) |
| 'switchNavigationTab: tabName must not be empty' | [packages/mobile/src/semantics/navigation.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L59) |
| 'openNavigationModal: modalId must not be empty' | [packages/mobile/src/semantics/navigation.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L66) |
| 'navigateDeepLink: url must not be empty' | [packages/mobile/src/semantics/navigation.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L73) |
| 'initNewArchitecture: appName must not be empty' | [packages/mobile/src/semantics/new-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L40) |
| `startNewArchInit: session is ${session.state}` | [packages/mobile/src/semantics/new-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L53) |
| `enableConcurrentReact: session is ${session.state}` | [packages/mobile/src/semantics/new-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L63) |
| `bridgeLegacyModule: session is ${session.state}` | [packages/mobile/src/semantics/new-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L75) |
| 'bridgeLegacyModule: moduleName must not be empty' | [packages/mobile/src/semantics/new-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L77) |
| `markNewArchReady: session is ${session.state}` | [packages/mobile/src/semantics/new-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L90) |
| 'mountReactNativeComponent: componentId must not be empty' | [packages/mobile/src/semantics/react-native.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L42) |
| 'invokeNativeModule: component is unmounted' | [packages/mobile/src/semantics/react-native.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L61) |
| 'recognizeGesture: component is unmounted' | [packages/mobile/src/semantics/react-native.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L76) |
| 'unmountReactNativeComponent: already unmounted' | [packages/mobile/src/semantics/react-native.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L90) |
| 'initReanimated: animationId must not be empty' | [packages/mobile/src/semantics/reanimated.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L37) |
| 'executeWorklet: workletName must not be empty' | [packages/mobile/src/semantics/reanimated.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L62) |
| 'startReanimatedAnimation: durationMs must be >= 0' | [packages/mobile/src/semantics/reanimated.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L75) |
| `completeReanimatedAnimation: session is ${session.state}` | [packages/mobile/src/semantics/reanimated.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L85) |
| 'initSecureStorage: vaultId must not be empty' | [packages/mobile/src/semantics/secure-storage.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L38) |
| 'storeCredential: key must not be empty' | [packages/mobile/src/semantics/secure-storage.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L53) |
| 'initTurboModules: moduleName must not be empty' | [packages/mobile/src/semantics/turbo-modules.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L41) |
| 'registerTurboSpec: methods must not be empty' | [packages/mobile/src/semantics/turbo-modules.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L57) |
| `bindJsiRuntime: session is ${session.state}` | [packages/mobile/src/semantics/turbo-modules.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L68) |
| `invokeTurboMethod: session is ${session.state}, jsi not bound` | [packages/mobile/src/semantics/turbo-modules.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L80) |
| `invokeTurboMethod: ${methodName} not in registered methods` | [packages/mobile/src/semantics/turbo-modules.ts](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L83) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `applyMetroHmr`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L71) `packages/mobile/src/semantics/metro.ts`

```ts
export declare function applyMetroHmr(session: MetroSession, moduleId: string): AxisStep<MetroState>;
```

#### `assertMobileRealDriverAvailable`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/real-driver.ts#L51) `packages/mobile/src/adapters/real-driver.ts`

```ts
export declare function assertMobileRealDriverAvailable(axis: MobileRealDriverAxis, env: MobileRealDriverEnv | null): void;
```

#### `bindJsiRuntime`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L66) `packages/mobile/src/semantics/turbo-modules.ts`

```ts
export declare function bindJsiRuntime(session: TurboModulesSession): AxisStep<TurboModulesState>;
```

#### `bridgeLegacyModule`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L70) `packages/mobile/src/semantics/new-architecture.ts`

```ts
export declare function bridgeLegacyModule(session: NewArchitectureSession, moduleName: string): AxisStep<NewArchitectureState>;
```

#### `buildSpawnInvocation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L118) `packages/mobile/src/adapters/spawn-driver.ts`

```ts
export declare function buildSpawnInvocation(input: {
    command: MobileCliCommand;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
}): SpawnInvocation;
```

#### `challengeBiometric`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L71) `packages/mobile/src/semantics/secure-storage.ts`

```ts
export declare function challengeBiometric(session: SecureStorageSession, input: {
    method: 'face-id' | 'touch-id' | 'fingerprint' | 'webauthn';
    success: boolean;
}): AxisStep<SecureStorageState>;
```

#### `cliForAxis`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L114) `packages/mobile/src/adapters/spawn-driver.ts`

```ts
export declare function cliForAxis(axis: MobileAxis): MobileCliCommand | null;
```

#### `collectFidelityCoverage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fidelity.ts#L87) `packages/mobile/src/semantics/fidelity.ts`

```ts
export declare function collectFidelityCoverage(providers?: MobileTarget[]): FidelityCoverage;
```

#### `commitShadowTree`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L57) `packages/mobile/src/semantics/fabric.ts`

```ts
export declare function commitShadowTree(session: FabricSession, input: {
    nodeCount: number;
}): AxisStep<FabricState>;
```

#### `completeCodegenBuild`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L86) `packages/mobile/src/semantics/codegen.ts`

```ts
export declare function completeCodegenBuild(session: CodegenSession): AxisStep<CodegenState>;
```

#### `completeExpoBuild`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L95) `packages/mobile/src/semantics/expo.ts`

```ts
export declare function completeExpoBuild(session: ExpoSession): AxisStep<ExpoState>;
```

#### `completeFabricMount`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L79) `packages/mobile/src/semantics/fabric.ts`

```ts
export declare function completeFabricMount(session: FabricSession): AxisStep<FabricState>;
```

#### `completeMetroBundle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L86) `packages/mobile/src/semantics/metro.ts`

```ts
export declare function completeMetroBundle(session: MetroSession): AxisStep<MetroState>;
```

#### `completeReanimatedAnimation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L83) `packages/mobile/src/semantics/reanimated.ts`

```ts
export declare function completeReanimatedAnimation(session: ReanimatedSession): AxisStep<ReanimatedState>;
```

#### `emitCodegenType`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L73) `packages/mobile/src/semantics/codegen.ts`

```ts
export declare function emitCodegenType(session: CodegenSession, filePath: string): AxisStep<CodegenState>;
```

#### `enableConcurrentReact`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L59) `packages/mobile/src/semantics/new-architecture.ts`

```ts
export declare function enableConcurrentReact(session: NewArchitectureSession): AxisStep<NewArchitectureState>;
```

#### `executeSpawn`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-executor.ts#L64) `packages/mobile/src/adapters/spawn-executor.ts`

```ts
export declare function executeSpawn(input: SpawnExecutorInput, spawnFn?: SpawnFn): Promise<SpawnExecutorResult>;
```

#### `executeWorklet`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L61) `packages/mobile/src/semantics/reanimated.ts`

```ts
export declare function executeWorklet(session: ReanimatedSession, workletName: string): AxisStep<ReanimatedState>;
```

#### `flushAsyncStorageBatch`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L79) `packages/mobile/src/semantics/async-storage.ts`

```ts
export declare function flushAsyncStorageBatch(session: AsyncStorageSession): AxisStep<AsyncStorageState>;
```

#### `generateSpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L61) `packages/mobile/src/semantics/codegen.ts`

```ts
export declare function generateSpec(session: CodegenSession, input: {
    specCount: number;
}): AxisStep<CodegenState>;
```

#### `initAsyncStorage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L36) `packages/mobile/src/semantics/async-storage.ts`

```ts
export declare function initAsyncStorage(input: {
    target: MobileTarget;
    storeId: string;
}): AsyncStorageSession;
```

#### `initCodegen`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L36) `packages/mobile/src/semantics/codegen.ts`

```ts
export declare function initCodegen(input: {
    target: MobileTarget;
    packageName: string;
}): CodegenSession;
```

#### `initFabric`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L36) `packages/mobile/src/semantics/fabric.ts`

```ts
export declare function initFabric(input: {
    target: MobileTarget;
    rootId: string;
}): FabricSession;
```

#### `initNavigation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L38) `packages/mobile/src/semantics/navigation.ts`

```ts
export declare function initNavigation(input: {
    target: MobileTarget;
    navigatorId: string;
}): NavigationSession;
```

#### `initNewArchitecture`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L36) `packages/mobile/src/semantics/new-architecture.ts`

```ts
export declare function initNewArchitecture(input: {
    target: MobileTarget;
    appName: string;
}): NewArchitectureSession;
```

#### `initReanimated`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L36) `packages/mobile/src/semantics/reanimated.ts`

```ts
export declare function initReanimated(input: {
    target: MobileTarget;
    animationId: string;
}): ReanimatedSession;
```

#### `initSecureStorage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L37) `packages/mobile/src/semantics/secure-storage.ts`

```ts
export declare function initSecureStorage(input: {
    target: MobileTarget;
    vaultId: string;
}): SecureStorageSession;
```

#### `initTurboModules`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L37) `packages/mobile/src/semantics/turbo-modules.ts`

```ts
export declare function initTurboModules(input: {
    target: MobileTarget;
    moduleName: string;
}): TurboModulesSession;
```

#### `invokeMobileCli`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L59) `packages/mobile/src/adapters/spawn-driver.ts`

v0.6 実 spawn 実行 = env-gate 通過確認 + args 上限 32 + 実 child_process.spawn 実行。 `KIWA_MOBILE_MODE=real` + 対応 axis env 未設定なら throw で fail-closed。 `KIWA_MOBILE_SPAWN=dry-run` の時は v0.5 stub 相当の shape 契約を返す (実 CLI 未 install 環境向け backward compat 経路)。

```ts
export declare function invokeMobileCli(inv: SpawnInvocation): Promise<SpawnResult>;
```

#### `invokeMobileCliWith`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L67) `packages/mobile/src/adapters/spawn-driver.ts`

DI 経路 = spawnFn を注入可能、 test で dummy spawn を差し込んで 決定的挙動を検証できる。 default は nodeSpawn。

```ts
export declare function invokeMobileCliWith(inv: SpawnInvocation, spawnFn: SpawnFn): Promise<SpawnResult>;
```

#### `invokeNativeModule`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L56) `packages/mobile/src/semantics/react-native.ts`

```ts
export declare function invokeNativeModule(session: ReactNativeSession, moduleName: string): AxisStep<ReactNativeState>;
```

#### `invokeTurboMethod`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L75) `packages/mobile/src/semantics/turbo-modules.ts`

```ts
export declare function invokeTurboMethod(session: TurboModulesSession, methodName: string): AxisStep<TurboModulesState>;
```

#### `loadCodegenSchema`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L51) `packages/mobile/src/semantics/codegen.ts`

```ts
export declare function loadCodegenSchema(session: CodegenSession, schemaHash: string): AxisStep<CodegenState>;
```

#### `loadExpoBuildConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L38) `packages/mobile/src/semantics/expo.ts`

```ts
export declare function loadExpoBuildConfig(input: {
    target: MobileTarget;
    appSlug: string;
    configHash: string;
}): ExpoSession;
```

#### `makeMockAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/mock-factory.ts#L215) `packages/mobile/src/adapters/mock-factory.ts`

```ts
export declare function makeMockAdapter(axis: MobileAxis): MobileAdapter;
```

#### `makeRealAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/mock-factory.ts#L225) `packages/mobile/src/adapters/mock-factory.ts`

```ts
export declare function makeRealAdapter(axis: MobileAxis): MobileAdapter;
```

#### `markNewArchReady`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L86) `packages/mobile/src/semantics/new-architecture.ts`

```ts
export declare function markNewArchReady(session: NewArchitectureSession): AxisStep<NewArchitectureState>;
```

#### `MOBILE_AXIS_TO_EVENTS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fidelity.ts#L16) `packages/mobile/src/semantics/fidelity.ts`

```ts
export declare const MOBILE_AXIS_TO_EVENTS: Record<MobileAxis, NeutralEventName[]>;
```

#### `MOCK_ADAPTERS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/mock-factory.ts#L236) `packages/mobile/src/adapters/mock-factory.ts`

```ts
export declare const MOCK_ADAPTERS: Record<MobileAxis, MobileAdapter>;
```

#### `mountReactNativeComponent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L37) `packages/mobile/src/semantics/react-native.ts`

```ts
export declare function mountReactNativeComponent(input: {
    target: MobileTarget;
    componentId: string;
}): ReactNativeSession;
```

#### `navigateDeepLink`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L72) `packages/mobile/src/semantics/navigation.ts`

```ts
export declare function navigateDeepLink(session: NavigationSession, url: string): AxisStep<NavigationState>;
```

#### `openNavigationModal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L65) `packages/mobile/src/semantics/navigation.ts`

```ts
export declare function openNavigationModal(session: NavigationSession, modalId: string): AxisStep<NavigationState>;
```

#### `providerEventName`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/types.ts#L230) `packages/mobile/src/semantics/types.ts`

```ts
export declare function providerEventName(target: MobileTarget, neutral: NeutralEventName): string;
```

#### `pushNavigationStack`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L51) `packages/mobile/src/semantics/navigation.ts`

```ts
export declare function pushNavigationStack(session: NavigationSession, screenName: string): AxisStep<NavigationState>;
```

#### `readAsyncStorageItem`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L59) `packages/mobile/src/semantics/async-storage.ts`

```ts
export declare function readAsyncStorageItem(session: AsyncStorageSession, key: string): AxisStep<AsyncStorageState>;
```

#### `readMobileRealDriverEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/real-driver.ts#L39) `packages/mobile/src/adapters/real-driver.ts`

```ts
export declare function readMobileRealDriverEnv(env?: NodeJS.ProcessEnv): MobileRealDriverEnv | null;
```

#### `REAL_ADAPTERS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/mock-factory.ts#L250) `packages/mobile/src/adapters/mock-factory.ts`

```ts
export declare const REAL_ADAPTERS: Record<MobileAxis, MobileAdapter>;
```

#### `receivePushNotification`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L79) `packages/mobile/src/semantics/expo.ts`

```ts
export declare function receivePushNotification(session: ExpoSession, input: {
    notificationId: string;
    category: string;
}): AxisStep<ExpoState>;
```

#### `recognizeGesture`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L71) `packages/mobile/src/semantics/react-native.ts`

```ts
export declare function recognizeGesture(session: ReactNativeSession, gesture: 'tap' | 'pan' | 'pinch' | 'rotation' | 'swipe'): AxisStep<ReactNativeState>;
```

#### `registerTurboSpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L53) `packages/mobile/src/semantics/turbo-modules.ts`

```ts
export declare function registerTurboSpec(session: TurboModulesSession, methods: string[]): AxisStep<TurboModulesState>;
```

#### `removeAsyncStorageItem`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L69) `packages/mobile/src/semantics/async-storage.ts`

```ts
export declare function removeAsyncStorageItem(session: AsyncStorageSession, key: string): AxisStep<AsyncStorageState>;
```

#### `removeCredential`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L84) `packages/mobile/src/semantics/secure-storage.ts`

```ts
export declare function removeCredential(session: SecureStorageSession, key: string): AxisStep<SecureStorageState>;
```

#### `resolveDeepLink`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L62) `packages/mobile/src/semantics/expo.ts`

```ts
export declare function resolveDeepLink(session: ExpoSession, input: {
    scheme: string;
    path: string;
}): AxisStep<ExpoState>;
```

#### `resolveMetroModule`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L56) `packages/mobile/src/semantics/metro.ts`

```ts
export declare function resolveMetroModule(session: MetroSession, modulePath: string): AxisStep<MetroState>;
```

#### `retrieveCredential`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L62) `packages/mobile/src/semantics/secure-storage.ts`

```ts
export declare function retrieveCredential(session: SecureStorageSession, key: string): AxisStep<SecureStorageState>;
```

#### `runFidelityCheck`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/fidelity-harness.ts#L18) `packages/mobile/src/adapters/fidelity-harness.ts`

```ts
export declare function runFidelityCheck(axes: MobileAxis[], targets?: MobileTarget[]): Promise<FidelityDiff[]>;
```

#### `sanitizeEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-executor.ts#L43) `packages/mobile/src/adapters/spawn-executor.ts`

```ts
export declare function sanitizeEnv(command: MobileCliCommand, env: Record<string, string>): Record<string, string>;
```

#### `scheduleFabricRender`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L48) `packages/mobile/src/semantics/fabric.ts`

```ts
export declare function scheduleFabricRender(session: FabricSession, priority: 'discrete' | 'continuous' | 'idle'): AxisStep<FabricState>;
```

#### `setAsyncStorageItem`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L48) `packages/mobile/src/semantics/async-storage.ts`

```ts
export declare function setAsyncStorageItem(session: AsyncStorageSession, input: {
    key: string;
    value: string;
}): AxisStep<AsyncStorageState>;
```

#### `startMetroBundle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L37) `packages/mobile/src/semantics/metro.ts`

```ts
export declare function startMetroBundle(input: {
    target: MobileTarget;
    bundleId: string;
}): MetroSession;
```

#### `startNewArchInit`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L51) `packages/mobile/src/semantics/new-architecture.ts`

```ts
export declare function startNewArchInit(session: NewArchitectureSession): AxisStep<NewArchitectureState>;
```

#### `startReanimatedAnimation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L71) `packages/mobile/src/semantics/reanimated.ts`

```ts
export declare function startReanimatedAnimation(session: ReanimatedSession, input: {
    durationMs: number;
    easing: 'linear' | 'ease' | 'spring';
}): AxisStep<ReanimatedState>;
```

#### `storeCredential`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L49) `packages/mobile/src/semantics/secure-storage.ts`

```ts
export declare function storeCredential(session: SecureStorageSession, input: {
    key: string;
    encryptedValue: string;
    requireBiometric?: boolean;
}): AxisStep<SecureStorageState>;
```

#### `summarizeFidelity`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/fidelity-harness.ts#L46) `packages/mobile/src/adapters/fidelity-harness.ts`

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

#### `switchNavigationTab`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L58) `packages/mobile/src/semantics/navigation.ts`

```ts
export declare function switchNavigationTab(session: NavigationSession, tabName: string): AxisStep<NavigationState>;
```

#### `unmountReactNativeComponent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L86) `packages/mobile/src/semantics/react-native.ts`

```ts
export declare function unmountReactNativeComponent(session: ReactNativeSession): AxisStep<ReactNativeState>;
```

#### `unregisterTurboModule`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L93) `packages/mobile/src/semantics/turbo-modules.ts`

```ts
export declare function unregisterTurboModule(session: TurboModulesSession): AxisStep<TurboModulesState>;
```

#### `updateFabricPriority`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L70) `packages/mobile/src/semantics/fabric.ts`

```ts
export declare function updateFabricPriority(session: FabricSession, priority: 'discrete' | 'continuous' | 'idle'): AxisStep<FabricState>;
```

#### `updateSharedValue`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L48) `packages/mobile/src/semantics/reanimated.ts`

```ts
export declare function updateSharedValue(session: ReanimatedSession, input: {
    name: string;
    value: number;
}): AxisStep<ReanimatedState>;
```

### 型

#### `AdapterInvocation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/types.ts#L21) `packages/mobile/src/adapters/types.ts`

```ts
export interface AdapterInvocation {
    scanId: string;
    target: MobileTarget;
    mode: AdapterMode;
    metadata?: Record<string, string | number | boolean>;
}
```

#### `AdapterMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/types.ts#L11) `packages/mobile/src/adapters/types.ts`

```ts
export type AdapterMode = 'mock' | 'real';
```

#### `AdapterResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/types.ts#L28) `packages/mobile/src/adapters/types.ts`

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

#### `AsyncStorageSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L8) `packages/mobile/src/semantics/async-storage.ts`

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

#### `AsyncStorageState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L6) `packages/mobile/src/semantics/async-storage.ts`

v1.51 async-storage axis — AsyncStorage / MMKV / web localStorage。

```ts
export type AsyncStorageState = 'idle' | 'set' | 'read' | 'removed' | 'batch-flushed';
```

#### `AxisStep`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/types.ts#L82) `packages/mobile/src/semantics/types.ts`

```ts
export interface AxisStep<TState extends string> {
    neutralEvent: NeutralEventName;
    providerEvent: string;
    state: TState;
    metadata: Record<string, string | number | boolean>;
}
```

#### `CodegenSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L8) `packages/mobile/src/semantics/codegen.ts`

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

#### `CodegenState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/codegen.ts#L6) `packages/mobile/src/semantics/codegen.ts`

v1.52 codegen axis — React Native 0.76+ Codegen (typed bridge + schema-first + type generation)。

```ts
export type CodegenState = 'idle' | 'schema-loaded' | 'spec-generated' | 'type-emitted' | 'build-completed';
```

#### `ExpoSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L9) `packages/mobile/src/semantics/expo.ts`

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

#### `ExpoState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L7) `packages/mobile/src/semantics/expo.ts`

Expo axis — build config load + deep link resolve + push notification + build complete の 4 step deterministic state machine。

```ts
export type ExpoState = 'idle' | 'config-loaded' | 'link-resolved' | 'push-received' | 'build-completed';
```

#### `FabricSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L8) `packages/mobile/src/semantics/fabric.ts`

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

#### `FabricState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L6) `packages/mobile/src/semantics/fabric.ts`

v1.52 fabric axis — React Native 0.76+ Fabric renderer (concurrent + priority + shadow tree)。

```ts
export type FabricState = 'idle' | 'scheduled' | 'shadow-committed' | 'priority-updated' | 'mounted';
```

#### `FidelityCoverage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fidelity.ts#L10) `packages/mobile/src/semantics/fidelity.ts`

```ts
export interface FidelityCoverage {
    providers: MobileTarget[];
    axes: MobileAxis[];
    rows: FidelityRow[];
}
```

#### `FidelityDiff`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/fidelity-harness.ts#L9) `packages/mobile/src/adapters/fidelity-harness.ts`

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

#### `FidelityRow`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fidelity.ts#L3) `packages/mobile/src/semantics/fidelity.ts`

```ts
export interface FidelityRow {
    provider: MobileTarget;
    axis: MobileAxis;
    neutralEvents: NeutralEventName[];
    providerEvents: string[];
}
```

#### `MetroSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L9) `packages/mobile/src/semantics/metro.ts`

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

#### `MetroState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L7) `packages/mobile/src/semantics/metro.ts`

Metro axis — bundle start + module resolve + HMR + bundle complete の 4 step deterministic state machine。

```ts
export type MetroState = 'idle' | 'bundling' | 'resolved' | 'hmr-applied' | 'completed';
```

#### `MobileAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/types.ts#L39) `packages/mobile/src/adapters/types.ts`

```ts
export interface MobileAdapter {
    axis: MobileAxis;
    scan(input: AdapterInvocation): Promise<AdapterResult>;
}
```

#### `MobileAxis`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/types.ts#L10) `packages/mobile/src/semantics/types.ts`

```ts
export type MobileAxis = 'react-native' | 'expo' | 'metro' | 'navigation' | 'reanimated' | 'async-storage' | 'secure-storage' | 'fabric' | 'turbo-modules' | 'codegen' | 'new-architecture';
```

#### `MobileCliCommand`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L14) `packages/mobile/src/adapters/spawn-driver.ts`

```ts
export type MobileCliCommand = 'expo build' | 'metro bundle' | 'codegen run' | 'react-native start' | 'pod install' | 'gradle build';
```

#### `MobileRealDriverAxis`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/real-driver.ts#L12) `packages/mobile/src/adapters/real-driver.ts`

Mobile real driver env-gate (v0.2)。 v1.51 で real CLI (Expo EAS + Metro real bundle + React Navigation deep link verify + Reanimated JSI worklet + AsyncStorage / MMKV native + Keychain / Keystore native) 呼出を stub 経由で隠蔽する契約。 env `KIWA_MOBILE_MODE=real` + 対応 URL env が全揃った時のみ real 呼出。 それ以外は explicit throw で fail-closed。

```ts
export type MobileRealDriverAxis = 'expo-eas' | 'metro' | 'navigation' | 'reanimated' | 'async-storage' | 'secure-storage';
```

#### `MobileRealDriverEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/real-driver.ts#L20) `packages/mobile/src/adapters/real-driver.ts`

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

#### `MobileTarget`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/types.ts#L8) `packages/mobile/src/semantics/types.ts`

```ts
export type MobileTarget = 'ios' | 'android' | 'web';
```

#### `NavigationSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L9) `packages/mobile/src/semantics/navigation.ts`

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

#### `NavigationState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L7) `packages/mobile/src/semantics/navigation.ts`

v1.51 navigation axis — React Navigation / Expo Router を統一。 stack push + tab switch + modal open + deep link navigate。

```ts
export type NavigationState = 'idle' | 'stack-pushed' | 'tab-switched' | 'modal-opened' | 'deep-linked';
```

#### `NeutralEventName`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/types.ts#L25) `packages/mobile/src/semantics/types.ts`

```ts
export type NeutralEventName = 'rn.component_mounted' | 'rn.native_module_invoked' | 'rn.gesture_recognized' | 'rn.component_unmounted' | 'expo.build_config_loaded' | 'expo.deep_link_resolved' | 'expo.push_notification_received' | 'expo.build_completed' | 'metro.bundle_started' | 'metro.module_resolved' | 'metro.hmr_applied' | 'metro.bundle_completed' | 'navigation.stack_pushed' | 'navigation.tab_switched' | 'navigation.modal_opened' | 'navigation.deep_link_navigated' | 'reanimated.shared_value_updated' | 'reanimated.worklet_executed' | 'reanimated.animation_started' | 'reanimated.animation_completed' | 'async-storage.item_set' | 'async-storage.item_read' | 'async-storage.item_removed' | 'async-storage.batch_flushed' | 'secure-storage.credential_stored' | 'secure-storage.credential_retrieved' | 'secure-storage.biometric_challenged' | 'secure-storage.credential_removed' | 'fabric.render_scheduled' | 'fabric.shadow_tree_committed' | 'fabric.priority_updated' | 'fabric.mount_completed' | 'turbo-modules.spec_registered' | 'turbo-modules.jsi_bound' | 'turbo-modules.method_invoked' | 'turbo-modules.unregistered' | 'codegen.schema_loaded' | 'codegen.spec_generated' | 'codegen.type_emitted' | 'codegen.build_completed' | 'new-architecture.init_started' | 'new-architecture.concurrent_enabled' | 'new-architecture.interop_bridged' | 'new-architecture.ready';
```

#### `NewArchitectureSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L8) `packages/mobile/src/semantics/new-architecture.ts`

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

#### `NewArchitectureState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L6) `packages/mobile/src/semantics/new-architecture.ts`

v1.52 new-architecture axis — React Native 0.76+ New Architecture (async init + concurrent React + interop layer)。

```ts
export type NewArchitectureState = 'idle' | 'initializing' | 'concurrent-enabled' | 'interop-bridged' | 'ready';
```

#### `ReactNativeSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L9) `packages/mobile/src/semantics/react-native.ts`

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

#### `ReactNativeState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L7) `packages/mobile/src/semantics/react-native.ts`

React Native axis — component mount + native module invocation + gesture recognition + unmount の 4 step deterministic state machine。

```ts
export type ReactNativeState = 'idle' | 'mounted' | 'native-invoked' | 'gesture-recognized' | 'unmounted';
```

#### `ReanimatedSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L8) `packages/mobile/src/semantics/reanimated.ts`

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

#### `ReanimatedState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L6) `packages/mobile/src/semantics/reanimated.ts`

v1.51 reanimated axis — Reanimated 3 shared value + worklet + animation。

```ts
export type ReanimatedState = 'idle' | 'value-updated' | 'worklet-run' | 'animating' | 'completed';
```

#### `SecureStorageSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L9) `packages/mobile/src/semantics/secure-storage.ts`

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

#### `SecureStorageState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L7) `packages/mobile/src/semantics/secure-storage.ts`

v1.51 secure-storage axis — iOS Keychain / Android Keystore / web CredMgmt API。 biometric challenge (Face ID / Touch ID / Fingerprint / WebAuthn) 込み。

```ts
export type SecureStorageState = 'idle' | 'stored' | 'retrieved' | 'biometric-challenged' | 'removed';
```

#### `SpawnExecutorInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-executor.ts#L20) `packages/mobile/src/adapters/spawn-executor.ts`

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

#### `SpawnExecutorResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-executor.ts#L11) `packages/mobile/src/adapters/spawn-executor.ts`

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

#### `SpawnFn`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-executor.ts#L29) `packages/mobile/src/adapters/spawn-executor.ts`

```ts
export type SpawnFn = typeof nodeSpawn;
```

#### `SpawnInvocation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L22) `packages/mobile/src/adapters/spawn-driver.ts`

```ts
export interface SpawnInvocation {
    command: MobileCliCommand;
    args: string[];
    env: Record<string, string>;
    cwd?: string;
}
```

#### `SpawnResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L29) `packages/mobile/src/adapters/spawn-driver.ts`

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

#### `TurboModulesSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L8) `packages/mobile/src/semantics/turbo-modules.ts`

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

#### `TurboModulesState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L6) `packages/mobile/src/semantics/turbo-modules.ts`

v1.52 turbo-modules axis — React Native 0.76+ TurboModules (typed native module + JSI + spec generation)。

```ts
export type TurboModulesState = 'idle' | 'spec-registered' | 'jsi-bound' | 'method-invoked' | 'unregistered';
```
<!-- kiwa-public-api:end -->
