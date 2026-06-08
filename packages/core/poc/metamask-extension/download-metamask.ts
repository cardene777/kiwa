/**
 * Metamask extension downloader (PoC).
 *
 * 公式 GitHub release から chrome 用 zip を download し unpack する。
 * version は固定 (METAMASK_VERSION) — selector 安定性のため。
 *
 * license note (PoC scope):
 * - Metamask license は non-commercial use (< 10K MAU global) 用途許諾、 自動化 test での利用は許容範囲
 * - 再配布禁止のため crx / zip は repo に commit しない (.gitignore 済)
 * - 起動時に都度 download し extension/ ディレクトリに unpack
 */

import { createWriteStream, existsSync, mkdirSync, rmSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { spawnSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const METAMASK_VERSION = '13.34.0'
export const METAMASK_DOWNLOAD_URL = `https://github.com/MetaMask/metamask-extension/releases/download/v${METAMASK_VERSION}/metamask-chrome-${METAMASK_VERSION}.zip`

export const EXTENSION_DIR = join(__dirname, 'extension')
export const ZIP_PATH = join(__dirname, `metamask-chrome-${METAMASK_VERSION}.zip`)

/**
 * Metamask chrome zip を download し EXTENSION_DIR に unpack する。
 * 既に unpack 済 (manifest.json 存在) なら skip。
 */
export async function downloadMetamask(opts: { force?: boolean } = {}): Promise<string> {
  const manifestPath = join(EXTENSION_DIR, 'manifest.json')

  if (!opts.force && existsSync(manifestPath)) {
    return EXTENSION_DIR
  }

  if (opts.force && existsSync(EXTENSION_DIR)) {
    rmSync(EXTENSION_DIR, { recursive: true, force: true })
  }

  await mkdir(EXTENSION_DIR, { recursive: true })

  if (!existsSync(ZIP_PATH)) {
    await downloadZip()
  }

  unpackZip()

  if (!existsSync(manifestPath)) {
    throw new Error(`[metamask-poc] unpack failed: manifest.json not found in ${EXTENSION_DIR}`)
  }

  return EXTENSION_DIR
}

async function downloadZip(): Promise<void> {
  const res = await fetch(METAMASK_DOWNLOAD_URL, { redirect: 'follow' })

  if (!res.ok || !res.body) {
    throw new Error(`[metamask-poc] download failed: ${res.status} ${res.statusText} (${METAMASK_DOWNLOAD_URL})`)
  }

  await mkdir(dirname(ZIP_PATH), { recursive: true })
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(ZIP_PATH))
}

function unpackZip(): void {
  if (!existsSync(EXTENSION_DIR)) {
    mkdirSync(EXTENSION_DIR, { recursive: true })
  }

  const result = spawnSync('unzip', ['-o', '-q', ZIP_PATH, '-d', EXTENSION_DIR], {
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    throw new Error(`[metamask-poc] unzip failed with exit code ${result.status}`)
  }
}

// CLI 起動経路 (node --import tsx download-metamask.ts)
if (import.meta.url === `file://${process.argv[1]}`) {
  downloadMetamask({ force: process.argv.includes('--force') })
    .then((dir) => {
      console.log(`[metamask-poc] extension ready: ${dir}`)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
