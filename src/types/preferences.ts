// Types that match the Rust AppPreferences struct
// Only contains settings that should be persisted to disk
export interface AppPreferences {
  theme: string
  codexBinaryPath: string
  workspacePath: string
  // Add new persistent preferences here, e.g.:
  // auto_save: boolean
  // language: string
}

export const defaultPreferences: AppPreferences = {
  theme: 'system',
  codexBinaryPath: '',
  workspacePath: '',
  // Add defaults for new preferences here
}
