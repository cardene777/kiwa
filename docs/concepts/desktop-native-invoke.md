---
title: Desktop v0.9 実 native binding 呼出 SSOT
---

# Desktop v0.9 実 native binding 呼出 SSOT

## What this covers

`@kiwa/desktop` v0.9 の実 native binding 呼出 + probe + invoke 統合 SSOT。 v1.64 で v0.8 probe layer → v0.9 実 invoke 拡張、 kiwa 縦深化 pair 第 14 の第 9 段 (depth-9 pattern 新設 candidate)、 v1.62 real behavior + v1.63 probe + v1.64 実 invoke の 3 layer separation の完全 pay off phase、 v0.8 baseline (`docs/concepts/desktop-probe.md`) を extend。

## native-invoke 3 type SSOT

```ts
export type InvokeStatus = 'invoked' | 'cli-unavailable' | 'axis-skipped' | 'no-cli-mapping';

export interface NativeInvokeInput {
  axis: DesktopAxis;
  target: DesktopTarget;
  args?: string[];
  env?: Record<string, string>;
  spawnFn?: SpawnFn;  // DI 経路
}

export interface NativeInvokeResult {
  axis: DesktopAxis;
  target: DesktopTarget;
  status: InvokeStatus;
  reason: string | null;
  spawnResult: SpawnResult | null;  // invoked のみ 非 null
}

export interface NativeInvokeMatrixSummary {
  total: number;
  invoked: NativeInvokeResult[];
  cliUnavailable: NativeInvokeResult[];
  axisSkipped: NativeInvokeResult[];
  noCliMapping: NativeInvokeResult[];
}
```

## probeAndInvoke 4 step 経路

```ts
export async function probeAndInvoke(input: NativeInvokeInput): Promise<NativeInvokeResult> {
  // Step 1: shouldSkipAxis で skip 判定 → 'axis-skipped'
  // Step 2: cliForAxis(axis) = null → 'no-cli-mapping'
  // Step 3: probeCliAvailable(cli) = 未 install → 'cli-unavailable'
  // Step 4: probe 成功 → invokeDesktopCliWith で 実 spawn → 'invoked'
}
```

## 3 layer separation SSOT

| layer | 実装 milestone | 責務 |
|---|---|---|
| shape 契約 | v0.4 (v1.59) | neutralEvents + eventCount 一致で fidelity 判定 |
| behavior diff | v0.7 (v1.62) | metadata + duration 差異検出、 real behavior 差別化 |
| skip / probe | v0.8 (v1.63) | availability probe + platform gate + skip 判定 |
| 実 invoke | v0.9 (v1.64) | probe → invoke 統合、 4 InvokeStatus で完全 separation |

各 layer が独立、 v1.62 → v1.63 → v1.64 の 3 milestone で構築した separation が v1.64 で完全 pay off。

## shape 契約 preserving 絶対維持

- invoked = `spawnResult` に SpawnResult 保持
- 他 3 status = `spawnResult=null` で shape 統一
- v0.1-v0.8 API 変更 0

## backward compat 絶対維持

v0.9 実 invoke の追加は additive、 v0.1-v0.8 の 12 axis / 48 method + adapter + fidelity + spawn stub + 実 spawn + real behavior + probe 完全保持。

## systematic pattern 39 度目適用

v1.63 の 38 度目 (probe layer uniform) を 39 度目で native invoke integration uniform 適用。

## depth-9 pattern 新設 candidate

Desktop pair v0.1 → v0.9 の 9 段拡張、 kiwa milestone 史上 depth-9 record 新設 candidate。

## Phase 10 (v1.65+) 計画

- 他 pair 5/6 段拡張 (depth-5 / depth-6 pattern 3 例安定化)
- v2.0 milestone coverage 100% goal
