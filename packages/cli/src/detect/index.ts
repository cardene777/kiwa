/**
 * The detection entry points the CLI uses.
 *
 * Loading the signal table and writing the result live here rather than in the
 * command so that both are testable without a CLI harness, and so the command
 * stays a matter of printing.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Detection, SignalTable } from './detect.js';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * `docs/stack-signals.json`, found relative to this file.
 *
 * Three layouts have to work: the source tree (`src/detect/`), the build output
 * (`dist/detect/`, one level shallower because `src` collapses), and the
 * published package, which carries its own copy beside the build rather than
 * reaching for a `docs/` directory that is not shipped.
 *
 * Walking up rather than listing fixed depths means adding a build step that
 * changes the nesting does not silently break detection.
 */
export function loadSignalTable(): SignalTable {
  const relatives = ['stack-signals.json', join('docs', 'stack-signals.json')];
  let dir = HERE;
  for (let up = 0; up < 8; up += 1) {
    for (const rel of relatives) {
      try {
        return JSON.parse(readFileSync(resolve(dir, rel), 'utf-8')) as SignalTable;
      } catch {
        // Not here; keep climbing.
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('stack-signals.json not found');
}

/** Where the detection is recorded, so `doctor` and the skills read one answer. */
export function writeStackFile(cwd: string, layers: Detection[]): string {
  const dir = join(cwd, '.kiwa');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'stack.json');
  const body = {
    // Recording the signal and the manifest, not just the layer, so a wrong
    // detection can be traced to the dependency that caused it.
    detected: layers.map((d) => ({
      layer: d.layer,
      signal: d.signal,
      manifest: d.manifest,
      strength: d.strength,
    })),
  };
  writeFileSync(file, `${JSON.stringify(body, null, 2)}\n`, 'utf-8');
  return join('.kiwa', 'stack.json');
}

export { detectFrom, resolve as resolveDetections } from './detect.js';
export { scan as scanManifests } from './scan.js';
export type { Detection, SignalTable } from './detect.js';
