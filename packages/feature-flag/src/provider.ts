import type { FlagProvider } from './client.js';

export interface ProviderConfig {
  provider: FlagProvider;
  apiKey?: string;
  environment?: string;
  clientKey?: string;
}

/**
 * provider 別の evaluation record id prefix。 実 provider の event stream / analytics で
 * 使われる prefix を再現し、 mock でも同じ format で id を発行する。
 */
export const providerIdPrefix: Record<FlagProvider, string> = {
  growthbook: 'gb',
  launchdarkly: 'ld',
  posthog: 'ph',
  unleash: 'un',
};

/**
 * provider config を統一 shape に正規化。 実 provider の SDK config 差 (LaunchDarkly = sdkKey,
 * PostHog = apiKey + host, GrowthBook = clientKey, Unleash = url + appName) を吸収。
 */
export function normalizeProviderConfig(config: Partial<ProviderConfig> & { provider: FlagProvider }): ProviderConfig {
  const result: ProviderConfig = { provider: config.provider };
  if (config.apiKey !== undefined) result.apiKey = config.apiKey;
  if (config.environment !== undefined) result.environment = config.environment;
  if (config.clientKey !== undefined) result.clientKey = config.clientKey;
  return result;
}
