export type {
  SpecItem,
  SpecDoc,
  SpecLayer,
  SplitResult,
  ClassifyIssue,
  ClassifyReport,
} from './types.js';
export { classify } from './classify.js';
export { splitSpec } from './split.js';

export type {
  KanameConfig,
  PartialKanameConfig,
  TrackerKind,
  LeanVerifyMode,
} from './config.js';
export {
  CONFIG_FILENAME,
  ConfigError,
  DEFAULT_CONFIG,
  configFromEnv,
  parseConfigFile,
  resolveConfig,
} from './config.js';
export type { LoadConfigOptions } from './config-file.js';
export { loadConfig, loadConfigFile } from './config-file.js';

export type { InitAction, InitEntry, InitOptions } from './init.js';
export {
  SETTINGS_TARGET,
  initTargets,
  planInit,
  renderConfig,
  runInit,
  settingsRunGates,
  templateFiles,
} from './init.js';
