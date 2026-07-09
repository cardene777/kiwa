import { h, type SolidChild, type SolidComponent } from '@kiwa-lab/solidjs';
import type { UserProfileStore } from '../store/user-profile.js';

/**
 * UserProfile component — reads `store.handle.accessor()` and switches on
 * the resource state. In `pending` / `refreshing` the component returns a
 * loading skeleton (which the Suspense boundary can also render in the
 * fallback slot). In `ready` it renders the profile card. In `errored`
 * it surfaces the error message so the ErrorBoundary in App.tsx can catch
 * a re-thrown error if the caller wants that path.
 */
export interface UserProfileProps {
  readonly store: UserProfileStore;
}

export const UserProfile: SolidComponent<UserProfileProps> = (props): SolidChild => {
  const { accessor } = props.store.handle;
  const state = accessor.state;
  if (state === 'pending' || state === 'unresolved') {
    return h(
      'section',
      { class: 'user-profile loading', 'data-testid': 'user-profile-loading' },
      h('p', null, 'Loading profile…'),
    );
  }
  if (state === 'errored') {
    const err = accessor.error;
    const message = err instanceof Error ? err.message : String(err);
    return h(
      'section',
      { class: 'user-profile error', 'data-testid': 'user-profile-error' },
      h('p', null, `Error: ${message}`),
    );
  }
  const profile = accessor();
  if (!profile) {
    return h(
      'section',
      { class: 'user-profile empty', 'data-testid': 'user-profile-empty' },
      h('p', null, 'No profile.'),
    );
  }
  return h(
    'section',
    { class: 'user-profile ready', 'data-testid': 'user-profile-ready' },
    h('h2', { class: 'user-profile-name' }, profile.displayName),
    h('p', { class: 'user-profile-email' }, profile.email),
    h('p', { class: 'user-profile-id' }, `id=${profile.id}`),
  );
};

/** Convenience loading fallback tree used by the Suspense boundary. */
export const UserProfileLoadingFallback: SolidComponent<Record<string, unknown>> = (): SolidChild => {
  return h(
    'section',
    { class: 'user-profile fallback', 'data-testid': 'user-profile-fallback' },
    h('p', null, 'Loading profile…'),
  );
};

/** Convenience error fallback used by the ErrorBoundary wrapper. */
export function renderProfileErrorFallback(error: unknown): SolidChild {
  const message = error instanceof Error ? error.message : String(error);
  return h(
    'section',
    { class: 'user-profile error-boundary', 'data-testid': 'user-profile-error-boundary' },
    h('p', null, `Boundary caught: ${message}`),
  );
}
