export type ERBLocals = Record<string, string | number | boolean>;

export interface ERBRenderResult {
  html: string;
  variables: string[];
  missing: string[];
}

/**
 * ERB `<%= name %>` interpolation の minimal mock。 実 ERB engine の control flow
 * (`<% if %>` 等) は未対応、 pure variable substitution のみ。
 */
export function renderERB(template: string, locals: ERBLocals): ERBRenderResult {
  const variables: string[] = [];
  const missing: string[] = [];
  const html = template.replace(/<%=\s*([\w.]+)\s*%>/g, (_, key: string) => {
    variables.push(key);
    if (!(key in locals)) {
      missing.push(key);
      return '';
    }
    return String(locals[key]);
  });
  return { html, variables, missing };
}
