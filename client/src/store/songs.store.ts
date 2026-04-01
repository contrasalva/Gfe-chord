import { create } from 'zustand'
import { songsService } from '../features/songs/songs.service'
import type { Song } from '../shared/types'

// ─── State interface ─────────────────────────────────────────────────────────

interface SongsState {
  // ── Data ──────────────────────────────────────────────────────────────────
  songs: Song[]
  isLoading: boolean
  error: string | null

  // ── Search ────────────────────────────────────────────────────────────────
  searchQuery: string
  searchResults: Song[]
  isSearching: boolean

  // ── Actions ───────────────────────────────────────────────────────────────
  fetchSongs: () => Promise<void>
  setSearchQuery: (query: string) => void
  searchSongs: (query: string) => Promise<void>
}

// ─── Store (ephemeral — NOT persisted) ───────────────────────────────────────

export const useSongsStore = create<SongsState>()((set, get) => ({
  songs: [],
  isLoading: false,
  error: null,

  searchQuery: '',
  searchResults: [],
  isSearching: false,

  fetchSongs: async () => {
    // Dedupe: skip if already loading or data is fresh
    const { isLoading, songs } = get()
    if (isLoading || songs.length > 0) return

    set({ isLoading: true, error: null })

    try {
      const data = await songsService.getAll()
      set({ songs: data, isLoading: false })
    } catch {
      set({ error: 'No se pudieron cargar las canciones', isLoading: false })
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  searchSongs: async (query: string) => {
    set({ searchQuery: query, isSearching: true, error: null })

    try {
      const data = await songsService.getAll(query ? { search: query } : undefined)
      set({ searchResults: data, isSearching: false })
    } catch {
      set({ error: 'No se pudieron buscar canciones', isSearching: false })
    }
  },
}))
