// Types that match the Rust AppPreferences struct
// Only contains settings that should be persisted to disk
export interface AppPreferences {
  theme: string
  codex: CodexPreferences
}

export interface CodexPreferences {
  codexPath: string
  workingDirectory?: string
  host: string
  port: number
}

export const defaultPreferences: AppPreferences = {
  theme: 'system',
  codex: {
    codexPath: '',
    workingDirectory: '',
    host: '127.0.0.1',
    port: 3928,
  },
}
