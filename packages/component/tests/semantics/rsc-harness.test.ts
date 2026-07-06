import { describe, expect, it } from 'vitest';
import {
  beginRscRender,
  completeRscRender,
  enterSuspenseBoundary,
  failRscRender,
  startRscHarness,
  streamHtmlChunk,
} from '../../src/index.js';

describe('rsc-harness axis', () => {
  it('starts idle with explicit target', () => {
    const session = startRscHarness({ target: 'storybook8', componentId: 'cmp-1' });
    expect(session.state).toBe('idle');
    expect(session.target).toBe('storybook8');
  });

  it('rejects empty component id', () => {
    expect(() => startRscHarness({ target: 'storybook8', componentId: '' })).toThrow(
      /componentId must not be empty/,
    );
  });

  it('begins render with target dialect', () => {
    const session = startRscHarness({ target: 'playwright-ct', componentId: 'cmp-2' });
    const step = beginRscRender(session);
    expect(step.neutralEvent).toBe('rsc.render_started');
    expect(step.providerEvent).toBe('pwct.mount.rsc.start');
    expect(step.amountCents).toBe(0);
  });

  it('rejects duplicate begin', () => {
    const session = startRscHarness({ target: 'storybook8', componentId: 'cmp-3' });
    beginRscRender(session);
    expect(() => beginRscRender(session)).toThrow(/not idle/);
  });

  it('enters suspense boundary after render starts', () => {
    const session = startRscHarness({ target: 'storybook8', componentId: 'cmp-4' });
    beginRscRender(session);
    const step = enterSuspenseBoundary(session, '<p>Loading</p>');
    expect(step.neutralEvent).toBe('rsc.suspense_boundary');
    expect(session.suspenseFallback).toBe('<p>Loading</p>');
  });

  it('rejects suspense before rendering', () => {
    const session = startRscHarness({ target: 'storybook8', componentId: 'cmp-5' });
    expect(() => enterSuspenseBoundary(session)).toThrow(/not rendering/);
  });

  it('streams html chunk from suspended state', () => {
    const session = startRscHarness({ target: 'chromatic', componentId: 'cmp-6' });
    beginRscRender(session);
    enterSuspenseBoundary(session);
    const step = streamHtmlChunk(session, '<section>Ready</section>');
    expect(step.providerEvent).toBe('chromatic.capture.chunk');
    expect(step.metadata.chunkIndex).toBe(0);
  });

  it('rejects empty chunk', () => {
    const session = startRscHarness({ target: 'storybook8', componentId: 'cmp-7' });
    beginRscRender(session);
    expect(() => streamHtmlChunk(session, '')).toThrow(/chunk must not be empty/);
  });

  it('rejects stream while idle', () => {
    const session = startRscHarness({ target: 'storybook8', componentId: 'cmp-8' });
    expect(() => streamHtmlChunk(session, '<div />')).toThrow(/cannot stream/);
  });

  it('completes render and joins chunks', () => {
    const session = startRscHarness({ target: 'storybook8', componentId: 'cmp-9' });
    beginRscRender(session);
    streamHtmlChunk(session, '<main>');
    streamHtmlChunk(session, '</main>');
    const step = completeRscRender(session);
    expect(step.neutralEvent).toBe('rsc.render_completed');
    expect(step.metadata.html).toBe('<main></main>');
  });

  it('rejects complete while idle', () => {
    const session = startRscHarness({ target: 'storybook8', componentId: 'cmp-10' });
    expect(() => completeRscRender(session)).toThrow(/cannot complete/);
  });

  it('captures render failure before completion', () => {
    const session = startRscHarness({ target: 'storybook8', componentId: 'cmp-11' });
    beginRscRender(session);
    const step = failRscRender(session, new Error('boom'));
    expect(step.neutralEvent).toBe('ssr.error_boundary_captured');
    expect(session.error).toBe('boom');
  });

  it('rejects fail after completion', () => {
    const session = startRscHarness({ target: 'storybook8', componentId: 'cmp-12' });
    beginRscRender(session);
    completeRscRender(session);
    expect(() => failRscRender(session, 'late')).toThrow(/completed session/);
  });

  it('records history in order', () => {
    const session = startRscHarness({ target: 'storybook8', componentId: 'cmp-13' });
    beginRscRender(session);
    streamHtmlChunk(session, '<main />');
    completeRscRender(session);
    expect(session.history.map((step) => step.neutralEvent)).toEqual([
      'rsc.render_started',
      'rsc.html_chunk_streamed',
      'rsc.render_completed',
    ]);
  });
});
