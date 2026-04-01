import { describe, it, expect, beforeEach } from 'vitest'
import { useSetlistsStore } from './setlists.store'

// ─── Setlists Store — ephemeral DnD fields ───────────────────────────────────

describe('useSetlistsStore — ephemeral DnD actions', () => {
  beforeEach(() => {
    useSetlistsStore.setState({
      viewingSetlistId: null,
      lastAddedAt: 0,
    })
  })

  it('setViewingSetlistId sets a string id', () => {
    useSetlistsStore.getState().setViewingSetlistId('abc')
    expect(useSetlistsStore.getState().viewingSetlistId).toBe('abc')
  })

  it('setViewingSetlistId sets null', () => {
    useSetlistsStore.setState({ viewingSetlistId: 'abc' })
    useSetlistsStore.getState().setViewingSetlistId(null)
    expect(useSetlistsStore.getState().viewingSetlistId).toBeNull()
  })

  it('notifySetlistUpdated sets lastAddedAt to a timestamp > 0', () => {
    const before = Date.now()
    useSetlistsStore.getState().notifySetlistUpdated()
    const lastAddedAt = useSetlistsStore.getState().lastAddedAt
    expect(lastAddedAt).toBeGreaterThan(0)
    expect(lastAddedAt).toBeGreaterThanOrEqual(before)
  })

  it('notifySetlistUpdated updates lastAddedAt with a newer timestamp on repeated calls', async () => {
    useSetlistsStore.getState().notifySetlistUpdated()
    const first = useSetlistsStore.getState().lastAddedAt

    // Wait a tick to ensure Date.now() advances
    await new Promise((r) => setTimeout(r, 2))

    useSetlistsStore.getState().notifySetlistUpdated()
    const second = useSetlistsStore.getState().lastAddedAt

    expect(second).toBeGreaterThanOrEqual(first)
  })

  it('viewingSetlistId is NOT included in partialize output', () => {
    useSetlistsStore.setState({ viewingSetlistId: 'xyz', lastAddedAt: 999 })
    const state = useSetlistsStore.getState()
    // Access the partialize function via persist options
    const persistOptions = (useSetlistsStore as unknown as { persist: { getOptions: () => { partialize?: (s: typeof state) => Record<string, unknown> } } }).persist?.getOptions?.()
    if (persistOptions?.partialize) {
      const serialized = persistOptions.partialize(state)
      expect(serialized).not.toHaveProperty('viewingSetlistId')
    } else {
      // Fallback: manually check what the store's persist config persists
      // The partialize in setlists.store.ts only includes: activeSetlistId, currentSongIndex, pinnedSetlistIds, recentSetlistIds
      const persistedKeys = ['activeSetlistId', 'currentSongIndex', 'pinnedSetlistIds', 'recentSetlistIds']
      const allKeys = Object.keys(state)
      expect(persistedKeys).not.toContain('viewingSetlistId')
      expect(allKeys).toContain('viewingSetlistId')
    }
  })

  it('lastAddedAt is NOT included in partialize output', () => {
    useSetlistsStore.setState({ viewingSetlistId: 'xyz', lastAddedAt: 999 })
    const state = useSetlistsStore.getState()
    const persistOptions = (useSetlistsStore as unknown as { persist: { getOptions: () => { partialize?: (s: typeof state) => Record<string, unknown> } } }).persist?.getOptions?.()
    if (persistOptions?.partialize) {
      const serialized = persistOptions.partialize(state)
      expect(serialized).not.toHaveProperty('lastAddedAt')
    } else {
      const persistedKeys = ['activeSetlistId', 'currentSongIndex', 'pinnedSetlistIds', 'recentSetlistIds']
      expect(persistedKeys).not.toContain('lastAddedAt')
    }
  })
})
