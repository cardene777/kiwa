export interface NavigationRoute {
  name: string;
  params?: Record<string, unknown>;
}

export interface NavigationMock {
  currentRoute: () => NavigationRoute;
  navigate: (name: string, params?: Record<string, unknown>) => void;
  goBack: () => boolean;
  reset: (route: NavigationRoute) => void;
  history: () => NavigationRoute[];
  addListener: (event: 'focus' | 'blur' | 'state', cb: (payload: NavigationRoute) => void) => () => void;
}

/**
 * @react-navigation/native 互換 mock。 navigation stack + listener を in-process で管理。
 * 実 RN navigation を差替えても同 signature で呼べる。
 */
export function mockNavigation(initialRoute: NavigationRoute): NavigationMock {
  const stack: NavigationRoute[] = [initialRoute];
  const listeners: Record<string, Array<(p: NavigationRoute) => void>> = { focus: [], blur: [], state: [] };

  function emit(event: 'focus' | 'blur' | 'state', payload: NavigationRoute): void {
    for (const cb of listeners[event] ?? []) cb(payload);
  }

  return {
    currentRoute() {
      return stack[stack.length - 1] ?? initialRoute;
    },
    navigate(name, params) {
      const next: NavigationRoute = params !== undefined ? { name, params } : { name };
      stack.push(next);
      emit('state', next);
      emit('focus', next);
    },
    goBack() {
      if (stack.length <= 1) return false;
      stack.pop();
      const prev = stack[stack.length - 1];
      if (prev) {
        emit('state', prev);
        emit('focus', prev);
      }
      return true;
    },
    reset(route) {
      stack.length = 0;
      stack.push(route);
      emit('state', route);
      emit('focus', route);
    },
    history() {
      return [...stack];
    },
    addListener(event, cb) {
      listeners[event]!.push(cb);
      return () => {
        const arr = listeners[event];
        if (!arr) return;
        const idx = arr.indexOf(cb);
        if (idx >= 0) arr.splice(idx, 1);
      };
    },
  };
}
