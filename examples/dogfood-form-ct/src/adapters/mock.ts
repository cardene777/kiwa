import {
  createPlaywrightCTMock,
  type PlaywrightCTMock,
} from '@kiwa-test/component';
import { FORM_SPECS } from '../forms/index.js';
import type {
  FormArgsMap,
  FormKind,
  FormSubmitPayload,
  FormValidationError,
} from '../forms/index.js';
import type {
  FormA11yOutcome,
  FormCTAdapter,
  FormMountSummary,
  FormSubmitOutcome,
  FormValidationOutcome,
  TraceEvent,
} from './interface.js';
import { createStoryRegistry, type StoryRegistry } from '@kiwa-test/component';

/**
 * Mock adapter — drives Playwright Component Testing through
 * `@kiwa-test/component` `createPlaywrightCTMock` (mount + interact + assert
 * against an in-memory MockNode canvas). Every op records a trace event so the
 * fidelity harness can diff mock vs real behaviour without a live browser
 * process.
 *
 * The mock is intentionally fast (<1 ms per op) but still records a per-op
 * latency sample so `perf.p95Ms` in the 7-axis release gate never reads as
 * 0-sample. A parallel `StoryRegistry` is used only for the a11y check because
 * the heuristic checker inside `@kiwa-test/component` is exposed through the
 * `StoryRegistry.runA11y` op rather than as a stand-alone function — the story
 * registration is a1 tiny shim (title + render + `A11y` story) around each
 * form so the check can run on the same rendered tree the CT flow mounted.
 */
export function makeMockAdapter(): FormCTAdapter {
  const trace: TraceEvent[] = [];
  const metricsAgg = {
    latencySamplesMs: [] as number[],
    mountInvocations: 0,
    validationInvocations: 0,
    submitInvocations: 0,
    a11yInvocations: 0,
    handlersInvoked: 0,
  };
  let ct: PlaywrightCTMock | null = null;
  let registry: StoryRegistry | null = null;

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function ensureCT(): PlaywrightCTMock {
    if (ct) return ct;
    ct = createPlaywrightCTMock();
    return ct;
  }

  function ensureRegistry(): StoryRegistry {
    if (registry) return registry;
    registry = createStoryRegistry();
    return registry;
  }

  async function timed<T>(op: string, run: () => T | Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await run();
      metricsAgg.latencySamplesMs.push(performance.now() - start);
      return result;
    } catch (err) {
      metricsAgg.latencySamplesMs.push(performance.now() - start);
      record(op, false, {
        errorKind: 'PW_CT_MOCK_ERROR',
        detail: { message: err instanceof Error ? err.message : String(err) },
      });
      throw err;
    }
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async mount<K extends FormKind>(
      kind: K,
      args: FormArgsMap[K],
    ): Promise<FormMountSummary> {
      return timed('mount', () => {
        const spec = FORM_SPECS[kind];
        const cy = ensureCT();
        const locator = cy.mount(
          spec.render as (a: FormArgsMap[K]) => ReturnType<typeof spec.render>,
          args,
        );
        const summary: FormMountSummary = {
          formId: args.formId,
          kind,
          fieldCount: locator.canvas.querySelectorAll('.field').length,
          submitButtonLabel:
            locator.canvas.querySelector('.form-submit')?.text ?? '',
          hasFormElement: Boolean(locator.canvas.querySelector('form')),
        };
        metricsAgg.mountInvocations += 1;
        record('mount', true, {
          detail: {
            formId: args.formId,
            kind,
            fieldCount: summary.fieldCount,
          },
        });
        // Unmount to keep the CT active mount count bounded across a run.
        locator.unmount();
        return summary;
      });
    },

    async interactValidation<K extends FormKind>(
      kind: K,
      args: FormArgsMap[K],
    ): Promise<FormValidationOutcome> {
      return timed('interactValidation', async () => {
        const spec = FORM_SPECS[kind];
        const cy = ensureCT();
        // Captured state lives on an object so TS narrows through `.error`
        // reads without needing a cast — closure-captured `let` variables
        // lose their narrowing across the async boundary.
        const captured: {
          error: FormValidationError | null;
          submitCount: number;
        } = { error: null, submitCount: 0 };
        const instrumentedArgs = {
          ...args,
          onValidationError: (err: FormValidationError) => {
            captured.error = err;
            metricsAgg.handlersInvoked += 1;
            args.onValidationError?.(err);
          },
          onSubmit: (payload: FormSubmitPayload) => {
            captured.submitCount += 1;
            metricsAgg.handlersInvoked += 1;
            args.onSubmit?.(payload);
          },
        } as FormArgsMap[K];
        const locator = cy.mount(
          spec.render as (a: FormArgsMap[K]) => ReturnType<typeof spec.render>,
          instrumentedArgs,
        );
        await locator
          .getByRole('button', { name: locator.canvas.querySelector('.form-submit')?.text ?? '' })
          .click();
        const errorNode = locator.canvas.querySelector('.form-error');
        const errorText = errorNode?.text ?? null;
        metricsAgg.validationInvocations += 1;
        record('interactValidation', true, {
          detail: {
            formId: args.formId,
            kind,
            errorText,
            missingFieldIds: captured.error
              ? captured.error.missingFieldIds
              : [],
            submitCount: captured.submitCount,
          },
        });
        locator.unmount();
        return {
          formId: args.formId,
          kind,
          error: captured.error,
          errorText,
          submitCallbackCount: captured.submitCount,
        };
      });
    },

    async interactSubmit<K extends FormKind>(
      kind: K,
      args: FormArgsMap[K],
    ): Promise<FormSubmitOutcome> {
      return timed('interactSubmit', async () => {
        const spec = FORM_SPECS[kind];
        const cy = ensureCT();
        const captured: {
          submit: FormSubmitPayload | null;
          validationCount: number;
        } = { submit: null, validationCount: 0 };
        const instrumentedArgs = {
          ...args,
          onSubmit: (payload: FormSubmitPayload) => {
            captured.submit = payload;
            metricsAgg.handlersInvoked += 1;
            args.onSubmit?.(payload);
          },
          onValidationError: (err: FormValidationError) => {
            captured.validationCount += 1;
            metricsAgg.handlersInvoked += 1;
            args.onValidationError?.(err);
          },
        } as FormArgsMap[K];
        const locator = cy.mount(
          spec.render as (a: FormArgsMap[K]) => ReturnType<typeof spec.render>,
          instrumentedArgs,
        );
        await locator
          .getByRole('button', { name: locator.canvas.querySelector('.form-submit')?.text ?? '' })
          .click();
        metricsAgg.submitInvocations += 1;
        record('interactSubmit', true, {
          detail: {
            formId: args.formId,
            kind,
            payloadKeys: captured.submit
              ? Object.keys(captured.submit.values)
              : [],
            validationCount: captured.validationCount,
          },
        });
        locator.unmount();
        return {
          formId: args.formId,
          kind,
          submit: captured.submit,
          submitCallbackCount: captured.submit ? 1 : 0,
          validationErrorCount: captured.validationCount,
        };
      });
    },

    async checkA11y<K extends FormKind>(
      kind: K,
      args: FormArgsMap[K],
    ): Promise<FormA11yOutcome> {
      return timed('checkA11y', async () => {
        const spec = FORM_SPECS[kind];
        const reg = ensureRegistry();
        // Register (or re-register) the form as a single-story meta so the
        // heuristic a11y checker inside `@kiwa-test/component` can walk the
        // rendered tree the same way it does for Storybook stories.
        reg.register({
          title: `FormCT/${kind}-${args.formId}`,
          render: spec.render as (
            a: FormArgsMap[K],
          ) => ReturnType<typeof spec.render>,
          stories: {
            A11y: { args: args as Partial<FormArgsMap[K]> },
          },
        });
        const { canvas } = reg.mount(`FormCT/${kind}-${args.formId}`, 'A11y');
        const a11y = reg.runA11y(
          `FormCT/${kind}-${args.formId}`,
          'A11y',
          canvas,
        );
        metricsAgg.a11yInvocations += 1;
        record('checkA11y', true, {
          detail: {
            formId: args.formId,
            kind,
            violationCount: a11y.violations.length,
          },
        });
        return {
          formId: args.formId,
          kind,
          violations: a11y.violations,
        };
      });
    },

    metrics() {
      return {
        latencySamplesMs: [...metricsAgg.latencySamplesMs],
        mountInvocations: metricsAgg.mountInvocations,
        validationInvocations: metricsAgg.validationInvocations,
        submitInvocations: metricsAgg.submitInvocations,
        a11yInvocations: metricsAgg.a11yInvocations,
        handlersInvoked: metricsAgg.handlersInvoked,
      };
    },

    async reset() {
      trace.length = 0;
      metricsAgg.latencySamplesMs.length = 0;
      metricsAgg.mountInvocations = 0;
      metricsAgg.validationInvocations = 0;
      metricsAgg.submitInvocations = 0;
      metricsAgg.a11yInvocations = 0;
      metricsAgg.handlersInvoked = 0;
      ct?.unmountAll();
      ct = null;
      registry = null;
    },
  };
}
