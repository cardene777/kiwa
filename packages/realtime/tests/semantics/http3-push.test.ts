import { describe, expect, it } from 'vitest';
import {
  createHttp3PushMock,
  type SemanticsEvent,
} from '../../src/index.js';

describe('http3-push axis', () => {
  it('T-SEM-H3P-001 pushStream emits push-promise with default priority', async () => {
    const mock = createHttp3PushMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const promise = await mock.pushStream('/app.css');
    expect(promise.path).toBe('/app.css');
    expect(promise.priority.urgency).toBe(3);
    expect(promise.priority.incremental).toBe(false);
    expect(events[0]?.kind).toBe('push-promise');
  });

  it('T-SEM-H3P-002 custom priority overrides default', async () => {
    const mock = createHttp3PushMock({ artificialLatencyMs: 0 });
    const promise = await mock.pushStream('/critical.js', { urgency: 0, incremental: true });
    expect(promise.priority.urgency).toBe(0);
    expect(promise.priority.incremental).toBe(true);
  });

  it('T-SEM-H3P-003 sendHeaders emits push-headers and updates state', async () => {
    const mock = createHttp3PushMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const promise = await mock.pushStream('/x.js');
    await promise.sendHeaders({ 'content-type': 'application/javascript' });
    expect(promise.state).toBe('headers-sent');
    expect(events.some((e) => e.kind === 'push-headers')).toBe(true);
  });

  it('T-SEM-H3P-004 sendBody emits push-body with byteLength', async () => {
    const mock = createHttp3PushMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const promise = await mock.pushStream('/x.js');
    await promise.sendHeaders({});
    await promise.sendBody('console.log(1);');
    expect(promise.state).toBe('body-sent');
    const bodyEv = events.find((e) => e.kind === 'push-body');
    expect(bodyEv).toBeDefined();
    expect((bodyEv?.payload as { byteLength: number }).byteLength).toBe(15);
  });

  it('T-SEM-H3P-005 cancel emits push-cancelled and prevents further sends', async () => {
    const mock = createHttp3PushMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const promise = await mock.pushStream('/x.js');
    await promise.cancel(8);
    expect(promise.state).toBe('cancelled');
    await promise.sendHeaders({}); // no-op after cancel
    expect(events.filter((e) => e.kind === 'push-headers')).toHaveLength(0);
    expect(mock.getMetrics().streamsReset).toBe(1);
  });

  it('T-SEM-H3P-006 metrics count promises + cancellations', async () => {
    const mock = createHttp3PushMock({ artificialLatencyMs: 0 });
    const p1 = await mock.pushStream('/a');
    const p2 = await mock.pushStream('/b');
    await p1.cancel(1);
    await p2.sendHeaders({});
    await p2.sendBody('x');
    const m = mock.getMetrics();
    expect(m.custom.pushesPromised).toBe(2);
    expect(m.custom.pushesCancelled).toBe(1);
    expect(m.streamsClosed).toBe(1); // p2 body sent
  });
});
