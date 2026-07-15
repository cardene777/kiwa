export {
  createDateClient,
  type DateProvider,
  type DateClient,
  type CreateDateClientOptions,
} from './client.js';

export {
  addDays,
  diffDays,
  type ArithmeticResult,
} from './arithmetic.js';

export {
  formatDate,
  parseDate,
  type FormatResult,
  type ParseResult,
} from './format.js';

export {
  timezoneConvert,
  type TimezoneResult,
} from './timezone.js';

// v2.1 extensions
export {
  parseDuration,
  expandRecurrence,
  createHolidayCalendar,
  retryWithBackoff,
  createObservabilityHook,
  type DurationParseResult,
  type RecurrenceFreq,
  type RecurrenceRule,
  type Holiday,
  type HolidayCalendar,
  type RetryOptions,
  type RetryResult,
  type ObservabilityHook,
} from './extensions.js';
