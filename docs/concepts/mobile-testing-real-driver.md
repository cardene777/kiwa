---
title: Mobile real driver adapter interface — v1.53 pair 深度 4 段記録 4 例目 depth-4 record SSOT
---

# Mobile real driver adapter interface — v1.53 pair 深度 4 段記録 4 例目 depth-4 record SSOT

## What this covers

`@kiwa/mobile` v0.4 の real driver adapter layer SSOT (11 axis × mock/real = 22 adapter + fidelity harness)、 縦深化 pair 第 13 の 4 段目 (Phase 4、 pair 深度 4 段拡張達成 4 例目 depth-4 record)。 v1.52 semantics 11 axis の上に v1.53 で adapter layer を lay、 mock/real trace diff 一致検証で Mobile 領域を production layer 完全到達に導く。

## adapter interface SSOT

### AdapterInvocation

```ts
export interface AdapterInvocation {
  scanId: string;
  target: MobileTarget;
  mode: 'mock' | 'real';
  metadata?: Record<string, string | number | boolean>;
}
```

### AdapterResult

```ts
export interface AdapterResult {
  axis: MobileAxis;
  target: MobileTarget;
  mode: 'mock' | 'real';
  completed: boolean;
  eventCount: number;
  durationMs: number;
  history: AxisStep<string>[];
  neutralEvents: NeutralEventName[];
}
```

### MobileAdapter

```ts
export interface MobileAdapter {
  axis: MobileAxis;
  scan(input: AdapterInvocation): Promise<AdapterResult>;
}
```

## 22 adapter constant records

```ts
export const MOCK_ADAPTERS: Record<MobileAxis, MobileAdapter> = {
  'react-native': makeMockAdapter('react-native'),
  expo: makeMockAdapter('expo'),
  metro: makeMockAdapter('metro'),
  navigation: makeMockAdapter('navigation'),
  reanimated: makeMockAdapter('reanimated'),
  'async-storage': makeMockAdapter('async-storage'),
  'secure-storage': makeMockAdapter('secure-storage'),
  fabric: makeMockAdapter('fabric'),
  'turbo-modules': makeMockAdapter('turbo-modules'),
  codegen: makeMockAdapter('codegen'),
  'new-architecture': makeMockAdapter('new-architecture'),
};

export const REAL_ADAPTERS: Record<MobileAxis, MobileAdapter> = { /* same 11 axis */ };
```

## Fidelity harness

`runFidelityCheck(axes, targets)` = 全 (axis, target) の mock vs real trace diff 検証、 全 33 diff (11 × 3) を返す。 `summarizeFidelity(diffs)` = total / matched / mismatched / perAxis 集計。

期待挙動 = v0.4 では mock/real 両方が semantics factory を経由する deterministic replay、 全 33 diff が matched。 v1.54+ で real adapter が child_process.spawn 実装に置換されると、 mock/real 差分が可視化される (期待は「neutralEvents 一致 = 契約整合、 durationMs 乖離 = 実 latency」)。

## 66 combination adapter pair

3 target × 11 axis × 2 mode (mock/real) = **66 combination adapter pair**、 kiwa Mobile 領域の complete production coverage matrix。 各 combination で semantics 経路 + fidelity 契約 + env-gate 統合が保証される。

## backward compat 絶対維持

- v0.1 (v1.50) 3 axis semantics API — 変更 0
- v0.2 (v1.51) advanced II + env-gate helper — 変更 0
- v0.3 (v1.52) advanced III (New Architecture) — 変更 0
- v0.4 adapter layer は完全 additive、 v0.1-v0.3 で書いた test は無修正で v0.4 でも継続動作

## 縦深化 pair 第 13 の 4 段目 (Phase 4、 pair 深度 4 段拡張達成 4 例目 depth-4 record)

Mobile pair の 4 段構造完成。

- **v1.50 (base)** = mobile v0.1 + 3 axis semantics
- **v1.51 (2 段目 = Phase 2)** = mobile v0.2 + 4 advanced II axis + env-gate helper
- **v1.52 (3 段目 = Phase 3)** = mobile v0.3 + 4 advanced III axis (New Architecture)
- **v1.53 (4 段目 = Phase 4)** = mobile v0.4 + adapter layer (11 mock + 11 real + fidelity harness)

**depth-4 record 4 例目**、 v1.40 AI/LLM + v1.41 Payment + v1.42 Observability の 3 例安定化 → **4 例目 depth-4 record 達成**、 **depth-4 pattern 4 例安定化を実証**。

## Phase 5 (v1.54+) 計画

- **Mobile v0.5 child_process.spawn 実装** = Metro real bundle + Expo EAS CLI 実 spawn + Fabric native mount 実行
- **fidelity 契約強化** = mock/real の neutralEvents 一致 SLA、 durationMs 差分許容範囲 SSOT、 SLA 違反時 fail-closed
- **pair 深度 5 段拡張 candidate** = v1.55+ で Mobile の 5 段目 (v0.6 CI 統合 + real-device execution) 検討
