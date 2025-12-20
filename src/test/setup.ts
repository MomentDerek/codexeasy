import '@testing-library/jest-dom'
import React from 'react'
import { vi } from 'vitest'

// Mock matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver used by scroll areas
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// @ts-expect-error jsdom test shim
window.ResizeObserver = ResizeObserverMock

// Mock Tauri APIs for tests
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {
    // Mock unlisten function
  }),
}))

vi.mock('@tauri-apps/plugin-updater', () => ({
  check: vi.fn().mockResolvedValue(null),
}))

// Simplify scroll areas to avoid ResizeObserver behavior in tests
vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({
    children,
    className,
  }: {
    children: React.ReactNode
    className?: string
  }) => React.createElement('div', { className }, children),
}))

// Provide a lightweight codex store for unit tests
const mockCodexState = {
  status: 'idle',
  userAgent: undefined,
  binaryPath: '',
  workspacePath: '',
  lastError: undefined,
  logs: [],
  setStatus: vi.fn(),
  setUserAgent: vi.fn(),
  updatePaths: vi.fn(),
  setLastError: vi.fn(),
  recordLog: vi.fn(),
  clearLogs: vi.fn(),
  hydrateFromPreferences: vi.fn(),
}

const useCodexStore = ((selector?: (state: typeof mockCodexState) => unknown) =>
  selector ? selector(mockCodexState) : mockCodexState) as any

useCodexStore.getState = () => mockCodexState

vi.mock('@/store/codex-store', () => ({
  useCodexStore,
}))
