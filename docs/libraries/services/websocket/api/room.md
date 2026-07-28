---
title: "@kiwa-lab/websocket room の API 契約"
---

# <code v-pre>@kiwa-lab/websocket</code> <code v-pre>room</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/room.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createRoomRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/room.ts#L23) <code v-pre>packages/websocket/src/room.ts</code>

room/channel 抽象。 client を roomName で group 化し、 broadcastToRoom で 該当 member にのみ配信。 real Socket.IO room / Colyseus room 相当を mock。

```ts
export declare function createRoomRegistry(now?: () => number): RoomRegistry;
```

### 型

#### <code v-pre>PresenceInfo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/room.ts#L13) <code v-pre>packages/websocket/src/room.ts</code>

```ts
export interface PresenceInfo {
    clientId: string;
    joinedAt: number;
    metadata?: Record<string, unknown>;
}
```

#### <code v-pre>RoomRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/room.ts#L4) <code v-pre>packages/websocket/src/room.ts</code>

```ts
export interface RoomRegistry {
    join: (roomName: string, client: WSClient) => void;
    leave: (roomName: string, clientId: string) => void;
    listMembers: (roomName: string) => WSClient[];
    broadcastToRoom: (roomName: string, payload: WSPayload) => number;
    listRooms: () => string[];
    presenceOf: (roomName: string) => PresenceInfo[];
}
```
