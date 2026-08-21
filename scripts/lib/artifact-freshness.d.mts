import type { execFileSync } from 'node:child_process';
import type { existsSync, readdirSync, statSync } from 'node:fs';

export type FreshnessIo = {
  execFileSync?: typeof execFileSync;
  existsSync?: typeof existsSync;
  readdirSync?: typeof readdirSync;
  statSync?: typeof statSync;
};

export type ChangedAt = {
  at: number;
  source: 'git' | 'mtime' | 'absent' | 'unknown';
};

export type FreshnessResult = {
  state: 'missing' | 'fresh' | 'stale' | 'unknown';
  artifactAt?: number;
  changedAt?: number;
  source?: string;
  reason?: string;
};

export function newestMtimeMs(dir: string, io?: FreshnessIo): number | null;

export function parseDirtyPaths(porcelainZ: string): string[];

export function implementationChangedAt(
  args: { repoRoot: string; srcRel: string; inputRels?: string[] },
  io?: FreshnessIo,
): ChangedAt;

export function checkArtifactFreshness(
  args: { repoRoot: string; srcRel: string; artifactRel: string; inputRels?: string[] },
  io?: FreshnessIo,
): FreshnessResult;

export function staleMessage(args: {
  pkg: string;
  artifactRel: string;
  regenerateCommand: string;
  result: FreshnessResult;
}): string;
