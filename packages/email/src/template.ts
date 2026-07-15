import type { EmailTemplateContext } from './client.js';

export interface TemplateRenderResult {
  html: string;
  variables: string[];
  missing: string[];
}

/**
 * `{{name}}` placeholder を data で置換する mustache-lite template。 実 provider の
 * template engine (Handlebars / MJML) を差し替えても同じ signature で呼べる想定。
 */
export function renderTemplate(template: string, data: EmailTemplateContext): TemplateRenderResult {
  const variables: string[] = [];
  const missing: string[] = [];
  const html = template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => {
    variables.push(key);
    if (!(key in data)) {
      missing.push(key);
      return '';
    }
    return String(data[key]);
  });
  return { html, variables, missing };
}
