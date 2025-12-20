import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { AppPreferences } from '@/types/preferences'

export type CodexServerStatus =
  | 'idle'
  | 'starting'
  | 'ready'
  | 'stopped'
  | 'error'

export interface CodexLogEntry {
  id: string
  timestamp: number
  direction: 'incoming' | 'outgoing' | 'system' | 'stderr'
  summary: string
  payload?: unknown
}

interface CodexState {
  status: CodexServerStatus
  userAgent?: string
  binaryPath: string
  workspacePath: string
  lastError?: string
  logs: CodexLogEntry[]
  setStatus: (status: CodexServerStatus) => void
  setUserAgent: (userAgent?: string) => void
  updatePaths: (binaryPath: string, workspacePath: string) => void
  setLastError: (message?: string) => void
  recordLog: (entry: CodexLogEntry) => void
  clearLogs: () => void
  hydrateFromPreferences: (preferences: AppPreferences) => void
}

const MAX_LOG_ENTRIES = 200

export const useCodexStore = create<CodexState>()(
  devtools(
    set => ({
      status: 'idle',
      userAgent: undefined,
      binaryPath: '',
      workspacePath: '',
      lastError: undefined,
      logs: [],
      setStatus: status => set({ status }, undefined, 'setStatus'),
      setUserAgent: userAgent => set({ userAgent }, undefined, 'setUserAgent'),
      updatePaths: (binaryPath, workspacePath) =>
        set({ binaryPath, workspacePath }, undefined, 'updatePaths'),
      setLastError: message =>
        set({ lastError: message }, undefined, 'setLastError'),
      recordLog: entry =>
        set(
          state => {
            const nextLogs = [...state.logs, entry].slice(-MAX_LOG_ENTRIES)
            return { logs: nextLogs }
          },
          undefined,
          'recordLog'
        ),
      clearLogs: () => set({ logs: [] }, undefined, 'clearLogs'),
      hydrateFromPreferences: preferences =>
        set(
          {
            binaryPath: preferences.codexBinaryPath,
            workspacePath: preferences.workspacePath,
          },
          undefined,
          'hydrateFromPreferences'
        ),
    }),
    { name: 'codex-store' }
  )
)
