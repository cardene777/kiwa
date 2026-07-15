import type { PythonAppEnv } from './env.js';

export type TemplateContext = Record<string, string | number | boolean>;

export interface TemplateRenderResult {
  html: string;
  variables: string[];
  missing: string[];
}

/**
 * Jinja2 相当の `{{ var }}` interpolation。 template を env に register してから
 * name 指定で render。 real Jinja2 の filter / for loop は含まない minimal 実装。
 */
export function renderTemplate(env: PythonAppEnv, name: string, context: TemplateContext): TemplateRenderResult {
  const tmpl = env.templates.get(name);
  if (tmpl === undefined) {
    throw new Error(`template not found: ${name}`);
  }
  const variables: string[] = [];
  const missing: string[] = [];
  const html = tmpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => {
    variables.push(key);
    if (!(key in context)) {
      missing.push(key);
      return '';
    }
    return String(context[key]);
  });
  return { html, variables, missing };
}
