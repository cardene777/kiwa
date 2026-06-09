/**
 * Headless Guard — chromium launch を強制 headless 化する。
 *
 * Route A / B / C 系の PoC 全てが `import './_headless-guard.js'` するだけで、
 * `chromium.launchPersistentContext` / `chromium.launch` の引数を monkey-patch して
 * 必ず headless mode + 画面外配置で起動する。
 *
 * 使い方:
 *   import './_headless-guard.js'  // ← file の冒頭で必ず import
 *   import { chromium } from '@playwright/test'
 *
 * ユーザーの画面前面化を防ぐためのセーフティ。
 */

import { chromium } from '@playwright/test'

type LaunchPersistentContextFn = typeof chromium.launchPersistentContext

const REQUIRED_ARGS = ['--headless=new', '--window-position=-3000,-3000', '--window-size=1280,800']

function patchArgs(args: string[] | undefined): string[] {
  const next = Array.isArray(args) ? [...args] : []
  // 既存 --headless 系を全削除 (false / new / old すべて)
  const filtered = next.filter((a) => !a.startsWith('--headless'))
  // 既存 --window-position / --window-size も削除して上書き
  const cleaned = filtered.filter(
    (a) => !a.startsWith('--window-position') && !a.startsWith('--window-size'),
  )
  return [...cleaned, ...REQUIRED_ARGS]
}

const originalLaunchPersistentContext: LaunchPersistentContextFn =
  chromium.launchPersistentContext.bind(chromium)

;(chromium as unknown as { launchPersistentContext: LaunchPersistentContextFn }).launchPersistentContext =
  async function patchedLaunchPersistentContext(userDataDir, options) {
    const patchedOptions = {
      ...(options ?? {}),
      headless: false as const, // headless: false + --headless=new で extension load 可能な「new headless」
      args: patchArgs(options?.args),
    }
    console.log('[headless-guard] launchPersistentContext args:', patchedOptions.args)
    return originalLaunchPersistentContext(userDataDir, patchedOptions)
  }
