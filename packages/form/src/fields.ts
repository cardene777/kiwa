import type { FormClient, FieldRegistration } from './client.js';
import type { FieldError } from './validator.js';

/**
 * registerField = provider 別 field register API (RHF register / Formik useField 相当) を
 * client に集約。 rule (required / min / max / pattern / custom) を同時に登録する経路。
 */
export function registerField(client: FormClient, reg: FieldRegistration): void {
  client.registerField(reg);
}

/**
 * getFieldError = 直近 submit の field-level error を取得。 UI 側 field error 表示 (RHF
 * formState.errors / Formik touched+errors) を再現する経路。
 */
export function getFieldError(client: FormClient, field: string): FieldError | null {
  const err = client.getLastErrors().find((e) => e.field === field);
  return err ?? null;
}
