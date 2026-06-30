// SvelteKit ambient types for the example.
//
// locals.user は src/lib/_kiwa/auth-handle.ts の AuthLocals と同じ shape。

declare global {
  namespace App {
    interface Locals {
      user: { id: string; role: 'admin' | 'guest' } | null;
      requestId?: string;
    }
  }
}

export {};
