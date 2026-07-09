---
title: "@kiwa-lab/realtime v2.1 session-orchestrator SSOT"
---

# @kiwa-lab/realtime v2.1 session-orchestrator SSOT

## What this covers

`@kiwa-lab/realtime` v2.1 session-orchestrator SSOT = presence + broadcast + subscription + heartbeat + reconnect の 継続合成 layer。 Realtime pair v0.1 → v0.2 → v2.1 = 5 段深化到達 = **depth-5 pattern 5 例目発生** (Mobile + Desktop + quality-metrics + Payment + Realtime)、 「dominant pattern」 (4 例目) → **systematic law** 昇格 candidate 到達 (5 例目)、 systematic pattern 47 度目適用 (continuous state machine variant Realtime 転用)。

## 5 state SSOT

| state | 意味 |
|---|---|
| connecting | 初期接続中 |
| subscribed | subscribe active、 broadcast 受信中 |
| reconnecting | reconnect 中、 backoff 待ち |
| degraded | heartbeat 失敗多発、 lower QoS mode |
| closed | terminal |

## 8 event SSOT

connect-succeeded / connect-failed / subscribe-succeeded / heartbeat-lost / heartbeat-recovered / reconnect-succeeded / reconnect-exhausted / user-disconnect

## 40 セル 遷移表 SSOT

5 state × 8 event = 40 セル。 soft-reject + invalid log pattern (payment v2.1 と 同型、 auth v0.7 の throw guard と 区別)。

## heartbeat 動的 QoS SSOT

subscribed 状態で heartbeat-lost 累積:

- **1-2 回** = state 維持、 counter インクリメント
- **3 回** = degraded 降格
- **heartbeat-recovered** = subscribed 復帰 + counter リセット
- **reconnect-succeeded** = subscribed 復帰 + counter リセット (reconnect 経由 の counter リセット)

## API 3 export SSOT

```ts
startSession(input: { timestamp: string }): RealtimeSession;
dispatchEvent(input: { session: RealtimeSession; event: RealtimeEvent; timestamp: string }): RealtimeSession;
summarizeSession(session: RealtimeSession): RealtimeSessionSummary;
```

## Session envelope shape SSOT

```ts
export interface RealtimeSession {
  state: RealtimeSessionState;
  connectAttempts: number;
  reconnectRounds: number;
  heartbeatFailures: number;
  broadcastsReceived: number;
  lastEventAt: string;
  events: string[];  // audit trail
}
```

## Backward compat 絶対維持

- 既存 API (v0.1-v0.2) 変更 0
- shape 契約 preserving = 27 semantics + adapter 群 全て 触らず
- 新規 file `semantics/session-orchestrator.ts` 追加 + main index.ts 6 export 追加のみ

## depth-5 pattern 5 例目発生 = systematic law 昇格 candidate 到達 SSOT

- **1 例目 (depth-5) confirmed** = Mobile v1.54-v1.55
- **1 例目 (depth-5) confirmed** = Desktop v1.60-v1.61
- **1 例目 (depth-5) confirmed** = quality-metrics v0.1-v0.5
- **4 例目 (depth-5) confirmed = dominant pattern 昇格** = Payment v0.1-v2.1 (v2.3)
- **v2.4 = 5 例目 (depth-5) 発生 = systematic law 昇格 candidate 到達** = Realtime v0.1-v2.1

「pattern → 確定 pattern → 絶対的 rule → dominant pattern → **systematic law**」 の 5 段昇格 candidate 到達、 v2.5+ で 6 例目 発生 or 別 pair depth-5 継続 で systematic law confirmed。

## systematic pattern 47 度目適用 (continuous state machine variant Realtime 転用)

- shape 契約 preserving (既存 API 変更 0)
- additive-only (新規 file 追加のみ)
- backward compat 絶対維持 (opt-in)
- 5 state SSOT + 8 event SSOT + 40 セル 遷移表
- **heartbeat 動的 QoS** (3 回連続失敗 で degraded 降格) ← v2.4 で 新設 の variant
- soft-reject + invalid log (payment 転用)
- events log 3 種類 (audit trail)

## Reference

- 実装 = `packages/realtime/src/semantics/session-orchestrator.ts`
- test = `packages/realtime/tests/semantics/session-orchestrator.test.ts` § T-R-SO-001-016 (16 test)
- dogfood = `examples/dogfood-realtime-session-app/` (4 pattern workflow、 6 test)
- tutorial = `docs/tutorials/131-realtime-session-orchestrator.md`
- migration = `docs/migrations/v2.3-to-v2.4.md`
