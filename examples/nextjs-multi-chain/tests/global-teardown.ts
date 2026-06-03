import { anvilState } from './anvil-handle';

export default async function globalTeardown() {
  for (const h of anvilState.handles) {
    await h.stop();
  }
  anvilState.handles = [];
}
