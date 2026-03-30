import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Setlist } from '../shared/types'

// ─── State interface ────────────────────────────────────────────────────────

interface SetlistsState {
  // ── Persisted ─────────────────────────────────────────────────────────────
  activeSetlistId: string | null
  currentSongIndex: number

  // ── Ephemeral (NOT persisted) ─────────────────────────────────────────────
  /** songId → temporary transposition delta for the current session */
  sessionDeltas: Record<string, number>
  setlists: Setlist[]
  activeSetlist: Setlist | null
  isLoading: boolean
  error: string | null

  // ── Actions ───────────────────────────────────────────────────────────────
  setSetlists: (setlists: Setlist[]) => void
  setActiveSetlist: (setlist: Setlist) => void
  clearActiveSetlist: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  /** Navigate to a song by absolute index within the active setlist */
  moveSongIndex: (index: number) => void
  /** Move to previous song (no-op at start) */
  prevSong: () => void
  /** Move to next song (no-op at end) */
  nextSong: () => void

  /** Adjust the in-memory transposition delta for a song */
  setSessionDelta: (songId: string, delta: number) => void
  /** Increment session delta +1 for a song */
  incrementSessionDelta: (songId: string) => void
  /** Decrement session delta -1 for a song */
  decrementSessionDelta: (songId: string) => void
  /** Reset all session deltas (called when loading a new setlist) */
  resetSessionDeltas: () => void
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useSetlistsStore = create<SetlistsState>()(
  persist(
    (set, get) => ({
      // Persisted
      activeSetlistId: null,
      currentSongIndex: 0,

      // Ephemeral
      sessionDeltas: {},
      setlists: [],
      activeSetlist: null,
      isLoading: false,
      error: null,

      // ── Basic setters ────────────────────────────────────────────────────

      setSetlists: (setlists) => set({ setlists }),

      setActiveSetlist: (setlist) =>
        set({
          activeSetlist: setlist,
          activeSetlistId: setlist.id,
          currentSongIndex: 0,
          sessionDeltas: {}, // reset ephemeral deltas when entering a new setlist
        }),

      clearActiveSetlist: () =>
        set({
          activeSetlist: null,
          activeSetlistId: null,
          currentSongIndex: 0,
          sessionDeltas: {},
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      // ── Navigation ───────────────────────────────────────────────────────

      moveSongIndex: (index) => {
        const { activeSetlist } = get()
        const total = activeSetlist?.songs.length ?? 0
        if (total === 0) return
        const clamped = Math.max(0, Math.min(index, total - 1))
        set({ currentSongIndex: clamped })
      },

      prevSong: () => {
        const { currentSongIndex } = get()
        if (currentSongIndex <= 0) return
        set({ currentSongIndex: currentSongIndex - 1 })
      },

      nextSong: () => {
        const { activeSetlist, currentSongIndex } = get()
        const total = activeSetlist?.songs.length ?? 0
        if (currentSongIndex >= total - 1) return
        set({ currentSongIndex: currentSongIndex + 1 })
      },

      // ── Session deltas ───────────────────────────────────────────────────

      setSessionDelta: (songId, delta) =>
        set((state) => ({
          sessionDeltas: { ...state.sessionDeltas, [songId]: delta },
        })),

      incrementSessionDelta: (songId) =>
        set((state) => ({
          sessionDeltas: {
            ...state.sessionDeltas,
            [songId]: (state.sessionDeltas[songId] ?? 0) + 1,
          },
        })),

      decrementSessionDelta: (songId) =>
        set((state) => ({
          sessionDeltas: {
            ...state.sessionDeltas,
            [songId]: (state.sessionDeltas[songId] ?? 0) - 1,
          },
        })),

      resetSessionDeltas: () => set({ sessionDeltas: {} }),
    }),
    {
      name: 'gfe-chord-setlists',
      // Only persist navigation state — ephemeral data is intentionally excluded
      partialize: (state) => ({
        activeSetlistId: state.activeSetlistId,
        currentSongIndex: state.currentSongIndex,
      }),
    }
  )
)
