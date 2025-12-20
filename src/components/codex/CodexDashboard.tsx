import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Play,
  StopCircle,
} from 'lucide-react'
import packageJson from '../../../package.json' assert { type: 'json' }
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useCommandContext } from '@/hooks/use-command-context'
import { startAppServer, stopAppServer, sendCodexRpc } from '@/services/codex'
import { usePreferences, useSavePreferences } from '@/services/preferences'
import { useCodexStore } from '@/store/codex-store'
import type { JsonRpcRequest } from '@/types/codex'
import { defaultPreferences } from '@/types/preferences'
import { logger } from '@/lib/logger'
import { CodexLogPanel } from './CodexLogPanel'

const clientInfo = {
  name: 'codexeasy',
  title: 'Codex Easy GUI',
  version: packageJson.version ?? '0.1.0',
}

const statusTone: Record<string, string> = {
  ready: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/40',
  starting: 'bg-amber-500/10 text-amber-500 border-amber-500/40',
  stopped: 'bg-slate-500/10 text-slate-400 border-slate-500/40',
  idle: 'bg-slate-500/10 text-slate-400 border-slate-500/40',
  error: 'bg-red-500/10 text-red-500 border-red-500/40',
}

const parseJsonSafely = (value: string): unknown => {
  if (!value.trim()) {
    return undefined
  }

  return JSON.parse(value)
}

const createLogId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

export function CodexDashboard() {
  const status = useCodexStore(state => state.status)
  const userAgent = useCodexStore(state => state.userAgent)
  const lastError = useCodexStore(state => state.lastError)
  const recordLog = useCodexStore(state => state.recordLog)
  const setStatus = useCodexStore(state => state.setStatus)
  const setUserAgent = useCodexStore(state => state.setUserAgent)
  const updatePaths = useCodexStore(state => state.updatePaths)
  const setLastError = useCodexStore(state => state.setLastError)
  const hydrateFromPreferences = useCodexStore(
    state => state.hydrateFromPreferences
  )

  const { data: preferences } = usePreferences()
  const savePreferences = useSavePreferences()
  const commandContext = useCommandContext()

  const [binaryPath, setBinaryPath] = useState('')
  const [workspacePath, setWorkspacePath] = useState('')
  const [rpcMethod, setRpcMethod] = useState('model/list')
  const [rpcParams, setRpcParams] = useState('{\n  \n}')
  const [rpcId, setRpcId] = useState('1')
  const [isStarting, setIsStarting] = useState(false)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (!preferences) {
      return
    }

    hydrateFromPreferences(preferences)
    setBinaryPath(current => current || preferences.codexBinaryPath)
    setWorkspacePath(current => current || preferences.workspacePath)
  }, [preferences, hydrateFromPreferences])

  const isReady = status === 'ready'

  const statusBadgeTone = useMemo(
    () => statusTone[status] ?? statusTone.idle,
    [status]
  )

  const handleStart = async () => {
    setIsStarting(true)
    setStatus('starting')
    setLastError(undefined)

    try {
      const result = await startAppServer({
        binaryPath: binaryPath || undefined,
        workingDirectory: workspacePath || undefined,
        clientInfo,
      })

      setUserAgent(result.userAgent)
      updatePaths(result.binaryPath, result.workingDirectory ?? workspacePath)
      setStatus('ready')
      recordLog({
        id: createLogId(),
        timestamp: Date.now(),
        direction: 'system',
        summary: 'codex app-server started and initialized',
        payload: result,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error('Failed to start codex app-server', { error: message })
      setStatus('error')
      setLastError(message)
      recordLog({
        id: createLogId(),
        timestamp: Date.now(),
        direction: 'system',
        summary: `Failed to start codex app-server: ${message}`,
      })
      toast.error('Failed to start codex', { description: message })
    } finally {
      setIsStarting(false)
    }
  }

  const handleStop = async () => {
    setStatus('stopped')
    try {
      await stopAppServer()
      recordLog({
        id: createLogId(),
        timestamp: Date.now(),
        direction: 'system',
        summary: 'codex app-server stopped',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error('Failed to stop codex app-server', { error: message })
      toast.error('Failed to stop codex', { description: message })
    }
  }

  const handleSavePreferences = () => {
    const existingPreferences = preferences ?? defaultPreferences
    savePreferences.mutate({
      ...existingPreferences,
      codexBinaryPath: binaryPath,
      workspacePath,
      theme: existingPreferences.theme,
    })
  }

  const handleSendRpc = async () => {
    if (!rpcMethod.trim()) {
      toast.error('Method is required')
      return
    }

    let params: unknown

    try {
      params = parseJsonSafely(rpcParams)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error('Invalid JSON for params', { description: message })
      return
    }

    const idValue = rpcId.trim()
    const parsedId =
      idValue.length === 0
        ? undefined
        : Number.isFinite(Number(idValue))
          ? Number(idValue)
          : idValue

    const request: JsonRpcRequest = {
      method: rpcMethod,
      params,
      id: parsedId,
    }

    setIsSending(true)

    try {
      recordLog({
        id: createLogId(),
        timestamp: Date.now(),
        direction: 'outgoing',
        summary: `Request → ${request.method}`,
        payload: request,
      })

      const response = await sendCodexRpc(request)

      if (response) {
        recordLog({
          id: createLogId(),
          timestamp: Date.now(),
          direction: 'incoming',
          summary: `Response ← ${request.method}`,
          payload: response,
        })
      } else {
        recordLog({
          id: createLogId(),
          timestamp: Date.now(),
          direction: 'system',
          summary:
            'Request sent without awaiting a direct response (notification)',
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error('RPC request failed', { error: message })
      toast.error('RPC request failed', { description: message })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Codex Easy</p>
          <h1 className="text-3xl font-semibold text-foreground">
            codex app-server workspace
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage the codex CLI, stream JSON-RPC events, and test requests from
            a desktop shell.
          </p>
        </div>

        <Badge variant="outline" className={statusBadgeTone}>
          <Activity className="mr-2 h-4 w-4" />
          {status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>App-server control</CardTitle>
            <CardDescription>
              Launch <code>codex app-server</code>, persist your binary path,
              and send the required initialize handshake automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="codex-binary">codex binary</Label>
                <Input
                  id="codex-binary"
                  placeholder="/usr/local/bin/codex"
                  value={binaryPath}
                  onChange={event => setBinaryPath(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-path">workspace directory</Label>
                <Input
                  id="workspace-path"
                  placeholder="~/projects/my-repo"
                  value={workspacePath}
                  onChange={event => setWorkspacePath(event.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleStart}
                disabled={isStarting}
                className="gap-2"
              >
                {isStarting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Start server
              </Button>
              <Button
                variant="outline"
                onClick={handleStop}
                disabled={status === 'idle'}
                className="gap-2"
              >
                <StopCircle className="h-4 w-4" />
                Stop
              </Button>
              <Button
                variant="ghost"
                className="gap-2"
                onClick={handleSavePreferences}
                disabled={savePreferences.isPending}
              >
                <CheckCircle2 className="h-4 w-4" />
                Save paths to preferences
              </Button>
              <Button
                variant="link"
                className="gap-1 text-primary"
                onClick={() => commandContext.openPreferences()}
              >
                Edit all settings
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Handshake status
                </p>
                <p className="text-xs text-muted-foreground">
                  initialize → initialized
                </p>
                <Separator className="my-3" />
                <p className="text-xs text-muted-foreground">
                  Client info: {clientInfo.title} ({clientInfo.version})
                </p>
                <p className="text-xs text-muted-foreground">
                  User agent:{' '}
                  {userAgent ? (
                    <span className="text-foreground">{userAgent}</span>
                  ) : (
                    '—'
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Diagnostics
                </p>
                <p className="text-xs text-muted-foreground">
                  Current status: {status}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last error: {lastError ?? 'none'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Workspace: {workspacePath || 'not set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>JSON-RPC playground</CardTitle>
            <CardDescription>
              Send raw codex requests through the managed app-server. Use an ID
              to await a response, or omit it for notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="rpc-method">Method</Label>
              <Input
                id="rpc-method"
                value={rpcMethod}
                onChange={event => setRpcMethod(event.target.value)}
                placeholder="model/list"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rpc-id">Request ID (optional)</Label>
              <Input
                id="rpc-id"
                value={rpcId}
                onChange={event => setRpcId(event.target.value)}
                placeholder="auto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rpc-params">Params (JSON)</Label>
              <Textarea
                id="rpc-params"
                value={rpcParams}
                onChange={event => setRpcParams(event.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <Button
              className="w-full gap-2"
              onClick={handleSendRpc}
              disabled={!isReady || isSending}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Send request
            </Button>
          </CardContent>
        </Card>
      </div>

      <CodexLogPanel limit={80} title="Traffic log" />
    </div>
  )
}
