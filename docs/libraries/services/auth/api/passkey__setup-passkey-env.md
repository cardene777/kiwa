---
title: "@kiwa-lab/auth passkey__setup-passkey-env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>passkey&#95;&#95;setup-passkey-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>&#95;&#95;resetPasskeyCounters</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L42) <code v-pre>packages/auth/src/passkey/setup-passkey-env.ts</code>

Reset the module-scoped counters imported from the WebAuthn base module so consecutive `setupPasskeyEnv` calls hand out stable, deterministic ids.

```ts
export declare function __resetPasskeyCounters(): void;
```

#### <code v-pre>setupPasskeyEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L75) <code v-pre>packages/auth/src/passkey/setup-passkey-env.ts</code>

Set up the passkey test environment. Composes WebAuthn primitives with per-device grouping and sync fabric wiring — every device has its own set of authenticators and credential stores, and every credential lives on exactly one device unless it has been synced through a fabric. The env owns the WebAuthn base-module state (global registry, ownership map) so a single `stop()` disposes the whole graph and consecutive `setupPasskeyEnv` calls are hermetic when preceded by `__resetPasskeyCounters()`.

```ts
export declare function setupPasskeyEnv(opts?: SetupPasskeyEnvOptions): Promise<PasskeyTestEnv>;
```


