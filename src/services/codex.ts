import { invoke } from '@tauri-apps/api/core'
import type {
  AppServerStartResult,
  JsonRpcMessage,
  JsonRpcRequest,
  JsonRpcResponse,
} from '@/types/codex'

interface StartOptions {
  binaryPath?: string
  workingDirectory?: string
  clientInfo?: {
    name: string
    title: string
    version: string
  }
}

export async function startAppServer(options: StartOptions) {
  const payload: Record<string, unknown> = {
    binaryPath: options.binaryPath,
    workingDirectory: options.workingDirectory,
    clientInfo: options.clientInfo,
  }

  const result = await invoke<AppServerStartResult>('start_app_server', payload)
  return result
}

export async function stopAppServer() {
  await invoke('stop_app_server')
}

export async function sendCodexRpc(
  payload: JsonRpcRequest
): Promise<JsonRpcResponse | null> {
  const response = await invoke<JsonRpcMessage | null>('send_app_server_rpc', {
    payload,
  })

  if (!response) {
    return null
  }

  if ('id' in response) {
    return response as JsonRpcResponse
  }

  return null
}
