import type { TestEnvBase } from '@kiwa-test/spec';
import type { ReactElement } from 'react';
import type { RenderOptions, RenderResult, screen as ScreenApi } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

export type UiTestMode = 'render' | 'interaction' | 'snapshot' | 'browser';

export interface SetupComponentEnvOptions<TMode extends UiTestMode = UiTestMode> {
  mode: TMode;
  ui: ReactElement;
  /** Options forwarded to @testing-library/react render() */
  renderOptions?: RenderOptions;
  /** Initial userEvent setup (interaction mode only) */
  userEventOptions?: Parameters<UserEvent['setup']> extends [infer Opts]
    ? Opts
    : Record<string, unknown>;
}

export interface RenderTestEnvUi extends TestEnvBase<'mock'> {
  kind: 'render';
  result: RenderResult;
  screen: typeof ScreenApi;
}

export interface InteractionTestEnvUi extends TestEnvBase<'live'> {
  kind: 'interaction';
  result: RenderResult;
  screen: typeof ScreenApi;
  user: UserEvent;
}

export interface SnapshotTestEnvUi extends TestEnvBase<'mock'> {
  kind: 'snapshot';
  result: RenderResult;
  /** Serialized DOM markup of the rendered tree, ready for inline / file snapshot */
  markup: string;
}

export type UiTestEnv = RenderTestEnvUi | InteractionTestEnvUi | SnapshotTestEnvUi;
