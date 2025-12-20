import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { logger } from '@/lib/logger'
import { useCodexStore } from '@/store/codex-store'
import type { CodexServerEvent, JsonRpcMessage } from '@/types/codex'

const createLogId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const summarizeRpc = (message: JsonRpcMessage): string => {
  if ('method' in message) {
    return `RPC ${message.id !== undefined ? 'response' : 'notification'}: ${message.method}`
  }

  if ('error' in message && message.error) {
    return `RPC error: ${message.error.message}`
  }

  return 'RPC message'
}

export function useCodexBridge() {
  useEffect(() => {
    const unlistenPromise = listen<CodexServerEvent>(
      'codex:server-event',
      event => {
        const payload = event.payload
        const store = useCodexStore.getState()

        switch (payload.type) {
          case 'rpc': {
            store.recordLog({
              id: createLogId(),
              timestamp: Date.now(),
              direction: 'incoming',
              summary: summarizeRpc(payload.message),
              payload: payload.message,
            })
            break
          }
          case 'stderr': {
            logger.debug('[codex stderr]', { line: payload.line })
            store.recordLog({
              id: createLogId(),
              timestamp: Date.now(),
              direction: 'stderr',
              summary: payload.line,
            })
            break
          }
          case 'exit': {
            store.setStatus('stopped')
            const exitSummary =
              payload.code === 0
                ? 'codex app-server exited'
                : `codex app-server exited with code ${payload.code ?? 'unknown'}`
            if (payload.code && payload.code !== 0) {
              store.setLastError(exitSummary)
            } else {
              store.setLastError(undefined)
            }
            store.recordLog({
              id: createLogId(),
              timestamp: Date.now(),
              direction: 'system',
              summary: exitSummary,
              payload: payload,
            })
            break
          }
          default: {
            logger.warn('Unknown Codex server event', payload)
          }
        }
      }
    )

    return () => {
      unlistenPromise.then(unlisten => unlisten())
    }
  }, [])
}
