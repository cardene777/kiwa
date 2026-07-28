---
title: "@kiwa-lab/realtime semantics__simulcast-svc の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>semantics&#95;&#95;simulcast-svc</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/simulcast-svc.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createSimulcastSvcMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/simulcast-svc.ts#L32) <code v-pre>packages/realtime/src/semantics/simulcast-svc.ts</code>

```ts
export declare function createSimulcastSvcMock(config?: SemanticsMockConfig): SimulcastSvcMock;
```

### 型

#### <code v-pre>SimulcastSvcLayer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/simulcast-svc.ts#L16) <code v-pre>packages/realtime/src/semantics/simulcast-svc.ts</code>

Simulcast + SVC axis — Simulcast (複数解像度 stream) + Scalable Video Coding (temporal / spatial / quality layer) + adaptive bitrate + layer drop policy。 WebRTC v1 / v2 と MoQ 両方で採用される layered delivery pattern。

```ts
export interface SimulcastSvcLayer {
    layerId: string;
    resolution: string;
    bitrateKbps: number;
    scalabilityMode: 'L1T1' | 'L1T2' | 'L1T3' | 'L2T1' | 'L2T3' | 'L3T3';
}
```

#### <code v-pre>SimulcastSvcMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/simulcast-svc.ts#L23) <code v-pre>packages/realtime/src/semantics/simulcast-svc.ts</code>

```ts
export interface SimulcastSvcMock extends SemanticsMock {
    readonly protocol: 'webcodecs';
    readonly axis: 'simulcast-svc';
    addSimulcastLayer(input: SimulcastSvcLayer): Promise<void>;
    selectSvcLayer(input: {
        layerId: string;
        temporalId: number;
        spatialId: number;
    }): Promise<void>;
    adaptBitrate(input: {
        layerId: string;
        targetKbps: number;
        reason: string;
    }): Promise<void>;
    dropLayer(input: {
        layerId: string;
        reason: string;
    }): Promise<void>;
}
```
