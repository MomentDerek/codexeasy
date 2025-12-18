import { useMemo, useState } from 'react'
import { FolderOpen, Save, Terminal } from 'lucide-react'
import { open } from '@tauri-apps/plugin-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { usePreferences, useSavePreferences } from '@/services/preferences'
import { defaultPreferences } from '@/types/preferences'

export function CodexPane() {
  const { data: preferences, isLoading } = usePreferences()
  const savePreferences = useSavePreferences()
  const resolvedPreferences = useMemo(
    () => preferences?.codex ?? defaultPreferences.codex,
    [preferences?.codex]
  )
  const preferenceKey = useMemo(
    () => JSON.stringify(resolvedPreferences),
    [resolvedPreferences]
  )
  const [formState, setFormState] = useState(resolvedPreferences)

  const updateField = (
    field: keyof typeof formState,
    value: string | number
  ) => {
    setFormState(prev => ({
      ...prev,
      [field]:
        field === 'port'
          ? typeof value === 'number'
            ? value
            : Number(value)
          : value,
    }))
  }

  const handleSave = () => {
    const current = preferences ?? defaultPreferences
    savePreferences.mutate({
      ...current,
      codex: {
        ...formState,
        port: Number(formState.port) || defaultPreferences.codex.port,
      },
    })
  }

  const pickBinary = async () => {
    const path = await open({
      multiple: false,
      title: 'Select Codex binary',
      filters: [{ name: 'Executable', extensions: [] }],
    })

    if (typeof path === 'string') {
      updateField('codexPath', path)
    }
  }

  const pickWorkingDirectory = async () => {
    const directory = await open({
      directory: true,
      multiple: false,
      title: 'Select working directory',
    })

    if (typeof directory === 'string') {
      updateField('workingDirectory', directory)
    }
  }

  return (
    <div key={preferenceKey} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground">
          Codex integration
        </h3>
        <Separator className="mt-2" />
        <p className="mt-2 text-sm text-muted-foreground">
          Point the GUI to your Codex build so the App Server can be launched
          without leaving the desktop app.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            Codex binary path
          </Label>
          <div className="flex items-center gap-2">
            <Input
              value={formState.codexPath}
              onChange={event => updateField('codexPath', event.target.value)}
              placeholder="/path/to/codex"
              className="font-mono"
            />
            <Button variant="outline" size="icon" onClick={pickBinary}>
              <Terminal className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This should be the compiled `codex` binary that exposes the
            app-server command.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            Working directory
          </Label>
          <div className="flex items-center gap-2">
            <Input
              value={formState.workingDirectory}
              onChange={event =>
                updateField('workingDirectory', event.target.value)
              }
              placeholder="Optional project root"
              className="font-mono"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={pickWorkingDirectory}
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            We run the app-server from here so relative includes behave like the
            CLI.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Host</Label>
            <Input
              value={formState.host}
              onChange={event => updateField('host', event.target.value)}
              placeholder="127.0.0.1"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Port</Label>
            <Input
              type="number"
              value={formState.port}
              onChange={event => updateField('port', event.target.value)}
              placeholder="3928"
              min={1}
              max={65535}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={savePreferences.isPending}>
          <Save className="mr-2 h-4 w-4" />
          Save Codex settings
        </Button>
        {isLoading && (
          <p className="text-xs text-muted-foreground">Loading preferences…</p>
        )}
      </div>
    </div>
  )
}
