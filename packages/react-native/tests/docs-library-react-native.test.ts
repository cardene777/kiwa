import { expect, it } from 'vitest';
import {
  createNotificationPermissionMock,
  createRNTestEnv,
  dispatchLinkingUrl,
  matchDeepLink,
  setDimensions,
  setPlatform,
} from '../src/index.js';

it('documents stored session navigation', async () => {
  const env = createRNTestEnv({
    platform: 'ios', initialRoute: { name: 'Login' }, asyncStorageInitial: { token: 'saved-token' },
  });
  const token = await env.asyncStorage.getItem('token');
  if (token !== null) env.navigation.navigate('Home', { source: 'session' });
  expect(env.navigation.currentRoute()).toEqual({ name: 'Home', params: { source: 'session' } });
});

it('documents allowed deep links, listener cleanup, permission, and dimensions', async () => {
  const env = createRNTestEnv({ initialRoute: { name: 'Home' } });
  env.linking.listeners.push(({ url }) => {
    const match = matchDeepLink(url, [{ scheme: 'app', pathPattern: /^\/orders\/(\d+)$/ }]);
    if (match.matched) env.navigation.navigate('Order', { id: match.params?.p1 });
  });
  dispatchLinkingUrl(env.linking, 'app:///orders/42');
  dispatchLinkingUrl(env.linking, 'app:///admin');
  expect(env.navigation.currentRoute()).toEqual({ name: 'Order', params: { id: '42' } });
  const focused: string[] = [];
  const unsubscribe = env.navigation.addListener('focus', route => focused.push(route.name));
  env.navigation.navigate('Settings');
  unsubscribe();
  env.navigation.navigate('Profile');
  expect(focused).toEqual(['Settings']);
  const permission = createNotificationPermissionMock('undetermined');
  expect(await permission.request()).toBe('granted');
  setPlatform(env.platform, { os: 'android', version: 34 });
  setDimensions(env.dimensions, { window: { width: 412, height: 915, scale: 2.6 } });
  expect(env.platform).toMatchObject({ os: 'android', version: 34 });
  expect(env.dimensions.window).toMatchObject({ width: 412, height: 915, scale: 2.6 });
});
