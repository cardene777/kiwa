# Tutorial 29 — GraphQL server + client + subscription

## 目的

`@kiwa-lab/graphql` を使って GraphQL server (Apollo) + typed client + subscription の end-to-end pipeline を test する。 schema 定義 + resolver + query / mutation / subscription を real HTTP/2 socket なしで in-process 叩ける。

## 前提

- `pnpm add -D @kiwa-lab/graphql vitest`
- GraphQL SDL の基本知識

## Step 1 — Server + schema

Apollo 相当の mock server を schema 付きで立てる。 provider = `'apollo' | 'yoga' | 'urql' | 'relay'`。

```typescript
import { createGraphQLServer } from '@kiwa-lab/graphql';
import { describe, expect, it, beforeAll } from 'vitest';

const typeDefs = `
  type Query {
    me: User
    users: [User!]!
    user(id: ID!): User
  }
  type Mutation {
    createUser(input: CreateUserInput!): User!
    deleteUser(id: ID!): Boolean!
  }
  type Subscription {
    userCreated: User!
  }
  input CreateUserInput { name: String! email: String! }
  type User { id: ID! name: String! email: String! }
`;

describe('GraphQL user service', () => {
  let server: ReturnType<typeof createGraphQLServer>;

  beforeAll(() => {
    const users = new Map<string, any>([['1', { id: '1', name: 'kiwa', email: 'k@x' }]]);
    let idCounter = 1;
    const subEmitter = new EventTarget();

    server = createGraphQLServer({
      provider: 'apollo',
      typeDefs,
      resolvers: {
        Query: {
          me: () => users.get('1'),
          users: () => [...users.values()],
          user: (_: any, { id }: { id: string }) => users.get(id),
        },
        Mutation: {
          createUser: (_: any, { input }: any) => {
            idCounter += 1;
            const user = { id: String(idCounter), ...input };
            users.set(user.id, user);
            subEmitter.dispatchEvent(new CustomEvent('userCreated', { detail: user }));
            return user;
          },
          deleteUser: (_: any, { id }: any) => users.delete(id),
        },
        Subscription: {
          userCreated: {
            subscribe: async function* () {
              while (true) {
                const event: any = await new Promise((resolve) => {
                  subEmitter.addEventListener('userCreated', (e) => resolve((e as CustomEvent).detail), { once: true });
                });
                yield { userCreated: event };
              }
            },
          },
        },
      },
    });
  });
});
```

## Step 2 — Query execute

`executeQuery(server, query, variables?, context?)` で server 側 resolver を invoke。

```typescript
import { executeQuery } from '@kiwa-lab/graphql';

it('me query が current user を返す', async () => {
  const result = await executeQuery(server, `query { me { id name email } }`);
  expect(result.errors).toBeUndefined();
  expect(result.data.me).toEqual({ id: '1', name: 'kiwa', email: 'k@x' });
});

it('user(id) query で variables 経由 fetch', async () => {
  const result = await executeQuery(
    server,
    `query GetUser($id: ID!) { user(id: $id) { name } }`,
    { id: '1' },
  );
  expect(result.data.user.name).toBe('kiwa');
});
```

## Step 3 — Mutation

```typescript
it('createUser mutation で新 user 作成', async () => {
  const result = await executeQuery(
    server,
    `mutation Create($input: CreateUserInput!) {
      createUser(input: $input) { id name email }
    }`,
    { input: { name: 'alice', email: 'a@x' } },
  );
  expect(result.data.createUser.name).toBe('alice');
  expect(result.data.createUser.id).toBeDefined();
});
```

## Step 4 — Error resolver

resolver 内で throw した Error は `errors[]` に normalize される。

```typescript
it('user(id) not found で errors 返却', async () => {
  const result = await executeQuery(server, `query { user(id: "999") { name } }`);
  // resolver は undefined 返却 → data.user = null
  expect(result.data.user).toBeNull();
});
```

## Step 5 — Typed client

`createGraphQLClient(server)` で server に紐付いた client、 network 経由せず in-process dispatch。

```typescript
import { createGraphQLClient } from '@kiwa-lab/graphql';

it('client 経由で query / mutation を叩く', async () => {
  const client = createGraphQLClient(server);
  const usersRes = await client.query(`query { users { id name } }`);
  expect(usersRes.data.users.length).toBeGreaterThan(0);

  const createRes = await client.mutate(
    `mutation($input: CreateUserInput!) { createUser(input: $input) { id } }`,
    { input: { name: 'bob', email: 'b@x' } },
  );
  expect(createRes.data.createUser.id).toBeDefined();
});
```

## Step 6 — Subscription

subscription を open、 mutation で emit → subscriber が受信することを verify。

```typescript
import { subscribeSubscription } from '@kiwa-lab/graphql';

it('userCreated subscription で新 user emit を受信', async () => {
  const handle = subscribeSubscription(
    server,
    `subscription { userCreated { id name email } }`,
  );
  // mutation を発火して event を trigger
  const pendingNext = handle.next();
  await executeQuery(
    server,
    `mutation { createUser(input: { name: "charlie", email: "c@x" }) { id } }`,
  );
  const first = await pendingNext;
  expect(first.done).toBe(false);
  expect(first.value.data.userCreated.name).toBe('charlie');
  await handle.close();
});
```

## Step 7 — Parser で query 内容の verify

query string を AST parse して「query が特定 field を要求してるか」 を test する。 client 側の code review で使える経路。

```typescript
import { parseGraphQLOperation } from '@kiwa-lab/graphql';

it('client query の field を verify', () => {
  const parsed = parseGraphQLOperation(`query { me { id name email } }`);
  expect(parsed.type).toBe('query');
  const meFields = parsed.fields.find((f) => f.name === 'me')?.selections?.map((s) => s.name);
  expect(meFields).toContain('email'); // email を要求してる
});
```

## 期待結果

- 全 7 assertion PASS、 real GraphQL server (Apollo / Yoga) 起動なし
- WebSocket subscription も in-process async iterable で決定的に動作
- provider 切替 (`provider: 'yoga'` 等) で同 test を再走可能

## 関連

- API reference: [`/api/graphql`](../api/graphql)
- Skill: [`/kiwa-graphql`](../skills/kiwa-graphql)
- Related: [`/tutorials/204-macos-app-a11y`](./204-macos-app-a11y)
