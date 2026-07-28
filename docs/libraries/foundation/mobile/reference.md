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

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [adapters/fidelity-harness.ts](./api/adapters-fidelity-harness) | 2 | 1 |
| [adapters/mock-factory.ts](./api/adapters-mock-factory) | 4 | 0 |
| [adapters/real-driver.ts](./api/adapters-real-driver) | 2 | 2 |
| [adapters/spawn-driver.ts](./api/adapters-spawn-driver) | 4 | 3 |
| [adapters/spawn-executor.ts](./api/adapters-spawn-executor) | 2 | 3 |
| [adapters/types.ts](./api/adapters-types) | 0 | 4 |
| [semantics/async-storage.ts](./api/semantics-async-storage) | 5 | 2 |
| [semantics/codegen.ts](./api/semantics-codegen) | 5 | 2 |
| [semantics/expo.ts](./api/semantics-expo) | 4 | 2 |
| [semantics/fabric.ts](./api/semantics-fabric) | 5 | 2 |
| [semantics/fidelity.ts](./api/semantics-fidelity) | 2 | 2 |
| [semantics/metro.ts](./api/semantics-metro) | 4 | 2 |
| [semantics/navigation.ts](./api/semantics-navigation) | 5 | 2 |
| [semantics/new-architecture.ts](./api/semantics-new-architecture) | 5 | 2 |
| [semantics/react-native.ts](./api/semantics-react-native) | 4 | 2 |
| [semantics/reanimated.ts](./api/semantics-reanimated) | 5 | 2 |
| [semantics/secure-storage.ts](./api/semantics-secure-storage) | 5 | 2 |
| [semantics/turbo-modules.ts](./api/semantics-turbo-modules) | 5 | 2 |
| [semantics/types.ts](./api/semantics-types) | 1 | 4 |

<!-- kiwa-public-api:end -->
