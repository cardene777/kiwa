# @kiwa-lab/grpc

gRPC service mock harness for kiwa — @grpc/grpc-js / nice-grpc / twirp / ConnectRPC を統一 interface で in-process から叩ける test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/grpc
# or
npm install -D @kiwa-lab/grpc
# or
yarn add -D @kiwa-lab/grpc
```

## Supported providers

| Provider | Status | RPC style |
|---|---|---|
| @grpc/grpc-js | ✅ Ready | HTTP/2 native |
| nice-grpc | ✅ Ready | AsyncIterable stream |
| twirp | ✅ Ready | HTTP/1.1 + protobuf/JSON |
| ConnectRPC | ✅ Ready | HTTP/1.1 or /2 |

## Quick start

```ts
import { describe, expect, it } from 'vitest';
import {
  createGrpcServer,
  defineService,
  invokeUnary,
  invokeServerStream,
} from '@kiwa-lab/grpc';

describe('user service', () => {
  it('unary + server stream で response を取得', async () => {
    const server = createGrpcServer({ provider: '@grpc/grpc-js' });
    defineService(server, {
      name: 'UserService',
      methods: {
        Get: { type: 'unary' },
        List: { type: 'server-stream' },
      },
    });
    const unary = await invokeUnary(server, 'UserService/Get', { id: '1' }, async () => ({ id: '1', name: 'a' }));
    expect(unary.value.name).toBe('a');
    const stream = await invokeServerStream(server, 'UserService/List', {}, async function* () {
      yield { id: '1' }; yield { id: '2' };
    });
    expect(stream.messages).toHaveLength(2);
  });
});
```

## API reference

- `createGrpcServer({ provider: GrpcProvider }): GrpcServer` — provider 別 mock server
- `defineService(server, def: ServiceDefinition): void` — service + method 登録
- `invokeUnary(server, path, req, handler: UnaryHandler): Promise<UnaryResult>` — unary RPC
- `invokeServerStream(server, path, req, handler: ServerStreamHandler): Promise<StreamResult>` — server stream
- `invokeClientStream(server, path, iter, handler): Promise<UnaryResult>` — client stream
- `invokeBidi(server, path, iter, handler: BidiHandler): Promise<StreamResult>` — bidirectional
- `encodeStatus(code: GrpcStatusCode, message?: string): GrpcStatus` — status trailer
- `createMetadata(entries: MetadataEntry[]): GrpcMetadata` — metadata 生成

## Test integration

vitest + `/kiwa-grpc` skill で real HTTP/2 socket 起動なしで RPC + deadline + status code を verify。

<!-- kiwa-docs:start -->
## Documentation

公開ドキュメントを正本として管理しています。

- [概要](https://cardene777.github.io/kiwa/libraries/services/grpc/)
- [はじめる](https://cardene777.github.io/kiwa/libraries/services/grpc/quickstart)
- [使い方](https://cardene777.github.io/kiwa/libraries/services/grpc/how-to)
- [リファレンス](https://cardene777.github.io/kiwa/libraries/services/grpc/reference)

編集元は [docs/libraries/services/grpc](../../docs/libraries/services/grpc/) です。
<!-- kiwa-docs:end -->

## License

UNLICENSED — see [github.com/cardene777/kiwa](https://github.com/cardene777/kiwa).
