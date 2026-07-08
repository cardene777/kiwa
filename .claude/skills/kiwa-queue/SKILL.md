---
name: kiwa-queue
description: |
  /kiwa-design (Layer 1) が出力した `tests/spec/integration/test-spec-{module}.queue.md` を入力に、 `@kiwa/queue` を使う `test/*.queue.test.ts` を Write して `vitest` で動作確認する Layer 2 queue test skill。
  11 観点 (正常系 / 異常系 / 境界値 / 状態遷移 / 権限 / 入力バリデーション / 冪等性 / 並行処理 / 性能 / セキュリティ / 回帰) を 4 provider (`setupBullMQEnv` BullMQ / `setupInngestEnv` Inngest / `setupCloudflareQueuesEnv` Cloudflare Queues / `setupSQSEnv` AWS SQS) × 各 provider 2 backend に変換し、 job add / process / retry / fail / drain / delay + event send / step function / concurrency + queue send / consumer batch / DLQ + SQS FIFO / batch / long polling / visibility timeout の sub-feature を 1 spec で cover する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-queue — Layer 2 queue test skill

`/kiwa-design` (Layer 1) の `--layer job-queue` 出力を `test/*.queue.test.ts` に変換し、 `vitest` で動作確認する。 BullMQ (Redis-backed) + Inngest (SaaS 型 event-driven) を統一 surface で cover する Layer 2 skill。

`@kiwa/queue` v0.1 (v1.8-4〜v1.8-5、 Issue #640 / #641) の 2 factory (`setupBullMQEnv` / `setupInngestEnv`) を Layer 1 spec の観点別 TC 表から自動的に選択し、 sandbox / testcontainers / stub / dev-server の 4 backend mode を TC ごとに割当てる。

## 前提

- `@kiwa/queue` v0.1.0+ が devDependency に入っている (`pnpm add -D @kiwa/queue`)
- 対象 backend (BullMQ の場合 `bullmq` / `ioredis` / testcontainers 使用時 `testcontainers`、 Inngest の場合 `inngest` / dev-server 使用時 `inngest-cli`) が peer dependency として入っている
- Layer 1 spec (`tests/spec/integration/test-spec-{module}.queue.md`) が存在

## ユーザーのリクエスト

$ARGUMENTS

## オプション

- `--module {name}` — Layer 1 spec の module 名 (`tests/spec/integration/test-spec-{name}.queue.md` を Read)
- `--spec-path {path}` — Layer 1 spec の path を明示 (`--module` の代替)
- `--provider {bullmq|inngest|cloudflare|sqs|all}` — 生成対象 provider (default `all`、 v1.9-3 で `cloudflare`、 v1.9-4 で `sqs` 追加)
- `--mode {sandbox|testcontainers|stub|dev-server|miniflare|wrangler|localstack|auto}` — provider 内の mode 選択 (default `auto` = 高速 backend (sandbox / stub / miniflare) を優先し、 spec が testcontainers / dev-server / wrangler / localstack を要求する TC のみ切替)
- `--output {path}` — test file 出力先 (default `tests/{module}.queue.test.ts`)
- `--lang {ja|en|<ISO 639-1>}` — report 生成言語
- `--no-run` — `vitest` 実行を skip (Write のみ)
- `--no-review` — Step 4 の kiwa-review 自動呼出 (test-review) を skip

## 実行フロー

### Step 0: 文書生成言語 (skill 起動時 1 回)

AskUserQuestion で言語確認、 `--lang` 指定時 skip。

### Step 1: Layer 1 spec 読込 + backend / mode 判定

`tests/spec/integration/test-spec-{module}.queue.md` を Read、 各 TC の 「対象 backend」 + 「mode」 column から BullMQ vs Inngest、 sandbox / testcontainers / stub / dev-server を判定。

### Step 2: test code 生成

TC 表を describe / it に落とす。 BullMQ TC は `setupBullMQEnv` + `env.addJob` / `env.assertProcessed` / `env.assertFailed` / `env.assertRetried` / `env.assertQueueDrained` を組合わせ、 Inngest TC は `setupInngestEnv` + `env.sendEvent` / `env.assertFunctionRan` / `env.assertStepRan` を組合わせる。

生成テンプレ (backend = BullMQ sandbox):

```ts
import { setupBullMQEnv } from "@kiwa/queue";
import { afterEach, describe, expect, it } from "vitest";

const envs: Array<{ stop(): Promise<void> }> = [];
afterEach(async () => {
  while (envs.length > 0) await envs.pop()!.stop();
});

describe("{module} — queue happy path", () => {
  it("T-QUEUE-001 processes an enqueued job", async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async (job) => (job.data as { x: number }).x * 2);
    await env.addJob("double", { x: 21 });
    await env.assertProcessed("double", { returnValue: 42 });
  });
});
```

### Step 3: vitest 実行

`pnpm vitest run {output_path}` で走らせる。 testcontainers / dev-server mode は Docker / `inngest-cli` 起動時間を含めた 60s timeout を採用する。

### Step 4: /kiwa-review test-review 自動呼出

`--no-review` 未指定なら `/kiwa-review --mode test-review --layer job-queue --module {module}` を chain 呼出。

## 完了条件

- test file が `{output}` に Write されている
- `vitest run` が exit 0
- kiwa-review test-review report が生成されている (`--no-review` 未指定時)

## 他 kiwa skill との chain 連携

- 上流 ... `/kiwa-design --layer job-queue` (Layer 1 spec 生成)
- 下流 ... `/kiwa-review --mode test-review --layer job-queue` (test 品質 review)
- 統合 ... `/kiwa-test --target queue` で Layer 1 → Layer 2 → review を 1 コマンド chain

## 関連

- `@kiwa/queue` v0.1 (v1.8-4〜v1.8-5、 Issue #640 / #641) SSOT
- `packages/queue/README.md` — 2 factory の API リファレンス
- `examples/queue-bullmq-poc/` / `examples/queue-inngest-poc/` — 実 test 例
