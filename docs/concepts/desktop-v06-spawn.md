---
title: Desktop v0.6 実 child_process.spawn 実行 — v1.61 spawn-executor + safety layer 4 段 SSOT
---

# Desktop v0.6 実 child_process.spawn 実行 — v1.61 spawn-executor + safety layer 4 段 SSOT

## What this covers

`@kiwa-test/desktop` v0.6 の spawn-executor + 実 child_process.spawn 実行 SSOT。 v1.61 で v0.5 spawn stub → v0.6 実 spawn 実装完成、 kiwa 縦深化 pair 第 14 の第 6 段、 **depth-6 pattern 新設 = kiwa milestone 史上初 depth-6 record 到達** + **depth-5 pattern 2 例目確定** (Mobile depth-5 1 例目 + Desktop v1.60-v1.61 で 2 例目、 2 例安定化到達)、 Mobile v1.55 pattern (v0.6 spawn-executor + per-command env allowlist + timeout + buffer 上限 + DI + dry-run) 転用、 v0.5 baseline (`docs/concepts/desktop-spawn-stub.md`) を extend。

## spawn-executor 3 type SSOT

```ts
export interface SpawnExecutorInput {
  command: DesktopCliCommand;
  args: string[];
  env: Record<string, string>;
  cwd?: string;
  timeoutMs?: number;       // default 60_000
  maxBufferBytes?: number;  // default 10 * 1024 * 1024
}

export interface SpawnExecutorResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  durationMs: number;
}

export type SpawnFn = typeof nodeSpawn;
```

## COMMAND_ENV_ALLOWLIST per-command 8 CLI × env SSOT

| CLI | env allowlist |
|---|---|
| electron-builder | PATH + HOME + NODE_ENV + ELECTRON_MIRROR + BUILD_TARGET + CSC_LINK + CSC_KEY_PASSWORD |
| electron-updater | PATH + HOME + NODE_ENV + GH_TOKEN + ELECTRON_UPDATER_CACHE |
| ffmpeg | PATH + HOME + FFMPEG_PATH + FFREPORT |
| xclip | PATH + HOME + DISPLAY + WAYLAND_DISPLAY |
| osascript | PATH + HOME + LANG + USER |
| notify-send | PATH + HOME + DISPLAY + DBUS_SESSION_BUS_ADDRESS + XDG_RUNTIME_DIR |
| defaults | PATH + HOME + USER |
| reg | PATH + HOME + USERPROFILE + APPDATA + LOCALAPPDATA |

各 CLI の env allowlist は実 desktop CLI の env 要件 (electron-builder CSC_LINK 署名 / electron-updater GH_TOKEN release / ffmpeg FFMPEG_PATH / xclip DISPLAY / osascript LANG / notify-send DISPLAY + DBUS / defaults USER / reg USERPROFILE + APPDATA) と 1:1 対応、 未 include env (SECRET_TOKEN / API_KEY 等) は `sanitizeEnv` で削ぎ落として secret 漏洩防止。

## safety layer 4 段の設計思想

1. **per-command env allowlist** = secret 漏洩防止、 command 別 env のみ通す (allowlist に含まれない env は throw なしで silently 削ぎ落とし = fail-safe)
2. **timeout 60_000ms** = 長時間 hang child を SIGKILL、 CI stall 防止、 default 60s は Mobile v0.6 と同値、 input.timeoutMs で override 可
3. **maxBufferBytes 10 * 1024 * 1024** = stdout/stderr buffer 上限 10MB、 memory 枯渇防止、 exceed で SIGKILL + `[buffer exceeded]` 印字、 input.maxBufferBytes で override 可
4. **shell:false + detached:false** = command injection 防止 (shell:false で args escape 不要) + zombie process 防止 (detached:false で parent 死亡時 child も cleanup)

これが Mobile v1.55 で確立した safety layer pattern を Desktop に転用、 pair 間 safety 実装 pattern の 2 pair 実証。

## invokeDesktopCli の 3 経路分岐

```ts
export async function invokeDesktopCliWith(inv, spawnFn) {
  if (inv.env.KIWA_DESKTOP_MODE !== 'real') throw ...;      // env-gate fail-closed
  if (inv.args.length > 32) throw ...;                       // args 上限 fail-closed
  if (inv.env.KIWA_DESKTOP_SPAWN === 'dry-run') return ...;  // v0.5 shape 復元
  const executed = await executeSpawn(inv, spawnFn);         // v0.6 実 spawn
  return { ...SpawnResult shape 契約 preserving };
}
```

3 経路 (fail-closed / dry-run / 実 spawn) を単一 API で表現、 caller は env で挙動を切替 (KIWA_DESKTOP_MODE=real 必須 + KIWA_DESKTOP_SPAWN=dry-run 任意)。

## DI 経路 = invokeDesktopCliWith(inv, spawnFn)

test 環境で dummy SpawnFn を注入、 実 CLI 未 install 環境でも決定的 test 成立。 CI (GitHub Actions - CI 全面禁止 rule により削除 / 実 local test) で 実 CLI 依存を切り離す設計、 Mobile v1.55 pattern 完全継承。

## shape 契約 preserving (Mobile v0.6 と 1:1)

Desktop v0.6 SpawnResult = Mobile v0.6 SpawnResult と 6 field 完全一致 (command / args / invoked / exitCode / stdout / stderr / durationMs)。 v0.5 stub + v0.6 実 spawn の shape 契約 preserving は Mobile pair (v1.54 → v1.55) + Desktop pair (v1.60 → v1.61) の 2 pair で実証、 「stub → real の shape 契約 preserving」 pattern **2 例安定化到達**。 stdout/stderr/exitCode/durationMs は 実 spawn からの実測値に置換、 dry-run 経路のみ v0.5 stub shape 復元。

## backward compat 絶対維持

v0.6 実 spawn 実行の追加は additive、 v0.1 + v0.2 + v0.3 + v0.4 + v0.5 の 12 axis / 48 method + adapter interface + fidelity harness + spawn stub 契約層 (invokeDesktopCli signature + SpawnResult 構造) は完全保持。 依存関係も `@kiwa-test/core` のみで v0.1-v0.5 と同じ、 他 44 package への影響 0、 semantics + adapters + spawn-driver 既存 layer からの API export 完全保持。

## systematic pattern 36 度目適用

v1.60 の 35 度目 = desktop v0.5 spawn stub uniform を 36 度目で desktop v0.6 spawn-executor に uniform 適用。 8 CLI 全て単一 executeSpawn pattern から実行、 SpawnExecutorInput → SpawnExecutorResult の shape 契約統一、 per-command env allowlist + timeout + buffer 上限 + SIGKILL の safety pattern 統一。 「pattern 化 = CLI 数 + safety layer 数 + shape 契約 に独立」 の pattern SSOT が確立。

## Mobile v1.55 rhythm 完全再現

Mobile v1.50 (base 3 axis) → v1.51 (advanced II 4 axis) → v1.52 (advanced III 4 axis) → v1.53 (v0.4 adapter layer + fidelity harness) → v1.54 (v0.5 spawn stub 契約層) → v1.55 (v0.6 実 spawn 実装完成) の 6 milestone rhythm を Desktop pair (v1.56-v1.61) で完全再現、 depth-6 到達。 pair 間 pattern 転用の 6 例目 (1 例目 = advanced axis rhythm、 2 例目 = adapter interface、 3 例目 = fidelity harness、 4 例目 = spawn-driver、 5 例目 = spawn-executor、 6 例目 = dogfood v06 workflow)。

## depth-6 pattern 新設 = kiwa milestone 史上初 depth-6 record 到達

pair 深度 6 段拡張達成 (v0.1 → v0.2 → v0.3 → v0.4 → v0.5 → v0.6) の kiwa milestone 史上初 depth-6 record。 Mobile v1.55 で depth-5 実装完成、 v1.61 Desktop で **depth-6 新設 candidate 到達** (Mobile が 6 段まで拡張していない = 深度は v0.6 が depth-6 の候補、 3 例安定化まで v1.70+ 前後で candidate)。

## depth-5 pattern 2 例目確定 = 2 例安定化到達

- **depth-5 pattern 1 例目** = Mobile v1.54 stub + v1.55 実 spawn (kiwa milestone 史上初 depth-5 record)
- **depth-5 pattern 2 例目確定** = Desktop v1.60 stub + v1.61 実 spawn ← v1.61
- **2 例安定化到達** = 「pattern 化 candidate → 確定 pattern」 昇格、 depth-5 pattern の再現性実証、 3 例目は他 pair (v1.40 AI/LLM / v1.41 Payment / v1.42 Observability) の depth-4 → depth-5 拡張で v1.62+ 検討

## Phase 7 (v1.62+) 計画

- **v0.4 real adapter を実 OS API 呼出に置換** = electron-updater / SCStream / NSPasteboard 等、 fidelity harness の behavior diff early warning 実運用開始
- **他 pair 5 段拡張** = v1.40 AI/LLM / v1.41 Payment / v1.42 Observability depth-4 → depth-5 (depth-5 pattern 3 例目 candidate)
- **他 pair 6 段拡張** = Mobile pair + Desktop pair 以外の depth-6 拡張 (depth-6 pattern 3 例安定化 candidate)
- **v2.0 milestone coverage 100% goal** への合流
