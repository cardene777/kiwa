# @kiwa-lab/websocket

WebSocket server + client mock harness for kiwa — ws / uWebSockets / Socket.IO / Colyseus を統一 interface で invoke する in-process mock。

## API

- `createWSServer(options)` = provider mock server (accept / broadcast / room / disconnect)
- `connectClient(server, options)` = client handle (send / onMessage / onClose / close)
- `sendMessage(clientOrServer, target, payload)` = text / binary frame send
- `broadcastMessage(server, payload, filter?)` = server-side broadcast to all or filtered clients
- `captureBinaryFrame(frame)` = binary frame parse (opcode / mask / payload extract)
