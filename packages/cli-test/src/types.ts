import type { TestEnvBase } from '@kiwa-test/core';

export interface SetupCliEnvOptions {
  /** Optional initial files seeded into the isolated tempdir before tests run */
  seedFiles?: Record<string, string | Buffer>;
  /** Optional env overrides applied to every runCli invocation */
  env?: Record<string, string>;
  /** Optional subdir name within OS tempdir (default "kiwa-cli-") */
  prefix?: string;
}

export interface CliRunOptions {
  cmd: string;
  args?: string[];
  /** stdin to pipe to the child (string is utf8-encoded) */
  stdin?: string;
  /** override env merged on top of the env captured at setupCliEnv() */
  env?: Record<string, string>;
  /** cwd within the temp dir; absolute paths are passed through unchanged */
  cwd?: string;
  /** Timeout for the process in ms (default 10s) */
  timeoutMs?: number;
}

export interface CliRunResult {
  exitCode: number;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface CliTestEnv extends TestEnvBase<'mock'> {
  tempDir: string;
  /** Run a CLI in the isolated tempdir with merged env */
  runCli: (opts: CliRunOptions) => Promise<CliRunResult>;
  /** Read a file relative to tempDir as utf8 */
  readFile: (relPath: string) => Promise<string>;
  /** Write a file relative to tempDir (creates parents) */
  writeFile: (relPath: string, content: string | Buffer) => Promise<void>;
  /** List files relative to tempDir */
  listFiles: (relDir?: string) => Promise<string[]>;
  /** Returns true when the relPath exists */
  fileExists: (relPath: string) => Promise<boolean>;
}
