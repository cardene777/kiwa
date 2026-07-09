---
title: Desktop v0.8 native binding availability probe + skip 経路 SSOT
---

# Desktop v0.8 native binding availability probe + skip 経路 SSOT

## What this covers

`@kiwa-lab/desktop` v0.8 の probe layer + skip 経路 SSOT。 v1.63 で v0.7 real behavior runner → v0.8 probe layer 拡張、 kiwa 縦深化 pair 第 14 の第 8 段 (depth-8 pattern 新設 candidate)、 v0.7 baseline (`docs/concepts/desktop-real-behavior.md`) を extend。

## probe layer 5 type SSOT

```ts
export type NodePlatform = 'darwin' | 'linux' | 'win32' | 'other';

export interface ProbeInput {
  command: DesktopCliCommand;
  platform?: NodePlatform;
  spawnFn?: SpawnFn;  // DI 経路
}

export interface ProbeResult {
  command: DesktopCliCommand;
  platform: NodePlatform;
  available: boolean;
  probePath: string | null;
  durationMs: number;
}

export interface PlatformGate {
  target: DesktopTarget;
  platform: NodePlatform;
  compatible: boolean;
}

// fidelity harness 経路
export interface SkippedPair {
  axis: DesktopAxis;
  target: DesktopTarget;
  reason: string;
}
```

## 12 axis 別 skip strategy SSOT

| axis | skip 条件 |
|---|---|
| electron | 常に skip なし (semantics-only、 実 API 呼出なし) |
| tauri | 常に skip なし |
| webview | 常に skip なし |
| dark-mode | 常に skip なし |
| auto-updater | platform mismatch のみで skip (target と platform 不一致) |
| fs-permissions | darwin 以外で skip (osascript 依存) |
| notification | linux 以外で skip (notify-send 依存) |
| menu-bar | platform mismatch のみで skip |
| tray-icon | platform mismatch のみで skip |
| screen-recording | platform mismatch のみで skip |
| global-shortcut | darwin 以外で skip (defaults 依存) |
| clipboard | linux 以外で skip (xclip 依存) |

## probeCliAvailable = which/where 経路

- unix (darwin/linux) = `which <cmd>` で exit code + stdout 判定
- win32 = `where <cmd>` で exit code + stdout 判定
- DI 経路 = `spawnFn` パラメータ注入で test 環境の決定的挙動、 実 CLI 未 install 環境でも成立
- `available` = exit code === 0 && stdout.length > 0
- `probePath` = 最初の line (絶対 path)

## fidelity harness probe 統合 = runFidelityCheckWithProbe

`runFidelityCheck({})` の 36 pair のうち、 shouldSkipAxis で skip 判定された pair は diffs から除外、 skippedPairs metadata で追跡。 shape 契約 preserving 絶対維持 = diffs 内 pair は matched=true 継続。

## backward compat 絶対維持

v0.8 probe layer の追加は additive、 v0.1-v0.7 の API 変更 0、 shape 契約 preserving 絶対維持 (既存 runFidelityCheck test 全継続 PASS)。

## systematic pattern 38 度目適用

v1.62 の 37 度目 (real behavior runner uniform) を 38 度目で probe layer uniform 適用。

## depth-8 pattern 新設 candidate

pair 深度 8 段拡張 (v0.1 → v0.2 → v0.3 → v0.4 → v0.5 → v0.6 → v0.7 → v0.8) の kiwa milestone 史上 depth-8 record 新設 candidate。 Desktop pair の pioneer depth 拡張継続、 3 例安定化まで v1.80+ 前後で candidate。

## Phase 9 (v1.64+) 計画

- 実 native binding 呼出 (probe availability 判定で 実 CLI 存在時のみ 呼出、 未 install 時は skip 経路で shape 契約 preserving)
- 他 pair depth-5/6 拡張 (3 例安定化)
- v2.0 milestone coverage 100% goal
