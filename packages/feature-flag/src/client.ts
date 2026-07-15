import { providerIdPrefix } from './provider.js';
import type { FlagRule } from './rules.js';

export type FlagProvider = 'growthbook' | 'launchdarkly' | 'posthog' | 'unleash';

export type FlagValue = boolean | string | number;

export type FlagVariant = 'boolean' | 'string' | 'number';

export interface FlagDefinition {
  key: string;
  variant: FlagVariant;
  defaultValue: FlagValue;
  description?: string;
}

export interface FlagUser {
  id: string;
  attributes?: Record<string, string | number | boolean>;
}

export interface EvaluatedFlagRecord {
  id: string;
  provider: FlagProvider;
  key: string;
  value: FlagValue;
  variant: FlagVariant;
  user: FlagUser;
  reason: string;
  evaluatedAt: number;
}

export interface FlagClient {
  provider: FlagProvider;
  registerFlag: (def: FlagDefinition) => void;
  registerRule: (key: string, rule: FlagRule) => void;
  getFlags: () => FlagDefinition[];
  getRules: (key: string) => FlagRule[];
  listEvaluated: () => EvaluatedFlagRecord[];
  recordEvaluation: (rec: Omit<EvaluatedFlagRecord, 'id' | 'evaluatedAt' | 'provider'>) => EvaluatedFlagRecord;
  clear: () => void;
}

export interface CreateFlagClientOptions {
  provider?: FlagProvider;
  flags?: FlagDefinition[];
  now?: () => number;
  idSeed?: number;
}

/**
 * provider 別 mock 差 (id prefix / evaluation stream 名) を持たせつつ、 全 API 共通 interface。
 * 実 provider (GrowthBook / LaunchDarkly / PostHog / Unleash) の SDK を差し替えても同じ
 * signature で呼べる想定。
 */
export function createFlagClient(options: CreateFlagClientOptions = {}): FlagClient {
  const provider = options.provider ?? 'growthbook';
  const now = options.now ?? (() => Number.parseInt(String(Math.floor(9e11)), 10));
  const idPrefix = providerIdPrefix[provider];
  const flags = new Map<string, FlagDefinition>();
  const rules = new Map<string, FlagRule[]>();
  const evaluated: EvaluatedFlagRecord[] = [];
  let counter = options.idSeed ?? 0;

  for (const def of options.flags ?? []) flags.set(def.key, def);

  return {
    provider,
    registerFlag(def: FlagDefinition): void {
      flags.set(def.key, def);
    },
    registerRule(key: string, rule: FlagRule): void {
      const existing = rules.get(key) ?? [];
      existing.push(rule);
      rules.set(key, existing);
    },
    getFlags(): FlagDefinition[] {
      return [...flags.values()];
    },
    getRules(key: string): FlagRule[] {
      return [...(rules.get(key) ?? [])];
    },
    listEvaluated(): EvaluatedFlagRecord[] {
      return [...evaluated];
    },
    recordEvaluation(rec): EvaluatedFlagRecord {
      counter += 1;
      const record: EvaluatedFlagRecord = {
        ...rec,
        id: `${idPrefix}-${counter}`,
        provider,
        evaluatedAt: now(),
      };
      evaluated.push(record);
      return record;
    },
    clear(): void {
      evaluated.length = 0;
    },
  };
}
