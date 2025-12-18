import { useMemo, useState } from 'react'
import {
  Activity,
  CheckCircle2,
  Cog,
  Copy,
  Play,
  Rocket,
  Square,
  Terminal,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  useCodexServerStatus,
  useStartCodexServer,
  useStopCodexServer,
} from '@/services/codex-app-server'
import { usePreferences } from '@/services/preferences'
import { useUIStore } from '@/store/ui-store'
import { cn } from '@/lib/utils'
import { defaultPreferences } from '@/types/preferences'

const statusTone: Record<'ready' | 'stopped' | 'unknown', string> = {
  ready: 'bg-green-100 text-green-900 dark:bg-green-500/15 dark:text-green-200',
  stopped:
    'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200',
  unknown:
    'bg-slate-100 text-slate-900 dark:bg-slate-500/15 dark:text-slate-200',
}

export function CodexWorkspace() {
  const [prompt, setPrompt] = useState(
    'Give me a high-level plan to scaffold a new React + Tauri feature.'
  )
  const [notes, setNotes] = useState(
    'Use the App Server health endpoint before sending user traffic.'
  )

  const { data: preferences, isLoading: loadingPreferences } = usePreferences()
  const codexPreferences = preferences?.codex ?? defaultPreferences.codex

  const { data: serverStatus, isFetching: checkingStatus } =
    useCodexServerStatus()
  const startServer = useStartCodexServer()
  const stopServer = useStopCodexServer()
  const togglePreferences = useUIStore(state => state.togglePreferences)

  const startDisabled =
    !codexPreferences.codexPath ||
    startServer.isPending ||
    checkingStatus ||
    serverStatus?.running
  const stopDisabled = stopServer.isPending || !serverStatus?.running

  const launchCommand = useMemo(() => {
    const binary = codexPreferences.codexPath || 'codex'
    const host = codexPreferences.host
    const port = codexPreferences.port
    const base = `${binary} app-server --host ${host} --port ${port}`

    if (codexPreferences.workingDirectory) {
      return `cd ${codexPreferences.workingDirectory} && ${base}`
    }

    return base
  }, [codexPreferences])

  const requestExample = useMemo(() => {
    const host = codexPreferences.host || '127.0.0.1'
    const port = codexPreferences.port || 3928

    return `curl -X POST http://${host}:${port}/v1/tasks \\
  -H 'Content-Type: application/json' \\
  -d '{
    "prompt": "${prompt}",
    "notes": "${notes}"
  }'`
  }, [codexPreferences.host, codexPreferences.port, notes, prompt])

  const handleStart = () => {
    if (!codexPreferences.codexPath) {
      return
    }

    startServer.mutate({
      codexPath: codexPreferences.codexPath,
      host: codexPreferences.host,
      port: codexPreferences.port,
      workingDirectory: codexPreferences.workingDirectory || undefined,
    })
  }

  const handleStop = () => {
    stopServer.mutate()
  }

  const handleCopy = async (value: string) => {
    await navigator.clipboard.writeText(value)
  }

  const statusVariant = (() => {
    if (serverStatus?.running) return 'ready'
    if (!serverStatus?.running && (serverStatus?.lastMessage || serverStatus))
      return 'stopped'
    return 'unknown'
  })() as 'ready' | 'stopped' | 'unknown'

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Codex App Server
              </p>
              <h1 className="text-xl font-semibold text-foreground">
                Programming assistant workspace
              </h1>
            </div>
          </div>
          <Badge className={cn('text-sm', statusTone[statusVariant])}>
            {serverStatus?.running ? 'Server running' : 'Server idle'}
          </Badge>
        </div>
        <p className="max-w-4xl text-sm text-muted-foreground">
          Start the Codex App Server using your configured binary, then send
          prompt payloads through the GUI instead of the CLI. The UI mirrors the
          typical `codex app-server` workflow: configure, launch, and iterate.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Connection</CardTitle>
              <CardDescription>Manage the embedded app server</CardDescription>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {codexPreferences.host}:{codexPreferences.port}
                </p>
                <p className="text-xs text-muted-foreground">
                  {serverStatus?.running
                    ? 'App server is accepting requests'
                    : 'Waiting for you to launch the server'}
                </p>
              </div>
              <Badge variant="outline" className="gap-2">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    serverStatus?.running ? 'bg-green-500' : 'bg-amber-500'
                  )}
                />
                {serverStatus?.running ? 'Online' : 'Offline'}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                className="flex-1"
                size="sm"
                onClick={handleStart}
                disabled={startDisabled || loadingPreferences}
              >
                <Play className="mr-2 h-4 w-4" />
                Start server
              </Button>
              <Button
                className="flex-1"
                size="sm"
                variant="outline"
                onClick={handleStop}
                disabled={stopDisabled}
              >
                <Square className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </div>

            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Launch command
              </p>
              <p className="mt-1 text-sm font-mono text-foreground">
                {launchCommand}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  onClick={() => handleCopy(launchCommand)}
                >
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  onClick={togglePreferences}
                >
                  <Cog className="mr-2 h-3.5 w-3.5" />
                  Preferences
                </Button>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Latest event</p>
              <p className="mt-1 text-sm text-foreground">
                {serverStatus?.lastMessage || 'No output yet'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Collected from your saved preferences
              </CardDescription>
            </div>
            <Cog className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <ConfigRow
              label="Codex binary"
              value={
                codexPreferences.codexPath
                  ? codexPreferences.codexPath
                  : 'Not set yet'
              }
              muted={!codexPreferences.codexPath}
            />
            <ConfigRow
              label="Working directory"
              value={
                codexPreferences.workingDirectory || 'Uses binary directory'
              }
              muted={!codexPreferences.workingDirectory}
            />
            <ConfigRow
              label="Host"
              value={codexPreferences.host}
              muted={!codexPreferences.host}
            />
            <ConfigRow
              label="Port"
              value={String(codexPreferences.port)}
              muted={!codexPreferences.port}
            />

            <Separator />
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={togglePreferences}
            >
              <SettingsIcon className="mr-2 h-4 w-4" />
              Edit configuration
            </Button>
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Integration checklist</CardTitle>
              <CardDescription>Mirror the CLI setup flow</CardDescription>
            </div>
            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <ChecklistItem
              title="Point to your Codex build"
              description="Set the binary path in Preferences → Advanced → Codex"
            />
            <ChecklistItem
              title="Choose the workspace root"
              description="Use the working directory to run app-server in project context"
            />
            <ChecklistItem
              title="Start and verify"
              description="Launch the server, then hit the health endpoint from the GUI"
            />
            <ChecklistItem
              title="Ship commands to the app server"
              description="Send prompts below instead of typing them in the CLI"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-1">
            <CardTitle>Compose a request</CardTitle>
            <CardDescription>
              Build the payload you would normally pass to the Codex CLI.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Prompt</p>
                <Textarea
                  value={prompt}
                  onChange={event => setPrompt(event.target.value)}
                  rows={5}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Notes & constraints
                </p>
                <Textarea
                  value={notes}
                  onChange={event => setNotes(event.target.value)}
                  rows={5}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="gap-2 px-2 py-1">
                <Rocket className="h-3.5 w-3.5" />
                Translate CLI → GUI
              </Badge>
              <Badge variant="outline" className="gap-2 px-2 py-1">
                <Terminal className="h-3.5 w-3.5" />
                Streams to app-server endpoint
              </Badge>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Example request
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  onClick={() => handleCopy(requestExample)}
                >
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
              <pre className="mt-2 overflow-x-auto rounded-md bg-background p-3 text-xs leading-relaxed">
                {requestExample}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Quick start</CardTitle>
            <CardDescription>
              Translate CLI usage into repeatable UI steps.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                1) Configure
              </p>
              <p className="text-sm text-foreground">
                Point to your Codex binary and working directory in Preferences.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                2) Launch
              </p>
              <p className="text-sm text-foreground">
                Click <span className="font-semibold">Start server</span> to run
                `codex app-server` with the configured host and port.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                3) Send prompts
              </p>
              <p className="text-sm text-foreground">
                Use the composer to send JSON payloads without memorizing CLI
                flags.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                4) Observe
              </p>
              <p className="text-sm text-foreground">
                Watch the latest app-server output and refine prompts in-place.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ConfigRow({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          'text-sm',
          muted ? 'text-muted-foreground' : 'text-foreground'
        )}
      >
        {value}
      </p>
    </div>
  )
}

function ChecklistItem({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex gap-3 rounded-md border bg-muted/30 p-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function SettingsIcon(props: React.ComponentProps<typeof Cog>) {
  return <Cog {...props} />
}
