/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANILIST_CLIENT_ID?: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
