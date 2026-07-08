---
title: "@kiwa/cli-test v0.6 cli-lifecycle-orchestrator SSOT"
---

# @kiwa/cli-test v0.6 cli-lifecycle-orchestrator SSOT

## What this covers

`@kiwa/cli-test` v0.6 cli-lifecycle-orchestrator = CLI process lifecycle (spawn + IO stream + signal + exit code + cleanup) の 継続合成 layer。 depth-5 pattern 13 例目 candidate = systematic law 継続強化 第 7 例、 **backend systems layer 第 5 例 = 完全普及** (ORM / Auth / Cache / Queue に続く、 全 backend layer 5 pair depth-5 到達で kiwa 全体 systematic law 完全普及達成)、 systematic pattern 55 度目適用。

## 5 state SSOT

| state | 意味 |
|---|---|
| spawning | process 起動中 |
| running | process 実行中、 IO stream 受信 |
| signaled | signal 送信済み、 exit 待ち |
| exited | process exit 検知、 cleanup 待ち |
| cleaned | terminal (cleanup 完了) |

## 8 event SSOT

spawn-succeeded / stdout-received / stderr-received / signal-sent / exit-detected / cleanup-requested / zombie-detected / timeout

## 40 セル 遷移表 SSOT

5 state × 8 event = 40 セル。

## API SSOT

```ts
startCli(input: { timestamp: string }): CliSession;
dispatchCliEvent(input: { session; event; timestamp }): CliSession;
summarizeCli(session): CliSummary;
```

## backend systems layer 完全普及 (第 5 例)

cli-test = backend systems layer の 5 pair 目 (最終)。 ORM (v2.8) / Auth (v2.9) / Cache (v2.10) / Queue (v2.11) / cli-test (v2.12) の 5 pair 全 depth-5 到達で、 backend systems layer 全体で systematic pattern が 完全普及達成。

## Backward compat 絶対維持

- 既存 API (setupCliEnv + expectExitCode + expectStdoutContains + expectStderrContains) 変更 0
- shape 契約 preserving
- 新規 semantics/ dir 追加のみ

## depth-5 pattern 13 例目 candidate SSOT

**...ORM v2.8 + Auth v2.9 + Cache v2.10 + Queue v2.11 + cli-test v2.12 = 13 pair 到達 candidate**、 backend systems layer 5 例目 = 完全普及、 systematic pattern 55 度目、 58 milestone streak、 15 milestone 連続完遂 (v1.66-v2.12) 62 PR merged (kiwa 史上最大 session 完遂記録)。
