# @kiwa-lab/auth リファレンス

このページは、認証基盤ごとの environment と、テストで観測する主要な状態をまとめます。各 environment は独立しており、作成した environment を使い終えたら `stop()` を呼びます。

## environment

| API | 対象 | 主な操作 |
| --- | --- | --- |
| `setupNextAuthEnv` | NextAuth v5 | `signIn`、`getSession`、`signOut`、provider registry |
| `setupLuciaEnv` | Lucia v3 | password sign-up、password sign-in、OAuth、session validation と invalidation |
| `setupBetterAuthEnv` | Better Auth | password、magic link、TOTP、organization、passkey |
| `setupClerkEnv` | Clerk | user、session、organization、JWT |
| `setupAuth0Env` | Auth0 | token、user、rule、action |
| `setupSupabaseAuthEnv` | Supabase Auth | password、OAuth、PKCE、magic link、SMS OTP、JWT session |

## NextAuth の設定

`setupNextAuthEnv` では `providers` に使う provider を指定します。`session.strategy` は `jwt` または `database` です。`database` を使う場合は `database` に adapter を渡せます。`createInMemoryAdapter()` は Auth.js Adapter の操作面に合わせた in-memory adapter を返します。

provider が空の場合、または setup 時に登録していない provider を `signIn` に渡した場合は失敗します。テストではその失敗をアプリケーション側がどのように扱うかを確認してください。

## session の扱い

`signIn` は user と session を返します。`getSession(token)` は token から session を取り出します。`signOut(token)` の意味は strategy によって異なります。database strategy では保存済み session を削除します。jwt strategy では発行済み token を失効リストへ入れるものではありません。

## adapter と型

`createInMemoryAdapter` のほか、`createInMemoryLuciaAdapter` と `createInMemoryBetterAuthAdapter` を公開しています。公開型には `AuthUser`、`AuthSession`、`AuthDatabaseAdapter`、各 provider の profile と option 型があります。実ライブラリの型と照合する場合は、対応する optional peer を開発依存へ追加してください。

## 制約

このパッケージは認証 SDK に近い操作面を再現しますが、実際の IdP への通信やホスト画面の UI を実行しません。実際の redirect、Cookie 属性、外部テナントの設定を検証するには integration または E2E テストを追加します。

## 後始末

すべての `setup*Env` が返す environment は `stop()` を持ちます。Vitest では `afterEach(async () => await env?.stop())` の形で登録してください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>updateUser: unknown id $&#123;patch.id&#125;</code> | [packages/auth/src/adapter.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/adapter.ts#L56) |
| <code v-pre>verifyAuth0AccessToken: audience mismatch (expected $&#123;expected.audience&#125;, got $&#123;JSON.stringify(claims.aud)&#125;)</code> | [packages/auth/src/auth0/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L103) |
| <code v-pre>verifyAuth0Jwt: malformed token (expected 3 segments)</code> | [packages/auth/src/auth0/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L113) |
| <code v-pre>verifyAuth0Jwt: unexpected JWT header (expected HS256/JWT)</code> | [packages/auth/src/auth0/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L117) |
| <code v-pre>verifyAuth0Jwt: signature mismatch</code> | [packages/auth/src/auth0/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L123) |
| <code v-pre>verifyAuth0Jwt: payload is not valid JSON</code> | [packages/auth/src/auth0/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L129) |
| <code v-pre>verifyAuth0Jwt: token expired</code> | [packages/auth/src/auth0/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L133) |
| <code v-pre>verifyAuth0IdToken: issuer mismatch (expected $&#123;expected.issuer&#125;, got $&#123;claims.iss&#125;)</code> | [packages/auth/src/auth0/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L71) |
| <code v-pre>verifyAuth0IdToken: audience mismatch (expected $&#123;expected.audience&#125;, got $&#123;String(claims.aud)&#125;)</code> | [packages/auth/src/auth0/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L76) |
| <code v-pre>verifyAuth0AccessToken: issuer mismatch (expected $&#123;expected.issuer&#125;, got $&#123;claims.iss&#125;)</code> | [packages/auth/src/auth0/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L95) |
| <code v-pre>Auth0 users.get: not found $&#123;userId&#125;</code> | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L320) |
| <code v-pre>Auth0 authenticate.signIn: unknown user email $&#123;input.email&#125;</code> | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L349) |
| <code v-pre>Auth0 authenticate.signIn: user $&#123;user.user&#95;id&#125; is blocked</code> | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L352) |
| <code v-pre>Auth0 authenticate.signIn: no password on file for $&#123;user.user&#95;id&#125;</code> | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L361) |
| <code v-pre>Auth0 authenticate.signIn: incorrect password for $&#123;input.email&#125;</code> | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L366) |
| <code v-pre>Auth0 authenticate.signIn: access denied — $&#123;acted.deniedReason&#125;</code> | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L393) |
| <code v-pre>Auth0 authenticate.signUp: user with email $&#123;input.email&#125; already exists</code> | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L420) |
| <code v-pre>Auth0 authenticate.signUp: registration denied — $&#123;preActed.deniedReason&#125;</code> | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L451) |
| <code v-pre>setupAuth0Env: tokenExpiration must be a positive number of seconds</code> | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L56) |
| <code v-pre>Auth0 setAppMetadata: unknown user id $&#123;userId&#125;</code> | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L563) |
| <code v-pre>setupAuth0Env: email must be a valid email (got $&#123;input.email&#125;)</code> | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L84) |
| <code v-pre>Auth0 store: user with email $&#123;user.email&#125; already exists</code> | [packages/auth/src/auth0/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/store.ts#L43) |
| <code v-pre>Auth0 store: unknown user id $&#123;userId&#125;</code> | [packages/auth/src/auth0/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/store.ts#L59) |
| <code v-pre>createUser: email already registered ($&#123;input.email&#125;)</code> | [packages/auth/src/better-auth/adapter.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/adapter.ts#L54) |
| <code v-pre>updateUser: unknown id $&#123;patch.id&#125;</code> | [packages/auth/src/better-auth/adapter.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/adapter.ts#L80) |
| <code v-pre>hashPassword: password must not be empty</code> | [packages/auth/src/better-auth/password.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/password.ts#L29) |
| <code v-pre>Unknown Better Auth provider kind: $&#123;String(kind)&#125;</code> | [packages/auth/src/better-auth/providers.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/providers.ts#L48) |
| <code v-pre>setupBetterAuthEnv: provider "$&#123;provider&#125;" was not configured</code> | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L103) |
| <code v-pre>sendMagicLink: email is required</code> | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L133) |
| <code v-pre>consumeMagicLink: invalid or expired token</code> | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L147) |
| <code v-pre>enrollTwoFactor: unknown user id $&#123;input.userId&#125;</code> | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L169) |
| <code v-pre>verifyTwoFactorCode: user is not enrolled in 2FA</code> | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L179) |
| <code v-pre>createOrganization: unknown user id $&#123;input.userId&#125;</code> | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L205) |
| <code v-pre>inviteToOrganization: unknown organization id $&#123;input.organizationId&#125;</code> | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L228) |
| <code v-pre>inviteToOrganization: unknown user id $&#123;input.userId&#125;</code> | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L234) |
| <code v-pre>registerPasskey: unknown user id $&#123;input.userId&#125;</code> | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L250) |
| <code v-pre>setupBetterAuthEnv: providers must contain at least one entry</code> | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L42) |
| <code v-pre>setupBetterAuthEnv: sessionExpiration must be a positive number of seconds</code> | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L46) |
| <code v-pre>setupBetterAuthEnv: verificationExpiration must be a positive number of seconds</code> | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L53) |
| <code v-pre>setupBetterAuthEnv: $&#123;method&#125; requires the "$&#123;kind&#125;" plugin to be enabled</code> | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L66) |
| <code v-pre>signUpWithPassword: email is required</code> | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L74) |
| <code v-pre>signInWithPassword: invalid email or password</code> | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L89) |
| <code v-pre>signInWithPassword: invalid email or password</code> | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L92) |
| <code v-pre>verifyClerkJwt: malformed token (expected 3 segments)</code> | [packages/auth/src/clerk/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/jwt.ts#L52) |
| <code v-pre>verifyClerkJwt: unexpected JWT header (expected HS256/JWT)</code> | [packages/auth/src/clerk/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/jwt.ts#L56) |
| <code v-pre>verifyClerkJwt: signature mismatch</code> | [packages/auth/src/clerk/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/jwt.ts#L62) |
| <code v-pre>verifyClerkJwt: payload is not valid JSON</code> | [packages/auth/src/clerk/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/jwt.ts#L68) |
| <code v-pre>verifyClerkJwt: token expired</code> | [packages/auth/src/clerk/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/jwt.ts#L72) |
| <code v-pre>setupClerkEnv: unknown user id $&#123;input.userId&#125;</code> | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L140) |
| <code v-pre>setupClerkEnv: unknown organization slug $&#123;input.organizationSlug&#125;</code> | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L146) |
| <code v-pre>setupClerkEnv: cannot seed organization, unknown user email $&#123;seed.createdByEmail&#125;</code> | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L183) |
| <code v-pre>setupClerkEnv: cannot seed token, unknown user email $&#123;seed.userEmail&#125;</code> | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L210) |
| <code v-pre>Clerk users.getUser: not found $&#123;id&#125;</code> | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L232) |
| <code v-pre>Clerk sessions.getSession: not found $&#123;id&#125;</code> | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L267) |
| <code v-pre>Clerk sessions.revokeSession: not found $&#123;id&#125;</code> | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L274) |
| <code v-pre>Clerk organizations.createOrganization: unknown creator id $&#123;input.createdBy&#125;</code> | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L287) |
| <code v-pre>Clerk organizations.getOrganization: not found $&#123;id&#125;</code> | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L314) |
| <code v-pre>Clerk organizations.createMembership: unknown organization $&#123;input.organizationId&#125;</code> | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L324) |
| <code v-pre>Clerk organizations.createMembership: unknown user $&#123;input.userId&#125;</code> | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L330) |
| <code v-pre>setupClerkEnv: sessionExpiration must be a positive number of seconds</code> | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L35) |
| <code v-pre>Clerk organizations.updateMembership: not found $&#123;input.organizationId&#125;/$&#123;input.userId&#125;</code> | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L355) |
| <code v-pre>verifyToken: session $&#123;claims.sid&#125; not found</code> | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L375) |
| <code v-pre>verifyToken: session $&#123;claims.sid&#125; status is $&#123;session.status&#125;</code> | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L380) |
| <code v-pre>verifyToken: session $&#123;claims.sid&#125; expired</code> | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L385) |
| <code v-pre>verifyToken: user $&#123;claims.sub&#125; not found</code> | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L389) |
| <code v-pre>setupClerkEnv.signIn: unknown user email $&#123;input.email&#125;</code> | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L400) |
| <code v-pre>setupClerkEnv: cannot issue token, organization slug not found: $&#123;input.organizationSlug&#125;</code> | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L58) |
| <code v-pre>setupClerkEnv: cannot issue token, user $&#123;input.user.id&#125; is not a member of org $&#123;org.id&#125;</code> | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L64) |
| <code v-pre>setupClerkEnv: primaryEmailAddress must be a valid email (got $&#123;input.primaryEmailAddress&#125;)</code> | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L98) |
| <code v-pre>Clerk store: unknown session id $&#123;id&#125;</code> | [packages/auth/src/clerk/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/store.ts#L132) |
| <code v-pre>Clerk store: organization with slug $&#123;org.slug&#125; already exists</code> | [packages/auth/src/clerk/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/store.ts#L142) |
| <code v-pre>Clerk store: user $&#123;membership.userId&#125; already a member of org $&#123;membership.organizationId&#125;</code> | [packages/auth/src/clerk/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/store.ts#L157) |
| <code v-pre>Clerk store: membership $&#123;orgId&#125;/$&#123;userId&#125; not found</code> | [packages/auth/src/clerk/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/store.ts#L171) |
| <code v-pre>Clerk store: user with email $&#123;user.primaryEmailAddress&#125; already exists</code> | [packages/auth/src/clerk/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/store.ts#L79) |
| <code v-pre>Clerk store: unknown user id $&#123;id&#125;</code> | [packages/auth/src/clerk/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/store.ts#L95) |
| <code v-pre>createUser: email already registered ($&#123;input.email&#125;)</code> | [packages/auth/src/lucia/adapter.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/adapter.ts#L34) |
| <code v-pre>updateUser: unknown id $&#123;patch.id&#125;</code> | [packages/auth/src/lucia/adapter.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/adapter.ts#L55) |
| <code v-pre>hashPassword: password must not be empty</code> | [packages/auth/src/lucia/password.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/password.ts#L40) |
| <code v-pre>Unknown Lucia provider kind: $&#123;String(kind)&#125;</code> | [packages/auth/src/lucia/providers.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/providers.ts#L48) |
| <code v-pre>setupLuciaEnv: providers must contain at least one entry</code> | [packages/auth/src/lucia/setup-lucia-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/setup-lucia-env.ts#L35) |
| <code v-pre>setupLuciaEnv: sessionExpiration must be a positive number of seconds</code> | [packages/auth/src/lucia/setup-lucia-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/setup-lucia-env.ts#L39) |
| <code v-pre>signUpWithPassword: email is required</code> | [packages/auth/src/lucia/setup-lucia-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/setup-lucia-env.ts#L47) |
| <code v-pre>signInWithPassword: invalid email or password</code> | [packages/auth/src/lucia/setup-lucia-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/setup-lucia-env.ts#L57) |
| <code v-pre>signInWithPassword: invalid email or password</code> | [packages/auth/src/lucia/setup-lucia-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/setup-lucia-env.ts#L60) |
| <code v-pre>setupLuciaEnv: provider "$&#123;provider&#125;" was not configured</code> | [packages/auth/src/lucia/setup-lucia-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/setup-lucia-env.ts#L71) |
| <code v-pre>registerUser: user "$&#123;user.subject&#125;" already registered</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L102) |
| <code v-pre>authorization-server: unknown client&#95;id "$&#123;clientId&#125;"</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L112) |
| <code v-pre>authorization-server: unknown subject "$&#123;subject&#125;" — preseed via options.users or call registerUser</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L122) |
| <code v-pre>authorization-server: redirect&#95;uri "$&#123;redirectUri&#125;" not registered for client "$&#123;client.clientId&#125;"</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L131) |
| <code v-pre>authorization-server: user "$&#123;user.subject&#125;" not entitled to scope "$&#123;scope&#125;"</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L157) |
| <code v-pre>authorization-server: client "$&#123;client.clientId&#125;" not registered for scope "$&#123;scope&#125;"</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L162) |
| <code v-pre>authorize: response&#95;type "$&#123;request.responseType&#125;" refused — OAuth 2.1 requires "code" (implicit + hybrid dropped by RFC 9700)</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L175) |
| <code v-pre>authorize: code&#95;challenge&#95;method "plain" refused — RFC 9700 §2.1.1 requires S256</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L180) |
| <code v-pre>authorize: unknown code&#95;challenge&#95;method "$&#123;request.codeChallengeMethod&#125;" — expected S256</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L185) |
| <code v-pre>authorize: code&#95;challenge missing — PKCE always mandatory in OAuth 2.1</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L190) |
| <code v-pre>authorize: state parameter missing — required for CSRF defence</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L195) |
| <code v-pre>token: grant&#95;type "$&#123;grantType&#125;" refused — dropped by OAuth 2.1 / RFC 9700</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L229) |
| <code v-pre>token: unknown grant&#95;type "$&#123;grantType&#125;"</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L234) |
| <code v-pre>token: unknown authorization code "$&#123;request.code&#125;"</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L248) |
| <code v-pre>token: authorization code "$&#123;request.code&#125;" already exchanged — replay refused</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L251) |
| <code v-pre>token: client&#95;id mismatch — code issued to "$&#123;record.clientId&#125;", exchanged by "$&#123;request.clientId&#125;"</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L256) |
| <code v-pre>token: redirect&#95;uri mismatch — code recorded "$&#123;record.redirectUri&#125;", exchanged with "$&#123;request.redirectUri&#125;"</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L261) |
| <code v-pre>token: PKCE code&#95;verifier does not match recorded code&#95;challenge</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L272) |
| <code v-pre>token: refresh&#95;token "$&#123;request.refreshToken&#125;" has been rotated — reuse refused (RFC 9700 §2.2 rotation family compromise)</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L311) |
| <code v-pre>token: unknown refresh&#95;token "$&#123;request.refreshToken&#125;"</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L315) |
| <code v-pre>token: refresh&#95;token "$&#123;request.refreshToken&#125;" is revoked — refresh refused</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L318) |
| <code v-pre>token: client&#95;id mismatch — refresh&#95;token issued to "$&#123;existing.clientId&#125;", used by "$&#123;request.clientId&#125;"</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L323) |
| <code v-pre>token: refresh&#95;token "$&#123;request.refreshToken&#125;" is expired</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L328) |
| <code v-pre>token: refresh&#95;token is DPoP-bound but no DPoP proof was supplied</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L335) |
| <code v-pre>token: DPoP JWK thumbprint mismatch — refresh&#95;token bound to a different key</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L340) |
| <code v-pre>token: refresh scope "$&#123;scope&#125;" not in original grant "$&#123;existing.scope&#125;"</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L354) |
| <code v-pre>revoke: token belongs to client "$&#123;access.clientId&#125;", revocation attempted by "$&#123;clientId&#125;"</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L419) |
| <code v-pre>revoke: refresh&#95;token belongs to client "$&#123;refresh.clientId&#125;", revocation attempted by "$&#123;clientId&#125;"</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L429) |
| <code v-pre>registerClient: client "$&#123;client.clientId&#125;" already registered</code> | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L93) |
| <code v-pre>parseDpopProof: expected compact JWT with 3 segments, got $&#123;parts.length&#125;</code> | [packages/auth/src/oauth21/dpop.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L112) |
| <code v-pre>parseDpopProof: expected typ=dpop+jwt, got typ="$&#123;headerRaw?.typ&#125;"</code> | [packages/auth/src/oauth21/dpop.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L120) |
| <code v-pre>parseDpopProof: expected alg=ES256, got alg="$&#123;headerRaw?.alg&#125;"</code> | [packages/auth/src/oauth21/dpop.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L125) |
| <code v-pre>parseDpopProof: expected EC P-256 jwk in header, got kty="$&#123;headerRaw?.jwk?.kty&#125;"</code> | [packages/auth/src/oauth21/dpop.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L130) |
| <code v-pre>verifyDpopProof: htm mismatch — expected "$&#123;options.expectedHtm.toUpperCase()&#125;", got "$&#123;parsed.payload.htm&#125;"</code> | [packages/auth/src/oauth21/dpop.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L174) |
| <code v-pre>verifyDpopProof: htu mismatch — expected "$&#123;options.expectedHtu&#125;", got "$&#123;parsed.payload.htu&#125;"</code> | [packages/auth/src/oauth21/dpop.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L179) |
| <code v-pre>verifyDpopProof: iat outside allowed skew (delta=$&#123;iatDelta&#125;s, allowed=$&#123;options.iatSkewSec&#125;s)</code> | [packages/auth/src/oauth21/dpop.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L186) |
| <code v-pre>verifyDpopProof: proof missing jti</code> | [packages/auth/src/oauth21/dpop.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L191) |
| <code v-pre>verifyDpopProof: jti "$&#123;parsed.payload.jti&#125;" replay detected</code> | [packages/auth/src/oauth21/dpop.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L194) |
| <code v-pre>deriveCodeChallenge: PKCE method "plain" is forbidden by RFC 9700 — use S256</code> | [packages/auth/src/oauth21/pkce.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/pkce.ts#L63) |
| <code v-pre>deriveCodeChallenge: unknown PKCE method "$&#123;method&#125;" — expected S256</code> | [packages/auth/src/oauth21/pkce.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/pkce.ts#L68) |
| <code v-pre>deriveCodeChallenge: code verifier must be 43-128 chars (got $&#123;verifier.length&#125;)</code> | [packages/auth/src/oauth21/pkce.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/pkce.ts#L73) |
| <code v-pre>rotateRefreshToken: refresh token "$&#123;previous.token&#125;" is already revoked — rotation not permitted (RFC 9700 §2.2 replay defence)</code> | [packages/auth/src/oauth21/refresh-rotation.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/refresh-rotation.ts#L101) |
| <code v-pre>dynamicClientRegistration: &#96;redirect&#95;uris&#96; must be a non-empty array (RFC 7591 §2)</code> | [packages/auth/src/oidc/dcr.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L182) |
| <code v-pre>dynamicClientRegistration: every redirect&#95;uri must be a non-empty string (got "$&#123;uri&#125;")</code> | [packages/auth/src/oidc/dcr.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L188) |
| <code v-pre>dynamicClientRegistration: redirect&#95;uri "$&#123;uri&#125;" is not a valid URL</code> | [packages/auth/src/oidc/dcr.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L197) |
| <code v-pre>dynamicClientRegistration: grant&#95;type "$&#123;grant&#125;" refused — OAuth 2.1 allowlist is $&#123;&#91;...ALLOWED&#95;GRANT&#95;TYPES&#93;.join(', ')&#125;</code> | [packages/auth/src/oidc/dcr.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L206) |
| <code v-pre>dynamicClientRegistration: response&#95;type "$&#123;responseType&#125;" refused — OIDC Discovery advertises "code" only</code> | [packages/auth/src/oidc/dcr.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L215) |
| <code v-pre>dynamicClientRegistration: token&#95;endpoint&#95;auth&#95;method "$&#123;authMethod&#125;" refused — advertised methods are $&#123;&#91;...ALLOWED&#95;AUTH&#95;METHODS&#93;.join(', ')&#125;</code> | [packages/auth/src/oidc/dcr.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L223) |
| <code v-pre>dynamicClientRegistration: software&#95;statement supplied but no trust anchor configured on the AS</code> | [packages/auth/src/oidc/dcr.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L246) |
| <code v-pre>dynamicClientRegistration: software&#95;statement parse failed — $&#123;(err as Error).message&#125;</code> | [packages/auth/src/oidc/dcr.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L254) |
| <code v-pre>dynamicClientRegistration: software&#95;statement signature verification failed</code> | [packages/auth/src/oidc/dcr.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L269) |
| <code v-pre>software&#95;statement: expected 3 dot-separated segments, got $&#123;parts.length&#125;</code> | [packages/auth/src/oidc/dcr.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L92) |
| <code v-pre>createDiscoveryEndpoint: metadata.issuer "$&#123;metadata.issuer&#125;" must match endpoint issuer "$&#123;issuer&#125;" (OIDC Discovery §4.3)</code> | [packages/auth/src/oidc/discovery.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/discovery.ts#L82) |
| <code v-pre>id&#95;token: no signing key registered for kid "$&#123;kid&#125;"</code> | [packages/auth/src/oidc/id-token.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/id-token.ts#L244) |
| <code v-pre>jwks: $&#123;member&#125; is unavailable on a fetched JWKS document</code> | [packages/auth/src/oidc/id-token.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/id-token.ts#L404) |
| <code v-pre>performBLEHandshake: sessionId is empty — cannot correlate BLE advertisement with QR payload</code> | [packages/auth/src/passkey/caBLE/ble-handshake.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/ble-handshake.ts#L47) |
| <code v-pre>migrateCredential: cannot migrate credential over unestablished tunnel "$&#123;tunnel.sessionId&#125;"</code> | [packages/auth/src/passkey/caBLE/hybrid-transport.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/hybrid-transport.ts#L35) |
| <code v-pre>migrateCredential: cannot migrate credential over closed tunnel "$&#123;tunnel.sessionId&#125;"</code> | [packages/auth/src/passkey/caBLE/hybrid-transport.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/hybrid-transport.ts#L40) |
| <code v-pre>performSignatureRoundtrip: cannot sign over unestablished tunnel "$&#123;tunnel.sessionId&#125;"</code> | [packages/auth/src/passkey/caBLE/hybrid-transport.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/hybrid-transport.ts#L72) |
| <code v-pre>performSignatureRoundtrip: cannot sign over closed tunnel "$&#123;tunnel.sessionId&#125;"</code> | [packages/auth/src/passkey/caBLE/hybrid-transport.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/hybrid-transport.ts#L77) |
| <code v-pre>performSignatureRoundtrip: challenge is empty — cannot produce a WebAuthn L3 §7.2 assertion signature over an empty challenge</code> | [packages/auth/src/passkey/caBLE/hybrid-transport.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/hybrid-transport.ts#L82) |
| <code v-pre>generateCaBLEQRCode: tunnelServerHint is empty — cannot advertise a hybrid transport ceremony without a tunnel endpoint</code> | [packages/auth/src/passkey/caBLE/qr-code.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/qr-code.ts#L32) |
| <code v-pre>generateCaBLEQRCode: nonce is empty — cannot derive a replay-safe handshake without a nonce</code> | [packages/auth/src/passkey/caBLE/qr-code.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/qr-code.ts#L37) |
| <code v-pre>establishWebSocketTunnel: BLE handshake not verified — real caBLE refuses to open the tunnel when the shared secret cannot be derived by both sides</code> | [packages/auth/src/passkey/caBLE/websocket-tunnel.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/websocket-tunnel.ts#L30) |
| <code v-pre>establishWebSocketTunnel: session id mismatch — QR "$&#123;qr.sessionId&#125;" vs handshake "$&#123;handshake.sessionId&#125;"</code> | [packages/auth/src/passkey/caBLE/websocket-tunnel.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/websocket-tunnel.ts#L35) |
| <code v-pre>establishWebSocketTunnel: cannot send on closed tunnel "$&#123;qr.sessionId&#125;"</code> | [packages/auth/src/passkey/caBLE/websocket-tunnel.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/websocket-tunnel.ts#L47) |
| <code v-pre>establishWebSocketTunnel: cannot drain closed tunnel "$&#123;qr.sessionId&#125;"</code> | [packages/auth/src/passkey/caBLE/websocket-tunnel.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/websocket-tunnel.ts#L55) |
| <code v-pre>requireFabric: sync fabric vendor "$&#123;vendor&#125;" is not registered on this env</code> | [packages/auth/src/passkey/credential-sync.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/credential-sync.ts#L113) |
| <code v-pre>backupCredential: credential "$&#123;credential.credentialId&#125;" is not backup-eligible — non-discoverable credentials cannot enter a sync fabric</code> | [packages/auth/src/passkey/credential-sync.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/credential-sync.ts#L26) |
| <code v-pre>createPlatformAuthenticator: passkeys require hasResidentKey=true — a non-discoverable platform credential is not a passkey</code> | [packages/auth/src/passkey/platform.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/platform.ts#L21) |
| <code v-pre>createPlatformAuthenticator: unknown biometric "$&#123;biometric&#125;" — expected touch-id / face-id / windows-hello / android-biometric</code> | [packages/auth/src/passkey/platform.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/platform.ts#L32) |
| <code v-pre>createRoamingAuthenticator: unknown roaming kind "$&#123;kind&#125;" — expected security-key or phone</code> | [packages/auth/src/passkey/roaming.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/roaming.ts#L22) |
| <code v-pre>setupPasskeyEnv: unknown deviceId "$&#123;deviceId&#125;" — call addDevice first or preseed via options.devices</code> | [packages/auth/src/passkey/setup-passkey-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L112) |
| <code v-pre>setupPasskeyEnv: credential "$&#123;credentialId&#125;" is not registered on any device</code> | [packages/auth/src/passkey/setup-passkey-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L134) |
| <code v-pre>setupPasskeyEnv: passkey metadata missing for credential "$&#123;credentialId&#125;" — was it minted through createPasskey?</code> | [packages/auth/src/passkey/setup-passkey-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L140) |
| <code v-pre>setupPasskeyEnv: device "$&#123;deviceId&#125;" is already registered</code> | [packages/auth/src/passkey/setup-passkey-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L156) |
| <code v-pre>setupPasskeyEnv: device "$&#123;device.deviceId&#125;" has no authenticator — call addPlatformAuthenticator or addRoamingAuthenticator first</code> | [packages/auth/src/passkey/setup-passkey-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L194) |
| <code v-pre>setupPasskeyEnv: authenticator "$&#123;authenticatorId&#125;" is not registered on device "$&#123;device.deviceId&#125;"</code> | [packages/auth/src/passkey/setup-passkey-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L203) |
| <code v-pre>restoreCredential: fabric "$&#123;vendor&#125;" does not hold credential "$&#123;credentialId&#125;" — call backupCredential first</code> | [packages/auth/src/passkey/setup-passkey-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L327) |
| <code v-pre>restoreCredential: credential "$&#123;credentialId&#125;" belongs to user "$&#123;blob.userId&#125;" — user "$&#123;userId&#125;" cannot restore it</code> | [packages/auth/src/passkey/setup-passkey-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L332) |
| <code v-pre>restoreCredential: device "$&#123;targetDeviceId&#125;" has no authenticator to host the restored credential</code> | [packages/auth/src/passkey/setup-passkey-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L337) |
| <code v-pre>createSyncFabric: unknown vendor "$&#123;vendor&#125;" — expected icloud-keychain or google-password-manager</code> | [packages/auth/src/passkey/sync-fabric.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/sync-fabric.ts#L16) |
| <code v-pre>Email provider requires an email address for the magic link</code> | [packages/auth/src/providers.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/providers.ts#L52) |
| <code v-pre>Unknown provider kind: $&#123;String(kind)&#125;</code> | [packages/auth/src/providers.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/providers.ts#L67) |
| <code v-pre>extendSession: session in revocation window, cannot extend</code> | [packages/auth/src/semantics/auth-continuity.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/auth-continuity.ts#L102) |
| <code v-pre>seamlessReauth: session in revocation window, cannot reauth</code> | [packages/auth/src/semantics/auth-continuity.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/auth-continuity.ts#L52) |
| <code v-pre>rotateRefresh: session in revocation window, cannot rotate</code> | [packages/auth/src/semantics/auth-continuity.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/auth-continuity.ts#L75) |
| <code v-pre>detectAbuse: no attempts recorded</code> | [packages/auth/src/semantics/auth-telemetry.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/auth-telemetry.ts#L117) |
| <code v-pre>updateSuccessRate: no attempts recorded</code> | [packages/auth/src/semantics/auth-telemetry.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/auth-telemetry.ts#L67) |
| <code v-pre>markTimeout: session is $&#123;session.state&#125;, expected hint-shown</code> | [packages/auth/src/semantics/conditional-ui.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/conditional-ui.ts#L109) |
| <code v-pre>markTimeout: nowMs $&#123;input.nowMs&#125; &lt; timeoutMs $&#123;session.timeoutMs&#125;</code> | [packages/auth/src/semantics/conditional-ui.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/conditional-ui.ts#L112) |
| <code v-pre>showHint: session is $&#123;session.state&#125;, expected idle</code> | [packages/auth/src/semantics/conditional-ui.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/conditional-ui.ts#L42) |
| <code v-pre>selectAutofill: session is $&#123;session.state&#125;, expected hint-shown</code> | [packages/auth/src/semantics/conditional-ui.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/conditional-ui.ts#L61) |
| <code v-pre>triggerFallback: session is $&#123;session.state&#125;, expected hint-shown</code> | [packages/auth/src/semantics/conditional-ui.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/conditional-ui.ts#L85) |
| <code v-pre>continuous-auth: cannot complete step-up from state "$&#123;input.session.state&#125;" (must be step-up-required)</code> | [packages/auth/src/semantics/continuous-auth.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/continuous-auth.ts#L115) |
| <code v-pre>completeHandshake: session is $&#123;session.state&#125;, expected tunnel-opened</code> | [packages/auth/src/semantics/cross-device-flow.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/cross-device-flow.ts#L110) |
| <code v-pre>generateQr: session is $&#123;session.state&#125;, expected idle</code> | [packages/auth/src/semantics/cross-device-flow.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/cross-device-flow.ts#L44) |
| <code v-pre>pairBle: session is $&#123;session.state&#125;, expected qr-generated</code> | [packages/auth/src/semantics/cross-device-flow.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/cross-device-flow.ts#L64) |
| <code v-pre>openTunnel: session is $&#123;session.state&#125;, expected ble-paired</code> | [packages/auth/src/semantics/cross-device-flow.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/cross-device-flow.ts#L88) |
| <code v-pre>confirmCredProps: session is idle, bind first</code> | [packages/auth/src/semantics/device-bound-passkey.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/device-bound-passkey.ts#L111) |
| <code v-pre>bindToDevice: session is $&#123;session.state&#125;, expected idle</code> | [packages/auth/src/semantics/device-bound-passkey.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/device-bound-passkey.ts#L44) |
| <code v-pre>verifySyncFabric: session is $&#123;session.state&#125;, expected device-bound</code> | [packages/auth/src/semantics/device-bound-passkey.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/device-bound-passkey.ts#L64) |
| <code v-pre>verifySyncFabric: no sync fabric configured</code> | [packages/auth/src/semantics/device-bound-passkey.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/device-bound-passkey.ts#L67) |
| <code v-pre>migrateCredential: session is $&#123;session.state&#125;, cannot migrate</code> | [packages/auth/src/semantics/device-bound-passkey.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/device-bound-passkey.ts#L89) |
| <code v-pre>applyPolicy: session is $&#123;session.state&#125;, cannot apply policy</code> | [packages/auth/src/semantics/risk-based-auth.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/risk-based-auth.ts#L106) |
| <code v-pre>evaluateScore: session is $&#123;session.state&#125;, expected idle</code> | [packages/auth/src/semantics/risk-based-auth.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/risk-based-auth.ts#L52) |
| <code v-pre>injectChallenge: session is $&#123;session.state&#125;, expected evaluated</code> | [packages/auth/src/semantics/risk-based-auth.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/risk-based-auth.ts#L81) |
| <code v-pre>injectChallenge: score $&#123;session.score&#125; not in challenge range &#91;$&#123;session.allowThreshold&#125;, $&#123;session.blockThreshold&#125;)</code> | [packages/auth/src/semantics/risk-based-auth.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/risk-based-auth.ts#L84) |
| <code v-pre>reportConcurrentSession: count $&#123;input.concurrentSessionCount&#125; must be &gt; 1</code> | [packages/auth/src/semantics/session-hijack-detect.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/session-hijack-detect.ts#L88) |
| <code v-pre>satisfyAal3: session is $&#123;session.state&#125;, expected escalation-requested</code> | [packages/auth/src/semantics/step-up-mfa.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/step-up-mfa.ts#L100) |
| <code v-pre>requestEscalation: requiredAal $&#123;input.requiredAal&#125; not higher than currentAal $&#123;session.currentAal&#125;</code> | [packages/auth/src/semantics/step-up-mfa.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/step-up-mfa.ts#L46) |
| <code v-pre>satisfyAal2: session is $&#123;session.state&#125;, expected escalation-requested</code> | [packages/auth/src/semantics/step-up-mfa.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/step-up-mfa.ts#L72) |
| <code v-pre>satisfyAal2: requiredAal is AAL3, cannot satisfy with AAL2</code> | [packages/auth/src/semantics/step-up-mfa.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/step-up-mfa.ts#L75) |
| <code v-pre>setupNextAuthEnv: unknown session strategy "$&#123;String(strategy)&#125;"</code> | [packages/auth/src/setup-nextauth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/setup-nextauth-env.ts#L23) |
| <code v-pre>setupNextAuthEnv: providers must contain at least one entry</code> | [packages/auth/src/setup-nextauth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/setup-nextauth-env.ts#L28) |
| <code v-pre>setupNextAuthEnv: provider "$&#123;providerKind&#125;" was not configured</code> | [packages/auth/src/setup-nextauth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/setup-nextauth-env.ts#L43) |
| <code v-pre>base32Decode: invalid character $&#123;ch&#125;</code> | [packages/auth/src/supabase-advanced/mfa.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/mfa.ts#L110) |
| <code v-pre>mapAttributes: missing or non-string email attribute (mapped from '$&#123;input.idp.attributeMap.email&#125;')</code> | [packages/auth/src/supabase-advanced/saml.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/saml.ts#L89) |
| <code v-pre>createUser: email $&#123;input.email&#125; already exists</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L151) |
| <code v-pre>enrollTotp: user $&#123;input.userId&#125; not found</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L256) |
| <code v-pre>enrollPhone: user $&#123;input.userId&#125; not found</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L280) |
| <code v-pre>issueBackupCodes: user $&#123;input.userId&#125; not found</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L297) |
| <code v-pre>challenge: factor $&#123;input.factorId&#125; not found</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L322) |
| <code v-pre>verifyChallenge: challenge $&#123;input.challengeId&#125; not found</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L340) |
| <code v-pre>verifyChallenge: challenge already verified</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L342) |
| <code v-pre>verifyChallenge: challenge expired</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L345) |
| <code v-pre>verifyChallenge: factor no longer exists</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L348) |
| <code v-pre>verifyChallenge: cannot verify challenge for backup factor</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L355) |
| <code v-pre>verifyChallenge: invalid code</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L357) |
| <code v-pre>consumeBackupCode: code invalid or already consumed</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L366) |
| <code v-pre>initiateSsoLogin: invalid email</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L386) |
| <code v-pre>initiateSsoLogin: no SAML IdP registered for domain $&#123;domain&#125;</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L391) |
| <code v-pre>mintAssertion: authn request not found</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L404) |
| <code v-pre>mintAssertion: idp no longer registered</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L406) |
| <code v-pre>exchangeAssertion: signature mismatch</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L421) |
| <code v-pre>exchangeAssertion: assertion expired</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L424) |
| <code v-pre>exchangeAssertion: no matching AuthnRequest for RelayState</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L430) |
| <code v-pre>exchangeAssertion: IdP no longer registered</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L432) |
| <code v-pre>verifySiweMessage: challenge not found</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L498) |
| <code v-pre>verifySiweMessage: nonce already consumed</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L499) |
| <code v-pre>verifySiweMessage: nonce expired</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L501) |
| <code v-pre>verifySiweMessage: signature does not match message address</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L505) |
| <code v-pre>verifySiweMessage: signature verification failed</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L514) |
| <code v-pre>setupSupabaseAdvancedEnv: sessionExpiration must be positive</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L81) |
| <code v-pre>setupSupabaseAdvancedEnv: mfaChallengeExpiration must be positive</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L85) |
| <code v-pre>setupSupabaseAdvancedEnv: siweNonceExpiration must be positive</code> | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L89) |
| <code v-pre>verifySupabaseAccessToken: malformed token (expected 3 segments)</code> | [packages/auth/src/supabase/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/jwt.ts#L53) |
| <code v-pre>verifySupabaseAccessToken: unexpected JWT header (expected HS256/JWT)</code> | [packages/auth/src/supabase/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/jwt.ts#L57) |
| <code v-pre>verifySupabaseAccessToken: signature mismatch</code> | [packages/auth/src/supabase/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/jwt.ts#L65) |
| <code v-pre>verifySupabaseAccessToken: payload is not valid JSON</code> | [packages/auth/src/supabase/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/jwt.ts#L71) |
| <code v-pre>verifySupabaseAccessToken: token expired</code> | [packages/auth/src/supabase/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/jwt.ts#L75) |
| <code v-pre>setupSupabaseAuthEnv: either email or phone is required</code> | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L113) |
| <code v-pre>setupSupabaseAuthEnv: cannot seed token, user with email $&#123;seed.userEmail&#125; not found</code> | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L200) |
| <code v-pre>signInWithPassword: invalid login credentials</code> | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L239) |
| <code v-pre>signInWithPassword: invalid login credentials</code> | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L242) |
| <code v-pre>signInWithOtp: user not found and shouldCreateUser is false</code> | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L257) |
| <code v-pre>exchangeCodeForSession: invalid or expired authorization code</code> | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L300) |
| <code v-pre>verifyOtp: invalid or expired OTP</code> | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L328) |
| <code v-pre>verifyOtp: OTP has expired</code> | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L331) |
| <code v-pre>verifyOtp: user not found after OTP consumption</code> | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L338) |
| <code v-pre>refreshSession: invalid refresh token</code> | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L355) |
| <code v-pre>refreshSession: user backing session no longer exists</code> | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L359) |
| <code v-pre>getUser: user backing session no longer exists</code> | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L388) |
| <code v-pre>getUser: session revoked</code> | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L391) |
| <code v-pre>admin.createUser: either email or phone is required</code> | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L399) |
| <code v-pre>setupSupabaseAuthEnv: sessionExpiration must be a positive number of seconds</code> | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L41) |
| <code v-pre>admin.getUserById: user $&#123;id&#125; not found</code> | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L415) |
| <code v-pre>setupSupabaseAuthEnv: otpExpiration must be a positive number of seconds</code> | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L47) |
| <code v-pre>Supabase store: user with email $&#123;patch.email&#125; already exists</code> | [packages/auth/src/supabase/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/store.ts#L100) |
| <code v-pre>Supabase store: user with phone $&#123;patch.phone&#125; already exists</code> | [packages/auth/src/supabase/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/store.ts#L107) |
| <code v-pre>Supabase store: user $&#123;id&#125; not found</code> | [packages/auth/src/supabase/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/store.ts#L118) |
| <code v-pre>Supabase store: session $&#123;id&#125; not found</code> | [packages/auth/src/supabase/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/store.ts#L159) |
| <code v-pre>Supabase store: user with email $&#123;user.email&#125; already exists</code> | [packages/auth/src/supabase/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/store.ts#L73) |
| <code v-pre>Supabase store: user with phone $&#123;user.phone&#125; already exists</code> | [packages/auth/src/supabase/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/store.ts#L76) |
| <code v-pre>Supabase store: user $&#123;id&#125; not found</code> | [packages/auth/src/supabase/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/store.ts#L95) |
| <code v-pre>credentialAssertion: no user-present authenticator can serve the requested credentials</code> | [packages/auth/src/webauthn/assertion.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/assertion.ts#L102) |
| <code v-pre>credentialAssertion: userVerification=required but authenticator does not support user verification</code> | [packages/auth/src/webauthn/assertion.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/assertion.ts#L109) |
| <code v-pre>credentialAssertion: rpId is required</code> | [packages/auth/src/webauthn/assertion.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/assertion.ts#L68) |
| <code v-pre>credentialAssertion: challenge is required</code> | [packages/auth/src/webauthn/assertion.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/assertion.ts#L71) |
| <code v-pre>allowList.length ? 'credentialAssertion: allowCredentials matched no stored credential' : 'credentialAssertion: no credentials are registered — call credentialCreation first'</code> | [packages/auth/src/webauthn/assertion.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/assertion.ts#L80) |
| <code v-pre>createVirtualAuthenticator: unknown attachment "$&#123;attachment&#125;" — expected "platform" or "cross-platform"</code> | [packages/auth/src/webauthn/authenticator.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/authenticator.ts#L35) |
| <code v-pre>createVirtualAuthenticator: unknown transport "$&#123;transport&#125;" — expected one of internal / usb / nfc / ble / hybrid</code> | [packages/auth/src/webauthn/authenticator.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/authenticator.ts#L47) |
| <code v-pre>createVirtualAuthenticator: platform attachment requires internal transport, got "$&#123;transport&#125;"</code> | [packages/auth/src/webauthn/authenticator.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/authenticator.ts#L54) |
| <code v-pre>createVirtualAuthenticator: cross-platform attachment cannot use internal transport</code> | [packages/auth/src/webauthn/authenticator.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/authenticator.ts#L59) |
| <code v-pre>credentialCreation: rp.id is required</code> | [packages/auth/src/webauthn/creation.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/creation.ts#L49) |
| <code v-pre>credentialCreation: user.id is required</code> | [packages/auth/src/webauthn/creation.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/creation.ts#L52) |
| <code v-pre>credentialCreation: challenge is required</code> | [packages/auth/src/webauthn/creation.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/creation.ts#L55) |
| <code v-pre>credentialCreation: authenticatorAttachment "$&#123;selection.authenticatorAttachment&#125;" does not match authenticator "$&#123;authenticator.attachment&#125;"</code> | [packages/auth/src/webauthn/creation.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/creation.ts#L62) |
| <code v-pre>credentialCreation: userVerification=required but authenticator does not support user verification</code> | [packages/auth/src/webauthn/creation.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/creation.ts#L67) |
| <code v-pre>credentialCreation: residentKey=required but authenticator does not have resident key storage</code> | [packages/auth/src/webauthn/creation.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/creation.ts#L73) |
| <code v-pre>credentialCreation: excludeCredentials matched existing credential "$&#123;excluded.id&#125;"</code> | [packages/auth/src/webauthn/creation.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/creation.ts#L81) |
| <code v-pre>setupWebAuthnEnv: no authenticator available — call addAuthenticator first or preseed via options.authenticators</code> | [packages/auth/src/webauthn/setup-webauthn-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/setup-webauthn-env.ts#L69) |
| <code v-pre>setupWebAuthnEnv: unknown authenticatorId "$&#123;authenticatorId&#125;"</code> | [packages/auth/src/webauthn/setup-webauthn-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/setup-webauthn-env.ts#L76) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [adapter.ts](./api/adapter) | 1 | 0 |
| [auth0/jwt.ts](./api/auth0__jwt) | 5 | 0 |
| [auth0/setup-auth0-env.ts](./api/auth0__setup-auth0-env) | 1 | 0 |
| [auth0/types.ts](./api/auth0__types) | 0 | 13 |
| [better-auth/adapter.ts](./api/better-auth__adapter) | 1 | 0 |
| [better-auth/providers.ts](./api/better-auth__providers) | 3 | 0 |
| [better-auth/setup-better-auth-env.ts](./api/better-auth__setup-better-auth-env) | 1 | 0 |
| [better-auth/totp.ts](./api/better-auth__totp) | 3 | 0 |
| [better-auth/types.ts](./api/better-auth__types) | 0 | 15 |
| [clerk/jwt.ts](./api/clerk__jwt) | 2 | 0 |
| [clerk/setup-clerk-env.ts](./api/clerk__setup-clerk-env) | 1 | 0 |
| [clerk/types.ts](./api/clerk__types) | 0 | 11 |
| [index.ts](./api/index) | 33 | 3 |
| [lucia/adapter.ts](./api/lucia__adapter) | 1 | 0 |
| [lucia/password.ts](./api/lucia__password) | 2 | 0 |
| [lucia/providers.ts](./api/lucia__providers) | 3 | 0 |
| [lucia/session.ts](./api/lucia__session) | 4 | 0 |
| [lucia/setup-lucia-env.ts](./api/lucia__setup-lucia-env) | 1 | 0 |
| [lucia/types.ts](./api/lucia__types) | 0 | 10 |
| [oauth21/authorization-server.ts](./api/oauth21__authorization-server) | 1 | 0 |
| [oauth21/dpop.ts](./api/oauth21__dpop) | 5 | 0 |
| [oauth21/pkce.ts](./api/oauth21__pkce) | 5 | 0 |
| [oauth21/refresh-rotation.ts](./api/oauth21__refresh-rotation) | 4 | 0 |
| [oauth21/setup-oauth21-env.ts](./api/oauth21__setup-oauth21-env) | 2 | 0 |
| [oauth21/types.ts](./api/oauth21__types) | 0 | 19 |
| [oidc/dcr.ts](./api/oidc__dcr) | 4 | 0 |
| [oidc/discovery.ts](./api/oidc__discovery) | 1 | 0 |
| [oidc/id-token.ts](./api/oidc__id-token) | 4 | 0 |
| [oidc/jwks.ts](./api/oidc__jwks) | 2 | 0 |
| [oidc/setup-oidc-env.ts](./api/oidc__setup-oidc-env) | 2 | 0 |
| [oidc/types.ts](./api/oidc__types) | 0 | 18 |
| [passkey/caBLE/ble-handshake.ts](./api/passkey__caBLE__ble-handshake) | 1 | 0 |
| [passkey/caBLE/hybrid-transport.ts](./api/passkey__caBLE__hybrid-transport) | 3 | 0 |
| [passkey/caBLE/qr-code.ts](./api/passkey__caBLE__qr-code) | 2 | 0 |
| [passkey/caBLE/types.ts](./api/passkey__caBLE__types) | 0 | 8 |
| [passkey/caBLE/websocket-tunnel.ts](./api/passkey__caBLE__websocket-tunnel) | 1 | 0 |
| [passkey/platform.ts](./api/passkey__platform) | 1 | 0 |
| [passkey/roaming.ts](./api/passkey__roaming) | 1 | 0 |
| [passkey/setup-passkey-env.ts](./api/passkey__setup-passkey-env) | 2 | 0 |
| [passkey/sync-fabric.ts](./api/passkey__sync-fabric) | 1 | 0 |
| [passkey/types.ts](./api/passkey__types) | 0 | 12 |
| [providers.ts](./api/providers) | 4 | 0 |
| [semantics/types.ts](./api/semantics__types) | 0 | 2 |
| [session.ts](./api/session) | 2 | 0 |
| [setup-nextauth-env.ts](./api/setup-nextauth-env) | 1 | 0 |
| [supabase/jwt.ts](./api/supabase__jwt) | 4 | 0 |
| [supabase/setup-supabase-auth-env.ts](./api/supabase__setup-supabase-auth-env) | 1 | 0 |
| [supabase/types.ts](./api/supabase__types) | 0 | 9 |
| [supabase-advanced/setup-supabase-advanced-env.ts](./api/supabase-advanced__setup-supabase-advanced-env) | 1 | 0 |
| [supabase-advanced/types.ts](./api/supabase-advanced__types) | 0 | 17 |
| [types.ts](./api/types) | 0 | 11 |
| [webauthn/authenticator.ts](./api/webauthn__authenticator) | 1 | 0 |
| [webauthn/setup-webauthn-env.ts](./api/webauthn__setup-webauthn-env) | 2 | 0 |
| [webauthn/types.ts](./api/webauthn__types) | 0 | 15 |

<!-- kiwa-public-api:end -->
