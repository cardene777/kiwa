---
title: Desktop adapter layer — v1.59 v0.4 24 adapter + 36 fidelity SSOT
---

# Desktop adapter layer — v1.59 v0.4 24 adapter + 36 fidelity SSOT

## What this covers

`@kiwa-test/desktop` v0.4 の adapter interface + fidelity harness SSOT。 v1.59 で v0.3 12 axis → v0.4 adapter layer 追加、 kiwa 縦深化 pair 第 14 の第 4 段、 **depth-4 record 5 例目**、 Mobile v1.53 pattern (v0.4 real driver adapter layer) 転用、 v0.3 baseline (`docs/concepts/desktop-advanced-iii.md`) を extend。

## adapter interface 4 type SSOT

```ts
export type AdapterMode = 'mock' | 'real';

export interface AdapterInvocation {
  scanId: string;
  target: DesktopTarget;   // macos | windows | linux
  mode: AdapterMode;
  metadata?: Record<string, string | number | boolean>;
}

export interface AdapterResult {
  axis: DesktopAxis;
  target: DesktopTarget;
  mode: AdapterMode;
  completed: boolean;
  eventCount: number;
  durationMs: number;
  history: AxisStep<string>[];
  neutralEvents: NeutralEventName[];
}

export interface DesktopAdapter {
  axis: DesktopAxis;
  scan(input: AdapterInvocation): Promise<AdapterResult>;
}
```

## 12 axis × mock/real = 24 adapter pair

- 12 axis = v0.1 3 (electron/tauri/webview) + v0.2 5 (auto-updater/fs-permissions/notification/menu-bar/tray-icon) + v0.3 4 (screen-recording/global-shortcut/clipboard/dark-mode)
- 2 mode = mock + real
- 12 × 2 = **24 adapter pair**
- constant records = MOCK_ADAPTERS + REAL_ADAPTERS で全 axis 分の adapter を pre-init
- factory = makeMockAdapter(axis) + makeRealAdapter(axis) で個別 adapter 生成

## 3 target × 12 axis × 2 mode = 72 combination

- target = macos + windows + linux = 3
- axis = 12
- mode = mock + real = 2
- 3 × 12 × 2 = **72 combination scan 可能**
- 全 combination で `completed === true` + `eventCount > 0` + neutralEvents 網羅

## 3 target × 12 axis = 36 fidelity pair (mock/real 一致検証)

- target × axis = 3 × 12 = **36 pair**
- 各 pair で mock/real の neutralEvents 一致 = **shape 契約 preserving**
- runFidelityCheck({ axes?, targets?, scanIdPrefix? }) で collect
- summarizeFidelity(diffs) で total / matched / unmatched / matchedRatio / perAxis を集計

## Fidelity harness の設計思想

現段階 (v0.4) では mock = real の shape 契約 preserving のみ、 実装は同一 (mock-factory の AXIS_RUNNERS が mode 差なく同じ semantics 関数を呼ぶ)。 v1.60+ で real adapter を実 OS API 呼出に置換した際:

- **behavior diff 発生時** = fidelity harness が early warning を出す (matchedRatio < 1.0 = drift 検知)
- **shape 一致継続時** = mock/real 交換可能、 CI 環境で mock、 実 desktop 環境で real の使い分け可能

これが「adapter layer + fidelity harness」 pattern の compound effect、 Mobile v1.53 で確立済み。

## Provider dialect 保持

adapter interface + fidelity harness は semantics layer の上に構築、 provider dialect (macOS TCC / Windows UAC / Linux xdg-portal 等の 144 mapping) は semantics layer が SSOT で保持。 adapter は semantics 関数を呼び出すだけ、 dialect は自動的に AdapterResult.history[].providerEvent に埋込まれる。

## backward compat 絶対維持

v0.4 adapter layer の追加は additive、 v0.1 + v0.2 + v0.3 の 12 axis / 48 method / 48 event / 144 mapping は完全保持。 依存関係も `@kiwa-test/core` のみで v0.1-v0.3 と同じ、 他 42 package への影響 0、 semantics layer からの API export 完全保持。

## systematic pattern 34 度目適用

v1.58 の 33 度目 = desktop v0.3 4 axis uniform (state / session / emit helper / 4 step 遷移) を 34 度目で desktop v0.4 adapter interface に uniform 適用。 12 axis 全て AXIS_RUNNERS[axis] pattern で単一 factory から生成、 makeMockAdapter / makeRealAdapter で mode 切替、 mock/real の shape 契約統一。 「pattern 化 = axis 数 + mode 数 + interface layer に独立」 の pattern SSOT が確立。

## Mobile v1.53 rhythm 完全再現

Mobile v1.50 (base 3 axis) → v1.51 (advanced II 4 axis) → v1.52 (advanced III 4 axis) → v1.53 (v0.4 adapter interface + fidelity harness) の 4 milestone rhythm を Desktop pair (v1.56-v1.59) で完全再現、 depth-4 到達。 pair 間 pattern 転用の 3 例目 (1 例目 = advanced axis rhythm、 2 例目 = adapter interface 実装、 3 例目 = fidelity harness 実装)。

## depth-4 record 5 例目到達

pair 深度 4 段拡張達成 (v0.1 → v0.2 → v0.3 → v0.4) の 5 例目 depth-4 record。

- **depth-4 record 1 例目** = v1.40 AI/LLM (v0.4 到達)
- **depth-4 record 2 例目** = v1.41 Payment (v0.4 到達)
- **depth-4 record 3 例目** = v1.42 Observability (v0.4 到達)
- **depth-4 record 4 例目** = v1.53 Mobile (v0.4 到達、 depth-5 まで拡張)
- **depth-4 record 5 例目** = v1.59 Desktop (v0.4 到達) ← v1.59

depth-4 pattern の 5 例安定化を実証、 kiwa の adapter pair layer 化 pattern が完全定着。

## Phase 5 (v1.60+) 計画

- **Desktop v0.5 spawn stub** = Mobile v0.5 pattern (invokeDesktopCli + cliForAxis + buildSpawnInvocation + env-gate + args 上限 + fail-closed) 転用、 desktop 側 CLI-backed axis 抽出 (auto-updater = electron-updater CLI / screen-recording = ffmpeg / clipboard = xclip-xsel-wl-clipboard 等)、 **depth-5 pattern 2 例目 candidate**
- **Desktop v0.6 real spawn** = Mobile v0.6 pattern (spawn-executor + env sanitize + timeout + buffer 上限 + DI) 転用、 depth-6 pattern 新設 candidate
- **v0.4 real adapter を実 OS API 呼出に置換** = electron-updater / SCStream / NSPasteboard 等、 fidelity harness が early warning 出す設計を実運用
- **v2.0 milestone coverage 100% goal** への合流
