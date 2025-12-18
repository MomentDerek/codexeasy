import { BookOpen, ExternalLink, Info, Play, Square } from 'lucide-react'
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
import {
  useCodexServerStatus,
  useStartCodexServer,
  useStopCodexServer,
} from '@/services/codex-app-server'
import { usePreferences } from '@/services/preferences'
import { cn } from '@/lib/utils'
import { defaultPreferences } from '@/types/preferences'

export function CodexNavigationSidebar() {
  const { data: preferences } = usePreferences()
  const codexPreferences = preferences?.codex ?? defaultPreferences.codex
  const { data: status } = useCodexServerStatus()
  const startServer = useStartCodexServer()
  const stopServer = useStopCodexServer()

  const handleStart = () => {
    if (!codexPreferences.codexPath) return
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

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-sm">App server</CardTitle>
          <CardDescription className="text-xs">
            Mirror the codex CLI lifecycle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-medium text-foreground">
                {status?.running ? 'Running' : 'Stopped'}
              </p>
            </div>
            <Badge
              className={cn(
                'text-xs',
                status?.running
                  ? 'bg-green-100 text-green-900 dark:bg-green-500/15 dark:text-green-200'
                  : 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200'
              )}
            >
              {status?.running ? 'Online' : 'Offline'}
            </Badge>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Host</p>
            <p>
              {codexPreferences.host}:{codexPreferences.port}
            </p>
            <p className="font-medium text-foreground">Binary</p>
            <p className="break-all">
              {codexPreferences.codexPath || 'Not configured'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={handleStart}
              disabled={!codexPreferences.codexPath || status?.running}
            >
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={handleStop}
              disabled={!status?.running}
            >
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-sm">Workflow</CardTitle>
          <CardDescription className="text-xs">
            Checklist from the CLI docs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <Step label="Set binary path" />
          <Step label="Pick working directory" />
          <Step label="Launch app-server" />
          <Step label="Send prompts" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-sm">Docs</CardTitle>
          <CardDescription className="text-xs">
            Quick references for Codex
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <DocLink
            label="Tauri integration guide"
            href="https://github.com/MomentDerek/codex/raw/refs/heads/codex/create-integration-documentation-for-tauri/docs/app-server-tauri-integration.md"
          />
          <DocLink
            label="App server README"
            href="https://raw.githubusercontent.com/openai/codex/refs/heads/main/codex-rs/app-server/README.md"
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function CodexInsightsSidebar() {
  const { data: status } = useCodexServerStatus()

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-sm">Latest output</CardTitle>
          <CardDescription className="text-xs">
            Tail of the Codex process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-foreground">
            {status?.lastMessage || 'Waiting for logs...'}
          </p>
          <Separator />
          <div className="text-xs text-muted-foreground">
            <p>
              PID:{' '}
              <span className="font-medium text-foreground">
                {status?.pid ?? '—'}
              </span>
            </p>
            <p>
              Host:{' '}
              <span className="font-medium text-foreground">
                {status?.host || 'n/a'}
              </span>
            </p>
            <p>
              Port:{' '}
              <span className="font-medium text-foreground">
                {status?.port ?? 'n/a'}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-sm">Tips</CardTitle>
          <CardDescription className="text-xs">
            Mirrors codex CLI ergonomics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <TipRow text="Use the same host/port as your CLI scripts for parity." />
          <TipRow text="Keep the working directory aligned with your repo root." />
          <TipRow text="Save prompts as snippets once the server is healthy." />
          <TipRow text="Use the Request composer to avoid memorizing flags." />
        </CardContent>
      </Card>
    </div>
  )
}

function Step({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Info className="h-3.5 w-3.5 text-primary" />
      <p>{label}</p>
    </div>
  )
}

function DocLink({ label, href }: { label: string; href: string }) {
  return (
    <a
      className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-xs text-foreground transition hover:bg-muted"
      href={href}
    >
      <span className="flex items-center gap-2">
        <BookOpen className="h-3.5 w-3.5 text-primary" />
        {label}
      </span>
      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
    </a>
  )
}

function TipRow({ text }: { text: string }) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <p>{text}</p>
    </div>
  )
}
