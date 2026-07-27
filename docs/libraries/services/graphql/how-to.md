# @kiwa-lab/graphql の使い方

この harness は schema の文字列を保持し、resolver の返り値を GraphQL らしい `data` と `errors` に整えます。schema validation や field の型検査はしません。ここで確認するのは、resolver が受け取る arguments と context、mutation 後の application state、partial error、有限 subscription の payload です。

次の file を `tests/users.graphql.test.ts` として保存してください。query、mutation、partial error、subscription を同じ application state に対して確認します。

```ts
import { describe, expect, it } from "vitest";
import {
  createGraphQLClient,
  createGraphQLServer,
  subscribeSubscription,
} from "@kiwa-lab/graphql";

const users = new Map<string, { id: string; name: string }>([
  ["u-1", { id: "u-1", name: "Ada" }],
]);

const server = createGraphQLServer(
  {
    typeDefs: `
      type Query { user(id: ID!): User healthy: String broken: String }
      type Mutation { rename(id: ID!, name: String!): User }
      type Subscription { messageAdded: Message }
      type User { id: ID! name: String! }
      type Message { id: ID! text: String! }
    `,
  },
  {
    Query: {
      user: ({ id }, context) => {
        if (context.actorId !== "admin-1") throw new Error("not allowed");
        return users.get(String(id)) ?? null;
      },
      healthy: () => "ok",
      broken: () => {
        throw new Error("upstream unavailable");
      },
    },
    Mutation: {
      rename: ({ id, name }) => {
        const user = { id: String(id), name: String(name) };
        users.set(user.id, user);
        return user;
      },
    },
    Subscription: {
      async *messageAdded() {
        yield { id: "m-1", text: "hello" };
      },
    },
  },
  { provider: "apollo" },
);

describe("users GraphQL contract", () => {
  it("passes variables and context to a query resolver", async () => {
    const result = await server.executeQuery(
      "query GetUser($id: ID!) { user(id: $id) { id name } }",
      { id: "u-1" },
      { actorId: "admin-1" },
    );

    expect(result).toEqual({ data: { user: { id: "u-1", name: "Ada" } } });
    expect(server.listCalls()).toEqual([
      expect.objectContaining({ operationName: "GetUser", variables: { id: "u-1" }, status: "ok" }),
    ]);
  });

  it("keeps successful fields when another resolver fails", async () => {
    const result = await server.executeQuery("{ healthy broken }");

    expect(result).toEqual({
      data: { healthy: "ok" },
      errors: [{ message: "upstream unavailable", path: ["broken"] }],
    });
  });

  it("runs a mutation through a client and reads its result", async () => {
    const client = createGraphQLClient({ server });
    const mutation = await client.mutate(
      "mutation Rename($id: ID!, $name: String!) { rename(id: $id, name: $name) { id name } }",
      { id: "u-1", name: "Grace" },
    );
    const query = await client.query("{ user(id: \"u-1\") { id name } }");

    expect(mutation.data).toEqual({ rename: { id: "u-1", name: "Grace" } });
    expect(query.errors).toEqual([{ message: "not allowed", path: ["user"] }]);
    expect(client.listCalls().map((call) => call.method)).toEqual(["mutate", "query"]);
  });

  it("reads a finite subscription and closes its handle", async () => {
    const handle = subscribeSubscription(server, "subscription { messageAdded { id text } }");
    const events: unknown[] = [];

    for await (const event of handle.events) events.push(event);
    handle.close();

    expect(events).toEqual([{ data: { messageAdded: { id: "m-1", text: "hello" } } }]);
  });
});
```

```bash
pnpm exec vitest run tests/users.graphql.test.ts
```

`executeQuery` は query と mutation 用です。subscription document を渡すと error result になるため、subscription には `subscribeSubscription` を使います。resolver が未登録の場合と resolver が throw した場合は、例外ではなく `errors` に field path と message が入ります。成功した sibling field は `data` に残るので、クライアントが partial result を受け入れるかを assertion してください。

`close()` は次の event を yield しないための flag で、source AsyncIterable の network connection や producer を cancel しません。WebSocket 接続、schema validation、fragment、directive、union、Apollo plugin、実 middleware は対象外です。採用している GraphQL server を起動する integration test で transport と schema を確認してください。
