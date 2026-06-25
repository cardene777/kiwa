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
