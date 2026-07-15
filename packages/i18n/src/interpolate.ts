import type { InterpolationValues } from './client.js';

export interface InterpolateResult {
  text: string;
  variables: string[];
  missing: string[];
}

/**
 * `{{name}}` placeholder を values で置換する mustache-lite interpolation。 実 provider
 * (next-intl / vue-i18n / react-i18next / Lingui) の interpolation engine を差し替えても
 * 同じ signature で呼べる想定。
 */
export function interpolate(template: string, values: InterpolationValues): InterpolateResult {
  const variables: string[] = [];
  const missing: string[] = [];
  const text = template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => {
    variables.push(key);
    if (!(key in values)) {
      missing.push(key);
      return '';
    }
    return String(values[key]);
  });
  return { text, variables, missing };
}
