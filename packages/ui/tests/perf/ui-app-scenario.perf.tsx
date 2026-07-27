/// <reference types="vitest/globals" />
import { setupComponentEnv } from '../../src/index.js';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MODULE = 'ui-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

function Card({ title, body }: { title: string; body: string }): JSX.Element {
  return (
    <div data-testid="card">
      <h1>{title}</h1>
      <p>{body}</p>
    </div>
  );
}

function List({ items }: { items: string[] }): JSX.Element {
  return (
    <ul data-testid="list">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function Form({ fields }: { fields: string[] }): JSX.Element {
  return (
    <form data-testid="form">
      {fields.map((field) => (
        <label key={field}>
          {field}
          <input name={field} />
        </label>
      ))}
      <button type="submit">Submit</button>
    </form>
  );
}

describe('ui app scenario perf (real workload)', () => {
  it('3-layer perf: multi-component workflow / snapshot batch / error handling', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      reportPath: REPORT_PATH,
      serialIterations: 20,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'component_workflow (3 different components mount+stop)',
          fn: async () => {
            const envA = await setupComponentEnv({ mode: 'render', ui: <Card title="hello" body="world" /> });
            await envA.stop();
            const envB = await setupComponentEnv({ mode: 'render', ui: <List items={['a', 'b', 'c']} /> });
            await envB.stop();
            const envC = await setupComponentEnv({ mode: 'render', ui: <Form fields={['name', 'email']} /> });
            await envC.stop();
          },
          serialP95CapMs: 200,
        },
        {
          name: 'snapshot_batch (3 snapshot mode consecutive)',
          fn: async () => {
            for (let i = 0; i < 3; i++) {
              const env = await setupComponentEnv({
                mode: 'snapshot',
                ui: <Card title={`title-${i}`} body={`body-${i}`} />,
              });
              await env.stop();
            }
          },
          serialP95CapMs: 200,
        },
        {
          name: 'mount_error_handling (3 throw + catch during render)',
          fn: async () => {
            const Broken = () => { throw new Error('boom'); };
            // React は描画失敗ごとに console.error を 3 回出す。test runner が
            // それを転送するバッファがメモリ計測に乗ってしまい、component の
            // 確保ではなくログ量を測ることになる。想定内の失敗の間だけ黙らせる。
            const originalError = console.error;
            console.error = () => undefined;
            try {
              for (let i = 0; i < 3; i++) {
                try {
                  const env = await setupComponentEnv({ mode: 'render', ui: <Broken /> });
                  await env.stop();
                } catch { /* handled */ }
              }
            } finally {
              console.error = originalError;
            }
          },
          serialP95CapMs: 200,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
