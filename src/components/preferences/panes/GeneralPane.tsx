import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { usePreferences, useSavePreferences } from '@/services/preferences'
import { useCodexStore } from '@/store/codex-store'
import { defaultPreferences } from '@/types/preferences'

const SettingsField: React.FC<{
  label: string
  children: React.ReactNode
  description?: string
}> = ({ label, children, description }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-foreground">{label}</Label>
    {children}
    {description && (
      <p className="text-sm text-muted-foreground">{description}</p>
    )}
  </div>
)

const SettingsSection: React.FC<{
  title: string
  children: React.ReactNode
}> = ({ title, children }) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      <Separator className="mt-2" />
    </div>
    <div className="space-y-4">{children}</div>
  </div>
)

export const GeneralPane: React.FC = () => {
  const { data: preferences } = usePreferences()
  const savePreferences = useSavePreferences()
  const hydrateFromPreferences = useCodexStore(
    state => state.hydrateFromPreferences
  )

  const [binaryPath, setBinaryPath] = useState('')
  const [workspacePath, setWorkspacePath] = useState('')

  useEffect(() => {
    if (!preferences) {
      return
    }

    hydrateFromPreferences(preferences)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrating form inputs from persisted preferences
    setBinaryPath(preferences.codexBinaryPath)
    setWorkspacePath(preferences.workspacePath)
  }, [preferences, hydrateFromPreferences])

  const handleSave = () => {
    const existingPreferences = preferences ?? defaultPreferences

    savePreferences.mutate({
      ...existingPreferences,
      codexBinaryPath: binaryPath,
      workspacePath,
      theme: existingPreferences.theme,
    })
  }

  return (
    <div className="space-y-6">
      <SettingsSection title="codex CLI">
        <SettingsField
          label="codex binary path"
          description="Path to the codex CLI. This is used to spawn the embedded app-server."
        >
          <Input
            placeholder="/usr/local/bin/codex"
            value={binaryPath}
            onChange={event => setBinaryPath(event.target.value)}
          />
        </SettingsField>

        <SettingsField
          label="Workspace directory"
          description="The default cwd passed to codex app-server. You can override it per request from the dashboard."
        >
          <Input
            placeholder="~/projects/my-repo"
            value={workspacePath}
            onChange={event => setWorkspacePath(event.target.value)}
          />
        </SettingsField>

        <div className="flex items-center justify-end">
          <Button onClick={handleSave} disabled={savePreferences.isPending}>
            Save codex settings
          </Button>
        </div>
      </SettingsSection>
    </div>
  )
}
