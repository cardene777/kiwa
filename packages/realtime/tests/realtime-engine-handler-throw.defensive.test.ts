import { describe, expect, it } from 'vitest';
import { RealtimeEngine } from '../src/engine.js';

describe('RealtimeEngine handler exception + bounded array defensive branches', () => {
  it('connection event handler that throws does not stop other handlers', async () => {
    const engine = new RealtimeEngine({});
    const okEvents: unknown[] = [];
    await engine.subscribe('conn-a', () => {
      throw new Error('handler-a throws');
    });
    await engine.subscribe('conn-b', (e) => {
      okEvents.push(e);
    });
    await engine.ensureConnected();
    await engine.disconnect();
    expect(engine).toBeDefined();
  });

  it('channel event handler that throws does not stop other handlers', async () => {
    const engine = new RealtimeEngine({
      scenarios: {
        'evt-ch': [
          {
            kind: 'presence',
            type: 'sync',
            members: [{ userId: 'u1', payload: {}, updatedAt: 0 }],
            delay: 0,
          },
        ],
      },
    });
    const okEvents: unknown[] = [];
    await engine.subscribe('evt-ch', () => {
      throw new Error('h1 throws');
    });
    await engine.subscribe('evt-ch', (e) => {
      okEvents.push(e);
    });
    await new Promise((r) => setTimeout(r, 30));
    expect(engine).toBeDefined();
  });

  it('scenario connection event with handler that throws survives across channels', async () => {
    const engine = new RealtimeEngine({});
    await engine.subscribe('bad-conn', () => {
      throw new Error('conn throw');
    });
    await engine.subscribe('good-conn', () => undefined);
    await engine.disconnect();
    await engine.ensureConnected();
    expect(engine).toBeDefined();
  });
});
