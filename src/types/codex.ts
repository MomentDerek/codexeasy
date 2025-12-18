export interface CodexServerStatus {
  running: boolean
  pid?: number
  host?: string
  port?: number
  startedAtMs?: number
  lastMessage?: string
}

export interface CodexLaunchOptions {
  codexPath: string
  workingDirectory?: string
  host?: string
  port?: number
}

export interface CodexHealthResponse {
  ok: boolean
  message?: string
}
