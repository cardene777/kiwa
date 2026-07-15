export {
  createFormClient,
  type FormProvider,
  type FormClient,
  type FieldRegistration,
  type SubmitOptions,
  type SubmitResult,
  type SubmittedRecord,
} from './client.js';

export {
  validateSchema,
  type SchemaLike,
  type ValidateResult,
  type FieldError,
} from './validator.js';

export {
  submitForm,
  type SubmitFlowOptions,
} from './submitter.js';

export {
  registerField,
  getFieldError,
} from './fields.js';

// v2.1 extensions
export {
  validateAsync,
  createFieldArray,
  validateDependentFields,
  retryWithBackoff,
  createObservabilityHook,
  withTimeout,
  type AsyncValidationOptions,
  type AsyncValidationResult,
  type AsyncValidator,
  type FieldArray,
  type DependentFieldRule,
  type DependentFieldResult,
  type RetryOptions,
  type RetryResult,
  type ObservabilityHook,
} from './extensions.js';
