import { BookOpen, Cog, PlugZap, Server } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useUIStore } from '@/store/ui-store'

export function CodexSidebar() {
  const { setPreferencesOpen } = useUIStore()

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground">
              First-time setup
            </CardTitle>
            <Badge variant="outline" className="gap-1">
              <Cog className="h-3.5 w-3.5" />
              Guided
            </Badge>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-3 pt-4">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              1
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Point to your codex binary
              </p>
              <p className="text-xs text-muted-foreground">
                Set the CLI path and workspace directory. You can save these in
                Preferences for future launches.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              2
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Start the app-server
              </p>
              <p className="text-xs text-muted-foreground">
                Launches <code>codex app-server</code> as a managed child
                process and performs the initialize → initialized handshake.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              3
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Send a JSON-RPC request
              </p>
              <p className="text-xs text-muted-foreground">
                Use the playground to call <code>model/list</code> or
                <code>thread/start</code> and inspect live responses.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => setPreferencesOpen(true)}
          >
            Open Preferences
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground">
              Integration docs
            </CardTitle>
            <Badge variant="outline" className="gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              Reference
            </Badge>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-3 pt-4">
          <div className="flex items-start gap-3 text-sm">
            <PlugZap className="h-4 w-4 text-primary" />
            <a
              href="https://github.com/MomentDerek/codex/raw/refs/heads/codex/create-integration-documentation-for-tauri/docs/app-server-tauri-integration.md"
              className="text-primary underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              Tauri app-server bridge (JSON-RPC over stdio)
            </a>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <Server className="h-4 w-4 text-primary" />
            <a
              href="https://raw.githubusercontent.com/openai/codex/refs/heads/main/codex-rs/app-server/README.md"
              className="text-primary underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              codex app-server protocol reference
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
