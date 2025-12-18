import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { defaultPreferences, type AppPreferences } from '@/types/preferences'

// Query keys for preferences
export const preferencesQueryKeys = {
  all: ['preferences'] as const,
  preferences: () => [...preferencesQueryKeys.all] as const,
}

// TanStack Query hooks following the architectural patterns
export function usePreferences() {
  return useQuery({
    queryKey: preferencesQueryKeys.preferences(),
    queryFn: async (): Promise<AppPreferences> => {
      try {
        logger.debug('Loading preferences from backend')
        const preferences = await invoke<AppPreferences>('load_preferences')
        const mergedPreferences: AppPreferences = {
          ...defaultPreferences,
          ...preferences,
          codex: {
            ...defaultPreferences.codex,
            ...preferences.codex,
          },
        }
        logger.info('Preferences loaded successfully', { preferences })
        return mergedPreferences
      } catch (error) {
        // Return defaults if preferences file doesn't exist yet
        logger.warn('Failed to load preferences, using defaults', { error })
        return defaultPreferences
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}

export function useSavePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (preferences: AppPreferences) => {
      try {
        const payload: AppPreferences = {
          ...defaultPreferences,
          ...preferences,
          codex: {
            ...defaultPreferences.codex,
            ...preferences.codex,
          },
        }

        logger.debug('Saving preferences to backend', { preferences: payload })
        await invoke('save_preferences', { preferences: payload })
        logger.info('Preferences saved successfully')
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error occurred'
        logger.error('Failed to save preferences', { error, preferences })
        toast.error('Failed to save preferences', { description: message })
        throw error
      }
    },
    onSuccess: (_, preferences) => {
      const nextPreferences: AppPreferences = {
        ...defaultPreferences,
        ...preferences,
        codex: {
          ...defaultPreferences.codex,
          ...preferences.codex,
        },
      }

      // Update the cache with the new preferences
      queryClient.setQueryData(
        preferencesQueryKeys.preferences(),
        nextPreferences
      )
      logger.info('Preferences cache updated')
      toast.success('Preferences saved')
    },
  })
}
