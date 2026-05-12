
/// <reference types="svelte" />

interface ImportMetaEnv {
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  skipTime: (days?: number) => void;
  skipDays: (n?: number) => void;
  maxSkills: () => void;
  addFragments: (n?: number) => void;
  addData: (n?: number) => void;
  addDna: (n?: number) => void;
}

declare module '*.css';

