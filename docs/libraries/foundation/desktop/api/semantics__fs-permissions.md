---
title: "@kiwa-lab/desktop semantics__fs-permissions の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/desktop</code> <code v-pre>semantics&#95;&#95;fs-permissions</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>grantFsPermission</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L59) <code v-pre>packages/desktop/src/semantics/fs-permissions.ts</code>

```ts
export declare function grantFsPermission(session: FsPermissionsSession, scope: FsPermissionScope): AxisStep<FsPermissionsState>;
```

#### <code v-pre>logFsPermissionAudit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L87) <code v-pre>packages/desktop/src/semantics/fs-permissions.ts</code>

```ts
export declare function logFsPermissionAudit(session: FsPermissionsSession, reason: string): AxisStep<FsPermissionsState>;
```

#### <code v-pre>requestFsPermission</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L40) <code v-pre>packages/desktop/src/semantics/fs-permissions.ts</code>

```ts
export declare function requestFsPermission(input: {
    target: DesktopTarget;
    path: string;
    scope: FsPermissionScope;
}): FsPermissionsSession;
```

#### <code v-pre>revokeFsPermission</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L72) <code v-pre>packages/desktop/src/semantics/fs-permissions.ts</code>

```ts
export declare function revokeFsPermission(session: FsPermissionsSession, scope: FsPermissionScope): AxisStep<FsPermissionsState>;
```

### 型

#### <code v-pre>FsPermissionScope</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L9) <code v-pre>packages/desktop/src/semantics/fs-permissions.ts</code>

```ts
export type FsPermissionScope = 'read' | 'write' | 'read-write' | 'execute';
```

#### <code v-pre>FsPermissionsSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L11) <code v-pre>packages/desktop/src/semantics/fs-permissions.ts</code>

```ts
export interface FsPermissionsSession {
    target: DesktopTarget;
    path: string;
    scope: FsPermissionScope;
    state: FsPermissionsState;
    grantedScopes: FsPermissionScope[];
    auditEntries: number;
    history: AxisStep<FsPermissionsState>[];
}
```

#### <code v-pre>FsPermissionsState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L7) <code v-pre>packages/desktop/src/semantics/fs-permissions.ts</code>

File-system permissions axis (v0.2) — request + grant + revoke + audit の 4 step 遷移。 macOS TCC + Windows UAC + Linux xdg-portal の 3 target を uniform state machine で扱う。

```ts
export type FsPermissionsState = 'idle' | 'requested' | 'granted' | 'revoked' | 'audited';
```
