# @kiwa-lab/i18n

i18n provider mock harness for kiwa — next-intl / vue-i18n / react-i18next / Lingui を統一 interface で invoke する in-process mock。

## API

- `createI18nClient(options)` = provider mock client (translate / formatNumber / formatDate / setLocale)
- `translate(key, options)` = interpolation ({{name}}) + pluralization (one/other/few/many) + fallback locale
- `formatNumber(value, locale, options)` = provider 別 number formatting
- `formatDate(value, locale, options)` = provider 別 date formatting
