import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CONFIG_FILENAME,
  ConfigError,
  configFromEnv,
  parseConfigFile,
  resolveConfig,
  type KanameConfig,
  type PartialKanameConfig,
} from './config.js';

/**
 * Read `kaname.config.json` from a project root.
 *
 * A missing file is not an error: every field has a default, so a project can
 * run without any configuration at all. A malformed file is an error, because
 * the author meant to configure something and it is not taking effect.
 */
export function loadConfigFile(projectRoot: string): PartialKanameConfig {
  const path = resolve(projectRoot, CONFIG_FILENAME);
  if (!existsSync(path)) return {};

  let text: string;
  try {
    text = readFileSync(path, 'utf-8');
  } catch (cause) {
    throw new ConfigError(`cannot read ${path}: ${(cause as Error).message}`);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (cause) {
    throw new ConfigError(`${path} is not valid JSON: ${(cause as Error).message}`);
  }

  return parseConfigFile(raw, path);
}

export interface LoadConfigOptions {
  /** Values a caller supplies directly. Highest precedence. */
  overrides?: PartialKanameConfig;
  /** Defaults to `process.env`. Injectable so tests need not mutate the process. */
  env?: NodeJS.ProcessEnv;
}

/**
 * Resolve the effective config for a project.
 *
 * Precedence, weakest to strongest: defaults, config file, environment,
 * explicit overrides. `resolveConfig` applies them in that order.
 */
export function loadConfig(projectRoot: string, opts: LoadConfigOptions = {}): KanameConfig {
  const fromFile = loadConfigFile(projectRoot);
  const fromEnv = configFromEnv(opts.env ?? process.env);
  return resolveConfig(fromFile, fromEnv, opts.overrides ?? {});
}
