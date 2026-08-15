import type { TestEnvBase } from '@kiwa-lab/core';

export interface SetupCliEnvOptions {
  /** Optional initial files seeded into the isolated tempdir before tests run */
  seedFiles?: Record<string, string | Buffer>;
  /** Optional env overrides applied to every runCli invocation */
  env?: Record<string, string>;
  /**
   * Label placed inside the `kiwa-` temp namespace (default "cli").
   *
   * The directory is always created under the namespace, as
   * `kiwa-<label>-<createdAt>-<pid>-<random>`, so that orphans left by an abnormal
   * exit are reclaimed on the next run. Only `[A-Za-z0-9_-]` is accepted; a value
   * containing a path separator throws.
   */
  label?: string;
  /**
   * @deprecated Use `label`. Kept so existing callers keep working.
   *
   * The basename shape changed: a directory is no longer named `<prefix><random>`
   * but `kiwa-<label>-<createdAt>-<pid>-<random>`. Reclaiming orphans requires the
   * namespace, so an arbitrary prefix cannot be honoured verbatim. A leading
   * `kiwa-` and trailing dashes are stripped, so `"kiwa-cli-"` and `"cli"` produce
   * the same label. Code that reads `env.tempDir` is unaffected; code that matches
   * on the directory name is not.
   */
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
