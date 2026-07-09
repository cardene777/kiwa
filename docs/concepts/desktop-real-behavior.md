---
title: Desktop v0.7 real behavior runner + fidelity harness behavior diff early warning SSOT
---

# Desktop v0.7 real behavior runner + fidelity harness behavior diff early warning SSOT

## What this covers

`@kiwa-lab/desktop` v0.7 の real behavior runner + fidelity harness 拡張 SSOT。 v1.62 で v0.6 実 spawn → v0.7 real behavior runner 実装、 kiwa 縦深化 pair 第 14 の第 7 段 (depth-7 pattern 新設 candidate)、 v0.4 fidelity harness 設計思想 (「v1.62+ で real 実装後の behavior diff 発生時に本 harness が early warning を出す設計」) の実運用開始、 v0.6 baseline (`docs/concepts/desktop-v06-spawn.md`) を extend。

## real-runner 12 axis 別 behavior 差別化 pattern SSOT

| axis | real 経路の behavior 差別化 |
|---|---|
| electron | `real-app-{target}` production app ID、 `renderer-ready` IPC channel with PID |
| tauri | `real-tauri-{target}` + `invoke_native` command + `native_ready` event |
| webview | `production-webview` + `productionAPI` + `/dashboard` route |
| auto-updater | 128MB update (2.5.0 stable channel) |
| fs-permissions | `/Users/production/Documents` production path + `production-audit-{month}` |
| notification | `prod-notif-{target}` + `Production release available` + `download` action |
| menu-bar | `production-menu` + app/help items + F1 accelerator |
| tray-icon | `production-tray` + `@2x.png` asset path + connection status tooltip |
| screen-recording | 4K chunks (8MB × 2) + `display-external-4k` |
| global-shortcut | `production-app` namespace + `Cmd+Shift+Space` + `Cmd+Alt+K` |
| clipboard | production URL contents + URL change simulation |
| dark-mode | `production-theme-observer` + initialTheme=`no-preference` |

## fidelity harness 拡張 3 type SSOT

```ts
export interface MetadataDiff {
  stepIndex: number;
  neutralEvent: NeutralEventName;
  key: string;
  mockValue: string | number | boolean | undefined;
  realValue: string | number | boolean | undefined;
}

// FidelityDiff (拡張)
export interface FidelityDiff {
  axis + target + mockEvents + realEvents + matched + mockCompleted + realCompleted (v0.4 継承)
  metadataDiffs: MetadataDiff[];    // v0.7 追加
  durationDiffMs: number;            // v0.7 追加
}

export interface FidelityBehaviorSummary {
  total: number;
  axesWithBehaviorDiff: DesktopAxis[];
  totalMetadataDiffs: number;
  perAxis: Record<DesktopAxis, { metadataDiffCount + maxDurationDiffMs + hasBehaviorDiff }>;
}
```

## shape 契約 preserving 絶対維持の設計思想

v0.7 real behavior runner は shape 契約 preserving を絶対維持:

- **neutralEvents 順序 + eventCount 一致** = matched=true 継続 (36 pair 全 matched)
- **metadata + state のみ差別化** = production-style behavior を simulate
- **backward compat 絶対維持** = v0.4 fidelity harness test 全 pass 継続

これが「stub → real の shape 契約 preserving」 pattern の 3 pair 実証、 Mobile (v1.54 → v1.55) + Desktop v0.5-v0.6 (v1.60 → v1.61) + Desktop v0.4-v0.7 (v1.59 → v1.62) の 3 pair で pattern 確立。

## v0.4 fidelity harness 設計思想の実運用開始

v0.4 (v1.59) で導入された fidelity harness の設計思想 = 「現段階では mock = real の shape 契約 preserving のみ、 v1.62+ で real adapter を実 OS API 呼出に置換した際に behavior diff が発生したら本 harness が early warning を出す設計」 が v1.62 で実運用開始。 v0.7 で mock/real の metadata + duration 差異を検知可能に、 v1.63+ で real 実装が native binding や 実 CLI 呼出に置換された際の drift を early warning で検知する基盤確立。

## systematic pattern 37 度目適用

v1.61 の 36 度目 = spawn-executor uniform を 37 度目で real behavior runner に uniform 適用。 12 axis 全て production-style behavior 差別化 pattern、 shape 契約 preserving 絶対維持、 `REAL_AXIS_RUNNERS` Record で単一 factory pattern。

## depth-7 pattern 新設 candidate

pair 深度 7 段拡張達成 (v0.1 → v0.2 → v0.3 → v0.4 → v0.5 → v0.6 → v0.7) の kiwa milestone 史上初 depth-7 record 新設 candidate。 depth-6 record 1 例目 (v1.61) 到達直後の v1.62 で depth-7 拡張、 depth-6 pattern 3 例安定化 (他 pair) を優先しつつ Desktop pair は深度化の pioneer role として先行、 depth-7 pattern の 3 例安定化まで v1.75+ 前後で candidate。

## Phase 8 (v1.63+) 計画

- **native binding 実装** = electron-updater 実 network call / SCStream 実 permission check / NSPasteboard 実 write-read cycle 等、 実 OS API 呼出、 実 CLI 未 install 環境では skip 経路
- **他 pair depth-5/6 拡張** = depth-5/6 pattern 3 例安定化
- **v2.0 milestone coverage 100% goal**
