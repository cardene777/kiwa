import { anvilState } from './anvil-handle';

export default async function globalTeardown() {
  await anvilState.handle?.stop();
  anvilState.handle = undefined;
}
