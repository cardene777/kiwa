# @kiwa-lab/form

Form validation + submit mock harness for kiwa — React Hook Form / Zod / Formik / Conform を統一 interface で in-process から叩ける test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/form
# or
npm install -D @kiwa-lab/form
# or
yarn add -D @kiwa-lab/form
```

## Supported providers

| Provider | Status | Validate integration |
|---|---|---|
| React Hook Form | ✅ Ready | resolver 経由 |
| Zod | ✅ Ready | schema.parse |
| Formik | ✅ Ready | validationSchema |
| Conform | ✅ Ready | parseWithZod |

## Quick start

```ts
import { describe, expect, it } from 'vitest';
import {
  createFormClient,
  validateSchema,
  submitForm,
} from '@kiwa-lab/form';

describe('signup form', () => {
  it('invalid email で validate 失敗、 valid で submit 成功', async () => {
    const client = createFormClient({ provider: 'zod' });
    const schema = { email: { type: 'email' }, password: { min: 8 } };
    const bad = validateSchema(schema, { email: 'x', password: '123' });
    expect(bad.ok).toBe(false);
    const good = await submitForm(client, {
      schema,
      values: { email: 'a@b.com', password: '12345678' },
      onSubmit: async (v) => ({ id: 'u-1', ...v }),
    });
    expect(good.result.id).toBe('u-1');
  });
});
```

## API reference

- `createFormClient({ provider: FormProvider }): FormClient` — provider 別 mock client
- `validateSchema(schema: SchemaLike, values: Record<string, unknown>): ValidateResult` — 統一 shape 検証
- `submitForm(client, options: SubmitFlowOptions): Promise<SubmitResult>` — validate → onSubmit → 結果集約
- `registerField(client, field: FieldRegistration): void` — field-level 登録
- `getFieldError(client, name: string): FieldError | undefined` — field 別 error 取得

## Test integration

vitest + `/kiwa-form` skill で React コンポーネント render なしで validation ロジックだけを高速に verify。

## License

UNLICENSED — see [github.com/cardene777/kiwa](https://github.com/cardene777/kiwa).
