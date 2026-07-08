---
title: "@kiwa/queue v0.6 job-lifecycle-orchestrator SSOT"
---

# @kiwa/queue v0.6 job-lifecycle-orchestrator SSOT

## What this covers

`@kiwa/queue` v0.6 job-lifecycle-orchestrator = 5 provider (BullMQ + Inngest + Cloudflare Queues + AWS SQS + RabbitMQ) を 継続合成する 上位 layer。 depth-5 pattern 12 例目 candidate = systematic law 継続強化 第 6 例、 backend systems layer 第 4 例 (ORM / Auth / Cache に続く)、 systematic pattern 54 度目適用。

## 5 state SSOT

| state | 意味 |
|---|---|
| queued | job enqueue 済、 process 待ち |
| processing | worker が job を処理中 |
| retrying | 失敗後、 retry schedule 待ち |
| dlq | terminal (retry-exhausted or timeout) |
| completed | terminal (成功) |

## 8 event SSOT

enqueue-succeeded / process-started / process-succeeded / process-failed / retry-scheduled / retry-exhausted / dlq-inspected / timeout

## 40 セル 遷移表 SSOT

5 state × 8 event = 40 セル。

## API SSOT

```ts
startJob(input: { timestamp: string }): JobSession;
dispatchJobEvent(input: { session; event; timestamp }): JobSession;
summarizeJob(session): JobSummary;
```

## throw guard (backend systems layer 第 4 例)

Queue = backend systems layer、 遷移確定的、 誤指定 = code bug。

## Backward compat 絶対維持

- 5 provider adapter 群 変更 0
- shape 契約 preserving

## depth-5 pattern 12 例目 candidate SSOT

**...ORM v2.8 + Auth v2.9 + Cache v2.10 + Queue v2.11 = 12 pair 到達 candidate**、 backend systems layer 4 例目、 57 milestone streak。
