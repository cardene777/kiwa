# @kiwa-lab/form API reference

## Overview

`@kiwa-lab/form` は React Hook Form / Zod / Formik / Conform 4 provider を統一 interface で mock する form validation + submit test infra。 field 登録 + schema validation + onSubmit 経路を real DOM 不要で叩ける。

## Supported providers

| provider | schema pattern | validation |
|---|---|---|
| react-hook-form | resolver (zod/yup/joi) | sync/async |
| zod | native z.object() | sync/async |
| formik | Yup + custom | sync/async |
| conform | native FormData + validator | sync/async |

## Main API

### `createFormClient(options): FormClient`

provider 別 mock client、 schema + initial values を config。 `.register(field)` / `.submit(values)` / `.reset()` を提供。

### `validateSchema(schema: SchemaLike, values): ValidateResult`

provider の schema validator を統一 shape で invoke、 `{ valid, errors: [{path, message, code}] }` を返す。

### `submitForm(client, values, options: SubmitFlowOptions): SubmitResult`

validate → onSubmit → result 集約の full flow、 `{ submitted, errors?, result? }`。 validation error 時は onSubmit を skip。

### `registerField(client, name, options?) / getFieldError(client, name)`

field 個別 register + error 取得、 `FieldRegistration` = `{ name, defaultValue?, rules? }`、 `FieldError` = `{ path, message, code, params? }`。

## Types

- `FormProvider = 'react-hook-form' | 'zod' | 'formik' | 'conform'`
- `SchemaLike` = `{ parse: (v) => any } | { safeParse: (v) => { success, data?, error? } } | z.ZodSchema | Yup.Schema`
- `SubmitOptions` = `{ onSubmit: (values) => any, onError?: (errors) => void }`
- `FieldError` = `{ path, message, code?, params? }`

## Usage examples

### Zod schema + submit flow

```typescript
import { createFormClient, submitForm } from '@kiwa-lab/form';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

describe('sign in form', () => {
  it('valid values で onSubmit が呼ばれる', async () => {
    const client = createFormClient({ provider: 'zod', schema });
    const onSubmit = vi.fn();
    const result = await submitForm(client, { email: 'a@x.com', password: 'password' }, { onSubmit });
    expect(result.submitted).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith({ email: 'a@x.com', password: 'password' });
  });

  it('invalid email で validation error', async () => {
    const client = createFormClient({ provider: 'zod', schema });
    const onSubmit = vi.fn();
    const result = await submitForm(client, { email: 'not-email', password: 'password' }, { onSubmit });
    expect(result.submitted).toBe(false);
    expect(result.errors?.[0].path).toBe('email');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

### React Hook Form field register

```typescript
import { createFormClient, registerField, getFieldError } from '@kiwa-lab/form';

const client = createFormClient({
  provider: 'react-hook-form',
  schema: {/* resolver */},
});
registerField(client, 'email', { rules: { required: true } });
// submit → validate 経由で error 発生
const emailErr = getFieldError(client, 'email');
expect(emailErr?.message).toContain('required');
```

## Related skills

- [`/kiwa-form`](../skills/kiwa-form) — form validation test 生成 skill
