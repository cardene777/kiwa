export type RouterNavigation = { type: 'push' | 'replace' | 'back'; path?: string; params?: Record<string, string> };

export interface ExpoRouterOptions {
  initialPath?: string;
  initialParams?: Record<string, string>;
}

export interface ExpoRouterMock {
  push: (path: string, params?: Record<string, string>) => void;
  replace: (path: string, params?: Record<string, string>) => void;
  back: () => void;
  getCurrentPath: () => string;
  getCurrentParams: () => Record<string, string>;
  getSegments: () => string[];
  getHistory: () => RouterNavigation[];
  clear: () => void;
}

/**
 * expo-router (file-based routing) mock。 push / replace / back の 3 navigation を
 * 内部 stack で管理、 history を snapshot 経由で verify 可能にする。
 */
export function mockExpoRouter(options: ExpoRouterOptions = {}): ExpoRouterMock {
  const stack: Array<{ path: string; params: Record<string, string> }> = [
    { path: options.initialPath ?? '/', params: options.initialParams ?? {} },
  ];
  const history: RouterNavigation[] = [];

  return {
    push(path: string, params: Record<string, string> = {}) {
      stack.push({ path, params });
      const entry: RouterNavigation = { type: 'push', path };
      if (Object.keys(params).length > 0) entry.params = params;
      history.push(entry);
    },
    replace(path: string, params: Record<string, string> = {}) {
      if (stack.length > 0) stack[stack.length - 1] = { path, params };
      else stack.push({ path, params });
      const entry: RouterNavigation = { type: 'replace', path };
      if (Object.keys(params).length > 0) entry.params = params;
      history.push(entry);
    },
    back() {
      if (stack.length > 1) stack.pop();
      history.push({ type: 'back' });
    },
    getCurrentPath() {
      return stack[stack.length - 1]?.path ?? '/';
    },
    getCurrentParams() {
      return { ...(stack[stack.length - 1]?.params ?? {}) };
    },
    getSegments() {
      const path = stack[stack.length - 1]?.path ?? '/';
      return path.split('/').filter((s) => s.length > 0);
    },
    getHistory() {
      return [...history];
    },
    clear() {
      stack.length = 0;
      stack.push({ path: options.initialPath ?? '/', params: options.initialParams ?? {} });
      history.length = 0;
    },
  };
}
