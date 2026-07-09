---
title: "kiwa v2.4 リリース — Realtime pair depth-5 到達 (realtime v2.1 session-orchestrator、 depth-5 pattern 5 例目発生 = systematic law 昇格 candidate 到達、 50 milestone streak、 systematic pattern 47 度目)"
emoji: "📡"
type: "tech"
topics: ["testing", "vitest", "realtime", "state-machine", "systematic-law"]
published: false
---

# kiwa v2.4 リリース — Realtime pair depth-5 到達

## Summary

**Realtime pair depth-5 到達** milestone、 session-orchestrator 新設 (5 state + 8 event + 40 セル 遷移表 + heartbeat 動的 QoS)。 **depth-5 pattern 5 例目発生** = 「dominant pattern」 (4 例目) → **systematic law 昇格 candidate 到達** (5 例目)、 4 PR rhythm 4 milestone 目継続、 systematic pattern 47 度目適用、 **50 milestone snippet streak 到達**。

## depth-5 pattern 昇格階段 = 5 段昇格 candidate 完成

| 例目 | pair | 段階 |
|---|---|---|
| 1 | Mobile | pattern |
| 2 | Desktop | 確定 pattern |
| 3 | quality-metrics | 絶対的 rule 昇格 signal |
| 4 | Payment | dominant pattern 昇格 confirmed |
| **5** | **Realtime** | **systematic law 昇格 candidate 到達** |

v2.5+ で 6 例目 発生 → **systematic law confirmed** = kiwa 全体 の 必ず守る 最上位規範化。

## What's new

- `@kiwa-lab/realtime` v2.0 → v2.1 minor bump
- 5 state SSOT (connecting / subscribed / reconnecting / degraded / closed)
- 8 event SSOT (connect-succeeded / failed / subscribe-succeeded / heartbeat-lost / recovered / reconnect-succeeded / exhausted / user-disconnect)
- heartbeat 動的 QoS (3 回失敗 → degraded、 recovered → subscribed 復帰 + counter リセット)
- soft-reject pattern (payment v2.1 と 同型)
- shape 契約 preserving 絶対維持

## Install

```bash
pnpm add -D @kiwa-lab/realtime@^2.1
```

## Migration guide

[v2.3 → v2.4](https://cardene777.github.io/kiwa/migrations/v2.3-to-v2.4)
