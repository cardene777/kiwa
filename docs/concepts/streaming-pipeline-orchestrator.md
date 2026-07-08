---
title: "@kiwa/streaming v2.1 pipeline-orchestrator SSOT"
---

# @kiwa/streaming v2.1 pipeline-orchestrator SSOT

## What this covers

`@kiwa/streaming` v2.1 pipeline-orchestrator = producer + consumer group + exactly-once + DLQ + schema registry の 5 axis を 継続合成する 上位 layer。 Streaming pair v0.1 → v0.2 → v0.3 → v2.1 = 5 段深化到達 = **depth-5 pattern 6 例目発生 = systematic law CONFIRMED**。 pattern 昇格階段 の 最上位 = kiwa 全体 で 必ず守る 最上位規範化 confirmed、 systematic pattern 48 度目適用 (continuous state machine variant Streaming 転用)。

## 5 state SSOT

| state | 意味 |
|---|---|
| producing | producer active |
| consuming | consumer active |
| rebalancing | consumer group rebalance 中 |
| dlq-active | DLQ に message 蓄積 (poison message 隔離) |
| stopped | terminal |

## 8 event SSOT

produce-succeeded / produce-failed / consume-succeeded / consume-failed / rebalance-triggered / rebalance-completed / dlq-message-added / stop-requested

## API SSOT

```ts
startPipeline(input: { timestamp: string }): PipelineSession;
dispatchPipelineEvent(input: { session; event; timestamp }): PipelineSession;
summarizePipeline(session): PipelineSummary;
```

## Backward compat 絶対維持

- 既存 API (v0.1-v0.3) 変更 0
- shape 契約 preserving = 27 semantics + adapter 群 全て 触らず

## depth-5 pattern 6 例目発生 = systematic law CONFIRMED SSOT

**Mobile v1.55 + Desktop v1.61 + quality-metrics v1.65 + Payment v2.3 + Realtime v2.4 + Streaming v2.5 = 6 pair 到達**

pattern 昇格階段 5 段:
1. pattern (1 例目)
2. 確定 pattern (2 例目)
3. 絶対的 rule (3 例目)
4. dominant pattern (4 例目)
5. **systematic law (6 例目 confirmed)**

kiwa 全体 で 必ず守る **最上位規範化 confirmed**、 v2.6+ で 全 pair depth-5 到達 or 7 例目発生時 も pattern 継承。

## systematic pattern 48 度目適用

- shape 契約 preserving
- additive-only
- backward compat 絶対維持
- 5 state SSOT + 8 event SSOT + 40 セル 遷移表
- soft-reject + invalid log (payment 転用)
- events log 3 種類
- **systematic law CONFIRMED 適用 pattern の テンプレート化** ← v2.5 で 新設 の meta-pattern

## Reference

- 実装 = `packages/streaming/src/semantics/pipeline-orchestrator.ts`
- test = `packages/streaming/tests/semantics/pipeline-orchestrator.test.ts` (15 test)
- dogfood = `examples/dogfood-streaming-pipeline-app/` (4 pattern、 6 test)
- tutorial = `docs/tutorials/132-streaming-pipeline-orchestrator.md`
- migration = `docs/migrations/v2.4-to-v2.5.md`
