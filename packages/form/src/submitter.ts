import type { FormClient, SubmitResult } from './client.js';

export interface SubmitFlowOptions {
  overrideValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  onError?: (errors: Array<{ field: string; message: string; code?: string }>) => void;
}

/**
 * client を受け取り、 optional な value override を setValue で反映してから submit を叩く
 * convenience wrapper。 form submit workflow (form event → validate → onSubmit) の 1 shot 経路を
 * shorten する。
 */
export async function submitForm(client: FormClient, opts: SubmitFlowOptions): Promise<SubmitResult> {
  if (opts.overrideValues) {
    for (const [k, v] of Object.entries(opts.overrideValues)) {
      client.setValue(k, v);
    }
  }
  const submitOpts: Parameters<FormClient['submit']>[0] = { onSubmit: opts.onSubmit };
  if (opts.onError) submitOpts.onError = opts.onError;
  return client.submit(submitOpts);
}
