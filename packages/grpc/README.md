# @kiwa-lab/grpc

gRPC service mock harness for kiwa — @grpc/grpc-js / nice-grpc / twirp / ConnectRPC を統一 interface で in-process invoke。

## API

- `createGrpcServer(options)` = provider mock server (defineService / invoke*)
- `defineService(name, methods)` = unary / server-stream / client-stream / bidi service 定義
- `invokeUnary(server, method, req, metadata?)` = unary RPC call
- `invokeServerStream(server, method, req, metadata?)` = server streaming
- `invokeBidi(server, method, requests, metadata?)` = bidirectional streaming
