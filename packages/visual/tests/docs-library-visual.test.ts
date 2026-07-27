import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { PNG } from 'pngjs';
import { comparePngBuffers, expectNoVisualDiff } from '../src/index.js';

function buildPng(width: number, height: number, fill: [number, number, number, number]): Buffer {
  const image = new PNG({ width, height });
  for (let index = 0; index < width * height; index += 1) image.data.set(fill, index * 4);
  return PNG.sync.write(image);
}

it('documents identical PNG success and a rejected size mismatch', async () => {
  const baseline = buildPng(4, 4, [37, 99, 235, 255]);
  const same = buildPng(4, 4, [37, 99, 235, 255]);
  const result = await comparePngBuffers(baseline, same, { threshold: 0.1, maxDiffRatio: 0.005 });
  expect(result).toMatchObject({ size: { width: 4, height: 4 }, diffPixels: 0, diffRatio: 0, ok: true });
  expectNoVisualDiff(result, expect as unknown as Parameters<typeof expectNoVisualDiff>[1]);
  await expect(comparePngBuffers(baseline, buildPng(5, 4, [37, 99, 235, 255]))).rejects.toThrow(/size mismatch/);
});

it('documents diff artifact retention and strict comparison', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'kiwa-visual-'));
  const baselinePath = join(directory, 'settings.baseline.png');
  const actualPath = join(directory, 'settings.actual.png');
  const artifactPath = join(directory, 'settings.diff.png');
  try {
    await writeFile(baselinePath, buildPng(4, 4, [0, 0, 0, 255]));
    await writeFile(actualPath, buildPng(4, 4, [255, 255, 255, 255]));
    const result = await comparePngBuffers(await readFile(baselinePath), await readFile(actualPath), { maxDiffRatio: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok && result.diffBuffer) await writeFile(artifactPath, result.diffBuffer);
    expect((await readFile(artifactPath)).length).toBeGreaterThan(0);
    expect(() => expectNoVisualDiff(result, expect as unknown as Parameters<typeof expectNoVisualDiff>[1])).toThrow(/Visual diff/);
    expect(await comparePngBuffers(await readFile(baselinePath), await readFile(baselinePath), {
      threshold: 0, includeAA: true, maxDiffRatio: 0,
    })).toMatchObject({ diffPixels: 0, ok: true });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
