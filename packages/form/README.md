# @kiwa-lab/form

Form validation + submit mock harness for kiwa — React Hook Form / Zod / Formik / Conform を統一 interface で叩ける in-process mock。

## API

- `createFormClient(options)` = provider mock client (registerField / getValues / submit / listSubmitted)
- `validateSchema(schema, values)` = provider 別 validate 挙動を統一 shape で返す
- `submitForm(client, options)` = validate + onSubmit + result 集約
- `registerField(client, name, opts)` = field register (default value / validate rules)
- `getFieldError(client, name)` = 直近 validate の field-level error 取得
