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
| `updateUser: unknown id ${patch.id}` | [packages/auth/src/adapter.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/adapter.ts#L56) |
| `verifyAuth0AccessToken: audience mismatch (expected ${expected.audience}, got ${JSON.stringify(claims.aud)})` | [packages/auth/src/auth0/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L103) |
| 'verifyAuth0Jwt: malformed token (expected 3 segments)' | [packages/auth/src/auth0/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L113) |
| 'verifyAuth0Jwt: unexpected JWT header (expected HS256/JWT)' | [packages/auth/src/auth0/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L117) |
| 'verifyAuth0Jwt: signature mismatch' | [packages/auth/src/auth0/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L123) |
| 'verifyAuth0Jwt: payload is not valid JSON' | [packages/auth/src/auth0/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L129) |
| 'verifyAuth0Jwt: token expired' | [packages/auth/src/auth0/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L133) |
| `verifyAuth0IdToken: issuer mismatch (expected ${expected.issuer}, got ${claims.iss})` | [packages/auth/src/auth0/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L71) |
| `verifyAuth0IdToken: audience mismatch (expected ${expected.audience}, got ${String(claims.aud)})` | [packages/auth/src/auth0/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L76) |
| `verifyAuth0AccessToken: issuer mismatch (expected ${expected.issuer}, got ${claims.iss})` | [packages/auth/src/auth0/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L95) |
| `Auth0 users.get: not found ${userId}` | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L320) |
| `Auth0 authenticate.signIn: unknown user email ${input.email}` | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L349) |
| `Auth0 authenticate.signIn: user ${user.user_id} is blocked` | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L352) |
| `Auth0 authenticate.signIn: no password on file for ${user.user_id}` | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L361) |
| `Auth0 authenticate.signIn: incorrect password for ${input.email}` | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L366) |
| `Auth0 authenticate.signIn: access denied — ${acted.deniedReason}` | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L393) |
| `Auth0 authenticate.signUp: user with email ${input.email} already exists` | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L420) |
| `Auth0 authenticate.signUp: registration denied — ${preActed.deniedReason}` | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L451) |
| 'setupAuth0Env: tokenExpiration must be a positive number of seconds' | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L56) |
| `Auth0 setAppMetadata: unknown user id ${userId}` | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L563) |
| `setupAuth0Env: email must be a valid email (got ${input.email})` | [packages/auth/src/auth0/setup-auth0-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L84) |
| `Auth0 store: user with email ${user.email} already exists` | [packages/auth/src/auth0/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/store.ts#L43) |
| `Auth0 store: unknown user id ${userId}` | [packages/auth/src/auth0/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/store.ts#L59) |
| `createUser: email already registered (${input.email})` | [packages/auth/src/better-auth/adapter.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/adapter.ts#L54) |
| `updateUser: unknown id ${patch.id}` | [packages/auth/src/better-auth/adapter.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/adapter.ts#L80) |
| 'hashPassword: password must not be empty' | [packages/auth/src/better-auth/password.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/password.ts#L29) |
| `Unknown Better Auth provider kind: ${String(kind)}` | [packages/auth/src/better-auth/providers.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/providers.ts#L48) |
| `setupBetterAuthEnv: provider "${provider}" was not configured` | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L103) |
| 'sendMagicLink: email is required' | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L133) |
| 'consumeMagicLink: invalid or expired token' | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L147) |
| `enrollTwoFactor: unknown user id ${input.userId}` | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L169) |
| 'verifyTwoFactorCode: user is not enrolled in 2FA' | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L179) |
| `createOrganization: unknown user id ${input.userId}` | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L205) |
| `inviteToOrganization: unknown organization id ${input.organizationId}` | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L228) |
| `inviteToOrganization: unknown user id ${input.userId}` | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L234) |
| `registerPasskey: unknown user id ${input.userId}` | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L250) |
| 'setupBetterAuthEnv: providers must contain at least one entry' | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L42) |
| 'setupBetterAuthEnv: sessionExpiration must be a positive number of seconds' | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L46) |
| 'setupBetterAuthEnv: verificationExpiration must be a positive number of seconds' | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L53) |
| `setupBetterAuthEnv: ${method} requires the "${kind}" plugin to be enabled` | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L66) |
| 'signUpWithPassword: email is required' | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L74) |
| 'signInWithPassword: invalid email or password' | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L89) |
| 'signInWithPassword: invalid email or password' | [packages/auth/src/better-auth/setup-better-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L92) |
| 'verifyClerkJwt: malformed token (expected 3 segments)' | [packages/auth/src/clerk/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/jwt.ts#L52) |
| 'verifyClerkJwt: unexpected JWT header (expected HS256/JWT)' | [packages/auth/src/clerk/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/jwt.ts#L56) |
| 'verifyClerkJwt: signature mismatch' | [packages/auth/src/clerk/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/jwt.ts#L62) |
| 'verifyClerkJwt: payload is not valid JSON' | [packages/auth/src/clerk/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/jwt.ts#L68) |
| 'verifyClerkJwt: token expired' | [packages/auth/src/clerk/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/jwt.ts#L72) |
| `setupClerkEnv: unknown user id ${input.userId}` | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L140) |
| `setupClerkEnv: unknown organization slug ${input.organizationSlug}` | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L146) |
| `setupClerkEnv: cannot seed organization, unknown user email ${seed.createdByEmail}` | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L183) |
| `setupClerkEnv: cannot seed token, unknown user email ${seed.userEmail}` | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L210) |
| `Clerk users.getUser: not found ${id}` | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L232) |
| `Clerk sessions.getSession: not found ${id}` | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L267) |
| `Clerk sessions.revokeSession: not found ${id}` | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L274) |
| `Clerk organizations.createOrganization: unknown creator id ${input.createdBy}` | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L287) |
| `Clerk organizations.getOrganization: not found ${id}` | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L314) |
| `Clerk organizations.createMembership: unknown organization ${input.organizationId}` | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L324) |
| `Clerk organizations.createMembership: unknown user ${input.userId}` | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L330) |
| 'setupClerkEnv: sessionExpiration must be a positive number of seconds' | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L35) |
| `Clerk organizations.updateMembership: not found ${input.organizationId}/${input.userId}` | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L355) |
| `verifyToken: session ${claims.sid} not found` | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L375) |
| `verifyToken: session ${claims.sid} status is ${session.status}` | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L380) |
| `verifyToken: session ${claims.sid} expired` | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L385) |
| `verifyToken: user ${claims.sub} not found` | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L389) |
| `setupClerkEnv.signIn: unknown user email ${input.email}` | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L400) |
| `setupClerkEnv: cannot issue token, organization slug not found: ${input.organizationSlug}` | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L58) |
| `setupClerkEnv: cannot issue token, user ${input.user.id} is not a member of org ${org.id}` | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L64) |
| `setupClerkEnv: primaryEmailAddress must be a valid email (got ${input.primaryEmailAddress})` | [packages/auth/src/clerk/setup-clerk-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L98) |
| `Clerk store: unknown session id ${id}` | [packages/auth/src/clerk/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/store.ts#L132) |
| `Clerk store: organization with slug ${org.slug} already exists` | [packages/auth/src/clerk/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/store.ts#L142) |
| `Clerk store: user ${membership.userId} already a member of org ${membership.organizationId}` | [packages/auth/src/clerk/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/store.ts#L157) |
| `Clerk store: membership ${orgId}/${userId} not found` | [packages/auth/src/clerk/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/store.ts#L171) |
| `Clerk store: user with email ${user.primaryEmailAddress} already exists` | [packages/auth/src/clerk/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/store.ts#L79) |
| `Clerk store: unknown user id ${id}` | [packages/auth/src/clerk/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/store.ts#L95) |
| `createUser: email already registered (${input.email})` | [packages/auth/src/lucia/adapter.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/adapter.ts#L34) |
| `updateUser: unknown id ${patch.id}` | [packages/auth/src/lucia/adapter.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/adapter.ts#L55) |
| 'hashPassword: password must not be empty' | [packages/auth/src/lucia/password.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/password.ts#L40) |
| `Unknown Lucia provider kind: ${String(kind)}` | [packages/auth/src/lucia/providers.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/providers.ts#L48) |
| 'setupLuciaEnv: providers must contain at least one entry' | [packages/auth/src/lucia/setup-lucia-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/setup-lucia-env.ts#L35) |
| 'setupLuciaEnv: sessionExpiration must be a positive number of seconds' | [packages/auth/src/lucia/setup-lucia-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/setup-lucia-env.ts#L39) |
| 'signUpWithPassword: email is required' | [packages/auth/src/lucia/setup-lucia-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/setup-lucia-env.ts#L47) |
| 'signInWithPassword: invalid email or password' | [packages/auth/src/lucia/setup-lucia-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/setup-lucia-env.ts#L57) |
| 'signInWithPassword: invalid email or password' | [packages/auth/src/lucia/setup-lucia-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/setup-lucia-env.ts#L60) |
| `setupLuciaEnv: provider "${provider}" was not configured` | [packages/auth/src/lucia/setup-lucia-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/setup-lucia-env.ts#L71) |
| `authorization-server: redirect_uri "${redirectUri}" not registered for client "${client.clientId}"` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L105) |
| `authorization-server: user "${user.subject}" not entitled to scope "${scope}"` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L131) |
| `authorization-server: client "${client.clientId}" not registered for scope "${scope}"` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L136) |
| `authorize: response_type "${request.responseType}" refused — OAuth 2.1 requires "code" (implicit + hybrid dropped by RFC 9700)` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L149) |
| 'authorize: code_challenge_method "plain" refused — RFC 9700 §2.1.1 requires S256' | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L154) |
| `authorize: unknown code_challenge_method "${request.codeChallengeMethod}" — expected S256` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L159) |
| 'authorize: code_challenge missing — PKCE always mandatory in OAuth 2.1' | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L164) |
| 'authorize: state parameter missing — required for CSRF defence' | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L169) |
| `token: grant_type "${grantType}" refused — dropped by OAuth 2.1 / RFC 9700` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L203) |
| `token: unknown grant_type "${grantType}"` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L208) |
| `token: unknown authorization code "${request.code}"` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L222) |
| `token: authorization code "${request.code}" already exchanged — replay refused` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L225) |
| `token: client_id mismatch — code issued to "${record.clientId}", exchanged by "${request.clientId}"` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L230) |
| `token: redirect_uri mismatch — code recorded "${record.redirectUri}", exchanged with "${request.redirectUri}"` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L235) |
| 'token: PKCE code_verifier does not match recorded code_challenge' | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L246) |
| `token: refresh_token "${request.refreshToken}" has been rotated — reuse refused (RFC 9700 §2.2 rotation family compromise)` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L285) |
| `token: unknown refresh_token "${request.refreshToken}"` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L289) |
| `token: refresh_token "${request.refreshToken}" is revoked — refresh refused` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L292) |
| `token: client_id mismatch — refresh_token issued to "${existing.clientId}", used by "${request.clientId}"` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L297) |
| `token: refresh_token "${request.refreshToken}" is expired` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L302) |
| 'token: refresh_token is DPoP-bound but no DPoP proof was supplied' | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L309) |
| 'token: DPoP JWK thumbprint mismatch — refresh_token bound to a different key' | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L314) |
| `token: refresh scope "${scope}" not in original grant "${existing.scope}"` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L328) |
| `revoke: token belongs to client "${access.clientId}", revocation attempted by "${clientId}"` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L393) |
| `revoke: refresh_token belongs to client "${refresh.clientId}", revocation attempted by "${clientId}"` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L403) |
| `registerClient: client "${client.clientId}" already registered` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L67) |
| `registerUser: user "${user.subject}" already registered` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L76) |
| `authorization-server: unknown client_id "${clientId}"` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L86) |
| `authorization-server: unknown subject "${subject}" — preseed via options.users or call registerUser` | [packages/auth/src/oauth21/authorization-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L96) |
| `parseDpopProof: expected compact JWT with 3 segments, got ${parts.length}` | [packages/auth/src/oauth21/dpop.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L112) |
| `parseDpopProof: expected typ=dpop+jwt, got typ="${headerRaw?.typ}"` | [packages/auth/src/oauth21/dpop.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L120) |
| `parseDpopProof: expected alg=ES256, got alg="${headerRaw?.alg}"` | [packages/auth/src/oauth21/dpop.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L125) |
| `parseDpopProof: expected EC P-256 jwk in header, got kty="${headerRaw?.jwk?.kty}"` | [packages/auth/src/oauth21/dpop.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L130) |
| `verifyDpopProof: htm mismatch — expected "${options.expectedHtm.toUpperCase()}", got "${parsed.payload.htm}"` | [packages/auth/src/oauth21/dpop.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L174) |
| `verifyDpopProof: htu mismatch — expected "${options.expectedHtu}", got "${parsed.payload.htu}"` | [packages/auth/src/oauth21/dpop.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L179) |
| `verifyDpopProof: iat outside allowed skew (delta=${iatDelta}s, allowed=${options.iatSkewSec}s)` | [packages/auth/src/oauth21/dpop.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L186) |
| 'verifyDpopProof: proof missing jti' | [packages/auth/src/oauth21/dpop.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L191) |
| `verifyDpopProof: jti "${parsed.payload.jti}" replay detected` | [packages/auth/src/oauth21/dpop.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L194) |
| 'deriveCodeChallenge: PKCE method "plain" is forbidden by RFC 9700 — use S256' | [packages/auth/src/oauth21/pkce.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/pkce.ts#L63) |
| `deriveCodeChallenge: unknown PKCE method "${method}" — expected S256` | [packages/auth/src/oauth21/pkce.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/pkce.ts#L68) |
| `deriveCodeChallenge: code verifier must be 43-128 chars (got ${verifier.length})` | [packages/auth/src/oauth21/pkce.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/pkce.ts#L73) |
| `rotateRefreshToken: refresh token "${previous.token}" is already revoked — rotation not permitted (RFC 9700 §2.2 replay defence)` | [packages/auth/src/oauth21/refresh-rotation.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/refresh-rotation.ts#L101) |
| 'dynamicClientRegistration: `redirect_uris` must be a non-empty array (RFC 7591 §2)' | [packages/auth/src/oidc/dcr.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L182) |
| `dynamicClientRegistration: every redirect_uri must be a non-empty string (got "${uri}")` | [packages/auth/src/oidc/dcr.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L188) |
| `dynamicClientRegistration: redirect_uri "${uri}" is not a valid URL` | [packages/auth/src/oidc/dcr.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L197) |
| `dynamicClientRegistration: grant_type "${grant}" refused — OAuth 2.1 allowlist is ${[...ALLOWED_GRANT_TYPES].join(', ')}` | [packages/auth/src/oidc/dcr.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L206) |
| `dynamicClientRegistration: response_type "${responseType}" refused — OIDC Discovery advertises "code" only` | [packages/auth/src/oidc/dcr.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L215) |
| `dynamicClientRegistration: token_endpoint_auth_method "${authMethod}" refused — advertised methods are ${[...ALLOWED_AUTH_METHODS].join(', ')}` | [packages/auth/src/oidc/dcr.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L223) |
| 'dynamicClientRegistration: software_statement supplied but no trust anchor configured on the AS' | [packages/auth/src/oidc/dcr.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L246) |
| `dynamicClientRegistration: software_statement parse failed — ${(err as Error).message}` | [packages/auth/src/oidc/dcr.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L254) |
| 'dynamicClientRegistration: software_statement signature verification failed' | [packages/auth/src/oidc/dcr.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L269) |
| `software_statement: expected 3 dot-separated segments, got ${parts.length}` | [packages/auth/src/oidc/dcr.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L92) |
| `createDiscoveryEndpoint: metadata.issuer "${metadata.issuer}" must match endpoint issuer "${issuer}" (OIDC Discovery §4.3)` | [packages/auth/src/oidc/discovery.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/discovery.ts#L82) |
| 'performBLEHandshake: sessionId is empty — cannot correlate BLE advertisement with QR payload' | [packages/auth/src/passkey/caBLE/ble-handshake.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/ble-handshake.ts#L47) |
| `migrateCredential: cannot migrate credential over unestablished tunnel "${tunnel.sessionId}"` | [packages/auth/src/passkey/caBLE/hybrid-transport.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/hybrid-transport.ts#L35) |
| `migrateCredential: cannot migrate credential over closed tunnel "${tunnel.sessionId}"` | [packages/auth/src/passkey/caBLE/hybrid-transport.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/hybrid-transport.ts#L40) |
| `performSignatureRoundtrip: cannot sign over unestablished tunnel "${tunnel.sessionId}"` | [packages/auth/src/passkey/caBLE/hybrid-transport.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/hybrid-transport.ts#L72) |
| `performSignatureRoundtrip: cannot sign over closed tunnel "${tunnel.sessionId}"` | [packages/auth/src/passkey/caBLE/hybrid-transport.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/hybrid-transport.ts#L77) |
| 'performSignatureRoundtrip: challenge is empty — cannot produce a WebAuthn L3 §7.2 assertion signature over an empty challenge' | [packages/auth/src/passkey/caBLE/hybrid-transport.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/hybrid-transport.ts#L82) |
| 'generateCaBLEQRCode: tunnelServerHint is empty — cannot advertise a hybrid transport ceremony without a tunnel endpoint' | [packages/auth/src/passkey/caBLE/qr-code.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/qr-code.ts#L32) |
| 'generateCaBLEQRCode: nonce is empty — cannot derive a replay-safe handshake without a nonce' | [packages/auth/src/passkey/caBLE/qr-code.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/qr-code.ts#L37) |
| 'establishWebSocketTunnel: BLE handshake not verified — real caBLE refuses to open the tunnel when the shared secret cannot be derived by both sides' | [packages/auth/src/passkey/caBLE/websocket-tunnel.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/websocket-tunnel.ts#L30) |
| `establishWebSocketTunnel: session id mismatch — QR "${qr.sessionId}" vs handshake "${handshake.sessionId}"` | [packages/auth/src/passkey/caBLE/websocket-tunnel.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/websocket-tunnel.ts#L35) |
| `establishWebSocketTunnel: cannot send on closed tunnel "${qr.sessionId}"` | [packages/auth/src/passkey/caBLE/websocket-tunnel.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/websocket-tunnel.ts#L47) |
| `establishWebSocketTunnel: cannot drain closed tunnel "${qr.sessionId}"` | [packages/auth/src/passkey/caBLE/websocket-tunnel.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/websocket-tunnel.ts#L55) |
| `requireFabric: sync fabric vendor "${vendor}" is not registered on this env` | [packages/auth/src/passkey/credential-sync.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/credential-sync.ts#L113) |
| `backupCredential: credential "${credential.credentialId}" is not backup-eligible — non-discoverable credentials cannot enter a sync fabric` | [packages/auth/src/passkey/credential-sync.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/credential-sync.ts#L26) |
| 'createPlatformAuthenticator: passkeys require hasResidentKey=true — a non-discoverable platform credential is not a passkey' | [packages/auth/src/passkey/platform.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/platform.ts#L21) |
| `createPlatformAuthenticator: unknown biometric "${biometric}" — expected touch-id / face-id / windows-hello / android-biometric` | [packages/auth/src/passkey/platform.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/platform.ts#L32) |
| `createRoamingAuthenticator: unknown roaming kind "${kind}" — expected security-key or phone` | [packages/auth/src/passkey/roaming.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/roaming.ts#L22) |
| `setupPasskeyEnv: unknown deviceId "${deviceId}" — call addDevice first or preseed via options.devices` | [packages/auth/src/passkey/setup-passkey-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L112) |
| `setupPasskeyEnv: credential "${credentialId}" is not registered on any device` | [packages/auth/src/passkey/setup-passkey-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L134) |
| `setupPasskeyEnv: passkey metadata missing for credential "${credentialId}" — was it minted through createPasskey?` | [packages/auth/src/passkey/setup-passkey-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L140) |
| `setupPasskeyEnv: device "${deviceId}" is already registered` | [packages/auth/src/passkey/setup-passkey-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L156) |
| `setupPasskeyEnv: device "${device.deviceId}" has no authenticator — call addPlatformAuthenticator or addRoamingAuthenticator first` | [packages/auth/src/passkey/setup-passkey-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L194) |
| `setupPasskeyEnv: authenticator "${authenticatorId}" is not registered on device "${device.deviceId}"` | [packages/auth/src/passkey/setup-passkey-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L203) |
| `restoreCredential: fabric "${vendor}" does not hold credential "${credentialId}" — call backupCredential first` | [packages/auth/src/passkey/setup-passkey-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L327) |
| `restoreCredential: credential "${credentialId}" belongs to user "${blob.userId}" — user "${userId}" cannot restore it` | [packages/auth/src/passkey/setup-passkey-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L332) |
| `restoreCredential: device "${targetDeviceId}" has no authenticator to host the restored credential` | [packages/auth/src/passkey/setup-passkey-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L337) |
| `createSyncFabric: unknown vendor "${vendor}" — expected icloud-keychain or google-password-manager` | [packages/auth/src/passkey/sync-fabric.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/sync-fabric.ts#L16) |
| 'Email provider requires an email address for the magic link' | [packages/auth/src/providers.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/providers.ts#L52) |
| `Unknown provider kind: ${String(kind)}` | [packages/auth/src/providers.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/providers.ts#L67) |
| 'extendSession: session in revocation window, cannot extend' | [packages/auth/src/semantics/auth-continuity.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/auth-continuity.ts#L102) |
| 'seamlessReauth: session in revocation window, cannot reauth' | [packages/auth/src/semantics/auth-continuity.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/auth-continuity.ts#L52) |
| 'rotateRefresh: session in revocation window, cannot rotate' | [packages/auth/src/semantics/auth-continuity.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/auth-continuity.ts#L75) |
| 'detectAbuse: no attempts recorded' | [packages/auth/src/semantics/auth-telemetry.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/auth-telemetry.ts#L117) |
| 'updateSuccessRate: no attempts recorded' | [packages/auth/src/semantics/auth-telemetry.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/auth-telemetry.ts#L67) |
| `markTimeout: session is ${session.state}, expected hint-shown` | [packages/auth/src/semantics/conditional-ui.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/conditional-ui.ts#L109) |
| `markTimeout: nowMs ${input.nowMs} < timeoutMs ${session.timeoutMs}` | [packages/auth/src/semantics/conditional-ui.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/conditional-ui.ts#L112) |
| `showHint: session is ${session.state}, expected idle` | [packages/auth/src/semantics/conditional-ui.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/conditional-ui.ts#L42) |
| `selectAutofill: session is ${session.state}, expected hint-shown` | [packages/auth/src/semantics/conditional-ui.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/conditional-ui.ts#L61) |
| `triggerFallback: session is ${session.state}, expected hint-shown` | [packages/auth/src/semantics/conditional-ui.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/conditional-ui.ts#L85) |
| `continuous-auth: cannot complete step-up from state "${input.session.state}" (must be step-up-required)` | [packages/auth/src/semantics/continuous-auth.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/continuous-auth.ts#L115) |
| `completeHandshake: session is ${session.state}, expected tunnel-opened` | [packages/auth/src/semantics/cross-device-flow.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/cross-device-flow.ts#L110) |
| `generateQr: session is ${session.state}, expected idle` | [packages/auth/src/semantics/cross-device-flow.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/cross-device-flow.ts#L44) |
| `pairBle: session is ${session.state}, expected qr-generated` | [packages/auth/src/semantics/cross-device-flow.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/cross-device-flow.ts#L64) |
| `openTunnel: session is ${session.state}, expected ble-paired` | [packages/auth/src/semantics/cross-device-flow.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/cross-device-flow.ts#L88) |
| 'confirmCredProps: session is idle, bind first' | [packages/auth/src/semantics/device-bound-passkey.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/device-bound-passkey.ts#L111) |
| `bindToDevice: session is ${session.state}, expected idle` | [packages/auth/src/semantics/device-bound-passkey.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/device-bound-passkey.ts#L44) |
| `verifySyncFabric: session is ${session.state}, expected device-bound` | [packages/auth/src/semantics/device-bound-passkey.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/device-bound-passkey.ts#L64) |
| 'verifySyncFabric: no sync fabric configured' | [packages/auth/src/semantics/device-bound-passkey.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/device-bound-passkey.ts#L67) |
| `migrateCredential: session is ${session.state}, cannot migrate` | [packages/auth/src/semantics/device-bound-passkey.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/device-bound-passkey.ts#L89) |
| `applyPolicy: session is ${session.state}, cannot apply policy` | [packages/auth/src/semantics/risk-based-auth.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/risk-based-auth.ts#L106) |
| `evaluateScore: session is ${session.state}, expected idle` | [packages/auth/src/semantics/risk-based-auth.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/risk-based-auth.ts#L52) |
| `injectChallenge: session is ${session.state}, expected evaluated` | [packages/auth/src/semantics/risk-based-auth.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/risk-based-auth.ts#L81) |
| `injectChallenge: score ${session.score} not in challenge range [${session.allowThreshold}, ${session.blockThreshold})` | [packages/auth/src/semantics/risk-based-auth.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/risk-based-auth.ts#L84) |
| `reportConcurrentSession: count ${input.concurrentSessionCount} must be > 1` | [packages/auth/src/semantics/session-hijack-detect.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/session-hijack-detect.ts#L88) |
| `satisfyAal3: session is ${session.state}, expected escalation-requested` | [packages/auth/src/semantics/step-up-mfa.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/step-up-mfa.ts#L100) |
| `requestEscalation: requiredAal ${input.requiredAal} not higher than currentAal ${session.currentAal}` | [packages/auth/src/semantics/step-up-mfa.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/step-up-mfa.ts#L46) |
| `satisfyAal2: session is ${session.state}, expected escalation-requested` | [packages/auth/src/semantics/step-up-mfa.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/step-up-mfa.ts#L72) |
| 'satisfyAal2: requiredAal is AAL3, cannot satisfy with AAL2' | [packages/auth/src/semantics/step-up-mfa.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/step-up-mfa.ts#L75) |
| `setupNextAuthEnv: unknown session strategy "${String(strategy)}"` | [packages/auth/src/setup-nextauth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/setup-nextauth-env.ts#L23) |
| 'setupNextAuthEnv: providers must contain at least one entry' | [packages/auth/src/setup-nextauth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/setup-nextauth-env.ts#L28) |
| `setupNextAuthEnv: provider "${providerKind}" was not configured` | [packages/auth/src/setup-nextauth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/setup-nextauth-env.ts#L43) |
| `base32Decode: invalid character ${ch}` | [packages/auth/src/supabase-advanced/mfa.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/mfa.ts#L110) |
| `mapAttributes: missing or non-string email attribute (mapped from '${input.idp.attributeMap.email}')` | [packages/auth/src/supabase-advanced/saml.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/saml.ts#L89) |
| `createUser: email ${input.email} already exists` | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L151) |
| `enrollTotp: user ${input.userId} not found` | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L256) |
| `enrollPhone: user ${input.userId} not found` | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L280) |
| `issueBackupCodes: user ${input.userId} not found` | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L297) |
| `challenge: factor ${input.factorId} not found` | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L322) |
| `verifyChallenge: challenge ${input.challengeId} not found` | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L340) |
| 'verifyChallenge: challenge already verified' | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L342) |
| 'verifyChallenge: challenge expired' | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L345) |
| 'verifyChallenge: factor no longer exists' | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L348) |
| 'verifyChallenge: cannot verify challenge for backup factor' | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L355) |
| 'verifyChallenge: invalid code' | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L357) |
| 'consumeBackupCode: code invalid or already consumed' | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L366) |
| 'initiateSsoLogin: invalid email' | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L386) |
| `initiateSsoLogin: no SAML IdP registered for domain ${domain}` | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L391) |
| 'mintAssertion: authn request not found' | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L404) |
| 'mintAssertion: idp no longer registered' | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L406) |
| 'exchangeAssertion: signature mismatch' | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L421) |
| 'exchangeAssertion: assertion expired' | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L424) |
| 'exchangeAssertion: no matching AuthnRequest for RelayState' | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L430) |
| 'exchangeAssertion: IdP no longer registered' | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L432) |
| 'verifySiweMessage: challenge not found' | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L498) |
| 'verifySiweMessage: nonce already consumed' | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L499) |
| 'verifySiweMessage: nonce expired' | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L501) |
| 'verifySiweMessage: signature does not match message address' | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L505) |
| 'verifySiweMessage: signature verification failed' | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L514) |
| 'setupSupabaseAdvancedEnv: sessionExpiration must be positive' | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L81) |
| 'setupSupabaseAdvancedEnv: mfaChallengeExpiration must be positive' | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L85) |
| 'setupSupabaseAdvancedEnv: siweNonceExpiration must be positive' | [packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L89) |
| 'verifySupabaseAccessToken: malformed token (expected 3 segments)' | [packages/auth/src/supabase/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/jwt.ts#L53) |
| 'verifySupabaseAccessToken: unexpected JWT header (expected HS256/JWT)' | [packages/auth/src/supabase/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/jwt.ts#L57) |
| 'verifySupabaseAccessToken: signature mismatch' | [packages/auth/src/supabase/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/jwt.ts#L65) |
| 'verifySupabaseAccessToken: payload is not valid JSON' | [packages/auth/src/supabase/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/jwt.ts#L71) |
| 'verifySupabaseAccessToken: token expired' | [packages/auth/src/supabase/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/jwt.ts#L75) |
| 'setupSupabaseAuthEnv: either email or phone is required' | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L113) |
| `setupSupabaseAuthEnv: cannot seed token, user with email ${seed.userEmail} not found` | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L200) |
| 'signInWithPassword: invalid login credentials' | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L239) |
| 'signInWithPassword: invalid login credentials' | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L242) |
| 'signInWithOtp: user not found and shouldCreateUser is false' | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L257) |
| 'exchangeCodeForSession: invalid or expired authorization code' | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L300) |
| 'verifyOtp: invalid or expired OTP' | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L328) |
| 'verifyOtp: OTP has expired' | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L331) |
| 'verifyOtp: user not found after OTP consumption' | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L338) |
| 'refreshSession: invalid refresh token' | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L355) |
| 'refreshSession: user backing session no longer exists' | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L359) |
| 'getUser: user backing session no longer exists' | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L388) |
| 'getUser: session revoked' | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L391) |
| 'admin.createUser: either email or phone is required' | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L399) |
| 'setupSupabaseAuthEnv: sessionExpiration must be a positive number of seconds' | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L41) |
| `admin.getUserById: user ${id} not found` | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L415) |
| 'setupSupabaseAuthEnv: otpExpiration must be a positive number of seconds' | [packages/auth/src/supabase/setup-supabase-auth-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L47) |
| `Supabase store: user with email ${patch.email} already exists` | [packages/auth/src/supabase/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/store.ts#L100) |
| `Supabase store: user with phone ${patch.phone} already exists` | [packages/auth/src/supabase/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/store.ts#L107) |
| `Supabase store: user ${id} not found` | [packages/auth/src/supabase/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/store.ts#L118) |
| `Supabase store: session ${id} not found` | [packages/auth/src/supabase/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/store.ts#L159) |
| `Supabase store: user with email ${user.email} already exists` | [packages/auth/src/supabase/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/store.ts#L73) |
| `Supabase store: user with phone ${user.phone} already exists` | [packages/auth/src/supabase/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/store.ts#L76) |
| `Supabase store: user ${id} not found` | [packages/auth/src/supabase/store.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/store.ts#L95) |
| 'credentialAssertion: no user-present authenticator can serve the requested credentials' | [packages/auth/src/webauthn/assertion.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/assertion.ts#L102) |
| 'credentialAssertion: userVerification=required but authenticator does not support user verification' | [packages/auth/src/webauthn/assertion.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/assertion.ts#L109) |
| 'credentialAssertion: rpId is required' | [packages/auth/src/webauthn/assertion.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/assertion.ts#L68) |
| 'credentialAssertion: challenge is required' | [packages/auth/src/webauthn/assertion.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/assertion.ts#L71) |
| allowList.length ? 'credentialAssertion: allowCredentials matched no stored credential' : 'credentialAssertion: no credentials are registered — call credentialCreation first' | [packages/auth/src/webauthn/assertion.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/assertion.ts#L80) |
| `createVirtualAuthenticator: unknown attachment "${attachment}" — expected "platform" or "cross-platform"` | [packages/auth/src/webauthn/authenticator.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/authenticator.ts#L35) |
| `createVirtualAuthenticator: unknown transport "${transport}" — expected one of internal / usb / nfc / ble / hybrid` | [packages/auth/src/webauthn/authenticator.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/authenticator.ts#L47) |
| `createVirtualAuthenticator: platform attachment requires internal transport, got "${transport}"` | [packages/auth/src/webauthn/authenticator.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/authenticator.ts#L54) |
| 'createVirtualAuthenticator: cross-platform attachment cannot use internal transport' | [packages/auth/src/webauthn/authenticator.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/authenticator.ts#L59) |
| 'credentialCreation: rp.id is required' | [packages/auth/src/webauthn/creation.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/creation.ts#L49) |
| 'credentialCreation: user.id is required' | [packages/auth/src/webauthn/creation.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/creation.ts#L52) |
| 'credentialCreation: challenge is required' | [packages/auth/src/webauthn/creation.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/creation.ts#L55) |
| `credentialCreation: authenticatorAttachment "${selection.authenticatorAttachment}" does not match authenticator "${authenticator.attachment}"` | [packages/auth/src/webauthn/creation.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/creation.ts#L62) |
| 'credentialCreation: userVerification=required but authenticator does not support user verification' | [packages/auth/src/webauthn/creation.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/creation.ts#L67) |
| 'credentialCreation: residentKey=required but authenticator does not have resident key storage' | [packages/auth/src/webauthn/creation.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/creation.ts#L73) |
| `credentialCreation: excludeCredentials matched existing credential "${excluded.id}"` | [packages/auth/src/webauthn/creation.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/creation.ts#L81) |
| 'setupWebAuthnEnv: no authenticator available — call addAuthenticator first or preseed via options.authenticators' | [packages/auth/src/webauthn/setup-webauthn-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/setup-webauthn-env.ts#L69) |
| `setupWebAuthnEnv: unknown authenticatorId "${authenticatorId}"` | [packages/auth/src/webauthn/setup-webauthn-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/setup-webauthn-env.ts#L76) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `__resetDcrCounter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L19) `packages/auth/src/oidc/dcr.ts`

Reset the client_id counter. Called by `setupOidcEnv` when preparing a fresh env so repeated env constructions produce identical output.

```ts
export declare function __resetDcrCounter(): void;
```

#### `__resetDpopCounters`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L12) `packages/auth/src/oauth21/dpop.ts`

```ts
export declare function __resetDpopCounters(): void;
```

#### `__resetIdTokenCounter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/id-token.ts#L18) `packages/auth/src/oidc/id-token.ts`

Reset any module-scope state carried by the signer. Called by `setupOidcEnv` when preparing a fresh env so repeated env constructions produce identical output. Kept as a no-op today (the mock signature is deterministic from `header.payload.kid` without stateful entropy) so future additions have a stable reset seam.

```ts
export declare function __resetIdTokenCounter(): void;
```

#### `__resetJwksCounter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/jwks.ts#L15) `packages/auth/src/oidc/jwks.ts`

Reset the kid counter. Called by `setupOidcEnv` when preparing a fresh env so repeated env constructions produce identical output.

```ts
export declare function __resetJwksCounter(): void;
```

#### `__resetOAuth21Counters`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/setup-oauth21-env.ts#L24) `packages/auth/src/oauth21/setup-oauth21-env.ts`

Reset every module-scope counter used by the OAuth 2.1 adapter so consecutive `setupOAuth21Env` calls produce stable, deterministic ids.

```ts
export declare function __resetOAuth21Counters(): void;
```

#### `__resetOidcCounters`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/setup-oidc-env.ts#L27) `packages/auth/src/oidc/setup-oidc-env.ts`

Reset every module-scope counter used by the OIDC adapter so consecutive `setupOidcEnv` calls produce stable, deterministic ids.

```ts
export declare function __resetOidcCounters(): void;
```

#### `__resetPasskeyCounters`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L42) `packages/auth/src/passkey/setup-passkey-env.ts`

Reset the module-scoped counters imported from the WebAuthn base module so consecutive `setupPasskeyEnv` calls hand out stable, deterministic ids.

```ts
export declare function __resetPasskeyCounters(): void;
```

#### `__resetPkceCounter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/pkce.ts#L18) `packages/auth/src/oauth21/pkce.ts`

Reset the verifier counter. Called by `setupOAuth21Env` when preparing a fresh env so repeated env constructions produce identical output.

```ts
export declare function __resetPkceCounter(): void;
```

#### `__resetTokenCounters`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/refresh-rotation.ts#L11) `packages/auth/src/oauth21/refresh-rotation.ts`

```ts
export declare function __resetTokenCounters(): void;
```

#### `__resetWebAuthnCounters`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/setup-webauthn-env.ts#L25) `packages/auth/src/webauthn/setup-webauthn-env.ts`

Full test-env reset — restarts credential IDs and authenticator IDs from 1 so consecutive `setupWebAuthnEnv` calls produce stable, deterministic IDs. Exposed for tests that want to reset counters without tearing down the env object itself.

```ts
export declare function __resetWebAuthnCounters(): void;
```

#### `backupPasskeyCredential`

公開 entry point から解決しています。

`backupCredential` を `backupPasskeyCredential` として公開しています。

Push a credential blob into a sync fabric. Bumps the credential's sync epoch (real fabrics use this to detect concurrent updates across devices) and appends the vendor to `syncedFabrics` if it is not already present. Returns the updated credential — callers should replace their in-memory copy with the return value so subsequent backup / restore see the new epoch. Throws when the credential is not backup-eligible. Non-discoverable credentials minted on a bare U2F-style security key cannot participate in the fabric — the FIDO Alliance Passkey Provider spec requires the credential live on a device that can round-trip the private key material through the vendor's E2EE blob.

```ts
export {
  __resetPasskeyCounters,
  backupCredential as backupPasskeyCredential,
  createPlatformAuthenticator,
  createRoamingAuthenticator,
  createSyncFabric,
  findFabricHolding as findPasskeyFabricHolding,
  requireFabric as requirePasskeyFabric,
  restoreCredential as restorePasskeyCredential,
  setupPasskeyEnv,
  syncCredentials as syncPasskeyCredentials,
} from './passkey/index.js';
```

#### `base64UrlDecodeWebAuthn`

公開 entry point から解決しています。

`base64UrlDecode` を `base64UrlDecodeWebAuthn` として公開しています。

```ts
export {
  __resetWebAuthnCounters,
  base64UrlDecode as base64UrlDecodeWebAuthn,
  base64UrlEncode as base64UrlEncodeWebAuthn,
  clientDataHash as webAuthnClientDataHash,
  createVirtualAuthenticator,
  credentialAssertion as webAuthnCredentialAssertion,
  credentialCreation as webAuthnCredentialCreation,
  mockSignature as webAuthnMockSignature,
  normalizeChallenge as webAuthnNormalizeChallenge,
  setupWebAuthnEnv,
} from './webauthn/index.js';
```

#### `base64UrlEncodeWebAuthn`

公開 entry point から解決しています。

`base64UrlEncode` を `base64UrlEncodeWebAuthn` として公開しています。

```ts
export {
  __resetWebAuthnCounters,
  base64UrlDecode as base64UrlDecodeWebAuthn,
  base64UrlEncode as base64UrlEncodeWebAuthn,
  clientDataHash as webAuthnClientDataHash,
  createVirtualAuthenticator,
  credentialAssertion as webAuthnCredentialAssertion,
  credentialCreation as webAuthnCredentialCreation,
  mockSignature as webAuthnMockSignature,
  normalizeChallenge as webAuthnNormalizeChallenge,
  setupWebAuthnEnv,
} from './webauthn/index.js';
```

#### `buildBetterAuthProviderRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/providers.ts#L41) `packages/auth/src/better-auth/providers.ts`

```ts
export declare function buildBetterAuthProviderRegistry(kinds: BetterAuthProviderKind[]): Record<BetterAuthProviderKind, BetterAuthProviderMock>;
```

#### `buildLuciaProviderRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/providers.ts#L41) `packages/auth/src/lucia/providers.ts`

```ts
export declare function buildLuciaProviderRegistry(kinds: LuciaProviderKind[]): Record<LuciaProviderKind, LuciaProviderMock>;
```

#### `buildProviderRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/providers.ts#L59) `packages/auth/src/providers.ts`

```ts
export declare function buildProviderRegistry(kinds: ProviderKind[]): Record<ProviderKind, ProviderMock>;
```

#### `buildSupabaseOtpAuthUri`

公開 entry point から解決しています。

`buildOtpAuthUri` を `buildSupabaseOtpAuthUri` として公開しています。

Build the standard `otpauth://` URI clients scan into an authenticator app.

```ts
export {
  buildOtpAuthUri as buildSupabaseOtpAuthUri,
  deriveMockAddress as deriveSupabaseMockAddress,
  generateBackupCodes as generateSupabaseBackupCodes,
  generateSiweNonce as generateSupabaseSiweNonce,
  generateTotpCode as generateSupabaseTotpCode,
  generateTotpSecret as generateSupabaseTotpSecret,
  serializeSiweMessage as serializeSupabaseSiweMessage,
  setupSupabaseAdvancedEnv,
  verifyTotpCode as verifySupabaseTotpCode,
} from './supabase-advanced/setup-supabase-advanced-env.js';
```

#### `computeDpopJkt`

公開 entry point から解決しています。

`computeJkt` を `computeDpopJkt` として公開しています。

Compute the JWK thumbprint (RFC 7638) for a DPoP JWK. Sender-constrained access tokens embed this thumbprint as `cnf.jkt` — the mock keeps the canonical member ordering (`crv`, `kty`, `x`, `y`) so identical JWKs always produce identical thumbprints.

```ts
export {
  __resetDpopCounters,
  __resetOAuth21Counters,
  __resetPkceCounter,
  __resetTokenCounters,
  computeJkt as computeDpopJkt,
  createAuthorizationServer,
  createDpopProof,
  createMockDpopJwk,
  createPkceChallenge,
  deriveCodeChallenge,
  generateCodeVerifier,
  mintAccessToken,
  mintRefreshToken,
  parseDpopProof,
  rotateRefreshToken,
  setupOAuth21Env,
  verifyCodeChallenge,
  verifyDpopProof,
} from './oauth21/index.js';
```

#### `computeTokenHash`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/id-token.ts#L49) `packages/auth/src/oidc/id-token.ts`

Compute the OIDC Core §3.1.3.6 hash (at_hash / c_hash). Left half of the SHA-256 of the ASCII string, base64url-encoded. For RS256 / ES256 the spec says "left half" — for a SHA-256 digest that's 16 bytes.

```ts
export declare function computeTokenHash(input: string): string;
```

#### `createAuthorizationServer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L38) `packages/auth/src/oauth21/authorization-server.ts`

Mock Authorization Server implementing the RFC 9700 (OAuth 2.1) endpoint surface: `/authorize`, `/token`, `/revoke`, `/introspect`. The mock keeps every piece of state in-memory so a test can drive the AS through method calls without HTTP plumbing. Notable enforcement (matches OAuth 2.1 hardening): - `response_type=code` only. `token` (implicit) is refused. - PKCE always mandatory. `code_challenge_method=plain` refused. - `grant_type=password` and `grant_type=client_credentials` refused. - Refresh tokens rotate on every use per RFC 9700 §2.2. - Revoked / expired / re-used refresh tokens are rejected. - DPoP-bound tokens verify the JWK thumbprint on `/token`. - `jti` replay defence guards the DPoP proof registry.

```ts
export declare function createAuthorizationServer(options?: AuthorizationServerOptions): AuthorizationServer;
```

#### `createBetterAuthGithubProviderMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/providers.ts#L32) `packages/auth/src/better-auth/providers.ts`

```ts
export declare function createBetterAuthGithubProviderMock(): BetterAuthProviderMock;
```

#### `createBetterAuthGoogleProviderMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/providers.ts#L23) `packages/auth/src/better-auth/providers.ts`

```ts
export declare function createBetterAuthGoogleProviderMock(): BetterAuthProviderMock;
```

#### `createBetterAuthSessionFor`

公開 entry point から解決しています。

`createSessionFor` を `createBetterAuthSessionFor` として公開しています。

```ts
export {
  createSessionFor as createBetterAuthSessionFor,
  generateSessionId as generateBetterAuthSessionId,
  generateSessionToken as generateBetterAuthSessionToken,
  invalidateSessionsForUser as invalidateBetterAuthSessionsForUser,
  validateSessionByToken as validateBetterAuthSessionByToken,
} from './better-auth/session.js';
```

#### `createDcrEndpoint`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L310) `packages/auth/src/oidc/dcr.ts`

Build a DCR endpoint handle. Tests use this when they want to inspect the advertised URL alongside the registration side effects.

```ts
export declare function createDcrEndpoint(options: CreateDcrEndpointOptions): DcrEndpoint;
```

#### `createDiscoveryEndpoint`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/discovery.ts#L66) `packages/auth/src/oidc/discovery.ts`

Build the OIDC discovery endpoint. The mock keeps every field in-memory; `fetch()` returns a fresh object so callers cannot mutate the underlying metadata by reference. The document is intentionally read-only. Tests that need to simulate an OP changing metadata should rebuild the discovery endpoint rather than reach into the returned object.

```ts
export declare function createDiscoveryEndpoint(options: CreateDiscoveryEndpointOptions): DiscoveryEndpoint;
```

#### `createDpopProof`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L71) `packages/auth/src/oauth21/dpop.ts`

Fabricate a DPoP proof JWT. The mock builds the compact `header.payload.signature` form but keeps the signature as a deterministic placeholder — verification is done by re-parsing the JWT and matching fields against the recorded JWK / htm / htu / iat / jti, not by running a real ECDSA verification. Callers wanting to test signature failure paths mangle the returned `jwt` string before handing it back.

```ts
export declare function createDpopProof(input: DpopProofInput): DpopProof;
```

#### `createEmailProviderMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/providers.ts#L45) `packages/auth/src/providers.ts`

```ts
export declare function createEmailProviderMock(): ProviderMock;
```

#### `createGithubProviderMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/providers.ts#L36) `packages/auth/src/providers.ts`

```ts
export declare function createGithubProviderMock(): ProviderMock;
```

#### `createGoogleProviderMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/providers.ts#L27) `packages/auth/src/providers.ts`

```ts
export declare function createGoogleProviderMock(): ProviderMock;
```

#### `createIdTokenSigner`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/id-token.ts#L88) `packages/auth/src/oidc/id-token.ts`

Build the id_token signer + verifier. Owns the JWKS endpoint reference so signing always uses the currently-active key + verification looks up the kid across the full JWKS (active + retained-retired keys, within the retention window).

```ts
export declare function createIdTokenSigner(options: CreateIdTokenSignerOptions): IdTokenSigner;
```

#### `createInMemoryAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/adapter.ts#L21) `packages/auth/src/adapter.ts`

In-memory database adapter compatible with the Auth.js adapter contract. `@auth/prisma-adapter` and `@auth/drizzle-adapter` both expose the same method names, so this mock is a drop-in for either surface during tests.

```ts
export declare function createInMemoryAdapter(): AuthDatabaseAdapter;
```

#### `createInMemoryBetterAuthAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/adapter.ts#L32) `packages/auth/src/better-auth/adapter.ts`

In-memory adapter that mirrors Better Auth's Prisma / Drizzle / Kysely adapter surface. All three official adapters expose the same operation set at the Better Auth layer (create / find / update / delete + a small verification + account surface), so this single implementation stands in for any of them — the `kind` tag is the only observable difference.

```ts
export declare function createInMemoryBetterAuthAdapter(kind?: BetterAuthDatabaseKind): BetterAuthDatabaseAdapter;
```

#### `createInMemoryLuciaAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/adapter.ts#L21) `packages/auth/src/lucia/adapter.ts`

In-memory adapter that mirrors the shape of `@lucia-auth/adapter-sqlite` and `@lucia-auth/adapter-postgresql`. Both expose the same method names, so this single implementation stands in for either at test time — the `kind` tag is the only observable difference.

```ts
export declare function createInMemoryLuciaAdapter(kind?: LuciaDatabaseKind): LuciaDatabaseAdapter;
```

#### `createJwksEndpoint`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/jwks.ts#L92) `packages/auth/src/oidc/jwks.ts`

Build the JWKS endpoint. Owns the current active signing key + the retired key registry with retention windows. Rotation semantics matches Auth0 / Google-style OPs: on `rotate()` the current key is retired with a retention deadline (`retentionSec` from now), a fresh key becomes active, and `fetch()` returns both until the retired key's deadline passes. Tokens signed by the retired key verify until the deadline — after that, `activeKey()` still resolves but the retired kid is dropped from the JWKS document.

```ts
export declare function createJwksEndpoint(options: CreateJwksEndpointOptions): JwksEndpoint;
```

#### `createLuciaGithubProviderMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/providers.ts#L32) `packages/auth/src/lucia/providers.ts`

```ts
export declare function createLuciaGithubProviderMock(): LuciaProviderMock;
```

#### `createLuciaGoogleProviderMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/providers.ts#L23) `packages/auth/src/lucia/providers.ts`

```ts
export declare function createLuciaGoogleProviderMock(): LuciaProviderMock;
```

#### `createMockDpopJwk`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L42) `packages/auth/src/oauth21/dpop.ts`

Produce a mock ES256 JWK. Real deployments generate a P-256 key pair; the mock returns a distinctly-shaped placeholder so tests can assert the `x`/`y` fields without pulling in a full crypto stack.

```ts
export declare function createMockDpopJwk(): DpopJwk;
```

#### `createOidcEntityStatement`

公開 entry point から解決しています。

`createEntityStatement` を `createOidcEntityStatement` として公開しています。

Build a plain entity statement for tests. Sets sensible defaults for `iat` / `exp` so tests only override the fields they care about.

```ts
export {
  __resetDcrCounter,
  __resetIdTokenCounter,
  __resetJwksCounter,
  __resetOidcCounters,
  computeTokenHash,
  createDcrEndpoint,
  createDiscoveryEndpoint,
  createEntityStatement as createOidcEntityStatement,
  createIdTokenSigner,
  createJwksEndpoint,
  createTrustAnchor as createOidcTrustAnchor,
  dynamicClientRegistration,
  mintSoftwareStatement,
  resolveTrustChain as resolveOidcTrustChain,
  setupOidcEnv,
} from './oidc/index.js';
```

#### `createOidcTrustAnchor`

公開 entry point から解決しています。

`createTrustAnchor` を `createOidcTrustAnchor` として公開しています。

Build a plain trust-anchor fixture for tests. Wraps the manual object construction so tests import a single helper.

```ts
export {
  __resetDcrCounter,
  __resetIdTokenCounter,
  __resetJwksCounter,
  __resetOidcCounters,
  computeTokenHash,
  createDcrEndpoint,
  createDiscoveryEndpoint,
  createEntityStatement as createOidcEntityStatement,
  createIdTokenSigner,
  createJwksEndpoint,
  createTrustAnchor as createOidcTrustAnchor,
  dynamicClientRegistration,
  mintSoftwareStatement,
  resolveTrustChain as resolveOidcTrustChain,
  setupOidcEnv,
} from './oidc/index.js';
```

#### `createPkceChallenge`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/pkce.ts#L85) `packages/auth/src/oauth21/pkce.ts`

Build a complete PKCE challenge (verifier + challenge). Convenience wrapper that always uses S256.

```ts
export declare function createPkceChallenge(): PkceChallenge;
```

#### `createPlatformAuthenticator`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/platform.ts#L17) `packages/auth/src/passkey/platform.ts`

Build a platform authenticator (Touch ID / Face ID / Windows Hello / Android biometric). A platform authenticator is bound to the device — the factory pins `attachment: platform` and `transport: internal`, matching the WebAuthn L3 §5.4.5 pairing constraint. Passkeys minted here are always discoverable credentials (`hasResidentKey: true`) — the factory rejects any attempt to disable resident-key storage because a non-discoverable platform credential is not a passkey.

```ts
export declare function createPlatformAuthenticator(options: PlatformAuthenticatorOptions): {
    handle: PlatformAuthenticator;
    credentials: Map<string, WebAuthnCredential>;
};
```

#### `createRoamingAuthenticator`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/roaming.ts#L34) `packages/auth/src/passkey/roaming.ts`

Build a roaming authenticator (security key / phone via caBLE). Roaming authenticators are portable — the factory pins `attachment: cross-platform` and picks the wire transport from `kind`. Unlike platform authenticators, roaming authenticators can be non-discoverable (a bare U2F-style token) — the caller decides via `hasResidentKey`.

```ts
export declare function createRoamingAuthenticator(options: RoamingAuthenticatorOptions): {
    handle: RoamingAuthenticator;
    credentials: Map<string, WebAuthnCredential>;
};
```

#### `createSessionFor`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/session.ts#L22) `packages/auth/src/lucia/session.ts`

```ts
export declare function createSessionFor(database: LuciaDatabaseAdapter, user: LuciaUser, expirationSeconds: number): Promise<LuciaSession>;
```

#### `createSyncFabric`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/sync-fabric.ts#L11) `packages/auth/src/passkey/sync-fabric.ts`

Build a sync fabric — the in-memory analogue of iCloud Keychain or Google Password Manager. Real fabrics wrap end-to-end-encrypted blobs indexed by credential id; the mock keeps a plain `Map&lt;credentialId, PasskeyCredential&gt;` so tests can inspect the blob shape at will. Every backup produces a shallow clone — mutating the returned credential must not race with a concurrent backup of the same credential on a sibling device.

```ts
export declare function createSyncFabric(vendor: SyncFabricVendor): SyncFabric;
```

#### `createVirtualAuthenticator`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/authenticator.ts#L27) `packages/auth/src/webauthn/authenticator.ts`

Build a Chrome Virtual Authenticator API compatible mock. Mirrors the shape of `WebAuthn.addVirtualAuthenticator` in the Chrome DevTools protocol which Playwright and Puppeteer surface as `page.context().addInitScript(...)` / `CDPSession.send('WebAuthn.addVirtualAuthenticator', ...)`. The mock keeps credentials in a `Map&lt;credentialId, WebAuthnCredential&gt;` and hands out an internal view — the RP-facing surface goes through `WebAuthnTestEnv` instead.

```ts
export declare function createVirtualAuthenticator(options: VirtualAuthenticatorOptions): {
    handle: VirtualAuthenticator;
    credentials: Map<string, WebAuthnCredential>;
};
```

#### `deriveCodeChallenge`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/pkce.ts#L58) `packages/auth/src/oauth21/pkce.ts`

Derive the code challenge for a verifier. RFC 9700 §2.1.1 forbids the `plain` method — the function rejects it explicitly rather than silently downgrading. Only `S256` is accepted.

```ts
export declare function deriveCodeChallenge(verifier: string, method?: PkceChallengeMethod): string;
```

#### `deriveSupabaseMockAddress`

公開 entry point から解決しています。

`deriveMockAddress` を `deriveSupabaseMockAddress` として公開しています。

Derive a deterministic pseudo-Ethereum address from a private key. Real addresses come from keccak256(pubkey)[-20:]; the mock uses a deterministic HMAC → 20 bytes → 0x-prefixed hex string. Good enough for tests that need uniqueness + a consistent address per key.

```ts
export {
  buildOtpAuthUri as buildSupabaseOtpAuthUri,
  deriveMockAddress as deriveSupabaseMockAddress,
  generateBackupCodes as generateSupabaseBackupCodes,
  generateSiweNonce as generateSupabaseSiweNonce,
  generateTotpCode as generateSupabaseTotpCode,
  generateTotpSecret as generateSupabaseTotpSecret,
  serializeSiweMessage as serializeSupabaseSiweMessage,
  setupSupabaseAdvancedEnv,
  verifyTotpCode as verifySupabaseTotpCode,
} from './supabase-advanced/setup-supabase-advanced-env.js';
```

#### `dynamicClientRegistration`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L235) `packages/auth/src/oidc/dcr.ts`

Register a client with the underlying mock AS. Returns the RFC 7591 §3 response. `client_id` is assigned deterministically; `client_secret` is omitted when `token_endpoint_auth_method` is `none` (matches how a real AS treats public clients).

```ts
export declare function dynamicClientRegistration(options: DynamicClientRegistrationOptions, request: ClientRegistrationRequest): ClientRegistrationResponse;
```

#### `encodeCaBLEQRURI`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/qr-code.ts#L61) `packages/auth/src/passkey/caBLE/qr-code.ts`

Encode a QR code payload as the `FIDO:/` URI a real caBLE QR image would carry. The mock returns a stable string built from the four payload fields so tests can assert the URI shape without invoking a QR image library.

```ts
export declare function encodeCaBLEQRURI(payload: CaBLEQRCodePayload): string;
```

#### `establishWebSocketTunnel`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/websocket-tunnel.ts#L25) `packages/auth/src/passkey/caBLE/websocket-tunnel.ts`

Establish the WebSocket tunnel the initiator (laptop) opens against the tunnel server hint advertised in the QR payload. Real caBLE step 3 — both sides send frames over a duplex WebSocket protected by the BLE handshake shared secret. The mock keeps an in-memory FIFO of messages the initiator sent so downstream credential migration + signature roundtrip can inspect the wire log without spinning up a real WebSocket server. `close()` flips the tunnel into a rejected state — subsequent `send()` / `drain()` throws so tests can assert lifecycle correctness. Throws when the handshake was not verified — real caBLE refuses to establish the tunnel if the BLE handshake shared secrets diverged. Callers that want to exercise the "handshake failed but tunnel opened" negative path can mint a synthetic handshake with `verified: true` before calling this function.

```ts
export declare function establishWebSocketTunnel(qr: CaBLEQRCodePayload, handshake: CaBLEBLEHandshake): CaBLEWebSocketTunnel;
```

#### `findPasskeyFabricHolding`

公開 entry point から解決しています。

`findFabricHolding` を `findPasskeyFabricHolding` として公開しています。

Locate every vendor that holds a given credential across a list of fabrics. Convenience helper used by `restoreCredential` in the env when the caller did not name a specific vendor.

```ts
export {
  __resetPasskeyCounters,
  backupCredential as backupPasskeyCredential,
  createPlatformAuthenticator,
  createRoamingAuthenticator,
  createSyncFabric,
  findFabricHolding as findPasskeyFabricHolding,
  requireFabric as requirePasskeyFabric,
  restoreCredential as restorePasskeyCredential,
  setupPasskeyEnv,
  syncCredentials as syncPasskeyCredentials,
} from './passkey/index.js';
```

#### `generateAuth0SigningSecret`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L143) `packages/auth/src/auth0/jwt.ts`

Generate a random signing secret. Called once per {@link setupAuth0Env } invocation so each env has its own signing key — mirrors Auth0's per-tenant key isolation.

```ts
export declare function generateAuth0SigningSecret(): string;
```

#### `generateBetterAuthSessionId`

公開 entry point から解決しています。

`generateSessionId` を `generateBetterAuthSessionId` として公開しています。

```ts
export {
  createSessionFor as createBetterAuthSessionFor,
  generateSessionId as generateBetterAuthSessionId,
  generateSessionToken as generateBetterAuthSessionToken,
  invalidateSessionsForUser as invalidateBetterAuthSessionsForUser,
  validateSessionByToken as validateBetterAuthSessionByToken,
} from './better-auth/session.js';
```

#### `generateBetterAuthSessionToken`

公開 entry point から解決しています。

`generateSessionToken` を `generateBetterAuthSessionToken` として公開しています。

```ts
export {
  createSessionFor as createBetterAuthSessionFor,
  generateSessionId as generateBetterAuthSessionId,
  generateSessionToken as generateBetterAuthSessionToken,
  invalidateSessionsForUser as invalidateBetterAuthSessionsForUser,
  validateSessionByToken as validateBetterAuthSessionByToken,
} from './better-auth/session.js';
```

#### `generateCaBLEQRCode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/qr-code.ts#L28) `packages/auth/src/passkey/caBLE/qr-code.ts`

Build the QR code payload the initiator (laptop) prints for the phone to scan. Real caBLE encodes an ephemeral EC P-256 public key + tunnel server hint + random nonce as a `FIDO:/` URI base32-encoded into a QR image. The mock keeps the same three fields as literal strings so tests can assert the payload survives the ceremony without running through a QR image decoder. The `sessionId` is a monotonic id — the WebSocket tunnel + BLE handshake use it as the correlation key so every step of the ceremony refers to the same session. Throws when the tunnel server hint or nonce is empty — real caBLE refuses to advertise a QR that would produce a degenerate handshake.

```ts
export declare function generateCaBLEQRCode(options: CaBLESessionOptions): CaBLEQRCodePayload;
```

#### `generateClerkSigningSecret`

公開 entry point から解決しています。

`generateSigningSecret` を `generateClerkSigningSecret` として公開しています。

Generate a random secret for signing. Called once per {@link setupClerkEnv } invocation so each env has its own signing key.

```ts
export {
  generateSigningSecret as generateClerkSigningSecret,
  signClerkJwt,
  verifyClerkJwt,
} from './clerk/jwt.js';
```

#### `generateCodeVerifier`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/pkce.ts#L38) `packages/auth/src/oauth21/pkce.ts`

Generate a fresh code verifier. RFC 7636 §4.1 requires 43-128 characters from the unreserved URL set. The mock produces 43-char base64url strings.

```ts
export declare function generateCodeVerifier(): string;
```

#### `generateSessionId`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/session.ts#L12) `packages/auth/src/lucia/session.ts`

```ts
export declare function generateSessionId(): string;
```

#### `generateSupabaseBackupCodes`

公開 entry point から解決しています。

`generateBackupCodes` を `generateSupabaseBackupCodes` として公開しています。

Generate a set of one-time backup codes. Each code is 10 hex characters, matching a common Supabase-adjacent pattern.

```ts
export {
  buildOtpAuthUri as buildSupabaseOtpAuthUri,
  deriveMockAddress as deriveSupabaseMockAddress,
  generateBackupCodes as generateSupabaseBackupCodes,
  generateSiweNonce as generateSupabaseSiweNonce,
  generateTotpCode as generateSupabaseTotpCode,
  generateTotpSecret as generateSupabaseTotpSecret,
  serializeSiweMessage as serializeSupabaseSiweMessage,
  setupSupabaseAdvancedEnv,
  verifyTotpCode as verifySupabaseTotpCode,
} from './supabase-advanced/setup-supabase-advanced-env.js';
```

#### `generateSupabaseRefreshToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/jwt.ts#L92) `packages/auth/src/supabase/jwt.ts`

Generate a random opaque refresh token. Supabase's real refresh tokens are opaque strings (not JWTs) rotated on each `refreshSession` call.

```ts
export declare function generateSupabaseRefreshToken(): string;
```

#### `generateSupabaseSigningSecret`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/jwt.ts#L84) `packages/auth/src/supabase/jwt.ts`

Generate a random 32-byte secret for signing. Called once per {@link setupSupabaseAuthEnv } invocation so each env has its own signing key.

```ts
export declare function generateSupabaseSigningSecret(): string;
```

#### `generateSupabaseSiweNonce`

公開 entry point から解決しています。

`generateSiweNonce` を `generateSupabaseSiweNonce` として公開しています。

EIP-4361 (Sign-In with Ethereum) helpers. Real SIWE relies on secp256k1 message signing + ecrecover to derive the address from a signature — the mock replaces the signature primitive with an HMAC over the canonical message + address, which is enough to model happy-path + tamper-detection behaviors without pulling in a full crypto library.

```ts
export {
  buildOtpAuthUri as buildSupabaseOtpAuthUri,
  deriveMockAddress as deriveSupabaseMockAddress,
  generateBackupCodes as generateSupabaseBackupCodes,
  generateSiweNonce as generateSupabaseSiweNonce,
  generateTotpCode as generateSupabaseTotpCode,
  generateTotpSecret as generateSupabaseTotpSecret,
  serializeSiweMessage as serializeSupabaseSiweMessage,
  setupSupabaseAdvancedEnv,
  verifyTotpCode as verifySupabaseTotpCode,
} from './supabase-advanced/setup-supabase-advanced-env.js';
```

#### `generateSupabaseTotpCode`

公開 entry point から解決しています。

`generateTotpCode` を `generateSupabaseTotpCode` として公開しています。

Generate the TOTP code for the given moment. `nowSeconds` is exposed so tests can advance time deterministically.

```ts
export {
  buildOtpAuthUri as buildSupabaseOtpAuthUri,
  deriveMockAddress as deriveSupabaseMockAddress,
  generateBackupCodes as generateSupabaseBackupCodes,
  generateSiweNonce as generateSupabaseSiweNonce,
  generateTotpCode as generateSupabaseTotpCode,
  generateTotpSecret as generateSupabaseTotpSecret,
  serializeSiweMessage as serializeSupabaseSiweMessage,
  setupSupabaseAdvancedEnv,
  verifyTotpCode as verifySupabaseTotpCode,
} from './supabase-advanced/setup-supabase-advanced-env.js';
```

#### `generateSupabaseTotpSecret`

公開 entry point から解決しています。

`generateTotpSecret` を `generateSupabaseTotpSecret` として公開しています。

```ts
export {
  buildOtpAuthUri as buildSupabaseOtpAuthUri,
  deriveMockAddress as deriveSupabaseMockAddress,
  generateBackupCodes as generateSupabaseBackupCodes,
  generateSiweNonce as generateSupabaseSiweNonce,
  generateTotpCode as generateSupabaseTotpCode,
  generateTotpSecret as generateSupabaseTotpSecret,
  serializeSiweMessage as serializeSupabaseSiweMessage,
  setupSupabaseAdvancedEnv,
  verifyTotpCode as verifySupabaseTotpCode,
} from './supabase-advanced/setup-supabase-advanced-env.js';
```

#### `generateTotpCode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/totp.ts#L22) `packages/auth/src/better-auth/totp.ts`

```ts
export declare function generateTotpCode(secret: string, nowMs?: number): string;
```

#### `generateTotpSecret`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/totp.ts#L16) `packages/auth/src/better-auth/totp.ts`

```ts
export declare function generateTotpSecret(): string;
```

#### `hashBetterAuthPassword`

公開 entry point から解決しています。

`hashPassword` を `hashBetterAuthPassword` として公開しています。

```ts
export {
  hashPassword as hashBetterAuthPassword,
  verifyPassword as verifyBetterAuthPassword,
} from './better-auth/password.js';
```

#### `hashPassword`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/password.ts#L38) `packages/auth/src/lucia/password.ts`

Hash a password. The returned string is opaque to callers and safe to store in the mock user record. Empty passwords are rejected — same policy the real argon2 adapters recommend, and the earliest place we can flag a bug.

```ts
export declare function hashPassword(password: string): Promise<string>;
```

#### `invalidateBetterAuthSessionsForUser`

公開 entry point から解決しています。

`invalidateSessionsForUser` を `invalidateBetterAuthSessionsForUser` として公開しています。

```ts
export {
  createSessionFor as createBetterAuthSessionFor,
  generateSessionId as generateBetterAuthSessionId,
  generateSessionToken as generateBetterAuthSessionToken,
  invalidateSessionsForUser as invalidateBetterAuthSessionsForUser,
  validateSessionByToken as validateBetterAuthSessionByToken,
} from './better-auth/session.js';
```

#### `invalidateSessionsForUser`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/session.ts#L73) `packages/auth/src/lucia/session.ts`

```ts
export declare function invalidateSessionsForUser(database: LuciaDatabaseAdapter, userId: string): Promise<void>;
```

#### `issueSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/session.ts#L61) `packages/auth/src/session.ts`

Issue a session token for a signed-in user. The JWT strategy short-circuits database writes; the database strategy persists the session row.

```ts
export declare function issueSession(database: AuthDatabaseAdapter, user: AuthUser, strategy: SessionStrategy, maxAgeSeconds: number): Promise<{
    sessionToken: string;
    expires: Date;
}>;
```

#### `migrateCredential`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/hybrid-transport.ts#L30) `packages/auth/src/passkey/caBLE/hybrid-transport.ts`

Ship the passkey credential from responder (phone) to initiator (laptop) over the established WebSocket tunnel. Real caBLE encrypts the payload with the BLE handshake shared secret; the mock keeps the raw {@link PasskeyCredential} plus a deterministic "encrypted" tag so tests can assert the migration went through the tunnel without leaking the credential material outside.

```ts
export declare function migrateCredential(tunnel: CaBLEWebSocketTunnel, credential: PasskeyCredential): CaBLECredentialMigration;
```

#### `mintAccessToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/refresh-rotation.ts#L30) `packages/auth/src/oauth21/refresh-rotation.ts`

Mint a fresh access token. Access tokens carry state (`clientId`, `subject`, `scope`, expiration) so the introspection endpoint can echo them without a separate lookup. Real deployments encode this as a signed JWT; the mock hands the state back to the caller who stores it in the AS registry.

```ts
export declare function mintAccessToken(params: {
    clientId: string;
    subject: string;
    scope: string;
    lifetimeSec: number;
    now: () => number;
    dpopJkt?: string;
    resource?: string;
}): AccessToken;
```

#### `mintRefreshToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/refresh-rotation.ts#L59) `packages/auth/src/oauth21/refresh-rotation.ts`

Mint a fresh refresh token. Refresh tokens are opaque strings the AS binds to a client + subject + scope. The mock keeps them separate from access tokens so the rotation registry is easy to inspect.

```ts
export declare function mintRefreshToken(params: {
    clientId: string;
    subject: string;
    scope: string;
    lifetimeSec: number;
    now: () => number;
    rotationCount?: number;
    dpopJkt?: string;
    resource?: string;
}): RefreshToken;
```

#### `mintSoftwareStatement`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L127) `packages/auth/src/oidc/dcr.ts`

Mint a software_statement JWT for testing. Tests use this to build valid / invalid software statements without cracking real JWS crypto.

```ts
export declare function mintSoftwareStatement(claims: Record<string, unknown>, trustAnchor: string, headerOverrides?: Record<string, unknown>): string;
```

#### `parseDpopProof`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L109) `packages/auth/src/oauth21/dpop.ts`

Parse a compact DPoP JWT string back into its header/payload shape. Used by the AS to inspect a proof carried on the wire (`DPoP` header). Throws on malformed input so a caller mangling the JWT for a fuzz test gets a predictable error.

```ts
export declare function parseDpopProof(jwt: string): DpopProof;
```

#### `performBLEHandshake`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/ble-handshake.ts#L43) `packages/auth/src/passkey/caBLE/ble-handshake.ts`

Run the BLE advertisement handshake. Real caBLE step 2 — the responder broadcasts a 20-byte BLE advertisement, the initiator picks it up over a scan, and both sides derive a shared secret from the QR nonce + responder's ephemeral key + session id. The mock computes the shared secret deterministically on both sides and flags the handshake as `verified: true` when they match. Tests can introduce a divergent shared secret by mutating the return value — the ceremony downstream (WebSocket tunnel, credential migration) does not gate on `verified`, so the caller keeps the check where it makes the fidelity axis most legible. Throws when the QR payload session id is empty — real caBLE refuses to derive a shared secret without a session correlation key.

```ts
export declare function performBLEHandshake(payload: CaBLEQRCodePayload): CaBLEBLEHandshake;
```

#### `performSignatureRoundtrip`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/hybrid-transport.ts#L66) `packages/auth/src/passkey/caBLE/hybrid-transport.ts`

Sign the challenge with the migrated credential + verify the signature on the initiator side. Real caBLE terminates the hybrid transport ceremony in a WebAuthn L3 §7.2 assertion signature check; the mock builds a deterministic signature string from the credential id + challenge + session id so tests can assert the roundtrip without running through a real signature verifier. Throws when the tunnel is not established / has been closed / the challenge is empty — real caBLE cannot produce a WebAuthn L3 §7.2 assertion over any of those conditions.

```ts
export declare function performSignatureRoundtrip(tunnel: CaBLEWebSocketTunnel, credential: PasskeyCredential, challenge: string): CaBLESignatureRoundtrip;
```

#### `requirePasskeyFabric`

公開 entry point から解決しています。

`requireFabric` を `requirePasskeyFabric` として公開しています。

Guarded lookup for a fabric by vendor. Throws when the vendor is not registered — the alternative (silent `undefined`) would let a caller silently drop backups on the floor.

```ts
export {
  __resetPasskeyCounters,
  backupCredential as backupPasskeyCredential,
  createPlatformAuthenticator,
  createRoamingAuthenticator,
  createSyncFabric,
  findFabricHolding as findPasskeyFabricHolding,
  requireFabric as requirePasskeyFabric,
  restoreCredential as restorePasskeyCredential,
  setupPasskeyEnv,
  syncCredentials as syncPasskeyCredentials,
} from './passkey/index.js';
```

#### `resolveOidcTrustChain`

公開 entry point から解決しています。

`resolveTrustChain` を `resolveOidcTrustChain` として公開しています。

Resolve a trust chain per OpenID Federation 1.0 §7. The chain walks from the leaf entity (typically the RP or a subordinate OP) through zero-or-more intermediates up to a trust anchor. Chain-walk rules (matches OIDF §7.2): - Every statement in the chain must have `iss` equal to the previous step's subject (the anchor is a virtual step past the last statement's iss). - Every statement must have `exp &gt; now`. - The final statement's `iss` must equal the trust anchor's entity_id. The mock does not verify JWS signatures on the statements — the point is to prove the chain-walk logic. Callers wanting to test signature verification build the statements with dedicated fixtures.

```ts
export {
  __resetDcrCounter,
  __resetIdTokenCounter,
  __resetJwksCounter,
  __resetOidcCounters,
  computeTokenHash,
  createDcrEndpoint,
  createDiscoveryEndpoint,
  createEntityStatement as createOidcEntityStatement,
  createIdTokenSigner,
  createJwksEndpoint,
  createTrustAnchor as createOidcTrustAnchor,
  dynamicClientRegistration,
  mintSoftwareStatement,
  resolveTrustChain as resolveOidcTrustChain,
  setupOidcEnv,
} from './oidc/index.js';
```

#### `restorePasskeyCredential`

公開 entry point から解決しています。

`restoreCredential` を `restorePasskeyCredential` として公開しています。

Pull a credential blob out of a sync fabric. Returns `null` when the fabric does not hold the credential — the caller decides whether to treat that as a hard error (no such passkey) or a soft one (fabric not yet synced). The returned credential is a fresh copy — restoring twice will produce two independent snapshots and the caller is responsible for merging them on the device side.

```ts
export {
  __resetPasskeyCounters,
  backupCredential as backupPasskeyCredential,
  createPlatformAuthenticator,
  createRoamingAuthenticator,
  createSyncFabric,
  findFabricHolding as findPasskeyFabricHolding,
  requireFabric as requirePasskeyFabric,
  restoreCredential as restorePasskeyCredential,
  setupPasskeyEnv,
  syncCredentials as syncPasskeyCredentials,
} from './passkey/index.js';
```

#### `rotateRefreshToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/refresh-rotation.ts#L94) `packages/auth/src/oauth21/refresh-rotation.ts`

Rotate a refresh token — invalidate the previous token and mint a fresh one that inherits the client + subject + scope. RFC 9700 §2.2 mandates this on every `/token` refresh call to defeat replay of an exfiltrated refresh token. Returns the newly-minted refresh token; the caller replaces the old token in the AS registry with the returned value.

```ts
export declare function rotateRefreshToken(previous: RefreshToken, lifetimeSec: number, now: () => number, overrides?: {
    scope?: string;
    dpopJkt?: string;
    resource?: string;
}): RefreshToken;
```

#### `runCaBLESession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/hybrid-transport.ts#L112) `packages/auth/src/passkey/caBLE/hybrid-transport.ts`

Run the full caBLE hybrid transport ceremony end-to-end. Chains the 3 FIDO caBLE steps (QR code → BLE handshake → WebSocket tunnel) followed by credential migration + signature roundtrip so a single call produces the {@link CaBLESession} artifact the fidelity harness inspects. The `challenge` picks the value the responder (phone) signs at the assertion step. Real caBLE surfaces this from the RP; the mock lets the caller supply it directly so tests can assert per-ceremony signature stability.

```ts
export declare function runCaBLESession(options: CaBLESessionOptions, challenge: string): CaBLESession;
```

#### `semantics`

公開 entry point から解決しています。

`"/Users/cardene/Desktop/projects/kiwa/packages/auth/src/semantics/index"` を `semantics` として公開しています。

```ts
export type {
  AuthAccount,
  AuthDatabaseAdapter,
  AuthProfile,
  AuthSession,
  AuthUser,
  NextAuthTestEnv,
  ProviderKind,
  ProviderMock,
  SessionStrategy,
  SetupNextAuthEnvOptions,
  VerificationToken,
} from './types.js';
export { setupNextAuthEnv } from './setup-nextauth-env.js';
export { createInMemoryAdapter } from './adapter.js';
export {
  buildProviderRegistry,
  createEmailProviderMock,
  createGithubProviderMock,
  createGoogleProviderMock,
} from './providers.js';
export { issueSession, upsertUserFromProfile } from './session.js';

// Lucia v3 adapter surface.
export type {
  LuciaDatabaseAdapter,
  LuciaDatabaseKind,
  LuciaOAuthAccount,
  LuciaOAuthProfile,
  LuciaProviderKind,
  LuciaProviderMock,
  LuciaSession,
  LuciaTestEnv,
  LuciaUser,
  SetupLuciaEnvOptions,
} from './lucia/types.js';
export { setupLuciaEnv } from './lucia/setup-lucia-env.js';
export { createInMemoryLuciaAdapter } from './lucia/adapter.js';
export {
  buildLuciaProviderRegistry,
  createLuciaGithubProviderMock,
  createLuciaGoogleProviderMock,
} from './lucia/providers.js';
export {
  createSessionFor,
  generateSessionId,
  invalidateSessionsForUser,
  validateSessionId,
} from './lucia/session.js';
export { hashPassword, verifyPassword } from './lucia/password.js';

// Better Auth adapter surface.
export type {
  BetterAuthAccount,
  BetterAuthDatabaseAdapter,
  BetterAuthDatabaseKind,
  BetterAuthMembership,
  BetterAuthOAuthProfile,
  BetterAuthOrganization,
  BetterAuthPasskey,
  BetterAuthPluginKind,
  BetterAuthProviderKind,
  BetterAuthProviderMock,
  BetterAuthSession,
  BetterAuthTestEnv,
  BetterAuthUser,
  BetterAuthVerification,
  SetupBetterAuthEnvOptions,
} from './better-auth/types.js';
export {
  generateTotpCode,
  setupBetterAuthEnv,
} from './better-auth/setup-better-auth-env.js';
export { createInMemoryBetterAuthAdapter } from './better-auth/adapter.js';
export {
  buildBetterAuthProviderRegistry,
  createBetterAuthGithubProviderMock,
  createBetterAuthGoogleProviderMock,
} from './better-auth/providers.js';
export {
  createSessionFor as createBetterAuthSessionFor,
  generateSessionId as generateBetterAuthSessionId,
  generateSessionToken as generateBetterAuthSessionToken,
  invalidateSessionsForUser as invalidateBetterAuthSessionsForUser,
  validateSessionByToken as validateBetterAuthSessionByToken,
} from './better-auth/session.js';
export {
  hashPassword as hashBetterAuthPassword,
  verifyPassword as verifyBetterAuthPassword,
} from './better-auth/password.js';
export {
  generateTotpSecret,
  verifyTotpCode,
} from './better-auth/totp.js';

// Clerk adapter surface.
export type {
  ClerkEmailAddress,
  ClerkExternalAccount,
  ClerkOrganization,
  ClerkOrganizationMembership,
  ClerkOrganizationRole,
  ClerkPhoneNumber,
  ClerkSession,
  ClerkSessionClaims,
  ClerkTestEnv,
  ClerkUser,
  SetupClerkEnvOptions,
} from './clerk/types.js';
export { setupClerkEnv } from './clerk/setup-clerk-env.js';
export {
  generateSigningSecret as generateClerkSigningSecret,
  signClerkJwt,
  verifyClerkJwt,
} from './clerk/jwt.js';

// Auth0 adapter surface.
export type {
  Auth0AccessTokenClaims,
  Auth0Action,
  Auth0ActionApi,
  Auth0ActionEvent,
  Auth0ActionTrigger,
  Auth0Connection,
  Auth0Identity,
  Auth0IdTokenClaims,
  Auth0Rule,
  Auth0RuleContext,
  Auth0TestEnv,
  Auth0User,
  SetupAuth0EnvOptions,
} from './auth0/types.js';
export { setupAuth0Env } from './auth0/setup-auth0-env.js';
export {
  generateAuth0SigningSecret,
  signAuth0AccessToken,
  signAuth0IdToken,
  verifyAuth0AccessToken,
  verifyAuth0IdToken,
} from './auth0/jwt.js';

// Supabase Auth core adapter surface (v1.10-1, GH #667).
export type {
  SetupSupabaseAuthEnvOptions,
  SupabaseAccessTokenClaims,
  SupabaseAuthTestEnv,
  SupabaseIdentity,
  SupabaseIdentityProvider,
  SupabaseOAuthAuthorizationUrl,
  SupabaseOtpDelivery,
  SupabaseSession,
  SupabaseUser,
} from './supabase/types.js';
export { setupSupabaseAuthEnv } from './supabase/setup-supabase-auth-env.js';
export {
  generateSupabaseSigningSecret,
  generateSupabaseRefreshToken,
  signSupabaseAccessToken,
  verifySupabaseAccessToken,
} from './supabase/jwt.js';

// Supabase Auth advanced adapter surface (v1.10-2, GH #668).
export type {
  MfaAal,
  MfaBackupCode,
  MfaChallenge,
  MfaFactor,
  MfaFactorKind,
  RlsCheckInput,
  RlsCheckOutcome,
  RlsCommand,
  RlsPolicy,
  RlsPolicyContext,
  SamlAssertion,
  SamlAuthnRequest,
  SamlIdentityProvider,
  SetupSupabaseAdvancedEnvOptions,
  SiweChallenge,
  SiweMessage,
  SupabaseAdvancedTestEnv,
} from './supabase-advanced/types.js';
export {
  buildOtpAuthUri as buildSupabaseOtpAuthUri,
  deriveMockAddress as deriveSupabaseMockAddress,
  generateBackupCodes as generateSupabaseBackupCodes,
  generateSiweNonce as generateSupabaseSiweNonce,
  generateTotpCode as generateSupabaseTotpCode,
  generateTotpSecret as generateSupabaseTotpSecret,
  serializeSiweMessage as serializeSupabaseSiweMessage,
  setupSupabaseAdvancedEnv,
  verifyTotpCode as verifySupabaseTotpCode,
} from './supabase-advanced/setup-supabase-advanced-env.js';

// WebAuthn L3 protocol adapter surface (v1.21-1a, GH #848).
export type {
  AuthenticatorAssertionResponse,
  AuthenticatorAttestationResponse,
  AuthenticatorSelectionCriteria,
  PublicKeyCredentialCreationOptionsInit,
  PublicKeyCredentialRequestOptionsInit,
  SetupWebAuthnEnvOptions,
  VirtualAuthenticator,
  VirtualAuthenticatorOptions,
  WebAuthnAttestationConveyancePreference,
  WebAuthnAuthenticatorAttachment,
  WebAuthnCredential,
  WebAuthnResidentKeyRequirement,
  WebAuthnTestEnv,
  WebAuthnTransport,
  WebAuthnUserVerificationRequirement,
} from './webauthn/types.js';
export {
  __resetWebAuthnCounters,
  base64UrlDecode as base64UrlDecodeWebAuthn,
  base64UrlEncode as base64UrlEncodeWebAuthn,
  clientDataHash as webAuthnClientDataHash,
  createVirtualAuthenticator,
  credentialAssertion as webAuthnCredentialAssertion,
  credentialCreation as webAuthnCredentialCreation,
  mockSignature as webAuthnMockSignature,
  normalizeChallenge as webAuthnNormalizeChallenge,
  setupWebAuthnEnv,
} from './webauthn/index.js';

// Passkey adapter surface (v1.21-1b, GH #849). Layered on top of the WebAuthn
// L3 primitives — adds device grouping, platform / roaming authenticator
// specialization, and sync fabric semantics (iCloud Keychain / Google
// Password Manager backup + restore).
export type {
  PasskeyCredential,
  PasskeyTestEnv,
  PlatformAuthenticator,
  PlatformAuthenticatorOptions,
  PlatformBiometricModality,
  RoamingAuthenticator,
  RoamingAuthenticatorKind,
  RoamingAuthenticatorOptions,
  SetupPasskeyEnvDeviceOptions,
  SetupPasskeyEnvOptions,
  SyncFabric,
  SyncFabricVendor,
} from './passkey/types.js';
export {
  __resetPasskeyCounters,
  backupCredential as backupPasskeyCredential,
  createPlatformAuthenticator,
  createRoamingAuthenticator,
  createSyncFabric,
  findFabricHolding as findPasskeyFabricHolding,
  requireFabric as requirePasskeyFabric,
  restoreCredential as restorePasskeyCredential,
  setupPasskeyEnv,
  syncCredentials as syncPasskeyCredentials,
} from './passkey/index.js';

// Passkey caBLE (CTAP2 hybrid transport) surface (v1.22-4, GH #890). Adds
// QR code + BLE advertisement handshake + WebSocket tunnel establishment +
// credential migration + signature roundtrip on top of the passkey adapter
// so the fidelity harness can walk the phone → laptop cross-device flow
// end-to-end without driving a real Bluetooth stack.
export type {
  CaBLEBLEHandshake,
  CaBLECredentialMigration,
  CaBLEQRCodePayload,
  CaBLESession,
  CaBLESessionOptions,
  CaBLESignatureRoundtrip,
  CaBLEStep,
  CaBLEWebSocketTunnel,
} from './passkey/caBLE/index.js';
export {
  encodeCaBLEQRURI,
  establishWebSocketTunnel,
  generateCaBLEQRCode,
  migrateCredential,
  performBLEHandshake,
  performSignatureRoundtrip,
  runCaBLESession,
} from './passkey/caBLE/index.js';

// OAuth 2.1 adapter surface (v1.21-1c, GH #850). Mock Authorization Server
// covering RFC 9700 (OAuth 2.1) + RFC 9449 (DPoP) + RFC 7636 (PKCE S256) +
// RFC 7009 (revocation) + RFC 7662 (introspection). Rejects the historical
// grants OAuth 2.1 dropped — `implicit`, `password`, `client_credentials`
// grant paths refuse at the type level and at runtime.
export type {
  AccessToken,
  AuthorizationRequest,
  AuthorizationResponse,
  AuthorizationServer,
  AuthorizationServerOptions,
  AuthorizationUser,
  ClientRegistration,
  DpopJwk,
  DpopProof,
  DpopProofInput,
  IntrospectionResponse,
  OAuth21GrantType,
  OAuth21TestEnv,
  PkceChallenge,
  PkceChallengeMethod,
  RefreshToken,
  SetupOAuth21EnvOptions,
  TokenRequest,
  TokenResponse,
} from './oauth21/types.js';
export {
  __resetDpopCounters,
  __resetOAuth21Counters,
  __resetPkceCounter,
  __resetTokenCounters,
  computeJkt as computeDpopJkt,
  createAuthorizationServer,
  createDpopProof,
  createMockDpopJwk,
  createPkceChallenge,
  deriveCodeChallenge,
  generateCodeVerifier,
  mintAccessToken,
  mintRefreshToken,
  parseDpopProof,
  rotateRefreshToken,
  setupOAuth21Env,
  verifyCodeChallenge,
  verifyDpopProof,
} from './oauth21/index.js';

// OIDC adapter surface (v1.21-1d, GH #851). Mock OpenID Provider covering
// OpenID Connect Core 1.0 (§2 id_token + §3.1.3.6-7 hashes) + Discovery 1.0
// + RFC 7591 Dynamic Client Registration + JWKS rotation w/ retention
// window + OpenID Federation 1.0 §7 trust-chain resolution. Layers on top
// of the OAuth 2.1 adapter (v1.21-1c) — the OP is really the OAuth 2.1 AS
// with the OIDC extensions bolted on. The mock re-uses the OAuth 2.1
// authorization_code + PKCE + DPoP flow verbatim and adds the id_token /
// discovery / DCR / JWKS / federation surface on top.
export type {
  ClientRegistrationRequest,
  ClientRegistrationResponse,
  DiscoveryEndpoint,
  EntityStatement as OidcEntityStatement,
  IdToken,
  IdTokenClaims,
  JwksDocument,
  JwksEndpoint,
  JwksKey,
  OidcTestEnv,
  OpenIdProviderMetadata,
  ResolveTrustChainInput,
  SetupOidcEnvOptions,
  SignIdTokenInput,
  TrustAnchor,
  TrustChainReasonCode,
  TrustChainResult,
  VerifyIdTokenOptions,
  VerifyIdTokenResult,
} from './oidc/types.js';
export {
  __resetDcrCounter,
  __resetIdTokenCounter,
  __resetJwksCounter,
  __resetOidcCounters,
  computeTokenHash,
  createDcrEndpoint,
  createDiscoveryEndpoint,
  createEntityStatement as createOidcEntityStatement,
  createIdTokenSigner,
  createJwksEndpoint,
  createTrustAnchor as createOidcTrustAnchor,
  dynamicClientRegistration,
  mintSoftwareStatement,
  resolveTrustChain as resolveOidcTrustChain,
  setupOidcEnv,
} from './oidc/index.js';

// v0.6 advanced Passwordless UX semantics (v1.44).
export * as semantics from './semantics/index.js';
export type {
  AuthAxis,
  AuthPlatform,
  AxisStep as SemanticsAxisStep,
  NeutralEventName as SemanticsNeutralEventName,
} from './semantics/types.js';
```

#### `serializeSupabaseSiweMessage`

公開 entry point から解決しています。

`serializeSiweMessage` を `serializeSupabaseSiweMessage` として公開しています。

Build the canonical EIP-4361 message string. Consumers can hash + sign this verbatim with a real client library, and the mock will verify it back.

```ts
export {
  buildOtpAuthUri as buildSupabaseOtpAuthUri,
  deriveMockAddress as deriveSupabaseMockAddress,
  generateBackupCodes as generateSupabaseBackupCodes,
  generateSiweNonce as generateSupabaseSiweNonce,
  generateTotpCode as generateSupabaseTotpCode,
  generateTotpSecret as generateSupabaseTotpSecret,
  serializeSiweMessage as serializeSupabaseSiweMessage,
  setupSupabaseAdvancedEnv,
  verifyTotpCode as verifySupabaseTotpCode,
} from './supabase-advanced/setup-supabase-advanced-env.js';
```

#### `setupAuth0Env`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L48) `packages/auth/src/auth0/setup-auth0-env.ts`

Build an Auth0 test env. The returned handle exposes `users` (Management API surface), `authenticate` (Authentication API surface), `rules` (legacy rules registry), and `actions` (post-login / pre-user-registration / post-user-registration / post-change-password triggers) plus `verifyIdToken` / `verifyAccessToken` helpers that validate JWTs issued by the same env. Consumers wire the env into their code by either (a) swapping the real `ManagementClient` / `AuthenticationClient` for `env.users` / `env.authenticate` in test setup, or (b) driving the token flow directly with `env.authenticate.signIn` + `env.verifyIdToken`.

```ts
export declare function setupAuth0Env(opts?: SetupAuth0EnvOptions): Promise<Auth0TestEnv>;
```

#### `setupBetterAuthEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/setup-better-auth-env.ts#L37) `packages/auth/src/better-auth/setup-better-auth-env.ts`

```ts
export declare function setupBetterAuthEnv(opts?: SetupBetterAuthEnvOptions): Promise<BetterAuthTestEnv>;
```

#### `setupClerkEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L30) `packages/auth/src/clerk/setup-clerk-env.ts`

Build a Clerk test env. The returned handle exposes a `users` / `sessions` / `organizations` surface that mirrors `@clerk/backend`'s SDK, plus a `verifyToken` helper that validates JWTs issued by the same env. Consumers wire the env into their code by either (a) swapping the real `@clerk/backend` client for `env` in the test setup, or (b) driving the handlers directly with `env.signIn` + `env.verifyToken`.

```ts
export declare function setupClerkEnv(opts?: SetupClerkEnvOptions): Promise<ClerkTestEnv>;
```

#### `setupLuciaEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/setup-lucia-env.ts#L30) `packages/auth/src/lucia/setup-lucia-env.ts`

```ts
export declare function setupLuciaEnv(opts?: SetupLuciaEnvOptions): Promise<LuciaTestEnv>;
```

#### `setupNextAuthEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/setup-nextauth-env.ts#L18) `packages/auth/src/setup-nextauth-env.ts`

```ts
export declare function setupNextAuthEnv(opts?: SetupNextAuthEnvOptions): Promise<NextAuthTestEnv>;
```

#### `setupOAuth21Env`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/setup-oauth21-env.ts#L40) `packages/auth/src/oauth21/setup-oauth21-env.ts`

Set up the OAuth 2.1 test environment. Composes a mock Authorization Server with PKCE + DPoP helpers so a test can drive the full RFC 9700 flow through a single handle. The env is hermetic — every mutation goes through the returned surface, and a single `stop()` disposes the AS state. Consecutive `setupOAuth21Env` calls in the same process should be preceded by `__resetOAuth21Counters()` when reproducibility of ids matters.

```ts
export declare function setupOAuth21Env(options?: SetupOAuth21EnvOptions): Promise<OAuth21TestEnv>;
```

#### `setupOidcEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/setup-oidc-env.ts#L46) `packages/auth/src/oidc/setup-oidc-env.ts`

Set up the OIDC test environment. Composes: - the OAuth 2.1 mock AS (OIDC layers on top of it), - the Discovery endpoint (`/.well-known/openid-configuration`), - the JWKS endpoint (RS256 / ES256 + kid rotation + retention), - the DCR endpoint (RFC 7591), - the id_token signer + verifier (OIDC Core §2 + §3.1.3.6-7), - the Federation trust-chain resolver (OIDF 1.0 §7). The env is hermetic — every mutation goes through the returned surface, and a single `stop()` disposes the underlying OAuth 2.1 AS + resets the OIDC state.

```ts
export declare function setupOidcEnv(options?: SetupOidcEnvOptions): Promise<OidcTestEnv>;
```

#### `setupPasskeyEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/setup-passkey-env.ts#L75) `packages/auth/src/passkey/setup-passkey-env.ts`

Set up the passkey test environment. Composes WebAuthn primitives with per-device grouping and sync fabric wiring — every device has its own set of authenticators and credential stores, and every credential lives on exactly one device unless it has been synced through a fabric. The env owns the WebAuthn base-module state (global registry, ownership map) so a single `stop()` disposes the whole graph and consecutive `setupPasskeyEnv` calls are hermetic when preceded by `__resetPasskeyCounters()`.

```ts
export declare function setupPasskeyEnv(opts?: SetupPasskeyEnvOptions): Promise<PasskeyTestEnv>;
```

#### `setupSupabaseAdvancedEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L76) `packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts`

Build a Supabase Auth advanced test env. Layers RLS / MFA / SSO SAML / SIWE on top of the same JWT + session shape the core adapter uses. The advanced env owns its own user + session store — consumers who need core-adapter flows too should keep both envs side by side, or wire the core env's `verifyToken` to a subset of the advanced env's users.

```ts
export declare function setupSupabaseAdvancedEnv(opts?: SetupSupabaseAdvancedEnvOptions): Promise<SupabaseAdvancedTestEnv>;
```

#### `setupSupabaseAuthEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L36) `packages/auth/src/supabase/setup-supabase-auth-env.ts`

Build a Supabase Auth test env. The returned handle exposes an `auth` (client) + `admin` (service-role) surface that mirrors `@supabase/supabase-js`'s `client.auth.*` + `client.auth.admin.*` API, plus a `verifyToken` helper that validates access tokens issued by the same env. v0.3 scope covers Supabase Auth core semantics — email/password + OAuth (Google/GitHub/Apple) + magic link + JWT session mock. RLS policy mock / MFA / SSO SAML / Web3 wallet auth are covered by the advanced adapter (v1.10-2).

```ts
export declare function setupSupabaseAuthEnv(opts?: SetupSupabaseAuthEnvOptions): Promise<SupabaseAuthTestEnv>;
```

#### `setupWebAuthnEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/setup-webauthn-env.ts#L41) `packages/auth/src/webauthn/setup-webauthn-env.ts`

Set up the WebAuthn test environment. Creates zero or more virtual authenticators (as configured), a shared credential registry, and returns a `WebAuthnTestEnv` handle. Follow-on calls (`credentialCreation` / `credentialAssertion`) go through the returned env. When no authenticator is passed the env is empty — the caller adds authenticators lazily with `addAuthenticator`. Most tests preseed one platform authenticator to mirror the Chrome DevTools "add virtual authenticator" workflow.

```ts
export declare function setupWebAuthnEnv(opts?: SetupWebAuthnEnvOptions): Promise<WebAuthnTestEnv>;
```

#### `signAuth0AccessToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L46) `packages/auth/src/auth0/jwt.ts`

Sign a set of Auth0 access_token claims. Same signature shape as id_token — Auth0's real access tokens are separately signed with the tenant's key pair, but for the mock they share the per-env secret to keep the verify path uniform.

```ts
export declare function signAuth0AccessToken(claims: Auth0AccessTokenClaims, secret: string): string;
```

#### `signAuth0IdToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L36) `packages/auth/src/auth0/jwt.ts`

Sign a set of Auth0 id_token claims into a `&lt;header&gt;.&lt;payload&gt;.&lt;signature&gt;` JWT. The secret is unique per test env — tokens issued by one env cannot be verified by another, which mirrors Auth0's per-tenant signing keys.

```ts
export declare function signAuth0IdToken(claims: Auth0IdTokenClaims, secret: string): string;
```

#### `signClerkJwt`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/jwt.ts#L35) `packages/auth/src/clerk/jwt.ts`

Sign a set of Clerk session claims into a `&lt;header&gt;.&lt;payload&gt;.&lt;signature&gt;` JWT. The secret is unique per test env (generated at setup) — tokens issued by one env cannot be verified by another, which mirrors Clerk's per-instance signing keys.

```ts
export declare function signClerkJwt(claims: ClerkSessionClaims, secret: string): string;
```

#### `signSupabaseAccessToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/jwt.ts#L30) `packages/auth/src/supabase/jwt.ts`

Sign a set of Supabase access-token claims into a `&lt;header&gt;.&lt;payload&gt;.&lt;signature&gt;` JWT. The secret is unique per test env — tokens issued by one env cannot be verified by another, mirroring per-project JWT_SECRET separation in production.

```ts
export declare function signSupabaseAccessToken(claims: SupabaseAccessTokenClaims, secret: string): string;
```

#### `syncPasskeyCredentials`

公開 entry point から解決しています。

`syncCredentials` を `syncPasskeyCredentials` として公開しています。

Copy every backup-eligible credential owned by `userId` from `source` into `target` via the shared fabric. Mirrors the "sign in on a new device" ceremony — the new device is the target, the fabric is the shared vendor, and every credential is backed up on the source side then restored on the target side. Returns the list of credentials that landed on the target. Skips credentials owned by other users (per-user isolation) and non-backup- eligible credentials (bare security key credentials cannot ride the fabric).

```ts
export {
  __resetPasskeyCounters,
  backupCredential as backupPasskeyCredential,
  createPlatformAuthenticator,
  createRoamingAuthenticator,
  createSyncFabric,
  findFabricHolding as findPasskeyFabricHolding,
  requireFabric as requirePasskeyFabric,
  restoreCredential as restorePasskeyCredential,
  setupPasskeyEnv,
  syncCredentials as syncPasskeyCredentials,
} from './passkey/index.js';
```

#### `upsertUserFromProfile`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/session.ts#L29) `packages/auth/src/session.ts`

Materialise a profile into a persisted user / account pair, mirroring the flow that NextAuth's `signIn` callback runs when a real provider returns.

```ts
export declare function upsertUserFromProfile(database: AuthDatabaseAdapter, profile: AuthProfile): Promise<AuthUser>;
```

#### `validateBetterAuthSessionByToken`

公開 entry point から解決しています。

`validateSessionByToken` を `validateBetterAuthSessionByToken` として公開しています。

```ts
export {
  createSessionFor as createBetterAuthSessionFor,
  generateSessionId as generateBetterAuthSessionId,
  generateSessionToken as generateBetterAuthSessionToken,
  invalidateSessionsForUser as invalidateBetterAuthSessionsForUser,
  validateSessionByToken as validateBetterAuthSessionByToken,
} from './better-auth/session.js';
```

#### `validateSessionId`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/session.ts#L43) `packages/auth/src/lucia/session.ts`

Validate a session id. Mirrors Lucia's rolling-expiration behaviour: - expired session → delete and return null - session in the refresh window (less than half the lifetime remaining) → extend `expiresAt` and mark the returned session `fresh: true` - session comfortably valid → return as-is with `fresh: false`

```ts
export declare function validateSessionId(database: LuciaDatabaseAdapter, sessionId: string, expirationSeconds: number): Promise<{
    user: LuciaUser;
    session: LuciaSession;
} | null>;
```

#### `verifyAuth0AccessToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L88) `packages/auth/src/auth0/jwt.ts`

Verify an access_token. Auth0's access tokens can have `aud` as string or string[] — the mock accepts both and matches the expected audience against every entry.

```ts
export declare function verifyAuth0AccessToken(token: string, secret: string, expected: {
    issuer: string;
    audience: string;
}): Auth0AccessTokenClaims;
```

#### `verifyAuth0IdToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L64) `packages/auth/src/auth0/jwt.ts`

Verify an id_token and return its decoded claims. Throws on shape mismatch, signature mismatch, expired token, or issuer mismatch. Mirrors what `express-jwt` + JWKS verification does in a real Auth0 backend.

```ts
export declare function verifyAuth0IdToken(token: string, secret: string, expected: {
    issuer: string;
    audience: string;
}): Auth0IdTokenClaims;
```

#### `verifyBetterAuthPassword`

公開 entry point から解決しています。

`verifyPassword` を `verifyBetterAuthPassword` として公開しています。

```ts
export {
  hashPassword as hashBetterAuthPassword,
  verifyPassword as verifyBetterAuthPassword,
} from './better-auth/password.js';
```

#### `verifyClerkJwt`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/jwt.ts#L49) `packages/auth/src/clerk/jwt.ts`

Verify a JWT and return its decoded claims. Throws on shape mismatch, signature mismatch, or expired token. Mirrors `verifyToken` from `@clerk/backend` — the error messages surface which failure mode hit.

```ts
export declare function verifyClerkJwt(token: string, secret: string): ClerkSessionClaims;
```

#### `verifyCodeChallenge`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/pkce.ts#L99) `packages/auth/src/oauth21/pkce.ts`

Verify that a supplied `codeVerifier` hashes to the stored `codeChallenge`. Used by the token endpoint on `authorization_code` exchange.

```ts
export declare function verifyCodeChallenge(codeVerifier: string, codeChallenge: string, method: PkceChallengeMethod): boolean;
```

#### `verifyDpopProof`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L168) `packages/auth/src/oauth21/dpop.ts`

Verify a DPoP proof per RFC 9449 §4.3. Checks the header shape (`typ`, `alg`, `jwk`), the payload fields (`htm`, `htu`, `iat`, `jti`), and the replay registry. Returns the parsed proof on success so the caller can pluck the JWK thumbprint. Throws on failure with a specific reason.

```ts
export declare function verifyDpopProof(proof: DpopProof, options: VerifyDpopProofOptions): DpopProof;
```

#### `verifyPassword`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/password.ts#L56) `packages/auth/src/lucia/password.ts`

Verify a password against a previously issued hash. Returns false for any malformed hash rather than throwing — matches the real argon2 verifier and lets sign-in flows treat the outcome as a boolean at the call site.

```ts
export declare function verifyPassword(hash: string, password: string): Promise<boolean>;
```

#### `verifySupabaseAccessToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/jwt.ts#L47) `packages/auth/src/supabase/jwt.ts`

Verify a Supabase access token JWT and return its decoded claims. Throws on shape mismatch, signature mismatch, or expired token. Mirrors GoTrue's own verification path.

```ts
export declare function verifySupabaseAccessToken(token: string, secret: string): SupabaseAccessTokenClaims;
```

#### `verifySupabaseTotpCode`

公開 entry point から解決しています。

`verifyTotpCode` を `verifySupabaseTotpCode` として公開しています。

```ts
export {
  buildOtpAuthUri as buildSupabaseOtpAuthUri,
  deriveMockAddress as deriveSupabaseMockAddress,
  generateBackupCodes as generateSupabaseBackupCodes,
  generateSiweNonce as generateSupabaseSiweNonce,
  generateTotpCode as generateSupabaseTotpCode,
  generateTotpSecret as generateSupabaseTotpSecret,
  serializeSiweMessage as serializeSupabaseSiweMessage,
  setupSupabaseAdvancedEnv,
  verifyTotpCode as verifySupabaseTotpCode,
} from './supabase-advanced/setup-supabase-advanced-env.js';
```

#### `verifyTotpCode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/totp.ts#L39) `packages/auth/src/better-auth/totp.ts`

```ts
export declare function verifyTotpCode(secret: string, code: string, nowMs?: number): boolean;
```

#### `webAuthnClientDataHash`

公開 entry point から解決しています。

`clientDataHash` を `webAuthnClientDataHash` として公開しています。

SHA-256-like deterministic digest for clientDataJSON. WebAuthn L3 §7.1 uses SHA-256; the mock uses fnv-1a widened to 32 bytes for a deterministic short digest that fits the same byte width as SHA-256.

```ts
export {
  __resetWebAuthnCounters,
  base64UrlDecode as base64UrlDecodeWebAuthn,
  base64UrlEncode as base64UrlEncodeWebAuthn,
  clientDataHash as webAuthnClientDataHash,
  createVirtualAuthenticator,
  credentialAssertion as webAuthnCredentialAssertion,
  credentialCreation as webAuthnCredentialCreation,
  mockSignature as webAuthnMockSignature,
  normalizeChallenge as webAuthnNormalizeChallenge,
  setupWebAuthnEnv,
} from './webauthn/index.js';
```

#### `webAuthnCredentialAssertion`

公開 entry point から解決しています。

`credentialAssertion` を `webAuthnCredentialAssertion` として公開しています。

Simulate `navigator.credentials.get({ publicKey })`. Produces an `AuthenticatorAssertionResponse` shaped like WebAuthn L3 §5.2.2. Enforces the RP-facing checks that a real RP library performs on the response — clientData.type must be `webauthn.get`, challenge must match, user verification bit must be set when requested, and signCount must increase monotonically (§7.2 step 21). `credentialOwnership` maps `credentialId -&gt; authenticatorId` so the mock routes each assertion through the authenticator that actually holds the credential. Real WebAuthn enforces this at the client-side discovery step (§5.5) — the mock mirrors it so a bug that assumes credentials float between authenticators surfaces at test time.

```ts
export {
  __resetWebAuthnCounters,
  base64UrlDecode as base64UrlDecodeWebAuthn,
  base64UrlEncode as base64UrlEncodeWebAuthn,
  clientDataHash as webAuthnClientDataHash,
  createVirtualAuthenticator,
  credentialAssertion as webAuthnCredentialAssertion,
  credentialCreation as webAuthnCredentialCreation,
  mockSignature as webAuthnMockSignature,
  normalizeChallenge as webAuthnNormalizeChallenge,
  setupWebAuthnEnv,
} from './webauthn/index.js';
```

#### `webAuthnCredentialCreation`

公開 entry point から解決しています。

`credentialCreation` を `webAuthnCredentialCreation` として公開しています。

Simulate `navigator.credentials.create({ publicKey })`. Produces an `AuthenticatorAttestationResponse` shaped like WebAuthn L3 §5.2.1 and writes the resulting credential into the authenticator's in-memory store. Called from `WebAuthnTestEnv.credentialCreation` — the env passes the authenticator selected by the caller (or its default).

```ts
export {
  __resetWebAuthnCounters,
  base64UrlDecode as base64UrlDecodeWebAuthn,
  base64UrlEncode as base64UrlEncodeWebAuthn,
  clientDataHash as webAuthnClientDataHash,
  createVirtualAuthenticator,
  credentialAssertion as webAuthnCredentialAssertion,
  credentialCreation as webAuthnCredentialCreation,
  mockSignature as webAuthnMockSignature,
  normalizeChallenge as webAuthnNormalizeChallenge,
  setupWebAuthnEnv,
} from './webauthn/index.js';
```

#### `webAuthnMockSignature`

公開 entry point から解決しています。

`mockSignature` を `webAuthnMockSignature` として公開しています。

Deterministic mock signature over `(publicKey || authenticatorData || clientDataJSONHash)`. Real WebAuthn signatures are ES256 / RS256 / EdDSA over that concatenation (WebAuthn L3 §6.5.4). The mock uses a fnv-1a hash for stability across runs so fixture comparisons stay deterministic.

```ts
export {
  __resetWebAuthnCounters,
  base64UrlDecode as base64UrlDecodeWebAuthn,
  base64UrlEncode as base64UrlEncodeWebAuthn,
  clientDataHash as webAuthnClientDataHash,
  createVirtualAuthenticator,
  credentialAssertion as webAuthnCredentialAssertion,
  credentialCreation as webAuthnCredentialCreation,
  mockSignature as webAuthnMockSignature,
  normalizeChallenge as webAuthnNormalizeChallenge,
  setupWebAuthnEnv,
} from './webauthn/index.js';
```

#### `webAuthnNormalizeChallenge`

公開 entry point から解決しています。

`normalizeChallenge` を `webAuthnNormalizeChallenge` として公開しています。

Normalize a challenge or credential.id that a caller may hand in as either `string` (base64url or plain UTF-8) or `Uint8Array`.

```ts
export {
  __resetWebAuthnCounters,
  base64UrlDecode as base64UrlDecodeWebAuthn,
  base64UrlEncode as base64UrlEncodeWebAuthn,
  clientDataHash as webAuthnClientDataHash,
  createVirtualAuthenticator,
  credentialAssertion as webAuthnCredentialAssertion,
  credentialCreation as webAuthnCredentialCreation,
  mockSignature as webAuthnMockSignature,
  normalizeChallenge as webAuthnNormalizeChallenge,
  setupWebAuthnEnv,
} from './webauthn/index.js';
```

### 型

#### `AccessToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L182) `packages/auth/src/oauth21/types.ts`

Access token minted by `/token`. Contains just enough state for the mock to answer `/introspect` and `/revoke` — a real JWT would encode this into claims, the mock keeps a plain record for test ergonomics.

```ts
export interface AccessToken {
    token: string;
    tokenType: 'Bearer' | 'DPoP';
    expiresAt: number;
    scope: string;
    clientId: string;
    subject: string;
    /**
     * SHA-256 thumbprint of the DPoP public JWK the token is bound to. Absent
     * when the token is a plain bearer.
     */
    dpopJkt?: string;
    /** Resource indicator (RFC 8707) the token is bound to, when supplied. */
    resource?: string;
}
```

#### `Auth0AccessTokenClaims`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/types.ts#L120) `packages/auth/src/auth0/types.ts`

Access token claims — Auth0 issues these when an API audience is configured. Tokens are consumed by backend APIs and verified with the tenant's JWKS.

```ts
export interface Auth0AccessTokenClaims {
    sub: string;
    /** Audience — the API identifier (a URL string in Auth0). */
    aud: string | string[];
    iss: string;
    iat: number;
    exp: number;
    /** azp — always the client id, matches OIDC. */
    azp?: string | undefined;
    /** Scopes granted (space-separated string in prod, kept as string here). */
    scope?: string | undefined;
    /**
     * Permissions array — Auth0 RBAC exposes granular perms alongside scope.
     * Populated when `add_permissions_in_the_access_token` is enabled.
     */
    permissions?: string[] | undefined;
    /** Custom claims from rules / actions, namespaced same as id_token. */
    [customClaim: string]: unknown;
}
```

#### `Auth0Action`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/types.ts#L238) `packages/auth/src/auth0/types.ts`

An action's callback shape — signature mirrors Auth0's real Actions runtime, `async (event, api) =&gt; void`. The mock invokes actions sequentially with shared idToken/accessToken/user mutations across the pipeline.

```ts
export type Auth0Action = (event: Auth0ActionEvent, api: Auth0ActionApi) => Promise<void> | void;
```

#### `Auth0ActionApi`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/types.ts#L210) `packages/auth/src/auth0/types.ts`

```ts
export interface Auth0ActionApi {
    idToken: {
        setCustomClaim: (name: string, value: unknown) => void;
    };
    accessToken: {
        setCustomClaim: (name: string, value: unknown) => void;
        /** Add a permission — Auth0 RBAC. Appends to `permissions` claim. */
        addScope: (scope: string) => void;
    };
    user: {
        setAppMetadata: (name: string, value: unknown) => void;
        setUserMetadata: (name: string, value: unknown) => void;
    };
    /** Redirect the user post-action. */
    redirect: {
        sendUserTo: (url: string) => void;
    };
    /** Deny the login — Auth0 aborts with the reason returned to the client. */
    access: {
        deny: (reason: string) => void;
    };
}
```

#### `Auth0ActionEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/types.ts#L190) `packages/auth/src/auth0/types.ts`

```ts
export interface Auth0ActionEvent {
    /** User the action fires for. */
    user: Auth0User;
    /** Connection metadata — kind (`Username-Password-Authentication` etc). */
    connection: {
        name: string;
        strategy: string;
    };
    /** Client the login belongs to. */
    client: {
        client_id: string;
        name: string;
    };
    /** Auth-hop data — carries request context (ip / method / etc). */
    request: {
        ip?: string;
        method: string;
    };
}
```

#### `Auth0ActionTrigger`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/types.ts#L184) `packages/auth/src/auth0/types.ts`

Actions — Auth0's current extensibility model. An action targets a trigger (post-login / pre-user-registration / etc) and receives an `event` object + an `api` object with helpers for mutation (idToken.setCustomClaim / accessToken.setCustomClaim / redirect.sendUserTo / user.setAppMetadata). The mock covers the two most common triggers.

```ts
export type Auth0ActionTrigger = 'post-login' | 'pre-user-registration' | 'post-user-registration' | 'post-change-password';
```

#### `Auth0Connection`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/types.ts#L23) `packages/auth/src/auth0/types.ts`

Auth0's user identity — the real profile carries dozens of fields; the mock covers what tests assert against (email + email_verified + connection + identities + app_metadata + user_metadata + Auth0's opaque `user_id` and the `sub` claim shape `&lt;connection&gt;|&lt;connection_user_id&gt;`).

```ts
export type Auth0Connection = 'Username-Password-Authentication' | 'google-oauth2' | 'github' | 'auth0' | 'sms' | 'email';
```

#### `Auth0Identity`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/types.ts#L44) `packages/auth/src/auth0/types.ts`

```ts
export interface Auth0Identity {
    /** Provider name — same taxonomy as the connection. */
    provider: Auth0Connection;
    /** Provider-side user id (the part after `|` in `sub`). */
    user_id: string;
    connection: string;
    isSocial: boolean;
}
```

#### `Auth0IdTokenClaims`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/types.ts#L88) `packages/auth/src/auth0/types.ts`

OIDC id_token claims Auth0 issues. Standard OIDC (sub / aud / iss / iat / exp) plus Auth0-specific extras (nickname / email / email_verified) and namespaced custom claims injected by rules / actions.

```ts
export interface Auth0IdTokenClaims {
    /** Subject — the Auth0 `user_id`. */
    sub: string;
    /** Audience — the Auth0 client id the token was issued for. */
    aud: string;
    /** Issuer — the tenant's Auth0 domain (`https://<tenant>.auth0.com/`). */
    iss: string;
    /** Issued-at seconds. */
    iat: number;
    /** Expiry seconds. */
    exp: number;
    /** Nonce — echoed from the authorize request. */
    nonce?: string | undefined;
    email?: string | undefined;
    email_verified?: boolean | undefined;
    name?: string | undefined;
    nickname?: string | undefined;
    picture?: string | undefined;
    /** Auth0 azp claim — the authorized party (client id). */
    azp?: string | undefined;
    /**
     * Custom claims injected by rules / actions. Auth0 recommends namespaced
     * URIs (`https://myapp.example/roles`) to avoid collisions — the mock stores
     * them as an open string-keyed record.
     */
    [customClaim: string]: unknown;
}
```

#### `Auth0Rule`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/types.ts#L171) `packages/auth/src/auth0/types.ts`

```ts
export type Auth0Rule = (user: Auth0User, context: Auth0RuleContext, callback: (err: Error | null, user?: Auth0User, context?: Auth0RuleContext) => void) => void;
```

#### `Auth0RuleContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/types.ts#L147) `packages/auth/src/auth0/types.ts`

Rules — Auth0's legacy pipeline (still supported for tenants pre-Actions). A rule is a `(user, context, callback) =&gt; void` in prod; the mock exposes the same signature so consumers can drop existing rules straight in. Rules run in order during login and can mutate `context.idToken` / `context.accessToken` (namespaced claim injection) and `user.app_metadata`.

```ts
export interface Auth0RuleContext {
    /** Client id the login is scoped to. */
    clientID: string;
    /** Connection the user authenticated with. */
    connection: string;
    /**
     * ID token claim namespace. Rules mutate this to inject custom claims —
     * e.g. `context.idToken['https://myapp.example/roles'] = ['admin']`.
     */
    idToken: Record<string, unknown>;
    /**
     * Access token claim namespace. Same shape, mutations flow into the
     * `access_token` JWT.
     */
    accessToken: Record<string, unknown>;
    /**
     * Redirect URL — set by rules to redirect the user after login (e.g.
     * enforce a step-up MFA challenge on a separate page).
     */
    redirect?: {
        url: string;
    };
}
```

#### `Auth0TestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/types.ts#L300) `packages/auth/src/auth0/types.ts`

Test env returned by {@link setupAuth0Env }. Consumers hold this handle for the lifetime of a test and call `stop()` in `afterEach` to reset all in-memory state. The `users` / `authenticate` / `rules` / `actions` handles mirror the shape of the real `auth0` node SDK.

```ts
export interface Auth0TestEnv extends TestEnvBase<'mock'> {
    tenant: string;
    clientId: string;
    audience: string | undefined;
    issuer: string;
    tokenExpiration: number;
    /**
     * Management API users surface — mirrors `ManagementClient.users.*` from
     * the `auth0` node SDK. Consumers that use the real client swap it for
     * this surface in test setup and every call resolves against the store.
     */
    users: {
        create: (input: {
            email: string;
            connection?: Auth0Connection;
            email_verified?: boolean;
            name?: string;
            nickname?: string;
            picture?: string;
            app_metadata?: Record<string, unknown>;
            user_metadata?: Record<string, unknown>;
        }) => Promise<Auth0User>;
        get: (userId: string) => Promise<Auth0User>;
        getByEmail: (email: string) => Promise<Auth0User | null>;
        update: (userId: string, patch: Partial<Pick<Auth0User, 'name' | 'nickname' | 'picture' | 'app_metadata' | 'user_metadata' | 'blocked'>>) => Promise<Auth0User>;
        delete: (userId: string) => Promise<void>;
        list: () => Promise<Auth0User[]>;
    };
    /**
     * Authentication API — mirrors the `AuthenticationClient` surface.
     * `signIn` = password grant / social login combined path (mock treats both
     * uniformly). `signUp` = database connection signup. Both return the
     * id_token + access_token pair.
     */
    authenticate: {
        signIn: (input: {
            email: string;
            /** Password — checked when the user's connection is Username-Password. */
            password?: string;
            /** Explicit connection override — otherwise the user's connection is used. */
            connection?: Auth0Connection;
            /** Nonce echoed back into the id_token. */
            nonce?: string;
            /** Request IP — passed to actions. */
            ip?: string;
        }) => Promise<{
            user: Auth0User;
            id_token: string;
            access_token: string;
            /** Redirect URL set by a rule / action, when present. */
            redirect_url?: string | undefined;
        }>;
        signUp: (input: {
            email: string;
            password: string;
            connection?: Auth0Connection;
            user_metadata?: Record<string, unknown>;
        }) => Promise<{
            user: Auth0User;
            id_token: string;
            access_token: string;
        }>;
    };
    /**
     * Rules registry. Rules run sequentially in the order they were added, and
     * can mutate tokens + user through the callback signature.
     */
    rules: {
        add: (rule: Auth0Rule) => void;
        list: () => Auth0Rule[];
        clear: () => void;
    };
    /**
     * Actions registry keyed by trigger. Actions run in registration order per
     * trigger. `post-login` fires on `signIn`, `pre-user-registration` fires
     * before `signUp` completes, `post-user-registration` fires after signUp.
     */
    actions: {
        add: (trigger: Auth0ActionTrigger, action: Auth0Action) => void;
        list: (trigger: Auth0ActionTrigger) => Auth0Action[];
        clear: (trigger?: Auth0ActionTrigger) => void;
    };
    /**
     * Verify an id_token — checks signature, expiry, issuer, and audience.
     * Throws when any of those fail. Mirrors `jwt.verify` with the tenant JWKS.
     */
    verifyIdToken: (token: string) => Promise<Auth0IdTokenClaims>;
    /**
     * Verify an access_token — same signature check + audience is matched
     * against the API audience configured on the env.
     */
    verifyAccessToken: (token: string) => Promise<Auth0AccessTokenClaims>;
    /**
     * Set app_metadata on a user directly — Auth0 users.update shortcut.
     * Useful for tests that want to seed app_metadata before signIn flows so
     * post-login actions can read it.
     */
    setAppMetadata: (userId: string, patch: Record<string, unknown>) => Promise<Auth0User>;
}
```

#### `Auth0User`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/types.ts#L53) `packages/auth/src/auth0/types.ts`

```ts
export interface Auth0User {
    /** Auth0's user id — matches `sub` claim shape (`connection|providerUserId`). */
    user_id: string;
    email: string;
    email_verified: boolean;
    name?: string | undefined;
    nickname?: string | undefined;
    picture?: string | undefined;
    /** Primary connection the user was created in (Username-Password / google-oauth2 / etc). */
    connection: Auth0Connection;
    /** All linked identities (Auth0's account-linking surface). */
    identities: Auth0Identity[];
    /**
     * App metadata — surfaced in tokens under the app namespace claim, writable
     * only via Management API. Tests assert against it after actions run.
     */
    app_metadata?: Record<string, unknown> | undefined;
    /**
     * User metadata — surfaced under the user namespace claim, editable by the
     * end user through Account Settings.
     */
    user_metadata?: Record<string, unknown> | undefined;
    created_at: Date;
    updated_at: Date;
    /** Last login timestamp — set when signIn flows complete. */
    last_login?: Date | undefined;
    /** Blocked flag — Auth0 marks accounts disabled via Management API. */
    blocked?: boolean | undefined;
}
```

#### `AuthAccount`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L35) `packages/auth/src/types.ts`

```ts
export interface AuthAccount {
    userId: string;
    provider: ProviderKind;
    providerAccountId: string;
    type: 'oauth' | 'email';
}
```

#### `AuthAxis`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/types.ts#L24) `packages/auth/src/semantics/types.ts`

```ts
export type AuthAxis = 'device-bound-passkey' | 'conditional-ui' | 'step-up-mfa' | 'risk-based-auth' | 'auth-continuity' | 'cross-device-flow' | 'session-hijack-detect' | 'auth-telemetry';
```

#### `AuthDatabaseAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L60) `packages/auth/src/types.ts`

Minimal, Auth.js-compatible database adapter surface. Both Prisma (`@auth/prisma-adapter`) and Drizzle (`@auth/drizzle-adapter`) expose the same method names, so the mock can stand in for either.

```ts
export interface AuthDatabaseAdapter {
    createUser: (user: Omit<AuthUser, 'id'>) => Promise<AuthUser>;
    getUser: (id: string) => Promise<AuthUser | null>;
    getUserByEmail: (email: string) => Promise<AuthUser | null>;
    getUserByAccount: (input: {
        provider: ProviderKind;
        providerAccountId: string;
    }) => Promise<AuthUser | null>;
    updateUser: (user: Partial<AuthUser> & {
        id: string;
    }) => Promise<AuthUser>;
    deleteUser: (id: string) => Promise<void>;
    linkAccount: (account: AuthAccount) => Promise<AuthAccount>;
    unlinkAccount: (input: {
        provider: ProviderKind;
        providerAccountId: string;
    }) => Promise<void>;
    createSession: (session: AuthSession) => Promise<AuthSession>;
    getSessionAndUser: (sessionToken: string) => Promise<{
        session: AuthSession;
        user: AuthUser;
    } | null>;
    updateSession: (session: Partial<AuthSession> & {
        sessionToken: string;
    }) => Promise<AuthSession | null>;
    deleteSession: (sessionToken: string) => Promise<void>;
    createVerificationToken: (token: VerificationToken) => Promise<VerificationToken>;
    useVerificationToken: (input: {
        identifier: string;
        token: string;
    }) => Promise<VerificationToken | null>;
    /** Reset all in-memory tables. Test-only affordance not present in real adapters. */
    reset: () => void;
}
```

#### `AuthenticatorAssertionResponse`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L149) `packages/auth/src/webauthn/types.ts`

Authenticator assertion response — the client returns this to the RP after `navigator.credentials.get()`. The mock produces a shape compatible with WebAuthn L3 §5.2.2. `signCount` is returned so the RP can update its stored counter and detect cloned authenticators.

```ts
export interface AuthenticatorAssertionResponse {
    credentialId: string;
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle: string;
    signCount: number;
}
```

#### `AuthenticatorAttestationResponse`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L133) `packages/auth/src/webauthn/types.ts`

Authenticator attestation response — the client returns this to the RP after `navigator.credentials.create()`. The mock produces a shape compatible with WebAuthn L3 §5.2.1; `attestationObject` and `clientDataJSON` are the two fields real RPs decode.

```ts
export interface AuthenticatorAttestationResponse {
    credentialId: string;
    clientDataJSON: string;
    attestationObject: string;
    attestation: WebAuthnAttestationConveyancePreference;
    publicKey: string;
    transports: WebAuthnTransport[];
    attachment: WebAuthnAuthenticatorAttachment;
}
```

#### `AuthenticatorSelectionCriteria`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L71) `packages/auth/src/webauthn/types.ts`

Authenticator selection criteria (WebAuthn L3 §5.4.4). Combines the fields an RP passes to `navigator.credentials.create({ publicKey: { authenticatorSelection } })`.

```ts
export interface AuthenticatorSelectionCriteria {
    authenticatorAttachment?: WebAuthnAuthenticatorAttachment;
    userVerification?: WebAuthnUserVerificationRequirement;
    residentKey?: WebAuthnResidentKeyRequirement;
    /** Legacy alias — `residentKey: 'required'` supersedes when both are set. */
    requireResidentKey?: boolean;
}
```

#### `AuthorizationRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L121) `packages/auth/src/oauth21/types.ts`

Authorization request submitted to `/authorize`. RFC 9700 §2.1 requires PKCE parameters on every request — `code_challenge` + `code_challenge_method` are mandatory even for confidential clients.

```ts
export interface AuthorizationRequest {
    responseType: 'code';
    clientId: string;
    redirectUri: string;
    state: string;
    scope?: string;
    codeChallenge: string;
    codeChallengeMethod: PkceChallengeMethod;
    /**
     * Optional resource indicator (RFC 8707). When present the AS records it on
     * the issued code so `/token` can bind the resulting access token to that
     * resource.
     */
    resource?: string;
}
```

#### `AuthorizationResponse`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L143) `packages/auth/src/oauth21/types.ts`

Response to a successful `/authorize` call. Real deployments 302-redirect the browser to `redirectUri?code=...&state=...`; the mock returns the parsed shape directly so tests can assert `code` and `state` without HTTP plumbing.

```ts
export interface AuthorizationResponse {
    code: string;
    state: string;
    redirectUri: string;
}
```

#### `AuthorizationServer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L272) `packages/auth/src/oauth21/types.ts`

`AuthorizationServer` return shape from `createAuthorizationServer`. Exposes the RFC 6749 / 9700 / 7662 endpoint surface as plain methods.

```ts
export interface AuthorizationServer {
    readonly issuer: string;
    /** Register an additional client after env construction. */
    registerClient(client: ClientRegistration): void;
    /** Register an additional user after env construction. */
    registerUser(user: AuthorizationUser): void;
    /** Handle an authorization request. Called by tests as if driving `/authorize`. */
    authorize(request: AuthorizationRequest, subject: string): AuthorizationResponse;
    /** Handle a token request. Called by tests as if driving `/token`. */
    token(request: TokenRequest): TokenResponse;
    /** Handle a token revocation. Called by tests as if driving `/revoke`. */
    revoke(token: string, clientId: string): void;
    /** Introspect a token per RFC 7662. */
    introspect(token: string): IntrospectionResponse;
    /**
     * Snapshot every currently-active access token. Test-only inspection —
     * production ASes never expose this.
     */
    listAccessTokens(): readonly AccessToken[];
    /** Snapshot every refresh token, including revoked ones. */
    listRefreshTokens(): readonly RefreshToken[];
    /** Snapshot the set of jti values the AS has seen. */
    listSeenJtis(): readonly string[];
    /** Reset every token, code, and jti registry without disposing the AS. */
    reset(): void;
}
```

#### `AuthorizationServerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L302) `packages/auth/src/oauth21/types.ts`

Options accepted by `createAuthorizationServer`.

```ts
export interface AuthorizationServerOptions {
    issuer?: string;
    clients?: readonly ClientRegistration[];
    users?: readonly AuthorizationUser[];
    /**
     * Access token lifetime in seconds. Defaults to 3600 (RFC 6749 §5.1
     * `expires_in` convention). Tests wanting near-expiry paths pass a small
     * number.
     */
    accessTokenLifetimeSec?: number;
    /**
     * Refresh token lifetime in seconds. Defaults to 86400.
     */
    refreshTokenLifetimeSec?: number;
    /**
     * DPoP proof `iat` skew tolerance in seconds. RFC 9449 §4.3 recommends 60
     * seconds; the mock uses that as default. Callers wanting deterministic
     * tests can override.
     */
    dpopIatSkewSec?: number;
    /** Deterministic clock. When omitted the mock uses `Date.now()`. */
    now?: () => number;
}
```

#### `AuthorizationUser`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L263) `packages/auth/src/oauth21/types.ts`

User account preseeded on the mock AS. Every user has a subject id and a canonical set of scopes the AS is allowed to grant.

```ts
export interface AuthorizationUser {
    subject: string;
    scopes?: readonly string[];
}
```

#### `AuthPlatform`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/types.ts#L22) `packages/auth/src/semantics/types.ts`

Advanced auth semantics — platform-neutral axis SSOT (v0.6 Passwordless UX III). v0.4 auth (v1.21) landed 4 protocol adapter (WebAuthn L3 / Passkey / OAuth 2.1 / OIDC). v0.5 (v1.22) added real driver env-gate + Federation JWKS rotation e2e + a11y gate. v0.6 (v1.44) adds 8 advanced Passwordless UX axes on top of the existing 4 protocol adapter — device-bound-passkey (device bind + credProps.rk + sync fabric verification), conditional-ui (autofill hint + mediation="conditional" + fallback ladder), step-up-mfa (AAL escalation ladder + biometric prompt + trust duration cache), risk-based-auth (risk score + adaptive challenge + policy chain), auth-continuity (seamless re-auth + refresh + session extension + revocation window), cross-device-flow (QR handshake + BLE proximity + hybrid transport + tunnel state machine), session-hijack-detect (fingerprint drift + geo anomaly + concurrent session + logout cascade), and auth-telemetry (attempt log + success rate histogram + latency histogram + abuse detection). Each axis is expressed as a small pure state-machine helper that returns a neutral envelope, so downstream tests can drive the axis without knowing the browser vendor's payload dialect (chromium / webkit / firefox each ship different WebAuthn conditional UI + sync fabric ergonomics).

```ts
export type AuthPlatform = 'chromium' | 'webkit' | 'firefox';
```

#### `AuthProfile`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L21) `packages/auth/src/types.ts`

```ts
export interface AuthProfile {
    provider: ProviderKind;
    providerAccountId: string;
    email: string;
    name?: string | undefined;
}
```

#### `AuthSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L42) `packages/auth/src/types.ts`

```ts
export interface AuthSession {
    sessionToken: string;
    userId: string;
    expires: Date;
}
```

#### `AuthUser`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L28) `packages/auth/src/types.ts`

```ts
export interface AuthUser {
    id: string;
    email: string;
    name?: string | undefined;
    emailVerified?: Date | undefined;
}
```

#### `BetterAuthAccount`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L66) `packages/auth/src/better-auth/types.ts`

```ts
export interface BetterAuthAccount {
    userId: string;
    provider: BetterAuthProviderKind;
    providerAccountId: string;
}
```

#### `BetterAuthDatabaseAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L125) `packages/auth/src/better-auth/types.ts`

Minimal, Better-Auth-compatible database adapter surface. `betterAuth/adapters/prisma`, `betterAuth/adapters/drizzle`, and `betterAuth/adapters/kysely` all funnel through the same operation set at the Better Auth layer.

```ts
export interface BetterAuthDatabaseAdapter {
    kind: BetterAuthDatabaseKind;
    createUser: (user: Omit<BetterAuthUser, 'id' | 'emailVerified'> & {
        emailVerified?: boolean;
    }) => Promise<BetterAuthUser>;
    getUser: (id: string) => Promise<BetterAuthUser | null>;
    getUserByEmail: (email: string) => Promise<BetterAuthUser | null>;
    updateUser: (user: Partial<BetterAuthUser> & {
        id: string;
    }) => Promise<BetterAuthUser>;
    deleteUser: (id: string) => Promise<void>;
    createSession: (session: BetterAuthSession) => Promise<BetterAuthSession>;
    getSession: (id: string) => Promise<BetterAuthSession | null>;
    getSessionByToken: (token: string) => Promise<BetterAuthSession | null>;
    deleteSession: (id: string) => Promise<void>;
    deleteUserSessions: (userId: string) => Promise<number>;
    linkAccount: (account: BetterAuthAccount) => Promise<BetterAuthAccount>;
    getUserByAccount: (input: {
        provider: BetterAuthProviderKind;
        providerAccountId: string;
    }) => Promise<BetterAuthUser | null>;
    createVerification: (verification: BetterAuthVerification) => Promise<BetterAuthVerification>;
    consumeVerification: (identifier: string, value: string) => Promise<BetterAuthVerification | null>;
    createOrganization: (input: Omit<BetterAuthOrganization, 'id'>) => Promise<BetterAuthOrganization>;
    getOrganization: (id: string) => Promise<BetterAuthOrganization | null>;
    addMembership: (membership: BetterAuthMembership) => Promise<BetterAuthMembership>;
    getMemberships: (userId: string) => Promise<BetterAuthMembership[]>;
    registerPasskey: (passkey: BetterAuthPasskey) => Promise<BetterAuthPasskey>;
    getPasskeysForUser: (userId: string) => Promise<BetterAuthPasskey[]>;
    /** Test-only affordance not present in the real adapters. */
    reset: () => void;
}
```

#### `BetterAuthDatabaseKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L10) `packages/auth/src/better-auth/types.ts`

Better Auth ships three official database adapter shapes — `betterAuth/adapters/prisma`, `betterAuth/adapters/drizzle`, and `betterAuth/adapters/kysely`. All three expose the same operation surface at the Better Auth layer (create / findOne / findMany / update / delete / count), so the mock is a drop-in for any of them. The `kind` tag surfaces the dialect for tests that assert against it without changing behaviour.

```ts
export type BetterAuthDatabaseKind = 'prisma' | 'drizzle' | 'kysely';
```

#### `BetterAuthMembership`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L103) `packages/auth/src/better-auth/types.ts`

```ts
export interface BetterAuthMembership {
    organizationId: string;
    userId: string;
    role: 'owner' | 'admin' | 'member';
}
```

#### `BetterAuthOAuthProfile`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L72) `packages/auth/src/better-auth/types.ts`

```ts
export interface BetterAuthOAuthProfile {
    provider: BetterAuthProviderKind;
    providerAccountId: string;
    email: string;
}
```

#### `BetterAuthOrganization`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L96) `packages/auth/src/better-auth/types.ts`

Organization + membership records. Better Auth's `organization` plugin persists these two tables and exposes create / invite / accept / list helpers on the auth client. The mock keeps the same shape so a suite can assert against membership state after invitation flows.

```ts
export interface BetterAuthOrganization {
    id: string;
    name: string;
    slug: string;
    createdBy: string;
}
```

#### `BetterAuthPasskey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L113) `packages/auth/src/better-auth/types.ts`

Passkey credential — Better Auth's `passkey` plugin stores a WebAuthn credential per user. The mock skips the WebAuthn ceremony and only records the shape.

```ts
export interface BetterAuthPasskey {
    id: string;
    userId: string;
    credentialId: string;
    publicKey: string;
}
```

#### `BetterAuthPluginKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L40) `packages/auth/src/better-auth/types.ts`

Plugin registry keys the mock understands. Better Auth's real plugin system is open-ended, but the ones covered by the AC (organizations + passkey + magic link + 2FA/TOTP) are the ones consumers actually mock in tests today. `emailAndPassword` and `magicLink` and `twoFactor` land here even though Better Auth distinguishes between core config and plugins — the mock treats them as opt-in capabilities the caller flips on for a specific suite, which is closer to how they are used in practice.

```ts
export type BetterAuthPluginKind = 'emailAndPassword' | 'magicLink' | 'twoFactor' | 'organizations' | 'passkey';
```

#### `BetterAuthProviderKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L28) `packages/auth/src/better-auth/types.ts`

Built-in social provider mocks. Better Auth's real `socialProviders` config accepts an open map, but for tests we only mock the two shapes documented in the quick-start (Google + GitHub). Extra providers can be added without breaking the surface — the mock builder rejects unknown kinds explicitly.

```ts
export type BetterAuthProviderKind = 'google' | 'github';
```

#### `BetterAuthProviderMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L171) `packages/auth/src/better-auth/types.ts`

```ts
export interface BetterAuthProviderMock {
    kind: BetterAuthProviderKind;
    id: string;
    name: string;
    signIn: (input?: {
        email?: string;
        sub?: string;
    }) => Promise<BetterAuthOAuthProfile>;
}
```

#### `BetterAuthSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L58) `packages/auth/src/better-auth/types.ts`

```ts
export interface BetterAuthSession {
    id: string;
    userId: string;
    expiresAt: Date;
    /** Better Auth exposes `token` on the returned session — the mock mirrors the shape. */
    token: string;
}
```

#### `BetterAuthTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L208) `packages/auth/src/better-auth/types.ts`

```ts
export interface BetterAuthTestEnv extends TestEnvBase<'mock'> {
    database: BetterAuthDatabaseAdapter;
    providers: Record<BetterAuthProviderKind, BetterAuthProviderMock>;
    plugins: Set<BetterAuthPluginKind>;
    sessionExpiration: number;
    verificationExpiration: number;
    /**
     * Register a new email + password user. Rejects when the email already exists,
     * when the `emailAndPassword` plugin is not enabled, or on empty password.
     */
    signUpWithPassword: (input: {
        email: string;
        password: string;
    }) => Promise<{
        user: BetterAuthUser;
        session: BetterAuthSession;
    }>;
    signInWithPassword: (input: {
        email: string;
        password: string;
    }) => Promise<{
        user: BetterAuthUser;
        session: BetterAuthSession;
    }>;
    signInWithOAuth: (provider: BetterAuthProviderKind, input?: {
        email?: string;
        sub?: string;
    }) => Promise<{
        user: BetterAuthUser;
        session: BetterAuthSession;
    }>;
    /**
     * Send a magic link. Returns the token value the caller would embed in the
     * click-through URL. Rejects when `magicLink` plugin is not enabled.
     */
    sendMagicLink: (input: {
        email: string;
    }) => Promise<{
        token: string;
    }>;
    /**
     * Consume a magic-link token. Creates the user on first sign-in, marks the
     * user's email as verified, and issues a session. Rejects on unknown / expired
     * token.
     */
    consumeMagicLink: (input: {
        email: string;
        token: string;
    }) => Promise<{
        user: BetterAuthUser;
        session: BetterAuthSession;
    }>;
    /**
     * Enrol a user in TOTP 2FA. Returns the raw secret (base32 in real usage —
     * the mock returns an opaque string sufficient to verify against later).
     * Rejects when `twoFactor` plugin is not enabled.
     */
    enrollTwoFactor: (input: {
        userId: string;
    }) => Promise<{
        secret: string;
    }>;
    /**
     * Verify a TOTP code. The mock accepts codes derived from the enrolled secret
     * via {@link generateTotpCode}. Rejects on wrong code or unenrolled user.
     */
    verifyTwoFactorCode: (input: {
        userId: string;
        code: string;
    }) => Promise<boolean>;
    /** Session validation — returns null on missing / expired token. */
    validateSession: (token: string) => Promise<{
        user: BetterAuthUser;
        session: BetterAuthSession;
    } | null>;
    invalidateSession: (token: string) => Promise<void>;
    invalidateUserSessions: (userId: string) => Promise<void>;
    /**
     * Organizations plugin helpers. Rejects when the plugin is not enabled.
     * Membership defaults to `owner` for the creator.
     */
    createOrganization: (input: {
        name: string;
        slug: string;
        userId: string;
    }) => Promise<BetterAuthOrganization>;
    inviteToOrganization: (input: {
        organizationId: string;
        userId: string;
        role?: 'admin' | 'member';
    }) => Promise<BetterAuthMembership>;
    /**
     * Passkey plugin helper. Rejects when the plugin is not enabled. The mock
     * skips the WebAuthn ceremony and records the shape.
     */
    registerPasskey: (input: {
        userId: string;
        credentialId: string;
        publicKey: string;
    }) => Promise<BetterAuthPasskey>;
}
```

#### `BetterAuthUser`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L47) `packages/auth/src/better-auth/types.ts`

```ts
export interface BetterAuthUser {
    id: string;
    email: string;
    /** Password hash returned by the password helper — never stored in plain text. */
    passwordHash?: string | undefined;
    /** Set to true once the user completes the initial magic-link click / OAuth callback. */
    emailVerified: boolean;
    /** Populated when the `twoFactor` plugin is enabled and the user completes TOTP setup. */
    twoFactorSecret?: string | undefined;
}
```

#### `BetterAuthVerification`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L84) `packages/auth/src/better-auth/types.ts`

Verification token issued for magic-link sign-in. Mirrors Better Auth's internal `verification` table (identifier + value + expiresAt). Consuming the token deletes it, so re-using a magic link rejects the second attempt — the same policy Better Auth enforces at runtime.

```ts
export interface BetterAuthVerification {
    identifier: string;
    value: string;
    expiresAt: Date;
}
```

#### `CaBLEBLEHandshake`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/types.ts#L55) `packages/auth/src/passkey/caBLE/types.ts`

BLE advertisement handshake artifact. Real caBLE uses a 20-byte advertisement carrying an encrypted session identifier. The mock keeps the same shape as a plain object so tests can assert the initiator + responder derived the same shared secret without decoding raw BLE bytes.

```ts
export interface CaBLEBLEHandshake {
    readonly sessionId: string;
    /** Deterministic shared secret both parties derived from `nonce`. */
    readonly sharedSecret: string;
    /** Advertisement payload (base64url encoded). */
    readonly advertisementPayload: string;
    /** `true` when both sides derived matching secrets. */
    readonly verified: boolean;
}
```

#### `CaBLECredentialMigration`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/types.ts#L93) `packages/auth/src/passkey/caBLE/types.ts`

Credential migration payload — the responder (phone) ships the passkey credential over the WebSocket tunnel. Real caBLE encrypts this with the shared secret; the mock keeps the raw {@link PasskeyCredential} plus a deterministic "encrypted" tag so tests can assert the migration went through the tunnel without leaking the credential material outside.

```ts
export interface CaBLECredentialMigration {
    readonly sessionId: string;
    readonly credentialId: string;
    readonly encryptedPayload: string;
    readonly credential: PasskeyCredential;
}
```

#### `CaBLEQRCodePayload`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/types.ts#L38) `packages/auth/src/passkey/caBLE/types.ts`

QR code payload the initiator (laptop) prints for the phone to scan. Real caBLE uses a base32-encoded EC public key + tunnel server hint + random nonce. The mock keeps the same three fields as literal strings so tests can assert the payload survives round-trip encoding without running through a QR image decoder.

```ts
export interface CaBLEQRCodePayload {
    /** Ephemeral EC P-256 public key advertised by the initiator. */
    readonly publicKey: string;
    /** Tunnel server hint — the phone dials this WebSocket endpoint. */
    readonly tunnelServerHint: string;
    /** Random nonce mixed into the BLE handshake to prevent replay. */
    readonly nonce: string;
    /** Monotonic session id — one per hybrid transport ceremony. */
    readonly sessionId: string;
}
```

#### `CaBLESession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/types.ts#L141) `packages/auth/src/passkey/caBLE/types.ts`

caBLE hybrid transport session — collects every artifact produced by the 3 steps + migration + signature roundtrip. `complete()` runs the whole chain and returns this shape so a single assertion can inspect every fidelity axis in one place.

```ts
export interface CaBLESession {
    readonly sessionId: string;
    readonly qrCode: CaBLEQRCodePayload;
    readonly handshake: CaBLEBLEHandshake;
    readonly tunnel: CaBLEWebSocketTunnel;
    readonly migration: CaBLECredentialMigration;
    readonly signature: CaBLESignatureRoundtrip;
    /** Steps that ran to completion — always populated in FIDO 3-step order. */
    readonly stepsCompleted: readonly CaBLEStep[];
}
```

#### `CaBLESessionOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/types.ts#L122) `packages/auth/src/passkey/caBLE/types.ts`

Options accepted by `startCaBLESession`. The initiator picks the tunnel server hint (a hostname string in real caBLE, a made-up literal in the mock) and the passkey to migrate. Every field is required — real caBLE refuses to start a hybrid transport ceremony with any of these missing.

```ts
export interface CaBLESessionOptions {
    /** Initiator device id — the laptop that scanned the QR. */
    readonly initiatorDeviceId: string;
    /** Responder device id — the phone that produced the QR. */
    readonly responderDeviceId: string;
    /** Credential to migrate — must live on the responder device. */
    readonly credential: PasskeyCredential;
    /** Tunnel server hint the initiator will dial. */
    readonly tunnelServerHint: string;
    /** Nonce mixed into the handshake — caller-supplied so tests are stable. */
    readonly nonce: string;
}
```

#### `CaBLESignatureRoundtrip`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/types.ts#L107) `packages/auth/src/passkey/caBLE/types.ts`

Signature roundtrip artifact — the responder (phone) signs a challenge with the passkey private key and streams the signature back through the tunnel. Verified by the initiator against the stored credential public key. Mirrors the WebAuthn L3 §7.2 assertion signature check the cross-device flow terminates in.

```ts
export interface CaBLESignatureRoundtrip {
    readonly sessionId: string;
    readonly credentialId: string;
    readonly challenge: string;
    readonly signature: string;
    /** `true` when the initiator verified the signature. */
    readonly verified: boolean;
}
```

#### `CaBLEStep`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/types.ts#L12) `packages/auth/src/passkey/caBLE/types.ts`

caBLE 3 step SSOT vocabulary. Modeled after the FIDO Alliance CTAP 2.2 hybrid transport spec — phone → laptop credential handoff runs QR code generation → BLE advertisement handshake → WebSocket tunnel establishment → credential migration → signature roundtrip. Each step surfaces its own artifact so the fidelity harness can assert on the wire format without driving a real Bluetooth stack.

```ts
export type CaBLEStep = 'qr-code' | 'ble-handshake' | 'websocket-tunnel' | 'credential-migration' | 'signature-roundtrip';
```

#### `CaBLEWebSocketTunnel`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/types.ts#L72) `packages/auth/src/passkey/caBLE/types.ts`

WebSocket tunnel handle. Real caBLE runs a duplex WebSocket over the tunnel server. The mock keeps an in-memory message queue keyed by session id — both sides `send()` / `receive()` through the same object so tests can assert the ordering + payload without spinning up a real WebSocket server.

```ts
export interface CaBLEWebSocketTunnel {
    readonly sessionId: string;
    readonly tunnelServerHint: string;
    readonly established: boolean;
    /** Push a message from initiator → responder. */
    send(payload: string): void;
    /** Drain every pending message the initiator sent. */
    drain(): readonly string[];
    /** Close the tunnel — subsequent send / drain calls throw. */
    close(): void;
    /** `true` after `close()` has been called. */
    readonly closed: boolean;
}
```

#### `ClerkEmailAddress`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L23) `packages/auth/src/clerk/types.ts`

```ts
export interface ClerkEmailAddress {
    id: string;
    emailAddress: string;
    verified: boolean;
}
```

#### `ClerkExternalAccount`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L17) `packages/auth/src/clerk/types.ts`

Clerk's real user record carries dozens of fields — the mock covers the ones that consumers actually assert against in tests (id + primary email + phone + external accounts + org memberships). Additional fields can be added later without breaking the surface.

```ts
export interface ClerkExternalAccount {
    provider: 'oauth_google' | 'oauth_github' | 'oauth_apple' | 'oauth_microsoft';
    providerUserId: string;
    emailAddress: string;
}
```

#### `ClerkOrganization`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L110) `packages/auth/src/clerk/types.ts`

```ts
export interface ClerkOrganization {
    id: string;
    name: string;
    slug: string;
    createdBy: string;
    createdAt: Date;
    publicMetadata?: Record<string, unknown> | undefined;
}
```

#### `ClerkOrganizationMembership`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L119) `packages/auth/src/clerk/types.ts`

```ts
export interface ClerkOrganizationMembership {
    id: string;
    organizationId: string;
    userId: string;
    role: ClerkOrganizationRole;
    createdAt: Date;
}
```

#### `ClerkOrganizationRole`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L102) `packages/auth/src/clerk/types.ts`

Organization + memberships. Clerk's real organization plugin exposes `organizations.getOrganization`, `memberships.getOrganizationMembership`, and a role model that includes org-scoped roles (`org:admin` / `org:member` in prod). The mock uses the shorter role names for readability but keeps the same relational shape.

```ts
export type ClerkOrganizationRole = 'owner' | 'admin' | 'member';
```

#### `ClerkPhoneNumber`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L29) `packages/auth/src/clerk/types.ts`

```ts
export interface ClerkPhoneNumber {
    id: string;
    phoneNumber: string;
    verified: boolean;
}
```

#### `ClerkSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L56) `packages/auth/src/clerk/types.ts`

Clerk session. Sessions are keyed by opaque id (`sess_...` in prod), the mock keeps the same shape. The `token` is the raw JWT surfaced to the client through `getToken()` — the mock generates a base64-encoded stub JWT.

```ts
export interface ClerkSession {
    id: string;
    userId: string;
    /** The active org the session is scoped to (Clerk multi-tenant). */
    activeOrganizationId?: string | undefined;
    expiresAt: Date;
    /** The raw JWT string emitted to the client. */
    token: string;
    /** Session status — Clerk's real API uses `active` / `expired` / `revoked` / `ended`. */
    status: 'active' | 'expired' | 'revoked' | 'ended';
}
```

#### `ClerkSessionClaims`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L74) `packages/auth/src/clerk/types.ts`

JWT claims Clerk embeds in the session token. `sub` = user id, `sid` = session id, `org_id` + `org_role` = active org context, `iat` / `exp` = standard JWT timestamps. The mock encodes these in a base64 stub the `verifyToken` helper decodes back.

```ts
export interface ClerkSessionClaims {
    /** Subject — the Clerk user id. */
    sub: string;
    /** Session id — the Clerk session id. */
    sid: string;
    /** Active organization id (present when session is scoped to an org). */
    org_id?: string | undefined;
    /** Active organization role (owner | admin | member typically). */
    org_role?: string | undefined;
    /** Active organization slug. */
    org_slug?: string | undefined;
    /** Issued at, seconds since epoch. */
    iat: number;
    /** Expires at, seconds since epoch. */
    exp: number;
    /** JWT issuer — Clerk uses `https://<instance>.clerk.accounts.dev` in prod. */
    iss: string;
    /** JWT audience — optional in Clerk, but present when configured. */
    aud?: string | undefined;
}
```

#### `ClerkTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L187) `packages/auth/src/clerk/types.ts`

The test env returned by {@link setupClerkEnv }. Consumers hold this handle for the lifetime of a test and call `stop()` in `afterEach` to reset all in-memory state. The `users` / `sessions` / `organizations` handles mirror the shape of Clerk's real `@clerk/backend` SDK — call sites that use the mock are drop-in-compatible with the real client after swap.

```ts
export interface ClerkTestEnv extends TestEnvBase<'mock'> {
    issuer: string;
    audience: string | undefined;
    sessionExpiration: number;
    /**
     * Seed tokens returned during setup. Only populated when the caller passes
     * `tokens` in {@link SetupClerkEnvOptions}. Keyed by primary email.
     */
    seededTokens: Record<string, {
        token: string;
        sessionId: string;
    }>;
    /** Users API — mirrors `@clerk/backend`'s `users.*` surface. */
    users: {
        createUser: (input: {
            primaryEmailAddress: string;
            firstName?: string;
            lastName?: string;
            phoneNumber?: string;
            externalAccounts?: ClerkExternalAccount[];
            publicMetadata?: Record<string, unknown>;
            privateMetadata?: Record<string, unknown>;
        }) => Promise<ClerkUser>;
        getUser: (id: string) => Promise<ClerkUser>;
        getUserByEmail: (email: string) => Promise<ClerkUser | null>;
        updateUser: (id: string, patch: Partial<Pick<ClerkUser, 'firstName' | 'lastName' | 'publicMetadata' | 'privateMetadata'>>) => Promise<ClerkUser>;
        deleteUser: (id: string) => Promise<void>;
        listUsers: () => Promise<ClerkUser[]>;
    };
    /** Sessions API — mirrors `@clerk/backend`'s `sessions.*` surface. */
    sessions: {
        createSession: (input: {
            userId: string;
            organizationId?: string;
        }) => Promise<{
            session: ClerkSession;
            token: string;
        }>;
        getSession: (id: string) => Promise<ClerkSession>;
        revokeSession: (id: string) => Promise<ClerkSession>;
        listSessionsForUser: (userId: string) => Promise<ClerkSession[]>;
    };
    /** Organizations API — mirrors `@clerk/backend`'s `organizations.*` surface. */
    organizations: {
        createOrganization: (input: {
            name: string;
            slug: string;
            createdBy: string;
            publicMetadata?: Record<string, unknown>;
        }) => Promise<ClerkOrganization>;
        getOrganization: (id: string) => Promise<ClerkOrganization>;
        getOrganizationBySlug: (slug: string) => Promise<ClerkOrganization | null>;
        createMembership: (input: {
            organizationId: string;
            userId: string;
            role: ClerkOrganizationRole;
        }) => Promise<ClerkOrganizationMembership>;
        getOrganizationMembership: (input: {
            organizationId: string;
            userId: string;
        }) => Promise<ClerkOrganizationMembership | null>;
        listMembershipsForUser: (userId: string) => Promise<ClerkOrganizationMembership[]>;
        listMembershipsForOrganization: (organizationId: string) => Promise<ClerkOrganizationMembership[]>;
        updateMembership: (input: {
            organizationId: string;
            userId: string;
            role: ClerkOrganizationRole;
        }) => Promise<ClerkOrganizationMembership>;
        deleteMembership: (input: {
            organizationId: string;
            userId: string;
        }) => Promise<void>;
    };
    /**
     * Verify a Clerk session token. Returns the decoded claims when the token
     * is valid, throws on invalid / expired / revoked tokens. Mirrors
     * `@clerk/backend`'s `verifyToken` helper.
     */
    verifyToken: (token: string) => Promise<ClerkSessionClaims>;
    /**
     * Convenience helper — sign in an existing user (by email) and return the
     * fresh session + JWT. Used in tests that want the full flow without
     * threading a session id through `sessions.createSession` manually.
     */
    signIn: (input: {
        email: string;
        organizationSlug?: string;
    }) => Promise<{
        user: ClerkUser;
        session: ClerkSession;
        token: string;
    }>;
}
```

#### `ClerkUser`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L35) `packages/auth/src/clerk/types.ts`

```ts
export interface ClerkUser {
    id: string;
    /** Primary email surfaced by Clerk's `primaryEmailAddress` field. */
    primaryEmailAddress: string;
    emailAddresses: ClerkEmailAddress[];
    phoneNumbers: ClerkPhoneNumber[];
    externalAccounts: ClerkExternalAccount[];
    firstName?: string | undefined;
    lastName?: string | undefined;
    /** Public metadata surfaced to the frontend. */
    publicMetadata?: Record<string, unknown> | undefined;
    /** Private metadata retained on the backend only. */
    privateMetadata?: Record<string, unknown> | undefined;
    createdAt: Date;
}
```

#### `ClientRegistration`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L251) `packages/auth/src/oauth21/types.ts`

Client registration accepted by the mock AS. Real deployments manage clients through a Dynamic Client Registration endpoint (RFC 7591); the mock accepts the client shape at env construction to keep tests hermetic.

```ts
export interface ClientRegistration {
    clientId: string;
    redirectUris: readonly string[];
    scopes?: readonly string[];
    /** Public / confidential distinction. `public` requires PKCE (still). */
    clientType?: 'public' | 'confidential';
}
```

#### `ClientRegistrationRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/types.ts#L61) `packages/auth/src/oidc/types.ts`

OpenID Connect Dynamic Client Registration request per RFC 7591 §2. Fields the mock validates: `redirect_uris` (mandatory, non-empty), `grant_types` (must be OAuth 2.1 allowlist), `token_endpoint_auth_method` (must be an advertised method). `client_name` is treated as opaque metadata.

```ts
export interface ClientRegistrationRequest {
    redirect_uris: readonly string[];
    client_name?: string;
    grant_types?: readonly string[];
    response_types?: readonly string[];
    token_endpoint_auth_method?: string;
    scope?: string;
    /**
     * Optional software statement per RFC 7591 §2.3. The mock treats it as a
     * signed JWT of the form `header.payload.signature`. When present the
     * signature is checked against the AS trust anchor + the payload claims
     * are folded into the registration.
     */
    software_statement?: string;
}
```

#### `ClientRegistrationResponse`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/types.ts#L83) `packages/auth/src/oidc/types.ts`

Response body from `/register` (RFC 7591 §3). Real deployments assign a random `client_id` and (for confidential clients) a `client_secret`; the mock returns deterministic ids from a monotonic counter for reproducible tests.

```ts
export interface ClientRegistrationResponse {
    client_id: string;
    client_secret?: string;
    client_id_issued_at: number;
    redirect_uris: readonly string[];
    grant_types: readonly string[];
    response_types: readonly string[];
    token_endpoint_auth_method: string;
    scope: string;
}
```

#### `DiscoveryEndpoint`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/types.ts#L48) `packages/auth/src/oidc/types.ts`

Discovery endpoint handle. `fetch()` returns the OP metadata as a plain object — a real HTTP client would parse the JSON body but the mock skips the encoding trip so tests can assert on the fields directly.

```ts
export interface DiscoveryEndpoint {
    readonly url: string;
    readonly issuer: string;
    fetch(): OpenIdProviderMetadata;
}
```

#### `DpopJwk`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L81) `packages/auth/src/oauth21/types.ts`

Public JWK embedded in the DPoP proof header. The mock represents the P-256 key as an opaque thumbprint so tests can compare identity without cracking the JWK fields.

```ts
export interface DpopJwk {
    /** Key type. Always `EC` for the ES256 alg the mock supports. */
    kty: 'EC';
    /** Curve. Always `P-256`. */
    crv: 'P-256';
    /** Base64url-encoded x-coordinate placeholder. */
    x: string;
    /** Base64url-encoded y-coordinate placeholder. */
    y: string;
}
```

#### `DpopProof`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L97) `packages/auth/src/oauth21/types.ts`

DPoP proof JWT structure. The mock represents the JWT as a compact `header.payload.signature` string but exposes the parsed header + payload for assertions.

```ts
export interface DpopProof {
    /** Full compact-serialized JWT string (`header.payload.signature`). */
    jwt: string;
    header: {
        /** Always `dpop+jwt` per RFC 9449 §4.2. */
        typ: 'dpop+jwt';
        /** Always `ES256`. */
        alg: 'ES256';
        /** Public JWK the AS binds the access token to. */
        jwk: DpopJwk;
    };
    payload: {
        htm: string;
        htu: string;
        iat: number;
        jti: string;
    };
}
```

#### `DpopProofInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L52) `packages/auth/src/oauth21/types.ts`

DPoP proof JWT parameters. RFC 9449 defines a Demonstration of Proof of Possession JWT that binds an access token to the client's asymmetric key, defeating bearer-token exfiltration. The mock uses ES256 (P-256 ECDSA) as the only supported alg — matching the alg advertised in the DPoP spec's default deployment.

```ts
export interface DpopProofInput {
    /** Uppercase HTTP method (`GET` / `POST` / `PUT` / `DELETE`). */
    htm: string;
    /** Absolute request URL, no query or fragment. */
    htu: string;
    /**
     * Issued-at timestamp in seconds since epoch. Callers can set this
     * explicitly (deterministic tests) or accept the default `Date.now()/1000`.
     */
    iat?: number;
    /**
     * Unique proof identifier. When omitted the mock generates a monotonic id
     * so replay attacks trip the AS's jti registry. Callers wanting to simulate
     * a replay pass an already-used `jti`.
     */
    jti?: string;
    /**
     * Public JWK the AS records as the client's DPoP key. When omitted the
     * mock provisions a fresh mock JWK; test suites that want to link multiple
     * proofs to the same key pass an existing `jwk`.
     */
    jwk?: DpopJwk;
}
```

#### `IdToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/types.ts#L184) `packages/auth/src/oidc/types.ts`

Compact-serialized id_token JWT (`header.payload.signature`). The mock exposes the parsed claims so tests can assert without decoding the JWT.

```ts
export interface IdToken {
    jwt: string;
    header: {
        alg: 'RS256' | 'ES256';
        typ: 'JWT';
        kid: string;
    };
    claims: IdTokenClaims;
}
```

#### `IdTokenClaims`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/types.ts#L154) `packages/auth/src/oidc/types.ts`

id_token claim shape per OpenID Connect Core 1.0 §2. `iss` / `sub` / `aud` / `exp` / `iat` are mandatory. The optional claims are the ones the mock validates on `verifyIdToken` — extending this shape requires teaching the verifier about new claims.

```ts
export interface IdTokenClaims {
    iss: string;
    sub: string;
    aud: string;
    exp: number;
    iat: number;
    /**
     * Nonce echoed from the authorization request. Mandatory when the RP sent
     * one — the mock refuses to sign an id_token missing `nonce` when the
     * caller passes an `expectedNonce` on verify.
     */
    nonce?: string;
    /**
     * Access token hash per OIDC Core §3.1.3.6. Left half of the SHA-256 of
     * the ASCII access_token, base64url-encoded.
     */
    at_hash?: string;
    /**
     * Authorization code hash per OIDC Core §3.3.2.11. Left half of the
     * SHA-256 of the ASCII code, base64url-encoded.
     */
    c_hash?: string;
    /** Additional claim carrier. */
    [claim: string]: unknown;
}
```

#### `IntrospectionResponse`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L236) `packages/auth/src/oauth21/types.ts`

Introspection response per RFC 7662. The mock returns the minimal shape a resource server needs to authorize a request.

```ts
export interface IntrospectionResponse {
    active: boolean;
    scope?: string;
    clientId?: string;
    sub?: string;
    exp?: number;
    tokenType?: 'Bearer' | 'DPoP';
    resource?: string;
}
```

#### `JwksDocument`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/types.ts#L127) `packages/auth/src/oidc/types.ts`

JWKS document returned by `/jwks`. Real deployments return `{keys: [...]}` per RFC 7517 §5; the mock mirrors that shape verbatim.

```ts
export interface JwksDocument {
    keys: readonly JwksKey[];
}
```

#### `JwksEndpoint`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/types.ts#L136) `packages/auth/src/oidc/types.ts`

JWKS endpoint handle. Exposes `fetch()` (returns the current key set), `rotate()` (mint a new active key, retire the old one with a retention window), and `activeKey()` (peek the current signing key).

```ts
export interface JwksEndpoint {
    readonly url: string;
    fetch(): JwksDocument;
    rotate(): JwksKey;
    activeKey(): JwksKey;
    /**
     * Snapshot every key including retired ones still in the retention window.
     * Test-only inspection.
     */
    allKeys(): readonly JwksKey[];
}
```

#### `JwksKey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/types.ts#L100) `packages/auth/src/oidc/types.ts`

JWKS entry. Keys are opaque records — the mock signs id_tokens with an HMAC-style signature keyed by `kid`, so `n` / `e` / `x` / `y` are placeholders that let a real client parse the JWK without cracking the cryptographic invariants.

```ts
export interface JwksKey {
    kid: string;
    /** Signature algorithm. Only `RS256` + `ES256` supported. */
    alg: 'RS256' | 'ES256';
    /** Key type. `RSA` for `RS256`, `EC` for `ES256`. */
    kty: 'RSA' | 'EC';
    /** Public exponent (RS256). Base64url-encoded placeholder. */
    n?: string;
    e?: string;
    /** EC curve params (ES256). */
    crv?: 'P-256';
    x?: string;
    y?: string;
    /** Public key use. Always `sig` in the mock. */
    use: 'sig';
    /**
     * Retention deadline in seconds since epoch. `undefined` means the key is
     * currently the active signing key; once rotated the mock stamps this
     * with `now + retentionSec` and drops the key once `now > retiredAt`.
     */
    retiredAt?: number;
}
```

#### `LuciaDatabaseAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/types.ts#L54) `packages/auth/src/lucia/types.ts`

Minimal, Lucia-v3-compatible database adapter surface. `@lucia-auth/adapter-sqlite` and `@lucia-auth/adapter-postgresql` both expose the same method names, so the mock is a drop-in for either at test time.

```ts
export interface LuciaDatabaseAdapter {
    kind: LuciaDatabaseKind;
    createUser: (user: Omit<LuciaUser, 'id'>) => Promise<LuciaUser>;
    getUser: (id: string) => Promise<LuciaUser | null>;
    getUserByEmail: (email: string) => Promise<LuciaUser | null>;
    updateUser: (user: Partial<LuciaUser> & {
        id: string;
    }) => Promise<LuciaUser>;
    deleteUser: (id: string) => Promise<void>;
    createSession: (session: LuciaSession) => Promise<LuciaSession>;
    getSession: (id: string) => Promise<LuciaSession | null>;
    updateSession: (session: Partial<LuciaSession> & {
        id: string;
    }) => Promise<LuciaSession | null>;
    deleteSession: (id: string) => Promise<void>;
    /** Bulk-delete every session belonging to a user — matches Lucia's `deleteUserSessions(userId)`. */
    deleteUserSessions: (userId: string) => Promise<number>;
    deleteExpiredSessions: () => Promise<number>;
    linkOAuthAccount: (account: LuciaOAuthAccount) => Promise<LuciaOAuthAccount>;
    getUserByOAuthAccount: (input: {
        provider: LuciaProviderKind;
        providerAccountId: string;
    }) => Promise<LuciaUser | null>;
    /** Test-only affordance not present in the real adapters. */
    reset: () => void;
}
```

#### `LuciaDatabaseKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/types.ts#L9) `packages/auth/src/lucia/types.ts`

Lucia v3 supports two database dialects out of the box through the official adapter packages (`@lucia-auth/adapter-sqlite`, `@lucia-auth/adapter-postgresql`). The kind tag lets the mock adapter behave the same as either at the API level while still surfacing the dialect for tests that care about it.

```ts
export type LuciaDatabaseKind = 'sqlite' | 'postgresql';
```

#### `LuciaOAuthAccount`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/types.ts#L37) `packages/auth/src/lucia/types.ts`

```ts
export interface LuciaOAuthAccount {
    userId: string;
    provider: LuciaProviderKind;
    providerAccountId: string;
}
```

#### `LuciaOAuthProfile`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/types.ts#L43) `packages/auth/src/lucia/types.ts`

```ts
export interface LuciaOAuthProfile {
    provider: LuciaProviderKind;
    providerAccountId: string;
    email: string;
}
```

#### `LuciaProviderKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/types.ts#L17) `packages/auth/src/lucia/types.ts`

```ts
export type LuciaProviderKind = 'google' | 'github';
```

#### `LuciaProviderMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/types.ts#L79) `packages/auth/src/lucia/types.ts`

```ts
export interface LuciaProviderMock {
    kind: LuciaProviderKind;
    id: string;
    name: string;
    signIn: (input?: {
        email?: string;
        sub?: string;
    }) => Promise<LuciaOAuthProfile>;
}
```

#### `LuciaSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/types.ts#L26) `packages/auth/src/lucia/types.ts`

```ts
export interface LuciaSession {
    id: string;
    userId: string;
    expiresAt: Date;
    /**
     * Lucia v3 sessions expose a `fresh` flag that flips to true when the session
     * was just extended (rolling expiration). The mock mirrors the same shape.
     */
    fresh: boolean;
}
```

#### `LuciaTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/types.ts#L101) `packages/auth/src/lucia/types.ts`

```ts
export interface LuciaTestEnv extends TestEnvBase<'mock'> {
    database: LuciaDatabaseAdapter;
    providers: Record<LuciaProviderKind, LuciaProviderMock>;
    sessionExpiration: number;
    /** Register a new email + password user. Rejects when the email already exists. */
    signUpWithPassword: (input: {
        email: string;
        password: string;
    }) => Promise<{
        user: LuciaUser;
        session: LuciaSession;
    }>;
    /** Verify the password and issue a fresh session. Rejects on unknown user / bad password. */
    signInWithPassword: (input: {
        email: string;
        password: string;
    }) => Promise<{
        user: LuciaUser;
        session: LuciaSession;
    }>;
    /** Simulate the OAuth callback for the given provider and issue a session. */
    signInWithOAuth: (provider: LuciaProviderKind, input?: {
        email?: string;
        sub?: string;
    }) => Promise<{
        user: LuciaUser;
        session: LuciaSession;
    }>;
    /**
     * Validate a session id. Mirrors Lucia's `validateSession()` — returns null
     * when the session is missing / expired, and re-issues a fresh session when
     * the current one is inside its rolling refresh window.
     */
    validateSession: (sessionId: string) => Promise<{
        user: LuciaUser;
        session: LuciaSession;
    } | null>;
    /** Invalidate a single session — mirrors Lucia's `invalidateSession()`. */
    invalidateSession: (sessionId: string) => Promise<void>;
    /** Invalidate every session belonging to the user — mirrors `invalidateUserSessions()`. */
    invalidateUserSessions: (userId: string) => Promise<void>;
}
```

#### `LuciaUser`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/types.ts#L19) `packages/auth/src/lucia/types.ts`

```ts
export interface LuciaUser {
    id: string;
    email: string;
    /** Argon2 hash returned by the password helper — never stored in plain text. */
    passwordHash?: string | undefined;
}
```

#### `MfaAal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/types.ts#L119) `packages/auth/src/supabase-advanced/types.ts`

Authenticator Assurance Level, exactly matching Supabase's terminology.

```ts
export type MfaAal = 'aal1' | 'aal2';
```

#### `MfaBackupCode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/types.ts#L102) `packages/auth/src/supabase-advanced/types.ts`

```ts
export interface MfaBackupCode {
    userId: string;
    code: string;
    consumedAt: Date | undefined;
}
```

#### `MfaChallenge`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/types.ts#L108) `packages/auth/src/supabase-advanced/types.ts`

```ts
export interface MfaChallenge {
    id: string;
    factorId: string;
    /** For phone factors — the SMS code that was delivered. */
    smsCode: string | undefined;
    createdAt: Date;
    expiresAt: Date;
    verified: boolean;
}
```

#### `MfaFactor`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/types.ts#L89) `packages/auth/src/supabase-advanced/types.ts`

```ts
export interface MfaFactor {
    id: string;
    userId: string;
    kind: MfaFactorKind;
    friendlyName: string;
    /** Base32 TOTP secret (kind='totp') or phone number (kind='phone'). */
    secret: string;
    /** Verified factors participate in AAL upgrades. */
    verified: boolean;
    createdAt: Date;
    updatedAt: Date;
}
```

#### `MfaFactorKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/types.ts#L87) `packages/auth/src/supabase-advanced/types.ts`

MFA factor — Supabase's `auth.mfa` surface exposes TOTP + phone as first class factors plus 10 backup codes per user. The mock mirrors these three factor kinds.

```ts
export type MfaFactorKind = 'totp' | 'phone' | 'backup';
```

#### `NextAuthTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L85) `packages/auth/src/types.ts`

```ts
export interface NextAuthTestEnv extends TestEnvBase<'mock'> {
    session: {
        strategy: SessionStrategy;
        maxAge: number;
    };
    providers: Record<ProviderKind, ProviderMock>;
    database: AuthDatabaseAdapter;
    /**
     * Simulate the full sign-in flow through the given provider. Returns the
     * session that a real NextAuth callback would produce.
     */
    signIn: (provider: ProviderKind, input?: {
        email?: string;
        sub?: string;
        name?: string;
    }) => Promise<{
        user: AuthUser;
        session: {
            sessionToken: string;
            expires: Date;
        };
        strategy: SessionStrategy;
    }>;
    /** Retrieve the session for a token — mirrors `auth()` / `getServerSession()`. */
    getSession: (sessionToken: string) => Promise<{
        user: AuthUser;
        expires: Date;
    } | null>;
    /** Sign the user out — mirrors NextAuth's `signOut()`. */
    signOut: (sessionToken: string) => Promise<void>;
}
```

#### `OAuth21GrantType`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L10) `packages/auth/src/oauth21/types.ts`

OAuth 2.1 grant type. The mock intentionally exposes only the RFC 9700 "OAuth 2.1" allowlisted grants — `authorization_code` (with PKCE always required) + `refresh_token`. The historical `implicit` and `password` grants that OAuth 2.0 permitted were dropped by 2.1 and the mock rejects them at parse time so tests catch a downgrade attack immediately.

```ts
export type OAuth21GrantType = 'authorization_code' | 'refresh_token';
```

#### `OAuth21TestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L336) `packages/auth/src/oauth21/types.ts`

`setupOAuth21Env` return shape. Exposes the AS plus the standalone helpers so a test can drive PKCE + DPoP without importing the module leaves.

```ts
export interface OAuth21TestEnv extends TestEnvBase<'mock'> {
    readonly server: AuthorizationServer;
    /**
     * Generate a fresh PKCE code verifier. Deterministic within a single env
     * (monotonic counter) so tests reading the verifier get reproducible
     * output.
     */
    generateCodeVerifier(): string;
    /**
     * Derive the S256 challenge for a given verifier. Rejects `plain`.
     */
    deriveCodeChallenge(verifier: string, method?: PkceChallengeMethod): string;
    /**
     * Build a complete `PkceChallenge` (verifier + challenge). Convenience
     * wrapper.
     */
    createPkceChallenge(): PkceChallenge;
    /**
     * Mint a DPoP proof for a given HTTP method + URL. Returns the parsed
     * proof; the client sends `proof.jwt` in the `DPoP` header.
     */
    createDpopProof(input: DpopProofInput): DpopProof;
    /**
     * Rotate the current refresh token. Convenience wrapper around
     * `server.token({grantType: 'refresh_token', ...})`.
     */
    refreshToken(refreshToken: string, clientId: string, dpop?: DpopProof): TokenResponse;
    /**
     * Reset every fabricated PKCE / DPoP artifact and the AS registry. Does
     * not dispose the env — call `stop` for that.
     */
    reset(): void;
}
```

#### `OidcEntityStatement`

公開 entry point から解決しています。

`EntityStatement` を `OidcEntityStatement` として公開しています。

Entity Statement per OpenID Federation 1.0 §3.1. The mock represents it as a plain object (skipping the JWS signature) with the subject / issuer pair that the chain walker follows. Real deployments would serialize this as a JWT signed by the issuer's JWKS.

```ts
export type {
  ClientRegistrationRequest,
  ClientRegistrationResponse,
  DiscoveryEndpoint,
  EntityStatement as OidcEntityStatement,
  IdToken,
  IdTokenClaims,
  JwksDocument,
  JwksEndpoint,
  JwksKey,
  OidcTestEnv,
  OpenIdProviderMetadata,
  ResolveTrustChainInput,
  SetupOidcEnvOptions,
  SignIdTokenInput,
  TrustAnchor,
  TrustChainReasonCode,
  TrustChainResult,
  VerifyIdTokenOptions,
  VerifyIdTokenResult,
} from './oidc/types.js';
```

#### `OidcTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/types.ts#L353) `packages/auth/src/oidc/types.ts`

`setupOidcEnv` return shape. Composes the OAuth 2.1 mock AS with OIDC discovery / DCR / JWKS / id_token / federation helpers.

```ts
export interface OidcTestEnv extends TestEnvBase<'mock'> {
    readonly issuer: string;
    readonly discovery: DiscoveryEndpoint;
    readonly jwks: JwksEndpoint;
    /**
     * Underlying OAuth 2.1 mock AS. OIDC layers `id_token` on the OAuth 2.1
     * authorization_code flow — tests can drive the AS directly for the OAuth
     * plumbing and use the OIDC helpers for the `id_token` layer on top.
     */
    readonly server: AuthorizationServer;
    /**
     * Underlying OAuth 2.1 env. Tests exclusively driving the OIDC surface
     * rarely touch this; it's exposed so callers can reuse PKCE / DPoP helpers.
     */
    readonly oauth21: OAuth21TestEnv;
    /**
     * Register a client via the Dynamic Client Registration endpoint (RFC
     * 7591). Returns the AS-assigned client_id + client_secret.
     */
    registerClient(request: ClientRegistrationRequest): ClientRegistrationResponse;
    /**
     * Sign an id_token with the currently-active JWKS key. Called by the RP
     * flow after `/token` mints the access token — the mock exposes it as a
     * standalone helper so tests can build id_tokens without driving the full
     * flow.
     */
    signIdToken(input: SignIdTokenInput): IdToken;
    /**
     * Verify an id_token JWT. Returns a discriminated result so tests can
     * assert on `reason` for failure paths.
     */
    verifyIdToken(jwt: string, options: VerifyIdTokenOptions): VerifyIdTokenResult;
    /**
     * Resolve a trust chain from a leaf entity to a trust anchor. Returns the
     * ordered chain when valid; a discriminated failure otherwise.
     */
    resolveTrustChain(input: ResolveTrustChainInput): TrustChainResult;
    /** Reset every OIDC fabricated artifact + the underlying OAuth 2.1 state. */
    reset(): void;
}
```

#### `OpenIdProviderMetadata`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/types.ts#L20) `packages/auth/src/oidc/types.ts`

OpenID Provider metadata returned by the Discovery endpoint (`.well-known/openid-configuration`). Fields follow OpenID Connect Discovery 1.0 §3. The mock returns the minimum set that a Relying Party (RP) needs to complete the Authorization Code + PKCE flow that OIDC layers on top of OAuth 2.1. `issuer` MUST match the URL used to fetch the document (spec §4.3). The mock derives every other URL from it so a test can compare with a single string mismatch check.

```ts
export interface OpenIdProviderMetadata {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    jwks_uri: string;
    registration_endpoint: string;
    userinfo_endpoint: string;
    /** Response types advertised. Always `['code']` (OIDC hybrid / implicit dropped). */
    response_types_supported: readonly string[];
    /** Subject identifier types. `public` only in the mock. */
    subject_types_supported: readonly string[];
    /** id_token signing algs advertised. `RS256` + `ES256`. */
    id_token_signing_alg_values_supported: readonly string[];
    /** Scopes advertised. Always contains `openid`. */
    scopes_supported: readonly string[];
    /** Token endpoint auth methods advertised. */
    token_endpoint_auth_methods_supported: readonly string[];
    /** Claims advertised via id_token. */
    claims_supported: readonly string[];
    /** PKCE code challenge methods. Always `['S256']` per OAuth 2.1. */
    code_challenge_methods_supported: readonly string[];
}
```

#### `PasskeyCredential`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/types.ts#L133) `packages/auth/src/passkey/types.ts`

Passkey credential record. A passkey extends `WebAuthnCredential` with sync fabric metadata — which vendor blob store the credential is backed up into, the device that minted the credential, and the sync epoch used to detect fabric conflicts. `syncedFabrics` tracks every vendor the credential has ever been backed up into so a restore on a fresh device knows every vendor to consult.

```ts
export interface PasskeyCredential extends WebAuthnCredential {
    /** Device that minted the credential. Set at creation, never mutated. */
    originDeviceId: string;
    /**
     * User handle recorded separately from the base `userHandle` so restore on a
     * fresh device can enforce per-user isolation without cracking the WebAuthn
     * userHandle base64 encoding.
     */
    userId: string;
    /** Sync fabric vendors that currently hold a backup of this credential. */
    syncedFabrics: readonly SyncFabricVendor[];
    /**
     * Monotonic sync epoch. Incremented on every backup so conflict detection
     * ("device A has epoch 3, device B has epoch 4, apply epoch 4") can happen
     * at the mock level even though the real FIDO Alliance CTAP 2.2 spec leaves
     * fabric conflict resolution vendor-specific.
     */
    syncEpoch: number;
    /**
     * `true` when the credential was minted on a platform authenticator that
     * bound the credential to a device (biometric-backed). `false` when the
     * credential was minted on a security key with `hasResidentKey: false`.
     * Non-backed-up credentials cannot participate in the sync fabric.
     */
    backupEligible: boolean;
}
```

#### `PasskeyTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/types.ts#L223) `packages/auth/src/passkey/types.ts`

`setupPasskeyEnv` return shape. Extends `TestEnvBase` with the passkey- specific device model and sync fabric surface. Every mutation goes through the env so a single `stop()` call disposes the entire graph.

```ts
export interface PasskeyTestEnv extends TestEnvBase<'mock'> {
    readonly devices: readonly string[];
    readonly fabrics: readonly SyncFabric[];
    /**
     * Register a new device. The device starts empty — the caller adds platform
     * / roaming authenticators with `addPlatformAuthenticator` /
     * `addRoamingAuthenticator`.
     */
    addDevice(deviceId: string): void;
    /** Drop a device and every authenticator + credential it owned. */
    removeDevice(deviceId: string): void;
    addPlatformAuthenticator(deviceId: string, options: PlatformAuthenticatorOptions): PlatformAuthenticator;
    addRoamingAuthenticator(deviceId: string, options: RoamingAuthenticatorOptions): RoamingAuthenticator;
    /** List authenticators bound to a device. */
    listAuthenticators(deviceId: string): readonly (PlatformAuthenticator | RoamingAuthenticator)[];
    /**
     * Create a passkey credential on the specified device. The passkey is
     * automatically minted on the device's platform authenticator (default) or
     * the caller-specified authenticator id.
     */
    createPasskey(deviceId: string, userId: string, options: PublicKeyCredentialCreationOptionsInit, authenticatorId?: string): Promise<AuthenticatorAttestationResponse>;
    /** Get the RP-facing assertion response from a device that holds the passkey. */
    authenticate(deviceId: string, options: PublicKeyCredentialRequestOptionsInit): Promise<AuthenticatorAssertionResponse>;
    /** Look up a passkey record by credential id. */
    getPasskey(credentialId: string): PasskeyCredential | null;
    /** Snapshot of every passkey currently registered across every device. */
    listPasskeys(): PasskeyCredential[];
    /** Look up the sync fabric handle by vendor. */
    fabric(vendor: SyncFabricVendor): SyncFabric;
    /**
     * Push a credential into a fabric vendor. Returns the updated credential
     * with the incremented sync epoch and the vendor added to `syncedFabrics`.
     */
    backupCredential(credentialId: string, vendor: SyncFabricVendor): PasskeyCredential;
    /**
     * Pull a credential out of a fabric vendor and register it on the target
     * device. The target device must already exist in the env. Returns the
     * restored credential. Throws when the credential is not held by the
     * fabric or when the calling user does not own the credential.
     */
    restoreCredential(targetDeviceId: string, userId: string, credentialId: string, vendor: SyncFabricVendor): PasskeyCredential;
    /**
     * Sync every backup-eligible credential owned by `userId` between two
     * devices through the shared fabric vendor. Convenience wrapper that
     * chains `backupCredential` (on source) + `restoreCredential` (on target)
     * for each credential.
     */
    syncCredentials(sourceDeviceId: string, targetDeviceId: string, userId: string, vendor: SyncFabricVendor): PasskeyCredential[];
    /** Reset every fabric + credential without disposing the env. */
    reset(): void;
}
```

#### `PkceChallenge`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L32) `packages/auth/src/oauth21/types.ts`

PKCE challenge produced by `generateCodeVerifier` + `deriveCodeChallenge`. The verifier is the high-entropy secret the client keeps; the challenge is the SHA-256 hash the client sends to the Authorization Server on `/authorize`, and later proves possession of by sending the verifier on `/token`.

```ts
export interface PkceChallenge {
    /** High-entropy secret. Kept by the client. */
    codeVerifier: string;
    /**
     * SHA-256 hash of the verifier, base64url encoded. Sent by the client on
     * `/authorize`; the AS records it against the issued code and, on `/token`,
     * re-hashes the verifier the client sends to compare.
     */
    codeChallenge: string;
    /** Method used to derive the challenge. Always `S256` in OAuth 2.1. */
    codeChallengeMethod: PkceChallengeMethod;
}
```

#### `PkceChallengeMethod`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L23) `packages/auth/src/oauth21/types.ts`

PKCE code challenge method. RFC 9700 §2.1.1 mandates `S256` for OAuth 2.1 and forbids `plain` — every parse path in the mock rejects `plain` explicitly rather than silently downgrading.

```ts
export type PkceChallengeMethod = 'S256';
```

#### `PlatformAuthenticator`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/types.ts#L109) `packages/auth/src/passkey/types.ts`

Passkey handle returned by `createPlatformAuthenticator` — extends the raw `VirtualAuthenticator` with the biometric modality recorded for assertion.

```ts
export interface PlatformAuthenticator extends VirtualAuthenticator {
    readonly kind: 'platform';
    readonly biometric: PlatformBiometricModality;
    biometricAvailable: boolean;
}
```

#### `PlatformAuthenticatorOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/types.ts#L64) `packages/auth/src/passkey/types.ts`

Configuration for `createPlatformAuthenticator`. A platform authenticator is bound to the device — `attachment` is always `platform`, `transport` is always `internal`. The caller only supplies the biometric modality plus the usual UV / user-presence toggles the WebAuthn layer accepts.

```ts
export interface PlatformAuthenticatorOptions {
    biometric: PlatformBiometricModality;
    /**
     * When `true` the biometric sensor is available and UV is satisfied on every
     * assertion (default). When `false` the mock keeps the authenticator alive
     * but every `credentialAssertion` rejects with a UV-not-satisfied error so
     * tests can exercise the "biometric locked out" branch.
     */
    biometricAvailable?: boolean;
    /**
     * User-presence gesture. Defaults to `true`. Set to `false` to simulate a
     * device that failed the touch gesture — matches WebAuthn L3 §7.2.
     */
    isUserPresent?: boolean;
    /**
     * Passkeys are always discoverable credentials (WebAuthn L3 §5.4.6 requires
     * `residentKey: 'required'` for a credential to be a passkey). The flag
     * defaults to `true` and cannot be turned off — the factory rejects
     * `hasResidentKey: false` at construction time.
     */
    hasResidentKey?: true;
}
```

#### `PlatformBiometricModality`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/types.ts#L43) `packages/auth/src/passkey/types.ts`

Platform authenticator biometric modality. The mock does not distinguish the biometric backend at the wire level — every modality resolves to UV=true — but tests want to assert that the correct modality was requested so the factory records it on the returned handle. Touch ID / Face ID are the two Apple platform modalities; Windows Hello covers both fingerprint and IR face; Android biometric covers fingerprint / face / iris depending on the OEM.

```ts
export type PlatformBiometricModality = 'touch-id' | 'face-id' | 'windows-hello' | 'android-biometric';
```

#### `ProviderKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L11) `packages/auth/src/types.ts`

```ts
export type ProviderKind = 'google' | 'github' | 'email';
```

#### `ProviderMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L13) `packages/auth/src/types.ts`

```ts
export interface ProviderMock {
    kind: ProviderKind;
    id: string;
    name: string;
    /** Simulate a successful sign-in. Returns the profile the provider would return. */
    signIn: (input?: {
        email?: string;
        sub?: string;
        name?: string;
    }) => Promise<AuthProfile>;
}
```

#### `PublicKeyCredentialCreationOptionsInit`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L84) `packages/auth/src/webauthn/types.ts`

Simplified `PublicKeyCredentialCreationOptions` (WebAuthn L3 §5.4). The real spec surfaces `Uint8Array` challenge / user.id — the mock accepts either the spec shape or plain strings and normalizes internally.

```ts
export interface PublicKeyCredentialCreationOptionsInit {
    rp: {
        id: string;
        name: string;
    };
    user: {
        id: string | Uint8Array;
        name: string;
        displayName: string;
    };
    challenge: string | Uint8Array;
    pubKeyCredParams?: Array<{
        type: 'public-key';
        alg: number;
    }>;
    timeout?: number;
    excludeCredentials?: Array<{
        id: string;
        type: 'public-key';
    }>;
    authenticatorSelection?: AuthenticatorSelectionCriteria;
    attestation?: WebAuthnAttestationConveyancePreference;
}
```

#### `PublicKeyCredentialRequestOptionsInit`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L99) `packages/auth/src/webauthn/types.ts`

Simplified `PublicKeyCredentialRequestOptions` (WebAuthn L3 §5.5). Used by `credentialAssertion` when the RP asks the client to prove possession.

```ts
export interface PublicKeyCredentialRequestOptionsInit {
    rpId: string;
    challenge: string | Uint8Array;
    timeout?: number;
    allowCredentials?: Array<{
        id: string;
        type: 'public-key';
    }>;
    userVerification?: WebAuthnUserVerificationRequirement;
}
```

#### `RefreshToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L204) `packages/auth/src/oauth21/types.ts`

Refresh token minted alongside every access token. RFC 9700 §2.2 mandates refresh token rotation — every use of a refresh token invalidates the previous token and issues a fresh one. The mock records a monotonic `rotationCount` so tests can assert the rotation happened.

```ts
export interface RefreshToken {
    token: string;
    clientId: string;
    subject: string;
    scope: string;
    rotationCount: number;
    expiresAt: number;
    /** Set to `true` after `/revoke` or a rotation. Prevents reuse. */
    revoked: boolean;
    /** SHA-256 thumbprint of the DPoP key, when bound. */
    dpopJkt?: string;
    /** Resource indicator, when bound. */
    resource?: string;
}
```

#### `ResolveTrustChainInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/types.ts#L434) `packages/auth/src/oidc/types.ts`

Input to `resolveTrustChain`. The caller supplies the leaf entity's statement + a set of intermediate statements + the trusted anchor. The mock walks from leaf to anchor following the `iss` / `sub` linkage.

```ts
export interface ResolveTrustChainInput {
    leaf: EntityStatement;
    intermediates: readonly EntityStatement[];
    anchor: TrustAnchor;
    /** Deterministic clock. */
    now?: () => number;
}
```

#### `RlsCheckInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/types.ts#L61) `packages/auth/src/supabase-advanced/types.ts`

```ts
export interface RlsCheckInput {
    /** Table the RLS check runs against. */
    table: string;
    /** SQL command being attempted. */
    command: Exclude<RlsCommand, 'all'>;
    /** Access token whose claims drive the policy evaluation. */
    accessToken: string;
    /** Candidate row for USING (SELECT / UPDATE / DELETE) predicates. */
    row?: Record<string, unknown>;
    /** New row for WITH CHECK (INSERT / UPDATE) predicates. */
    newRow?: Record<string, unknown>;
}
```

#### `RlsCheckOutcome`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/types.ts#L74) `packages/auth/src/supabase-advanced/types.ts`

```ts
export interface RlsCheckOutcome {
    allowed: boolean;
    /** Name of the policy that granted access, undefined when denied. */
    matchedPolicy: string | undefined;
    /** Reason the access was denied — populated only when allowed is false. */
    reason: string | undefined;
}
```

#### `RlsCommand`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/types.ts#L20) `packages/auth/src/supabase-advanced/types.ts`

RLS (Row Level Security) policy — mirrors a subset of PostgreSQL RLS with a `USING` predicate evaluated against a subject's JWT claims. Callers register a policy against a table + command + role, then invoke `checkAccess` to see whether the subject can execute the command on a candidate row. The mock covers `SELECT` / `INSERT` / `UPDATE` / `DELETE` and evaluates the predicate as a pure JS function so tests can express arbitrary conditions without a real Postgres round-trip.

```ts
export type RlsCommand = 'select' | 'insert' | 'update' | 'delete' | 'all';
```

#### `RlsPolicy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/types.ts#L40) `packages/auth/src/supabase-advanced/types.ts`

```ts
export interface RlsPolicy {
    name: string;
    table: string;
    command: RlsCommand;
    /**
     * Roles the policy applies to. Empty array = applies to all roles including
     * `anon`, matching PostgreSQL's default `TO PUBLIC`.
     */
    roles: Array<'authenticated' | 'anon' | 'service_role'>;
    /**
     * USING predicate — returns true when the subject can access the row. Called
     * for read-side checks (SELECT / UPDATE / DELETE) with the candidate row.
     */
    using?: (row: Record<string, unknown>, ctx: RlsPolicyContext) => boolean;
    /**
     * WITH CHECK predicate — returns true when the subject can write the row.
     * Called for write-side checks (INSERT / UPDATE) with the incoming row.
     */
    withCheck?: (row: Record<string, unknown>, ctx: RlsPolicyContext) => boolean;
}
```

#### `RlsPolicyContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/types.ts#L28) `packages/auth/src/supabase-advanced/types.ts`

```ts
export interface RlsPolicyContext {
    /** Subject's role — `authenticated` / `anon` / `service_role`. */
    role: 'authenticated' | 'anon' | 'service_role';
    /** Subject's user id (sub claim). Undefined when role is `anon`. */
    userId: string | undefined;
    /** app_metadata + user_metadata from the JWT — used in RLS predicates. */
    appMetadata: Record<string, unknown>;
    userMetadata: Record<string, unknown>;
    /** JWT claim set — advanced predicates can read any custom claim. */
    jwt: Record<string, unknown>;
}
```

#### `RoamingAuthenticator`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/types.ts#L120) `packages/auth/src/passkey/types.ts`

Passkey handle returned by `createRoamingAuthenticator` — extends the raw `VirtualAuthenticator` with the roaming kind and transport recorded so caBLE-specific tests can assert the hybrid path was taken.

```ts
export interface RoamingAuthenticator extends VirtualAuthenticator {
    readonly kind: 'roaming';
    readonly roamingKind: RoamingAuthenticatorKind;
}
```

#### `RoamingAuthenticatorKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/types.ts#L56) `packages/auth/src/passkey/types.ts`

Roaming authenticator kind. Security key = physical FIDO2 token (YubiKey, Titan). Phone = hybrid transport (caBLE / QR-code-initiated cross-device flow) surfaced through a BLE advertisement handshake. Both resolve to `attachment: cross-platform`, but the mock keeps the kind so tests can assert the correct roaming path was exercised.

```ts
export type RoamingAuthenticatorKind = 'security-key' | 'phone';
```

#### `RoamingAuthenticatorOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/types.ts#L93) `packages/auth/src/passkey/types.ts`

Configuration for `createRoamingAuthenticator`. A roaming authenticator is portable — `attachment` is `cross-platform`. The `kind` chooses whether the mock uses a USB security-key transport or the hybrid (caBLE) transport that mirrors phone-based cross-device sign-in.

```ts
export interface RoamingAuthenticatorOptions {
    kind: RoamingAuthenticatorKind;
    /**
     * Whether the roaming authenticator can perform UV. Security keys with a
     * PIN keypad set this to `true`; a bare token without a PIN keypad sets it
     * `false` and every UV=required assertion rejects.
     */
    hasUserVerification?: boolean;
    isUserPresent?: boolean;
    hasResidentKey?: boolean;
}
```

#### `SamlAssertion`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/types.ts#L159) `packages/auth/src/supabase-advanced/types.ts`

```ts
export interface SamlAssertion {
    /** SAML NameID — typically the user's email. */
    nameId: string;
    /** IdP attribute statements — mapped through `attributeMap` on verification. */
    attributes: Record<string, string | string[]>;
    /** Session index issued by the IdP. */
    sessionIndex: string;
    /** UTC time the assertion was minted (`NotBefore`). */
    issuedAt: Date;
    /** UTC time the assertion expires (`NotOnOrAfter`). */
    expiresAt: Date;
    /** RelayState the assertion is bound to. */
    relayState: string;
    /** HMAC signature (mock stand-in for a real X.509 signature). */
    signature: string;
}
```

#### `SamlAuthnRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/types.ts#L148) `packages/auth/src/supabase-advanced/types.ts`

```ts
export interface SamlAuthnRequest {
    id: string;
    idpId: string;
    /** Request URL the client would redirect the user to. */
    redirectUrl: string;
    /** RelayState (opaque token round-tripped through the IdP). */
    relayState: string;
    issuedAt: Date;
    expiresAt: Date;
}
```

#### `SamlIdentityProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/types.ts#L127) `packages/auth/src/supabase-advanced/types.ts`

SAML SSO IdP mock. Real Supabase supports SAML 2.0 IdP-initiated + SP-initiated SSO. The mock simulates SP-initiated flow — the app requests a SAML AuthnRequest URL, the IdP responds with an assertion, and the mock validates + exchanges it for a session.

```ts
export interface SamlIdentityProvider {
    id: string;
    entityId: string;
    ssoUrl: string;
    /** X.509 certificate used to sign IdP assertions (PEM-encoded). */
    signingCertificate: string;
    /** Attribute mapping — IdP attribute name → Supabase user field. */
    attributeMap: {
        email: string;
        firstName?: string;
        lastName?: string;
        groups?: string;
    };
    metadata: {
        /** Human-friendly IdP name. */
        displayName: string;
        /** IdP domain the mock will match against email suffix. */
        domain: string;
    };
}
```

#### `SemanticsAxisStep`

公開 entry point から解決しています。

`AxisStep` を `SemanticsAxisStep` として公開しています。

```ts
export type {
  AuthAxis,
  AuthPlatform,
  AxisStep as SemanticsAxisStep,
  NeutralEventName as SemanticsNeutralEventName,
} from './semantics/types.js';
```

#### `SemanticsNeutralEventName`

公開 entry point から解決しています。

`NeutralEventName` を `SemanticsNeutralEventName` として公開しています。

Platform-neutral event names emitted by the axis helpers. Browsers expose different string ids for the same semantic — the {@link platformEventName} map handles the translation. Tests can assert on the neutral name via `step.neutralEvent` or on the browser dialect via `step.platformEvent`.

```ts
export type {
  AuthAxis,
  AuthPlatform,
  AxisStep as SemanticsAxisStep,
  NeutralEventName as SemanticsNeutralEventName,
} from './semantics/types.js';
```

#### `SessionStrategy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L3) `packages/auth/src/types.ts`

```ts
export type SessionStrategy = 'jwt' | 'database';
```

#### `SetupAuth0EnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/types.ts#L248) `packages/auth/src/auth0/types.ts`

Options accepted by {@link setupAuth0Env }. Every field is optional — the defaults exercise a single-tenant single-user shape that matches Auth0's hosted quick-start after tenant creation.

```ts
export interface SetupAuth0EnvOptions {
    /** Auth0 tenant name — flows into the issuer `https://<tenant>.auth0.com/`. */
    tenant?: string | undefined;
    /** Auth0 client id — surfaces as `aud` in id_token + `azp` in access_token. */
    clientId?: string | undefined;
    /** Client secret — reserved for future signature checks, unused today. */
    clientSecret?: string | undefined;
    /** API audience — set when the tenant has an API configured (backend gates). */
    audience?: string | undefined;
    /** Token lifetime in seconds — Auth0 default is 24h for id_token, mock mirrors it. */
    tokenExpiration?: number | undefined;
    /** Custom issuer override — otherwise derived from `tenant`. */
    issuer?: string | undefined;
    /**
     * Pre-seeded users. Each entry becomes an {@link Auth0User} through the
     * `users.create` Management API. Useful when tests need a specific
     * `user_id` shape to assert against without threading `signIn` calls.
     */
    users?: Array<{
        email: string;
        connection?: Auth0Connection;
        email_verified?: boolean;
        name?: string;
        nickname?: string;
        /**
         * Optional seed password. Set when the test wants to call
         * {@link Auth0TestEnv.authenticate.signIn} against the seeded user
         * without running through `signUp` first. Ignored for non-database
         * connections (social / SMS / email).
         */
        password?: string;
        app_metadata?: Record<string, unknown>;
        user_metadata?: Record<string, unknown>;
    }> | undefined;
    /**
     * Pre-registered rules. Rules run in order during login flows — later rules
     * see mutations from earlier rules (mirrors Auth0's actual rule pipeline).
     */
    rules?: Auth0Rule[] | undefined;
    /**
     * Pre-registered actions keyed by trigger. The mock invokes matching actions
     * in registration order during {@link Auth0TestEnv.signIn} + {@link Auth0TestEnv.signUp}.
     */
    actions?: Partial<Record<Auth0ActionTrigger, Auth0Action[]>> | undefined;
}
```

#### `SetupBetterAuthEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L181) `packages/auth/src/better-auth/types.ts`

```ts
export interface SetupBetterAuthEnvOptions {
    /**
     * Which social provider mocks to expose. Defaults to `['google', 'github']`.
     * Password / magic-link / 2FA are configured through `plugins`, not `providers`.
     */
    providers?: BetterAuthProviderKind[] | undefined;
    /** Session lifetime in seconds. Defaults to 7 days, matching Better Auth's default. */
    sessionExpiration?: number | undefined;
    /**
     * Enabled plugin surfaces. Defaults to `['emailAndPassword']` — the minimum
     * Better Auth suite (password sign-up + sign-in). Adding `magicLink` unlocks
     * `sendMagicLink` + `consumeMagicLink`; adding `twoFactor` unlocks the TOTP
     * helpers; `organizations` / `passkey` unlock the corresponding plugin helpers.
     */
    plugins?: BetterAuthPluginKind[] | undefined;
    /**
     * Pre-built adapter instance. When omitted, the helper builds an in-memory
     * adapter of the requested {@link database.kind} (default `prisma`).
     */
    database?: BetterAuthDatabaseAdapter | {
        kind?: BetterAuthDatabaseKind;
    } | undefined;
    /** Verification token lifetime in seconds. Defaults to 15 minutes. */
    verificationExpiration?: number | undefined;
}
```

#### `SetupClerkEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L132) `packages/auth/src/clerk/types.ts`

Options accepted by {@link setupClerkEnv }. Every field is optional — the defaults exercise a single-org / single-user shape that matches Clerk's hosted quick-start.

```ts
export interface SetupClerkEnvOptions {
    /**
     * Session lifetime in seconds. Defaults to 7 days, matching Clerk's default
     * session inactivity timeout for hosted instances.
     */
    sessionExpiration?: number | undefined;
    /**
     * Pre-seeded users. Each entry becomes a {@link ClerkUser} through the
     * `createUser` API. Useful for tests that need a specific user id to
     * assert against without going through `signIn`.
     */
    users?: Array<{
        primaryEmailAddress: string;
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        externalAccounts?: ClerkExternalAccount[];
        publicMetadata?: Record<string, unknown>;
        privateMetadata?: Record<string, unknown>;
    }> | undefined;
    /**
     * Pre-seeded organizations. Each entry becomes a {@link ClerkOrganization}.
     * The `createdBy` field is a reference to a user's primary email — the
     * setup resolves it to the corresponding user id after user creation.
     */
    orgs?: Array<{
        name: string;
        slug: string;
        createdByEmail: string;
        publicMetadata?: Record<string, unknown>;
    }> | undefined;
    /**
     * Pre-seeded session tokens. Each entry issues an active session for the
     * user with the matching primary email — the resulting token is exposed
     * back to the caller for use in the suite.
     */
    tokens?: Array<{
        userEmail: string;
        organizationSlug?: string;
        /** Override the JWT issuer for the seeded tokens. */
        issuer?: string;
    }> | undefined;
    /** JWT issuer used when issuing session tokens. Defaults to the mock instance stub. */
    issuer?: string | undefined;
    /** JWT audience used when issuing session tokens. Defaults to undefined. */
    audience?: string | undefined;
}
```

#### `SetupLuciaEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/types.ts#L86) `packages/auth/src/lucia/types.ts`

```ts
export interface SetupLuciaEnvOptions {
    /**
     * Which OAuth provider mocks to expose. Defaults to `['google', 'github']`.
     * Password auth is always available and does not need to be enumerated here.
     */
    providers?: LuciaProviderKind[] | undefined;
    /** Session lifetime in seconds. Defaults to 30 days, matching Lucia's default. */
    sessionExpiration?: number | undefined;
    /**
     * Pre-built adapter instance. When omitted, the helper builds an in-memory
     * adapter of the requested {@link database.kind} (default `sqlite`).
     */
    database?: LuciaDatabaseAdapter | {
        kind?: LuciaDatabaseKind;
    } | undefined;
}
```

#### `SetupNextAuthEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L79) `packages/auth/src/types.ts`

```ts
export interface SetupNextAuthEnvOptions {
    providers?: ProviderKind[] | undefined;
    session?: {
        strategy?: SessionStrategy;
        maxAge?: number;
    } | undefined;
    database?: AuthDatabaseAdapter | undefined;
}
```

#### `SetupOAuth21EnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L330) `packages/auth/src/oauth21/types.ts`

Options accepted by `setupOAuth21Env`. Composes the AS options with helpers for PKCE + DPoP.

```ts
export interface SetupOAuth21EnvOptions extends AuthorizationServerOptions {
}
```

#### `SetupOidcEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/types.ts#L398) `packages/auth/src/oidc/types.ts`

Options accepted by `setupOidcEnv`. Extends the OAuth 2.1 options with OIDC-specific settings.

```ts
export interface SetupOidcEnvOptions {
    issuer?: string;
    clients?: readonly OAuth21ClientRegistration[];
    users?: readonly {
        subject: string;
        scopes?: readonly string[];
    }[];
    /**
     * Access token lifetime (seconds). Passed through to the OAuth 2.1 mock.
     */
    accessTokenLifetimeSec?: number;
    /** Refresh token lifetime (seconds). Passed through to the OAuth 2.1 mock. */
    refreshTokenLifetimeSec?: number;
    /** id_token lifetime (seconds). Defaults to 3600. */
    idTokenLifetimeSec?: number;
    /**
     * Retention window for retired JWKS keys (seconds). Defaults to 86400
     * (24 h). During the retention window a token signed by the retired key
     * still verifies; after it, the key is dropped from the JWKS.
     */
    jwksRetentionSec?: number;
    /**
     * Software statement issuer used to validate DCR `software_statement`
     * signatures. When absent the mock refuses every request that carries a
     * `software_statement`.
     */
    softwareStatementIssuer?: string;
    /** Deterministic clock. */
    now?: () => number;
}
```

#### `SetupPasskeyEnvDeviceOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/types.ts#L212) `packages/auth/src/passkey/types.ts`

Per-device authenticator preseed. Mirrors the shape a real deployment picks per device (a MacBook has a Touch ID platform authenticator; a Yubikey user carries a security-key roaming authenticator).

```ts
export interface SetupPasskeyEnvDeviceOptions {
    deviceId: string;
    platform?: PlatformAuthenticatorOptions;
    roaming?: RoamingAuthenticatorOptions;
}
```

#### `SetupPasskeyEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/types.ts#L191) `packages/auth/src/passkey/types.ts`

Options accepted by `setupPasskeyEnv`.

```ts
export interface SetupPasskeyEnvOptions {
    /**
     * Devices participating in the env. Each device gets an isolated set of
     * platform / roaming authenticators. When omitted the env starts with a
     * single default device (`device-1`) and no authenticators — the caller
     * adds them lazily.
     */
    devices?: SetupPasskeyEnvDeviceOptions[];
    /**
     * Sync fabric vendors to instantiate. Defaults to both iCloud Keychain and
     * Google Password Manager so tests can exercise cross-vendor backup /
     * restore without extra setup.
     */
    fabrics?: SyncFabricVendor[];
}
```

#### `SetupSupabaseAdvancedEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/types.ts#L211) `packages/auth/src/supabase-advanced/types.ts`

Options accepted by {@link setupSupabaseAdvancedEnv }. Every field is optional — defaults produce a usable env with no policies, no factors, and no SAML IdPs.

```ts
export interface SetupSupabaseAdvancedEnvOptions {
    projectUrl?: string | undefined;
    /** Session access-token lifetime (seconds). Default 3600. */
    sessionExpiration?: number | undefined;
    /** MFA challenge lifetime (seconds). Default 300 (5 minutes). */
    mfaChallengeExpiration?: number | undefined;
    /** SIWE nonce lifetime (seconds). Default 600 (10 minutes). */
    siweNonceExpiration?: number | undefined;
    /** Pre-seeded users (same shape as core adapter). */
    users?: Array<{
        email?: string;
        phone?: string;
        password?: string;
        emailConfirmed?: boolean;
        phoneConfirmed?: boolean;
        appMetadata?: Record<string, unknown>;
        userMetadata?: Record<string, unknown>;
        role?: 'authenticated' | 'anon' | 'service_role';
    }> | undefined;
    /** Pre-seeded RLS policies. */
    policies?: RlsPolicy[] | undefined;
    /** Pre-seeded SAML IdPs. */
    samlIdps?: Array<Omit<SamlIdentityProvider, 'id'>> | undefined;
}
```

#### `SetupSupabaseAuthEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/types.ts#L157) `packages/auth/src/supabase/types.ts`

Options accepted by {@link setupSupabaseAuthEnv }. Every field is optional — the defaults exercise a single anonymous project shape.

```ts
export interface SetupSupabaseAuthEnvOptions {
    /**
     * Project URL — used as the JWT issuer (`iss` claim). Defaults to a stub URL
     * matching Supabase's format.
     */
    projectUrl?: string | undefined;
    /**
     * Session access-token lifetime (seconds). Defaults to 3600 (1 hour), matching
     * Supabase's hosted default.
     */
    sessionExpiration?: number | undefined;
    /**
     * OTP code lifetime (seconds). Defaults to 3600 (1 hour), matching Supabase's
     * magic-link + SMS OTP default.
     */
    otpExpiration?: number | undefined;
    /**
     * Pre-seeded users. Each entry becomes a {@link SupabaseUser} through the
     * `admin.createUser` API path. Useful for tests that need a specific user id
     * to assert against without going through `signUp`.
     */
    users?: Array<{
        email?: string;
        phone?: string;
        password?: string;
        emailConfirmed?: boolean;
        phoneConfirmed?: boolean;
        identities?: Array<{
            provider: SupabaseIdentityProvider;
            identityData?: Record<string, unknown>;
        }>;
        appMetadata?: Record<string, unknown>;
        userMetadata?: Record<string, unknown>;
        role?: 'authenticated' | 'anon' | 'service_role';
    }> | undefined;
    /**
     * Pre-seeded sessions. Each entry issues an active session for the user with
     * the matching email — the resulting token pair is exposed back for use in
     * the suite.
     */
    tokens?: Array<{
        userEmail: string;
    }> | undefined;
}
```

#### `SetupWebAuthnEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L225) `packages/auth/src/webauthn/types.ts`

Options accepted by `setupWebAuthnEnv`. Callers can preseed the environment with authenticators or leave it empty and add them lazily.

```ts
export interface SetupWebAuthnEnvOptions {
    authenticators?: VirtualAuthenticatorOptions[];
}
```

#### `SignIdTokenInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/types.ts#L198) `packages/auth/src/oidc/types.ts`

Input to `signIdToken`. The signer builds a full JWT from these fields plus the currently-active JWKS key.

```ts
export interface SignIdTokenInput {
    /** Issuer. Defaults to the AS issuer. */
    iss?: string;
    /** Subject. Required — no default. */
    sub: string;
    /** Audience (client_id of the RP). Required. */
    aud: string;
    /** Lifetime in seconds. Added to `iat` to compute `exp`. */
    lifetimeSec?: number;
    /** Nonce echoed from the authorization request. */
    nonce?: string;
    /** ASCII access_token that `at_hash` should cover. */
    accessToken?: string;
    /** ASCII authorization code that `c_hash` should cover. */
    code?: string;
    /** Additional custom claims folded into the payload. */
    extraClaims?: Record<string, unknown>;
}
```

#### `SiweChallenge`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/types.ts#L198) `packages/auth/src/supabase-advanced/types.ts`

```ts
export interface SiweChallenge {
    id: string;
    nonce: string;
    message: SiweMessage;
    issuedAt: Date;
    expiresAt: Date;
    consumed: boolean;
}
```

#### `SiweMessage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/types.ts#L183) `packages/auth/src/supabase-advanced/types.ts`

EIP-4361 Sign-In with Ethereum message. Real SIWE messages are constructed from a fixed set of fields — domain, address, statement, uri, version, chainId, nonce, issuedAt + optional expirationTime / notBefore / requestId / resources. The mock stores each field so consumers can craft messages the same way the real client does.

```ts
export interface SiweMessage {
    domain: string;
    address: string;
    statement: string;
    uri: string;
    version: '1';
    chainId: number;
    nonce: string;
    issuedAt: string;
    expirationTime: string | undefined;
    notBefore: string | undefined;
    requestId: string | undefined;
    resources: string[] | undefined;
}
```

#### `SupabaseAccessTokenClaims`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/types.ts#L95) `packages/auth/src/supabase/types.ts`

JWT claims Supabase Auth embeds in the access_token. The mock encodes these in an HS256-signed JWT the `verifyToken` helper decodes back.

```ts
export interface SupabaseAccessTokenClaims {
    /** Subject — the Supabase user id. */
    sub: string;
    /** Audience — typically `authenticated`. */
    aud: string;
    /** Role — used by PostgREST for RLS (`authenticated` / `anon` / `service_role`). */
    role: 'authenticated' | 'anon' | 'service_role';
    email: string | undefined;
    phone: string | undefined;
    /** Application metadata — writeable only via admin API, exposed in JWT for RLS. */
    app_metadata: Record<string, unknown>;
    /** User metadata — writeable by the user themselves. */
    user_metadata: Record<string, unknown>;
    /** Session id — links the access_token to the refresh_token. */
    session_id: string;
    /** Issued at, seconds since epoch. */
    iat: number;
    /** Expires at, seconds since epoch. */
    exp: number;
    /** JWT issuer — Supabase uses `<project>.supabase.co/auth/v1` in prod. */
    iss: string;
    /** Auth method used to sign in — Supabase surfaces this in `amr`. */
    amr: Array<{
        method: string;
        timestamp: number;
    }>;
}
```

#### `SupabaseAdvancedTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/types.ts#L240) `packages/auth/src/supabase-advanced/types.ts`

The advanced test env returned by {@link setupSupabaseAdvancedEnv }. Adds `rls`, `mfa`, `saml`, and `web3` handles on top of the core `auth` + `admin` API.

```ts
export interface SupabaseAdvancedTestEnv extends TestEnvBase<'mock'> {
    projectUrl: string;
    sessionExpiration: number;
    mfaChallengeExpiration: number;
    siweNonceExpiration: number;
    /**
     * RLS policy simulation. Consumers call `defineRlsPolicy` at setup + `checkRlsAccess`
     * at request time to assert whether the subject can access a given row.
     */
    rls: {
        defineRlsPolicy: (policy: RlsPolicy) => void;
        dropRlsPolicy: (table: string, name: string) => void;
        checkRlsAccess: (input: RlsCheckInput) => Promise<RlsCheckOutcome>;
        listPolicies: (table?: string) => RlsPolicy[];
    };
    /**
     * MFA (multi-factor authentication) — TOTP + backup codes + phone factors.
     * Mirrors Supabase's `auth.mfa.*` surface.
     */
    mfa: {
        /** Enroll a TOTP factor — returns the shared secret + otpauth URI. */
        enrollTotp: (input: {
            userId: string;
            friendlyName?: string;
        }) => Promise<{
            factor: MfaFactor;
            otpAuthUri: string;
        }>;
        /** Enroll an SMS phone factor — challenges it via SMS OTP. */
        enrollPhone: (input: {
            userId: string;
            phone: string;
            friendlyName?: string;
        }) => Promise<{
            factor: MfaFactor;
        }>;
        /** Issue 10 fresh backup codes, replacing any prior set. */
        issueBackupCodes: (input: {
            userId: string;
        }) => Promise<{
            codes: string[];
        }>;
        /** Start an MFA challenge for a specific factor. */
        challenge: (input: {
            factorId: string;
        }) => Promise<MfaChallenge>;
        /** Verify a challenge with a TOTP or SMS code. */
        verifyChallenge: (input: {
            challengeId: string;
            code: string;
        }) => Promise<{
            factor: MfaFactor;
            aal: MfaAal;
        }>;
        /** Consume a backup code — upgrades the current session to aal2. */
        consumeBackupCode: (input: {
            userId: string;
            code: string;
        }) => Promise<{
            aal: MfaAal;
        }>;
        listFactors: (userId: string) => MfaFactor[];
        listBackupCodes: (userId: string) => MfaBackupCode[];
        /** Current AAL for a session — aal2 if any verified factor upgrade occurred. */
        getSessionAal: (sessionId: string) => MfaAal;
    };
    /**
     * SAML 2.0 SSO IdP mock. Consumers register an IdP + email domain, request
     * an AuthnRequest URL, then submit a mocked assertion to obtain a session.
     */
    saml: {
        registerIdp: (idp: Omit<SamlIdentityProvider, 'id'>) => SamlIdentityProvider;
        initiateSsoLogin: (input: {
            email: string;
            relayState?: string;
        }) => Promise<SamlAuthnRequest>;
        /**
         * Mint a signed assertion for testing — mimics what the real IdP would
         * return. Callers pass the intended attributes + the AuthnRequest id.
         */
        mintAssertion: (input: {
            authnRequestId: string;
            nameId: string;
            attributes: Record<string, string | string[]>;
            /** Override expirationTime — defaults to 10 minutes. */
            expiresIn?: number;
        }) => SamlAssertion;
        /**
         * Verify + exchange the assertion for a Supabase session. Real Supabase
         * validates the IdP signature + attribute mapping + NotBefore / NotOnOrAfter
         * bounds.
         */
        exchangeAssertion: (input: {
            assertion: SamlAssertion;
        }) => Promise<{
            accessToken: string;
            refreshToken: string;
            sessionId: string;
            userId: string;
        }>;
        listIdps: () => SamlIdentityProvider[];
    };
    /**
     * Web3 wallet auth via EIP-4361 Sign-In with Ethereum. Consumers request a
     * challenge nonce, sign the message, and exchange the signature for a session.
     */
    web3: {
        createSiweChallenge: (input: {
            address: string;
            domain: string;
            uri: string;
            chainId?: number;
            statement?: string;
            requestId?: string;
            resources?: string[];
        }) => Promise<SiweChallenge>;
        /**
         * Sign the SIWE message with a private key — the mock uses an HMAC over
         * the canonical EIP-4361 message to stand in for `secp256k1` recover,
         * verified back with the same key.
         */
        signSiweMessage: (input: {
            message: SiweMessage;
            privateKey: string;
        }) => string;
        /**
         * Verify + exchange the SIWE signature for a session. Real Supabase would
         * recover the address from the signature and match against the message
         * `address` field; the mock does the same via HMAC + address check.
         */
        verifySiweMessage: (input: {
            challengeId: string;
            signature: string;
            privateKey: string;
        }) => Promise<{
            accessToken: string;
            refreshToken: string;
            sessionId: string;
            userId: string;
        }>;
        listChallenges: () => SiweChallenge[];
    };
    /** Verify an access token issued by the advanced env. */
    verifyToken: (token: string) => Promise<Record<string, unknown>>;
    /**
     * Direct handle to the user store — advanced flows need to reach into user
     * records that were created by SIWE / SAML flows without going through the
     * core `admin.getUserByEmail`.
     */
    getUserById: (id: string) => {
        id: string;
        email: string | undefined;
        role: string;
    } | null;
}
```

#### `SupabaseAuthTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/types.ts#L209) `packages/auth/src/supabase/types.ts`

The test env returned by {@link setupSupabaseAuthEnv }. Consumers hold this handle for the lifetime of a test and call `stop()` in `afterEach` to reset all in-memory state. The `auth` handle mirrors `@supabase/supabase-js`'s `client.auth.*` client surface so call sites are drop-in-compatible after swap. The `admin` handle mirrors `client.auth.admin.*` — the service-role-only API.

```ts
export interface SupabaseAuthTestEnv extends TestEnvBase<'mock'> {
    projectUrl: string;
    sessionExpiration: number;
    otpExpiration: number;
    /**
     * Seed tokens returned during setup. Only populated when the caller passes
     * `tokens` in {@link SetupSupabaseAuthEnvOptions}. Keyed by user email.
     */
    seededTokens: Record<string, {
        accessToken: string;
        refreshToken: string;
        sessionId: string;
    }>;
    /** Client-side auth API — mirrors `client.auth.*`. */
    auth: {
        signUp: (input: {
            email?: string;
            phone?: string;
            password: string;
            options?: {
                data?: Record<string, unknown>;
            };
        }) => Promise<{
            user: SupabaseUser;
            session: SupabaseSession | null;
        }>;
        signInWithPassword: (input: {
            email?: string;
            phone?: string;
            password: string;
        }) => Promise<{
            user: SupabaseUser;
            session: SupabaseSession;
        }>;
        signInWithOtp: (input: {
            email?: string;
            phone?: string;
            options?: {
                shouldCreateUser?: boolean;
                emailRedirectTo?: string;
            };
        }) => Promise<{
            otp: SupabaseOtpDelivery;
        }>;
        signInWithOAuth: (input: {
            provider: Exclude<SupabaseIdentityProvider, 'email'>;
            options?: {
                redirectTo?: string;
                scopes?: string;
            };
        }) => Promise<SupabaseOAuthAuthorizationUrl>;
        exchangeCodeForSession: (input: {
            code: string;
            codeVerifier: string;
        }) => Promise<{
            user: SupabaseUser;
            session: SupabaseSession;
        }>;
        verifyOtp: (input: {
            email?: string;
            phone?: string;
            token: string;
            type: 'email' | 'sms' | 'magiclink' | 'signup' | 'recovery';
        }) => Promise<{
            user: SupabaseUser;
            session: SupabaseSession;
        }>;
        refreshSession: (input: {
            refreshToken: string;
        }) => Promise<{
            user: SupabaseUser;
            session: SupabaseSession;
        }>;
        signOut: (input: {
            accessToken: string;
        }) => Promise<void>;
        getUser: (accessToken: string) => Promise<SupabaseUser>;
    };
    /** Admin (service-role) API — mirrors `client.auth.admin.*`. */
    admin: {
        createUser: (input: {
            email?: string;
            phone?: string;
            password?: string;
            emailConfirm?: boolean;
            phoneConfirm?: boolean;
            appMetadata?: Record<string, unknown>;
            userMetadata?: Record<string, unknown>;
            role?: 'authenticated' | 'anon' | 'service_role';
        }) => Promise<SupabaseUser>;
        getUserById: (id: string) => Promise<SupabaseUser>;
        getUserByEmail: (email: string) => Promise<SupabaseUser | null>;
        listUsers: () => Promise<SupabaseUser[]>;
        updateUserById: (id: string, patch: Partial<{
            email: string;
            phone: string;
            password: string;
            emailConfirm: boolean;
            phoneConfirm: boolean;
            appMetadata: Record<string, unknown>;
            userMetadata: Record<string, unknown>;
        }>) => Promise<SupabaseUser>;
        deleteUser: (id: string) => Promise<void>;
    };
    /**
     * Verify a Supabase access token. Returns the decoded claims when the token
     * is valid, throws on invalid / expired tokens. Mirrors GoTrue's
     * `authorization.verifyJwt`.
     */
    verifyToken: (token: string) => Promise<SupabaseAccessTokenClaims>;
    /**
     * Introspection — every OTP delivery the mock has issued (magic link + SMS).
     * Tests use this to assert delivery channel + one-time code without threading
     * a mock inbox.
     */
    listOtpDeliveries: (channel?: 'email' | 'sms') => SupabaseOtpDelivery[];
    /** Introspection — every pending OAuth authorization URL. */
    listOAuthPending: () => SupabaseOAuthAuthorizationUrl[];
}
```

#### `SupabaseIdentity`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/types.ts#L43) `packages/auth/src/supabase/types.ts`

```ts
export interface SupabaseIdentity {
    id: string;
    userId: string;
    identityId: string;
    provider: SupabaseIdentityProvider;
    identityData: Record<string, unknown>;
    createdAt: Date;
    lastSignInAt: Date;
}
```

#### `SupabaseIdentityProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/types.ts#L20) `packages/auth/src/supabase/types.ts`

Supabase identity — one per external provider (email or OAuth) linked to a user. Real Supabase surfaces `identities: Identity[]` on every user record.

```ts
export type SupabaseIdentityProvider = 'email' | 'google' | 'github' | 'apple' | 'azure' | 'facebook' | 'twitter';
```

#### `SupabaseOAuthAuthorizationUrl`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/types.ts#L144) `packages/auth/src/supabase/types.ts`

OAuth authorization URL response — mimicking `signInWithOAuth`. The mock captures the URL for the test to assert against, then a follow-up `exchangeCodeForSession` completes the PKCE flow.

```ts
export interface SupabaseOAuthAuthorizationUrl {
    provider: Exclude<SupabaseIdentityProvider, 'email'>;
    url: string;
    /** PKCE code_verifier — the mock returns it so tests can drive the exchange. */
    codeVerifier: string;
    /** Authorization code the mock will accept in `exchangeCodeForSession`. */
    code: string;
}
```

#### `SupabaseOtpDelivery`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/types.ts#L124) `packages/auth/src/supabase/types.ts`

OTP delivery record — captured whenever the mock issues a magic link or an SMS OTP. Tests can inspect this to assert the delivery channel + one-time code.

```ts
export interface SupabaseOtpDelivery {
    channel: 'email' | 'sms';
    recipient: string;
    /** One-time code (6 digits for email OTP, sms OTP). */
    code: string;
    /** Magic link URL when the flow used `signInWithOtp({ shouldCreateUser })`. */
    magicLink: string | undefined;
    /** ISO ms timestamp of when the code was issued. */
    issuedAt: Date;
    /** ISO ms — when the code expires (default 1 hour). */
    expiresAt: Date;
    /** True once the code has been consumed via `verifyOtp`. */
    consumed: boolean;
}
```

#### `SupabaseSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/types.ts#L80) `packages/auth/src/supabase/types.ts`

Supabase session — a pair of tokens (access_token + refresh_token) plus the user they authenticate. Real Supabase returns this shape from `signInWithPassword` / `signUp` / `signInWithOtp` / `exchangeCodeForSession`.

```ts
export interface SupabaseSession {
    accessToken: string;
    refreshToken: string;
    /** JWT expiration timestamp (seconds since epoch). */
    expiresAt: number;
    /** Seconds until expiration (Supabase surfaces both fields). */
    expiresIn: number;
    tokenType: 'bearer';
    user: SupabaseUser;
}
```

#### `SupabaseUser`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/types.ts#L59) `packages/auth/src/supabase/types.ts`

Supabase user record. The mock covers the fields that consumers assert against in tests — id + email + phone + identities + app_metadata + user_metadata + timestamps. Real Supabase carries additional fields (banned_until / is_sso_user / confirmation_sent_at etc) that are added lazily as needed.

```ts
export interface SupabaseUser {
    id: string;
    aud: string;
    role: 'authenticated' | 'anon' | 'service_role';
    email: string | undefined;
    emailConfirmedAt: Date | undefined;
    phone: string | undefined;
    phoneConfirmedAt: Date | undefined;
    identities: SupabaseIdentity[];
    appMetadata: Record<string, unknown>;
    userMetadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    lastSignInAt: Date | undefined;
}
```

#### `SyncFabric`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/types.ts#L166) `packages/auth/src/passkey/types.ts`

Sync fabric handle. Real iCloud Keychain / Google Password Manager expose a cloud endpoint; the mock keeps every backup in an in-memory blob store keyed by `credentialId`. The blob shape is opaque to the caller — restore just hands back the original `PasskeyCredential`.

```ts
export interface SyncFabric {
    readonly vendor: SyncFabricVendor;
    /** Number of blobs currently held by the fabric. */
    size(): number;
    /**
     * Push a credential blob into the fabric. Idempotent — pushing the same
     * credential twice replaces the earlier blob and bumps the sync epoch.
     */
    backup(credential: PasskeyCredential): void;
    /**
     * Fetch a credential blob by `credentialId`. Returns `null` when the fabric
     * does not hold the credential.
     */
    restore(credentialId: string): PasskeyCredential | null;
    /** Remove a credential blob from the fabric. */
    evict(credentialId: string): boolean;
    /** Snapshot of every backup currently held. */
    list(): PasskeyCredential[];
    /** Drop every blob. Called by `PasskeyTestEnv.reset()`. */
    clear(): void;
}
```

#### `SyncFabricVendor`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/types.ts#L23) `packages/auth/src/passkey/types.ts`

Sync fabric vendors modeled by the mock. Real-world Passkey deployments synchronize discoverable credentials across a user's devices through one of two commercial fabrics — Apple's iCloud Keychain (FIDO Alliance CTAP 2.2 Passkey Provider spec) and Google Password Manager (FIDO2 credential sync for Android + Chrome). The mock represents each as an independent, in-memory blob store that survives device removal — matching the "credential outlives the authenticator that minted it" property that separates passkeys from plain WebAuthn credentials.

```ts
export type SyncFabricVendor = 'icloud-keychain' | 'google-password-manager';
```

#### `TokenRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L154) `packages/auth/src/oauth21/types.ts`

Token request submitted to `/token`. RFC 6749 §4.1.3 dictates the shape; OAuth 2.1 adds mandatory PKCE (`code_verifier`) and RFC 9449 optionally adds `DPoP` header for sender-constrained tokens.

```ts
export type TokenRequest = {
    grantType: 'authorization_code';
    code: string;
    redirectUri: string;
    clientId: string;
    codeVerifier: string;
    /** DPoP proof for sender-constrained access tokens. Optional. */
    dpop?: DpopProof;
} | {
    grantType: 'refresh_token';
    refreshToken: string;
    clientId: string;
    /** DPoP proof for sender-constrained access tokens. Optional. */
    dpop?: DpopProof;
    /**
     * Explicit scope narrowing (RFC 6749 §6). When omitted the refreshed
     * token inherits the original grant's scope.
     */
    scope?: string;
};
```

#### `TokenResponse`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L224) `packages/auth/src/oauth21/types.ts`

Response to a successful `/token` call. Mirrors the RFC 6749 token response body verbatim so a caller wiring the mock behind a real HTTP client can treat it as-is.

```ts
export interface TokenResponse {
    accessToken: string;
    tokenType: 'Bearer' | 'DPoP';
    expiresIn: number;
    refreshToken: string;
    scope: string;
}
```

#### `TrustAnchor`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/types.ts#L259) `packages/auth/src/oidc/types.ts`

Trust chain node in an OpenID Federation 1.0 trust chain. The mock represents each node as a plain object rather than a signed Entity Configuration JWT — the point is to prove the chain-walk logic, not the signature cryptography.

```ts
export interface TrustAnchor {
    /** Entity identifier (URL). */
    entity_id: string;
    /**
     * Public JWKS the node advertises. In real Federation this signs its own
     * Entity Configuration + Entity Statements about subordinates.
     */
    jwks: JwksDocument;
    /** Metadata the node advertises. */
    metadata: {
        openid_provider?: Partial<OpenIdProviderMetadata>;
        openid_relying_party?: Record<string, unknown>;
    };
}
```

#### `TrustChainReasonCode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/types.ts#L311) `packages/auth/src/oidc/types.ts`

Structured discriminator for `TrustChainResult.reason`. Downstream wrappers (dogfood-oidc-federation の `classifyFederationReason` 等) が reason string の substring match で failure axis を判定する fragile 依存を除去するため、 underlying resolver 側で 5 種の failure axis を tag 付けする。 `broken_link` — chain step が previous step の `iss` を describe しない (walker が該当 intermediate を見つけられず exhausted、 または cycle 検出前に exhaust)、 `cycle` — walker が既訪 entity を再訪、 `expired_intermediate` — intermediate statement の `exp &lt;= now`、 `expired_leaf` — leaf statement の `exp &lt;= now`、 `anchor_mismatch` — chain 到達点の `iss` が指定 trust anchor と一致しない。

```ts
export type TrustChainReasonCode = 'broken_link' | 'cycle' | 'expired_intermediate' | 'expired_leaf' | 'anchor_mismatch';
```

#### `TrustChainResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/types.ts#L336) `packages/auth/src/oidc/types.ts`

Trust chain returned by `resolveTrustChain`. The chain is ordered from the leaf (index 0) to the trust anchor (last index). `valid` false always carries a `reason` + `reason_code` — the `reason_code` は failure axis を pin する structured tag、 `reason` は human-readable diagnostic string。

```ts
export interface TrustChainResult {
    valid: boolean;
    chain?: readonly EntityStatement[];
    anchor?: TrustAnchor;
    reason?: string;
    /**
     * Failure axis を pin する structured tag。 `valid === false` の時のみ
     * 存在する。 wrapper が substring match せず discriminated union として
     * failure mode を分岐できるようにする (undefined 許容で backward compat)。
     */
    reason_code?: TrustChainReasonCode;
}
```

#### `VerificationToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L48) `packages/auth/src/types.ts`

```ts
export interface VerificationToken {
    identifier: string;
    token: string;
    expires: Date;
}
```

#### `VerifyIdTokenOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/types.ts#L225) `packages/auth/src/oidc/types.ts`

Options accepted by `verifyIdToken`. The verifier refuses on any mismatch — `expectedIssuer` / `expectedAudience` are mandatory in practice (the mock types them as required to remind callers). `expectedNonce` / `expectedAccessToken` / `expectedCode` are optional because not every flow carries them, but if the token has the corresponding claim the verifier checks it against the expectation.

```ts
export interface VerifyIdTokenOptions {
    expectedIssuer: string;
    expectedAudience: string;
    expectedNonce?: string;
    /** ASCII access_token to compare against `at_hash`. */
    expectedAccessToken?: string;
    /** ASCII code to compare against `c_hash`. */
    expectedCode?: string;
    /** Deterministic clock. */
    now?: () => number;
    /**
     * Skew tolerance in seconds. Clock drift between the RP and OP is common
     * in real deployments; the mock defaults to 60 s to match the DPoP skew
     * default in the OAuth 2.1 adapter.
     */
    clockSkewSec?: number;
}
```

#### `VerifyIdTokenResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/types.ts#L247) `packages/auth/src/oidc/types.ts`

Verify result. `valid` false always carries a `reason` so tests can pin failure modes without regexing the exception message.

```ts
export interface VerifyIdTokenResult {
    valid: boolean;
    claims?: IdTokenClaims;
    reason?: string;
}
```

#### `VirtualAuthenticator`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L189) `packages/auth/src/webauthn/types.ts`

Virtual authenticator handle. Callers do not construct this directly — use `createVirtualAuthenticator({ ... })`.

```ts
export interface VirtualAuthenticator {
    readonly id: string;
    readonly attachment: WebAuthnAuthenticatorAttachment;
    readonly transport: WebAuthnTransport;
    readonly hasResidentKey: boolean;
    readonly hasUserVerification: boolean;
    isUserPresent: boolean;
    /** Snapshot of credentials currently stored on this authenticator. */
    listCredentials(): WebAuthnCredential[];
}
```

#### `VirtualAuthenticatorOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L163) `packages/auth/src/webauthn/types.ts`

Configuration for `createVirtualAuthenticator`. Mirrors the Chrome Virtual Authenticator Protocol (`WebAuthn.addVirtualAuthenticator` in the DevTools protocol, used by Playwright / Puppeteer).

```ts
export interface VirtualAuthenticatorOptions {
    attachment: WebAuthnAuthenticatorAttachment;
    transport: WebAuthnTransport;
    /**
     * When `true` the authenticator stores discoverable credentials
     * (resident keys) that survive across sessions.
     */
    hasResidentKey?: boolean;
    /**
     * When `true` the authenticator can perform user verification (biometric /
     * PIN). When `false` the authenticator is UV=false regardless of RP
     * preference.
     */
    hasUserVerification?: boolean;
    /**
     * When `true` the authenticator claims user presence for every assertion
     * (default). When `false` the mock returns UP=0 to simulate an authenticator
     * that failed the touch gesture.
     */
    isUserPresent?: boolean;
}
```

#### `WebAuthnAttestationConveyancePreference`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L40) `packages/auth/src/webauthn/types.ts`

Attestation conveyance preference (WebAuthn L3 §5.4.7). `none` — RP does not want attestation, authenticator returns a self-signed empty attestation. `indirect` — client may substitute an anonymized attestation CA. `direct` — RP wants the raw attestation statement. `enterprise` — RP is allowed to receive uniquely-identifying attestation (enterprise deployments only). The mock returns matching attestation object shapes for each.

```ts
export type WebAuthnAttestationConveyancePreference = 'none' | 'indirect' | 'direct' | 'enterprise';
```

#### `WebAuthnAuthenticatorAttachment`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L29) `packages/auth/src/webauthn/types.ts`

`platform` — authenticator is bound to the device (Touch ID, Windows Hello). `cross-platform` — authenticator is a roaming key (YubiKey, phone via caBLE). Mirrors the `authenticatorAttachment` field from WebAuthn L3 §5.4.5.

```ts
export type WebAuthnAuthenticatorAttachment = 'platform' | 'cross-platform';
```

#### `WebAuthnCredential`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L113) `packages/auth/src/webauthn/types.ts`

Stored credential record. WebAuthn L3 §6.1 defines the authenticator-side storage — the mock keeps the shape the RP would round-trip through its own database. `signCount` is the monotonic counter used to detect cloned authenticators (§6.1.1).

```ts
export interface WebAuthnCredential {
    credentialId: string;
    userHandle: string;
    publicKey: string;
    signCount: number;
    transports: WebAuthnTransport[];
    attachment: WebAuthnAuthenticatorAttachment;
    discoverable: boolean;
    /** Millisecond wall clock at credential creation, for ordering / audit. */
    createdAt: number;
    /** Millisecond wall clock at last successful assertion. */
    lastUsedAt?: number;
}
```

#### `WebAuthnResidentKeyRequirement`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L62) `packages/auth/src/webauthn/types.ts`

`required` — credential must be stored on the authenticator (discoverable / resident credential, enables usernameless login). `preferred` — store if possible. `discouraged` — do not store (server-side credential, WebAuthn L3 §5.4.6).

```ts
export type WebAuthnResidentKeyRequirement = 'required' | 'preferred' | 'discouraged';
```

#### `WebAuthnTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L204) `packages/auth/src/webauthn/types.ts`

`setupWebAuthnEnv` return shape. Follows the kiwa factory convention — one `stop()` disposes the environment and clears all in-memory state.

```ts
export interface WebAuthnTestEnv extends TestEnvBase<'mock'> {
    readonly authenticators: readonly VirtualAuthenticator[];
    addAuthenticator(options: VirtualAuthenticatorOptions): VirtualAuthenticator;
    removeAuthenticator(id: string): void;
    credentialCreation(options: PublicKeyCredentialCreationOptionsInit, authenticatorId?: string): Promise<AuthenticatorAttestationResponse>;
    credentialAssertion(options: PublicKeyCredentialRequestOptionsInit): Promise<AuthenticatorAssertionResponse>;
    getCredential(credentialId: string): WebAuthnCredential | null;
    listCredentials(): WebAuthnCredential[];
    deleteCredential(credentialId: string): boolean;
    reset(): void;
}
```

#### `WebAuthnTransport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L10) `packages/auth/src/webauthn/types.ts`

Chrome Virtual Authenticator API mirrors WebAuthn L3 spec §6.2. Transport defines how the client speaks to the authenticator — `internal` for platform authenticators (Touch ID / Windows Hello), `usb` / `nfc` / `ble` for roaming security keys. The `hybrid` transport was rebranded to `caBLE` in later drafts and is covered by the passkey adapter (v1.21-1b), not here.

```ts
export type WebAuthnTransport = 'internal' | 'usb' | 'nfc' | 'ble' | 'hybrid';
```

#### `WebAuthnUserVerificationRequirement`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L51) `packages/auth/src/webauthn/types.ts`

`required` — user verification (biometric / PIN) is mandatory. `preferred` — request but do not require UV. `discouraged` — do not perform UV (WebAuthn L3 §5.4.6).

```ts
export type WebAuthnUserVerificationRequirement = 'required' | 'preferred' | 'discouraged';
```
<!-- kiwa-public-api:end -->
