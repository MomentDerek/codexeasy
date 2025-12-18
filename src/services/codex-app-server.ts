import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import type { CodexLaunchOptions, CodexServerStatus } from '@/types/codex'

export const codexQueryKeys = {
  serverStatus: ['codex', 'server', 'status'] as const,
}

const normalizeStatus = (status?: CodexServerStatus): CodexServerStatus => ({
  running: false,
  host: undefined,
  port: undefined,
  pid: undefined,
  startedAtMs: undefined,
  lastMessage: undefined,
  ...status,
})

export function useCodexServerStatus() {
  return useQuery({
    queryKey: codexQueryKeys.serverStatus,
    queryFn: async (): Promise<CodexServerStatus> => {
      const status = await invoke<CodexServerStatus>('get_codex_server_status')
      const normalized = normalizeStatus(status)
      logger.debug('Fetched Codex server status', { status: normalized })
      return normalized
    },
    initialData: normalizeStatus(),
    refetchInterval: query =>
      query.state.data?.running ? 2000 : (false as const),
  })
}

export function useStartCodexServer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (options: CodexLaunchOptions) => {
      logger.info('Starting Codex app server', { options })
      const status = await invoke<CodexServerStatus>('start_codex_app_server', {
        options,
      })
      return normalizeStatus(status)
    },
    onSuccess: status => {
      queryClient.invalidateQueries({ queryKey: codexQueryKeys.serverStatus })
      toast.success('Codex app server started', {
        description:
          status.host && status.port
            ? `Listening on ${status.host}:${status.port}`
            : 'Using configured Codex binary',
      })
    },
    onError: error => {
      const message = error instanceof Error ? error.message : String(error)
      logger.error('Failed to start Codex app server', { error: message })
      toast.error('Unable to start Codex', { description: message })
    },
  })
}

export function useStopCodexServer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      logger.info('Stopping Codex app server')
      const status = await invoke<CodexServerStatus>('stop_codex_app_server')
      return normalizeStatus(status)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: codexQueryKeys.serverStatus })
      toast.success('Codex app server stopped')
    },
    onError: error => {
      const message = error instanceof Error ? error.message : String(error)
      logger.error('Failed to stop Codex app server', { error: message })
      toast.error('Unable to stop Codex', { description: message })
    },
  })
}
