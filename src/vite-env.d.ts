/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_V2_URL?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  namespace JSX {
    type Element = import('react').ReactElement
    type IntrinsicElements = import('react').JSX.IntrinsicElements
  }
}

export {}
