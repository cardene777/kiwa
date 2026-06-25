import type { CompareOptions, CompareResult } from './types.js';

interface PixelmatchFn {
  (
    img1: Uint8Array | Buffer,
    img2: Uint8Array | Buffer,
    output: Uint8Array | Buffer | null,
    width: number,
    height: number,
    options?: { threshold?: number; includeAA?: boolean },
  ): number;
}

interface PngStatic {
  sync: {
    read: (buffer: Buffer) => { width: number; height: number; data: Buffer };
    write: (image: { width: number; height: number; data: Buffer | Uint8Array }) => Buffer;
  };
}

async function loadPixelmatch(): Promise<PixelmatchFn> {
  try {
    const mod = (await import('pixelmatch')) as unknown as { default?: PixelmatchFn } & {
      default: PixelmatchFn;
    };
    return mod.default ?? (mod as unknown as PixelmatchFn);
  } catch {
    throw new Error('comparePngBuffers requires "pixelmatch". Run `pnpm add -D pixelmatch`.');
  }
}

async function loadPng(): Promise<PngStatic> {
  try {
    const mod = (await import('pngjs')) as unknown as { PNG: PngStatic } & { default?: { PNG: PngStatic } };
    return mod.PNG ?? mod.default?.PNG ?? (mod as unknown as { PNG: PngStatic }).PNG;
  } catch {
    throw new Error('comparePngBuffers requires "pngjs". Run `pnpm add -D pngjs`.');
  }
}

export async function comparePngBuffers(
  baseline: Buffer,
  actual: Buffer,
  opts: CompareOptions = {},
): Promise<CompareResult> {
  const png = await loadPng();
  const a = png.sync.read(baseline);
  const b = png.sync.read(actual);
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(
      `comparePngBuffers: size mismatch ${a.width}x${a.height} vs ${b.width}x${b.height}. Resize before comparing.`,
    );
  }
  const pixelmatch = await loadPixelmatch();
  const { width, height } = a;
  const emit = opts.emitDiff ?? true;
  const diff = emit ? Buffer.alloc(width * height * 4) : null;
  const diffPixels = pixelmatch(a.data, b.data, diff as Buffer | null, width, height, {
    threshold: opts.threshold ?? 0.1,
    includeAA: opts.includeAA ?? false,
  });
  const totalPixels = width * height;
  const diffRatio = totalPixels === 0 ? 0 : diffPixels / totalPixels;
  const maxDiffRatio = opts.maxDiffRatio ?? 0.005;
  return {
    size: { width, height },
    diffPixels,
    diffRatio,
    ok: diffRatio <= maxDiffRatio + 0.0000001,
    diffBuffer: diff
      ? png.sync.write({ width, height, data: diff })
      : null,
  };
}

export function expectNoVisualDiff(
  result: CompareResult,
  expect: { (actual: unknown): { toBe: (expected: unknown) => void } },
): void {
  if (!result.ok) {
    throw new Error(
      `Visual diff exceeded threshold: ${result.diffPixels} pixels (${(result.diffRatio * 100).toFixed(2)}%).`,
    );
  }
  expect(result.ok).toBe(true);
}
