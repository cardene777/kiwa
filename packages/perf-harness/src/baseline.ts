import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { MeasureResult } from './types.js';

export async function loadBaseline(path: string): Promise<MeasureResult | null> {
  try {
    const body = await readFile(path, 'utf8');
    return JSON.parse(body) as MeasureResult;
  } catch (error) {
    if (isMissingFile(error)) {
      return null;
    }
    throw error;
  }
}

export async function saveBaseline(path: string, result: MeasureResult): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
}

export function defaultBaselinePath(moduleName: string): string {
  return `${process.cwd()}/.perf-baseline/${moduleName}.json`;
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}
