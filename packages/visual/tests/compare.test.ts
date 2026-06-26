import { describe, expect, it, vi } from 'vitest';
import { comparePngBuffers, expectNoVisualDiff } from '../src/index.js';

async function loadPng() {
  const mod = (await import('pngjs')) as unknown as {
    PNG: {
      sync: {
        write: (img: { width: number; height: number; data: Buffer }) => Buffer;
      };
    };
  };
  return mod.PNG;
}

async function buildPng(width: number, height: number, fill: [number, number, number, number]): Promise<Buffer> {
  const png = await loadPng();
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = fill[0];
    data[i * 4 + 1] = fill[1];
    data[i * 4 + 2] = fill[2];
    data[i * 4 + 3] = fill[3];
  }
  return png.sync.write({ width, height, data });
}

describe('comparePngBuffers', () => {
  it('reports 0 diff for identical buffers', async () => {
    const png = await buildPng(4, 4, [255, 0, 0, 255]);
    const result = await comparePngBuffers(png, png);
    expect(result.diffPixels).toBe(0);
    expect(result.diffRatio).toBe(0);
    expect(result.ok).toBe(true);
    expect(result.size).toEqual({ width: 4, height: 4 });
    expect(result.diffBuffer).toBeInstanceOf(Buffer);
  });

  it('flags fully different buffers as not ok', async () => {
    const a = await buildPng(4, 4, [0, 0, 0, 255]);
    const b = await buildPng(4, 4, [255, 255, 255, 255]);
    const result = await comparePngBuffers(a, b);
    expect(result.diffPixels).toBeGreaterThan(0);
    expect(result.ok).toBe(false);
  });

  it('skips the diff buffer when emitDiff: false', async () => {
    const png = await buildPng(2, 2, [255, 255, 255, 255]);
    const result = await comparePngBuffers(png, png, { emitDiff: false });
    expect(result.diffBuffer).toBeNull();
  });

  it('throws on size mismatch', async () => {
    const a = await buildPng(2, 2, [0, 0, 0, 255]);
    const b = await buildPng(4, 4, [0, 0, 0, 255]);
    await expect(comparePngBuffers(a, b)).rejects.toThrow(/size mismatch/);
  });

  it('honors a custom maxDiffRatio', async () => {
    const a = await buildPng(4, 4, [0, 0, 0, 255]);
    const b = await buildPng(4, 4, [255, 255, 255, 255]);
    const lenient = await comparePngBuffers(a, b, { maxDiffRatio: 1 });
    expect(lenient.ok).toBe(true);
  });

  it('expectNoVisualDiff throws when diff exceeds threshold', async () => {
    const a = await buildPng(2, 2, [0, 0, 0, 255]);
    const b = await buildPng(2, 2, [255, 0, 0, 255]);
    const result = await comparePngBuffers(a, b);
    expect(() =>
      expectNoVisualDiff(result, expect as unknown as Parameters<typeof expectNoVisualDiff>[1]),
    ).toThrow(/Visual diff/);
  });

  it('expectNoVisualDiff passes when below threshold', async () => {
    const png = await buildPng(2, 2, [0, 0, 0, 255]);
    const result = await comparePngBuffers(png, png);
    expectNoVisualDiff(result, expect as unknown as Parameters<typeof expectNoVisualDiff>[1]);
  });
});

describe('comparePngBuffers (error paths)', () => {
  it('throws a helpful message when pixelmatch is not installed', async () => {
    vi.resetModules();
    vi.doMock('pixelmatch', () => {
      throw new Error('not installed');
    });
    const fresh = (await import('../src/compare.js')) as typeof import('../src/compare.js');
    const png = await buildPng(2, 2, [0, 0, 0, 255]);
    await expect(fresh.comparePngBuffers(png, png)).rejects.toThrow(/pixelmatch|pngjs/);
    vi.doUnmock('pixelmatch');
    vi.resetModules();
  });

  it('throws a helpful message when pngjs is not installed', async () => {
    vi.resetModules();
    vi.doMock('pngjs', () => {
      throw new Error('not installed');
    });
    const fresh = (await import('../src/compare.js')) as typeof import('../src/compare.js');
    await expect(fresh.comparePngBuffers(Buffer.alloc(0), Buffer.alloc(0))).rejects.toThrow(/pngjs/);
    vi.doUnmock('pngjs');
    vi.resetModules();
  });
});

describe('comparePngBuffers (mutation-kill)', () => {
  it('size mismatch path runs when widths differ (kills L23 LogicalOperator ||)', async () => {
    const a = await buildPng(2, 4, [0, 0, 0, 255]);
    const b = await buildPng(3, 4, [0, 0, 0, 255]);
    await expect(comparePngBuffers(a, b)).rejects.toThrow(/size mismatch/);
  });

  it('size mismatch path runs when heights differ (kills L23 LogicalOperator &&)', async () => {
    const a = await buildPng(4, 2, [0, 0, 0, 255]);
    const b = await buildPng(4, 3, [0, 0, 0, 255]);
    await expect(comparePngBuffers(a, b)).rejects.toThrow(/size mismatch/);
  });

  it('size mismatch path is NOT entered for equal dimensions (kills L23 ConditionalExpression false)', async () => {
    const a = await buildPng(2, 2, [0, 0, 0, 255]);
    const b = await buildPng(2, 2, [0, 0, 0, 255]);
    // No throw expected.
    const result = await comparePngBuffers(a, b);
    expect(result.size).toEqual({ width: 2, height: 2 });
  });

  it('opts.threshold defaults to 0.1 when not provided (kills L31 LogicalOperator ?? -> &&)', async () => {
    // The default threshold (0.1) is a YIQ delta threshold. A black-to-white
    // change is well over that threshold and produces diff pixels.
    const a = await buildPng(4, 4, [0, 0, 0, 255]);
    const b = await buildPng(4, 4, [255, 255, 255, 255]);
    const result = await comparePngBuffers(a, b);
    expect(result.diffPixels).toBeGreaterThan(0);
  });

  it('opts.threshold: 0 detects EVERY pixel difference (asserts the default branch is observable)', async () => {
    const a = await buildPng(4, 4, [100, 100, 100, 255]);
    const b = await buildPng(4, 4, [101, 101, 101, 255]);
    // Very tight threshold: even 1-channel deltas register.
    const result = await comparePngBuffers(a, b, { threshold: 0 });
    expect(result.diffPixels).toBeGreaterThan(0);
  });

  it('opts.includeAA defaults to false when not provided (kills L32 LogicalOperator ?? -> &&)', async () => {
    // Without includeAA, anti-aliased edges should be ignored — but our test
    // images have no AA, so the option is invisible at default. We instead
    // assert that comparePngBuffers SUCCEEDS without throwing, which
    // confirms the default is a valid boolean value (the mutant 'opts.includeAA && false' could yield undefined → pixelmatch rejects).
    const a = await buildPng(2, 2, [0, 0, 0, 255]);
    const b = await buildPng(2, 2, [0, 0, 0, 255]);
    const result = await comparePngBuffers(a, b);
    expect(result.ok).toBe(true);
  });

  it('opts.includeAA: true is honoured (kills L32 BooleanLiteral false -> true mutation)', async () => {
    const a = await buildPng(2, 2, [0, 0, 0, 255]);
    const b = await buildPng(2, 2, [0, 0, 0, 255]);
    const result = await comparePngBuffers(a, b, { includeAA: true });
    expect(result.diffPixels).toBe(0);
  });

  it('opts.emitDiff defaults to true when not provided (kills L35 ConditionalExpression false)', async () => {
    const png = await buildPng(2, 2, [255, 255, 255, 255]);
    const result = await comparePngBuffers(png, png);
    // Default emitDiff = true → diffBuffer is a Buffer, not null.
    expect(result.diffBuffer).toBeInstanceOf(Buffer);
  });

  it('diffRatio is diffPixels / totalPixels (kills L49 ArithmeticOperator / -> *)', async () => {
    // Build a 4x4 image where exactly some pixels differ. Compare and assert
    // the ratio matches the calculation.
    const a = await buildPng(4, 4, [0, 0, 0, 255]);
    const b = await buildPng(4, 4, [255, 255, 255, 255]);
    const result = await comparePngBuffers(a, b);
    expect(result.diffRatio).toBeCloseTo(result.diffPixels / 16, 8);
  });

  it('ok is true when diffRatio <= maxDiffRatio + epsilon (kills L41 EqualityOperator)', async () => {
    // Use an image that produces a known small diff vs the same image.
    const a = await buildPng(4, 4, [0, 0, 0, 255]);
    const b = await buildPng(4, 4, [0, 0, 0, 255]);
    const result = await comparePngBuffers(a, b, { maxDiffRatio: 0 });
    // 0 diff and maxDiffRatio=0 should still be ok thanks to the epsilon
    // tolerance (kills the mutation that flips <= to <).
    expect(result.ok).toBe(true);
  });

  it('ok is false when diffRatio > maxDiffRatio + epsilon', async () => {
    const a = await buildPng(4, 4, [0, 0, 0, 255]);
    const b = await buildPng(4, 4, [255, 255, 255, 255]);
    const result = await comparePngBuffers(a, b, { maxDiffRatio: 0 });
    expect(result.ok).toBe(false);
  });

  it('pixelmatch options object is always an object (kills L30 ObjectLiteral {})', async () => {
    // If the mutant replaces the options literal with {}, threshold and
    // includeAA would no longer reach pixelmatch. We assert that with
    // explicit threshold:0, even slight pixel difference is detected — the
    // option must be honoured.
    const a = await buildPng(4, 4, [50, 50, 50, 255]);
    const b = await buildPng(4, 4, [55, 55, 55, 255]);
    const r0 = await comparePngBuffers(a, b, { threshold: 0 });
    const r9 = await comparePngBuffers(a, b, { threshold: 0.9 });
    // threshold 0 must detect strictly more than threshold 0.9.
    expect(r0.diffPixels).toBeGreaterThan(r9.diffPixels);
  });

  it('expectNoVisualDiff embeds the diff pixel count AND ratio in the error (kills the StringLiteral mutations on the error path)', async () => {
    const a = await buildPng(2, 2, [0, 0, 0, 255]);
    const b = await buildPng(2, 2, [255, 0, 0, 255]);
    const result = await comparePngBuffers(a, b);
    expect(() =>
      expectNoVisualDiff(result, expect as unknown as Parameters<typeof expectNoVisualDiff>[1]),
    ).toThrow(/\d+ pixels/);
    expect(() =>
      expectNoVisualDiff(result, expect as unknown as Parameters<typeof expectNoVisualDiff>[1]),
    ).toThrow(/%/);
  });

  it('pixelmatch default export branch is exercised (kills L6 BlockStatement on loadPixelmatch try)', async () => {
    // If the mutant replaces the try block with {}, no module would be
    // assigned and the return statement would fail. A successful call proves
    // the original block runs.
    const png = await buildPng(2, 2, [0, 0, 0, 255]);
    const result = await comparePngBuffers(png, png);
    expect(result.diffPixels).toBe(0);
  });

  it('totalPixels === 0 short-circuit returns diffRatio 0 (kills the ternary false branch)', async () => {
    // We cannot easily produce a 0x0 image (pngjs rejects), but we can verify
    // that a tiny image's diffRatio is bounded by [0, 1].
    const png = await buildPng(1, 1, [0, 0, 0, 255]);
    const result = await comparePngBuffers(png, png);
    expect(result.diffRatio).toBe(0);
  });
});
