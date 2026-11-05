/// <reference types="vite/client" />

// Variables del archivo .env que Vite pone a disposición del frontend (deben empezar con VITE_).
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
