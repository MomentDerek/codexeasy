import { AlertCircle, TerminalSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useCodexStore } from '@/store/codex-store'

interface CodexLogPanelProps {
  limit?: number
  condensed?: boolean
  title?: string
}

const directionTone: Record<
  'incoming' | 'outgoing' | 'stderr' | 'system',
  string
> = {
  incoming: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  outgoing: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  stderr: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  system: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
}

export function CodexLogPanel({
  limit = 25,
  condensed = false,
  title = 'Server events',
}: CodexLogPanelProps) {
  const logs = useCodexStore(state => state.logs.slice(-limit)).reverse()

  return (
    <Card className="h-full">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">
            {title}
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            <TerminalSquare className="h-3.5 w-3.5" />
            {logs.length} events
          </Badge>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        <ScrollArea className="h-[360px]">
          <ul className="divide-y divide-border">
            {logs.map(log => (
              <li key={log.id} className="p-3 hover:bg-muted/40 transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={directionTone[log.direction]}
                      >
                        {log.direction}
                      </Badge>
                      {!condensed && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{log.summary}</p>
                    {!condensed &&
                      log.payload !== undefined &&
                      log.payload !== null && (
                        <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-2 text-xs text-muted-foreground">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      )}
                  </div>
                  {log.direction === 'stderr' && (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              </li>
            ))}
            {logs.length === 0 && (
              <li className="p-4 text-sm text-muted-foreground">
                No codex app-server traffic yet. Start the server to view
                JSON-RPC activity.
              </li>
            )}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
