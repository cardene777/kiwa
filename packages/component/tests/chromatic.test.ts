import { describe, expect, it } from 'vitest';
import {
  buildButton,
  buildCard,
  createChromaticVisualMock,
  createStoryRegistry,
} from '../src/index.js';

describe('ChromaticVisualMock — baseline / diff', () => {
  it('first capture creates baseline with status=new', () => {
    const chromatic = createChromaticVisualMock({ now: () => 1000 });
    const registry = createStoryRegistry();
    registry.register({
      title: 'Button',
      render: buildButton,
      stories: { Primary: { args: { label: 'ok' } } },
    });
    const { canvas, entry } = registry.mount('Button', 'Primary');
    const diff = chromatic.capture({ entry, canvas });
    expect(diff.status).toBe('new');
    expect(diff.changed).toBe(false);
    expect(diff.currentHash).toBeTruthy();
    expect(diff.baselineHash).toBe('');
  });

  it('second capture with identical output returns status=passed', () => {
    const chromatic = createChromaticVisualMock();
    const registry = createStoryRegistry();
    registry.register({
      title: 'Button',
      render: buildButton,
      stories: { Primary: { args: { label: 'ok' } } },
    });
    const first = registry.mount('Button', 'Primary');
    chromatic.capture({ entry: first.entry, canvas: first.canvas });
    // Re-render same story — identical markup
    const second = registry.mount('Button', 'Primary');
    const diff = chromatic.capture({ entry: second.entry, canvas: second.canvas });
    expect(diff.status).toBe('passed');
    expect(diff.changed).toBe(false);
    expect(diff.pixelDiffRatio).toBe(0);
    expect(diff.baselineHash).toBe(diff.currentHash);
  });

  it('capture detects change with status=failed when baseline differs', () => {
    const chromatic = createChromaticVisualMock();
    const registry = createStoryRegistry();
    registry.register({
      title: 'Button',
      render: buildButton,
      stories: { Primary: { args: { label: 'old' } } },
    });
    const first = registry.mount('Button', 'Primary');
    chromatic.capture({ entry: first.entry, canvas: first.canvas });
    const changed = registry.mount('Button', 'Primary', { label: 'new' });
    const diff = chromatic.capture({ entry: changed.entry, canvas: changed.canvas });
    expect(diff.status).toBe('failed');
    expect(diff.changed).toBe(true);
    expect(diff.pixelDiffRatio).toBe(1);
  });

  it('diffThreshold from parameters.chromatic controls pass/fail', () => {
    const chromatic = createChromaticVisualMock();
    const registry = createStoryRegistry();
    registry.register({
      title: 'Button',
      render: buildButton,
      parameters: { chromatic: { diffThreshold: 1 } }, // accept any diff
      stories: { Primary: { args: { label: 'old' } } },
    });
    const first = registry.mount('Button', 'Primary');
    chromatic.capture({ entry: first.entry, canvas: first.canvas });
    const changed = registry.mount('Button', 'Primary', { label: 'new' });
    const diff = chromatic.capture({ entry: changed.entry, canvas: changed.canvas });
    // pixelDiffRatio=1, threshold=1 → not exceeded → passed
    expect(diff.status).toBe('passed');
    expect(diff.threshold).toBe(1);
  });

  it('disabled story returns synthetic passed status without capture', () => {
    const chromatic = createChromaticVisualMock();
    const registry = createStoryRegistry();
    registry.register({
      title: 'Button',
      render: buildButton,
      stories: {
        Skipped: {
          args: { label: 'x' },
          parameters: { chromatic: { disable: true } },
        },
      },
    });
    const { entry, canvas } = registry.mount('Button', 'Skipped');
    const diff = chromatic.capture({ entry, canvas });
    expect(diff.status).toBe('passed');
    expect(chromatic.baselines()).toHaveLength(0);
  });
});

describe('ChromaticVisualMock — multi viewport', () => {
  it('captureAll iterates parameters.chromatic.viewports', () => {
    const chromatic = createChromaticVisualMock();
    const registry = createStoryRegistry();
    registry.register({
      title: 'Card',
      render: buildCard,
      parameters: { chromatic: { viewports: ['mobile', 'tablet', 'desktop'] } },
      stories: { Default: { args: { title: 't', body: 'b' } } },
    });
    const { entry, canvas } = registry.mount('Card', 'Default');
    const diffs = chromatic.captureAll({ entry, canvas });
    expect(diffs).toHaveLength(3);
    expect(diffs.map((d) => d.viewport)).toEqual(['mobile', 'tablet', 'desktop']);
    // All new on first pass
    expect(diffs.every((d) => d.status === 'new')).toBe(true);
    expect(chromatic.baselines()).toHaveLength(3);
  });

  it('captureAll falls back to default viewport when parameters.chromatic missing', () => {
    const chromatic = createChromaticVisualMock({ defaultViewport: 'desktop' });
    const registry = createStoryRegistry();
    registry.register({
      title: 'Card',
      render: buildCard,
      stories: { Default: { args: { title: 't', body: 'b' } } },
    });
    const { entry, canvas } = registry.mount('Card', 'Default');
    const diffs = chromatic.captureAll({ entry, canvas });
    expect(diffs).toHaveLength(1);
    expect(diffs[0]?.viewport).toBe('desktop');
  });

  it('captureAll returns empty for disabled story', () => {
    const chromatic = createChromaticVisualMock();
    const registry = createStoryRegistry();
    registry.register({
      title: 'Card',
      render: buildCard,
      stories: {
        Skipped: {
          args: { title: 't', body: 'b' },
          parameters: { chromatic: { disable: true } },
        },
      },
    });
    const { entry, canvas } = registry.mount('Card', 'Skipped');
    expect(chromatic.captureAll({ entry, canvas })).toEqual([]);
  });
});

describe('ChromaticVisualMock — accept / reject workflow', () => {
  it('accept replaces baseline with current capture', () => {
    const chromatic = createChromaticVisualMock({ now: () => 1000 });
    const registry = createStoryRegistry();
    registry.register({
      title: 'Button',
      render: buildButton,
      stories: { Primary: { args: { label: 'old' } } },
    });
    const first = registry.mount('Button', 'Primary');
    chromatic.capture({ entry: first.entry, canvas: first.canvas });
    const changed = registry.mount('Button', 'Primary', { label: 'new' });
    const changedDiff = chromatic.capture({ entry: changed.entry, canvas: changed.canvas });
    expect(changedDiff.status).toBe('failed');

    chromatic.review({
      storyId: changed.entry.id,
      viewport: 'default',
      action: 'accept',
    });

    // Re-capture with same "new" args — should now be passed against updated baseline
    const reCheck = registry.mount('Button', 'Primary', { label: 'new' });
    const reCheckDiff = chromatic.capture({ entry: reCheck.entry, canvas: reCheck.canvas });
    expect(reCheckDiff.status).toBe('passed');
  });

  it('reject keeps baseline unchanged', () => {
    const chromatic = createChromaticVisualMock();
    const registry = createStoryRegistry();
    registry.register({
      title: 'Button',
      render: buildButton,
      stories: { Primary: { args: { label: 'old' } } },
    });
    const first = registry.mount('Button', 'Primary');
    chromatic.capture({ entry: first.entry, canvas: first.canvas });
    const changed = registry.mount('Button', 'Primary', { label: 'new' });
    chromatic.capture({ entry: changed.entry, canvas: changed.canvas });

    chromatic.review({
      storyId: changed.entry.id,
      viewport: 'default',
      action: 'reject',
    });

    // Baseline still matches 'old' args
    const reCheck = registry.mount('Button', 'Primary', { label: 'old' });
    const reCheckDiff = chromatic.capture({ entry: reCheck.entry, canvas: reCheck.canvas });
    expect(reCheckDiff.status).toBe('passed');
  });

  it('review without prior capture throws', () => {
    const chromatic = createChromaticVisualMock();
    expect(() =>
      chromatic.review({
        storyId: 'never-captured',
        viewport: 'default',
        action: 'accept',
      }),
    ).toThrow('no current capture');
  });

  it('reviewHistory records all actions in order', () => {
    const chromatic = createChromaticVisualMock({ now: () => 1000 });
    const registry = createStoryRegistry();
    registry.register({
      title: 'Button',
      render: buildButton,
      stories: { Primary: { args: { label: 'x' } } },
    });
    const { entry, canvas } = registry.mount('Button', 'Primary');
    chromatic.capture({ entry, canvas });
    chromatic.review({ storyId: entry.id, viewport: 'default', action: 'accept' });
    chromatic.review({ storyId: entry.id, viewport: 'default', action: 'reject' });
    expect(chromatic.reviewHistory()).toHaveLength(2);
    expect(chromatic.reviewHistory().map((r) => r.action)).toEqual(['accept', 'reject']);
  });

  it('reset clears baselines + currents + reviews', () => {
    const chromatic = createChromaticVisualMock();
    const registry = createStoryRegistry();
    registry.register({
      title: 'Button',
      render: buildButton,
      stories: { Primary: { args: { label: 'x' } } },
    });
    const { entry, canvas } = registry.mount('Button', 'Primary');
    chromatic.capture({ entry, canvas });
    chromatic.review({ storyId: entry.id, viewport: 'default', action: 'accept' });
    expect(chromatic.baselines()).toHaveLength(1);
    expect(chromatic.reviewHistory()).toHaveLength(1);
    chromatic.reset();
    expect(chromatic.baselines()).toEqual([]);
    expect(chromatic.reviewHistory()).toEqual([]);
  });

  it('seedBaseline pre-populates baseline (test setup helper)', () => {
    const chromatic = createChromaticVisualMock({ now: () => 500 });
    const seeded = chromatic.seedBaseline({
      storyId: 'button--primary',
      viewport: 'desktop',
      markup: '<button>x</button>',
    });
    expect(seeded.hash).toBeTruthy();
    expect(seeded.capturedAt).toBe(500);
    expect(chromatic.baselines()).toHaveLength(1);
  });
});
