# @kiwa-lab/data の使い方

daily sync を例にします。同じ同期要求が二度届いても、未完了の仕事は一件だけにします。worker が処理できない場合は retry 上限で DLQ に移し、cleanup job は実時間を待たずに進めます。queue と clock は別の状態を持つため、同じ file の中でも別の test として責任を分けます。

`tests/daily-sync.data.test.ts` を作成します。

```ts
import { expect, test } from 'vitest';
import { createFakeClock, setupQueueEnv } from '@kiwa-lab/data';

test('keeps one pending sync for a dedup key', async () => {
  const env = await setupQueueEnv<{ version: number }>({ mode: 'mock' });
  try {
    const first = env.client.send({ version: 1 }, { dedupKey: 'daily-sync' });
    const duplicate = env.client.send({ version: 2 }, { dedupKey: 'daily-sync' });

    expect(duplicate).toBe(first);
    expect(env.client.size()).toBe(1);
  } finally {
    await env.stop();
  }
});

test('moves an unprocessable sync to the DLQ', async () => {
  const env = await setupQueueEnv<string>({ mode: 'mock', maxReceiveCount: 2 });
  let deliveries = 0;
  const finished = new Promise<void>((resolve) => {
    const unsubscribe = env.client.consume((_message, ack) => {
      deliveries += 1;
      ack.nack();
      if (deliveries === 2) {
        unsubscribe();
        resolve();
      }
    });
  });

  try {
    env.client.send('always-fails');
    await finished;
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(env.client.size()).toBe(0);
    expect(env.client.dlqSize()).toBe(1);
    expect(env.client.drainDlq()).toEqual([
      expect.objectContaining({ body: 'always-fails', receivedCount: 2 }),
    ]);
  } finally {
    await env.stop();
  }
});

test('runs a cleanup job once per interval without waiting for wall time', async () => {
  const clock = createFakeClock({ startMs: 0 });
  const fired: number[] = [];
  const id = clock.schedule(100, () => {
    fired.push(clock.nowMs());
  });

  await clock.advanceMs(350);
  clock.unschedule(id);
  expect(fired).toEqual([100, 200, 300]);
  expect(clock.nowMs()).toBe(350);
});
```

実行します。

```bash
pnpm exec vitest run tests/daily-sync.data.test.ts
```

`dedupKey` は queue に残っている間だけ重複を抑えます。ack または DLQ 移動の後は解放されるので、同じ key を新しい仕事として送れます。body を更新したいからと同じ key で送っても、既存 entry の body は置き換わりません。

この queue は dispatch 完了を await する API を公開していません。DLQ の assertion 前の `setTimeout` は、二回目の consumer callback が返った後に queue の後処理を終えるための一 turn です。worker の処理完了を任意の時間で推測する用途には使わず、application 側では完了 signal を持つ設計にしてください。handler が throw しても、この queue は自動で retry 方針に変換しません。application code で例外を捕捉し、retry なら `nack()`、完了なら `ack()` を明示します。interval は正の有限値、`advanceMs` はゼロ以上の有限値が必要です。`live` mode も同じ in-memory queue であり、network、visibility timeout、delayed delivery、parallel worker、provider 固有の ordering は検証しません。これらは対象 provider を起動する integration environment で確認してください。
