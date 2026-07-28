# @kiwa-lab/grpc

`@kiwa-lab/grpc` は、unary、server stream、client stream、bidi RPC の handler を process 内で呼び、request、metadata、status を test する harness です。grpc-js、nice-grpc、Twirp、Connect の provider 名を記録できますが、HTTP2 listener、TLS、protobuf serialization は起動しません。

<img src="/images/kiwa-docs/services/grpc-overview.webp" alt="サービス定義からunaryまたはstream RPCを呼びstatusを確認する流れ" width="1774" height="887" loading="lazy" decoding="async">

## RPC handler の結果と失敗を確認する

service definition を server に登録すると、invoke helper が service 名、method 名、method type を確認して handler を直接呼びます。unary は response、status、trailing metadata を返します。未登録 method や method type の不一致は throw せず、`ok: false` と status code 12 を返します。handler が throw した失敗も同じく status として assertion できます。

stream では message の順序、終了、cancel token、deadline、interceptor chain を test できます。実 network、stream backpressure、provider 固有 middleware、protobuf の互換性は実 gRPC server を起動する integration test で確認してください。

## 読み進める

[Quickstart](./quickstart) では metadata 付き unary RPC を実行します。[使い方](./how-to) では stream、認証 interceptor、deadline を扱います。status と helper の仕様は [リファレンス](./reference) にあります。
