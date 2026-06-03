/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANVIL_PORT?: string;
  readonly VITE_MINT_CONTRACT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
