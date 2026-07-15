# @kiwa-lab/grpc API reference

## Overview

`@kiwa-lab/grpc` は @grpc/grpc-js / nice-grpc / twirp / ConnectRPC 4 impl を統一 interface で mock する gRPC service test infra。 unary / server-stream / client-stream / bidi の 4 method type を real HTTP/2 socket 不要で in-process 叩ける。

## Supported providers

| provider | transport | codegen | streaming |
|---|---|---|---|
| grpc-js | HTTP/2 | protoc-gen-ts | full |
| nice-grpc | HTTP/2 | ts-proto | full |
| twirp | HTTP/1.1 JSON | protoc-gen-twirp | unary + server-stream |
| connect-rpc | HTTP/1.1 or HTTP/2 | @bufbuild/protoc-gen-connect | full |

## Main API

### `createGrpcServer(options): GrpcServer`

provider 別 mock server、 service 一覧を register。

### `defineService(name: string, methods: MethodDefinition[]): ServiceDefinition`

service を宣言、 `MethodDefinition` = `{ name, type, requestType?, responseType?, handler }`。

### `invokeUnary<TReq, TRes>(server, service, method, request: TReq, metadata?): Promise<UnaryResult<TRes>>`

unary RPC call、 `{ response, metadata, status: GrpcStatus }` を返す。

### `invokeServerStream / invokeClientStream / invokeBidi`

stream 系 4 pattern。 async iterable で events を pull、 status = end 時に final 判定。

### `encodeStatus(code, message?) / decodeStatus(raw): GrpcStatus`

gRPC status を encode / decode。 `STATUS_CODES = { OK: 0, CANCELLED: 1, ... }` 全 17 code。

### `createMetadata(entries?: MetadataEntry[]) / mergeMetadata(a, b): GrpcMetadata`

request / response metadata を組立て。

## Types

- `GrpcProvider = 'grpc-js' | 'nice-grpc' | 'twirp' | 'connect-rpc'`
- `MethodType = 'unary' | 'server-stream' | 'client-stream' | 'bidi'`
- `GrpcMetadata` = `Record<string, string | string[]>`
- `GrpcStatusCode = 0 | 1 | 2 | ... | 16` (17 code)
- `UnaryResult<T>` = `{ response: T, metadata, status }`

## Usage examples

### Unary RPC

```typescript
import { createGrpcServer, defineService, invokeUnary } from '@kiwa-lab/grpc';
import { describe, expect, it } from 'vitest';

describe('GreeterService.SayHello', () => {
  it('unary で greeting を返す', async () => {
    const server = createGrpcServer({ provider: 'grpc-js' });
    server.register(defineService('Greeter', [
      { name: 'SayHello', type: 'unary', handler: async (req) => ({ message: `Hello, ${req.name}!` }) },
    ]));
    const result = await invokeUnary(server, 'Greeter', 'SayHello', { name: 'kiwa' });
    expect(result.response.message).toBe('Hello, kiwa!');
    expect(result.status.code).toBe(0); // OK
  });
});
```

### Server streaming

```typescript
import { createGrpcServer, defineService, invokeServerStream } from '@kiwa-lab/grpc';

const server = createGrpcServer({ provider: 'nice-grpc' });
server.register(defineService('Log', [
  {
    name: 'Tail',
    type: 'server-stream',
    handler: async function* (req) {
      for (const line of ['a', 'b', 'c']) yield { line };
    },
  },
]));
const stream = invokeServerStream(server, 'Log', 'Tail', { since: 0 });
const received: string[] = [];
for await (const chunk of stream) received.push(chunk.line);
expect(received).toEqual(['a', 'b', 'c']);
```

## Related skills

- [`/kiwa-grpc`](../skills/kiwa-grpc) — gRPC test 生成 skill
