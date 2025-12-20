export type JsonRpcId = string | number

export interface JsonRpcRequest {
  method: string
  params?: unknown
  id?: JsonRpcId
}

export interface JsonRpcResponse {
  id: JsonRpcId
  result?: unknown
  error?: {
    code?: number
    message: string
    data?: unknown
  }
}

export type JsonRpcMessage = JsonRpcRequest | JsonRpcResponse

export type CodexServerEvent =
  | {
      type: 'rpc'
      message: JsonRpcMessage
    }
  | {
      type: 'stderr'
      line: string
    }
  | {
      type: 'exit'
      code: number | null
      signal: number | null
    }

export interface AppServerStartResult {
  userAgent?: string
  binaryPath: string
  workingDirectory?: string
}
