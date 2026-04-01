import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Setlist } from '../shared/types'

// ─── Constants ───────────────────────────────────────────────────────────────

export const MAX_RECENT_SETLISTS = 5

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SetlistRef {
  id: string
  name: string
}

// ─── State interface ────────────────────────────────────────────────────────

interface SetlistsState {
  // ── Persisted ─────────────────────────────────────────────────────────────
  activeSetlistId: string | null
  currentSongIndex: number
  pinnedSetlistIds: SetlistRef[]
  recentSetlistIds: SetlistRef[]

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

  /** Pin a setlist by id+name (idempotent) */
  pinSetlist: (ref: SetlistRef) => void
  /** Unpin a setlist by id */
  unpinSetlist: (id: string) => void
  /** Add a setlist to recents — LIFO, max 5, deduped */
  addRecentSetlist: (ref: SetlistRef) => void
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useSetlistsStore = create<SetlistsState>()(
  persist(
    (set, get) => ({
      // Persisted
      activeSetlistId: null,
      currentSongIndex: 0,
      pinnedSetlistIds: [],
      recentSetlistIds: [],

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

      // ── Pinned / Recent setlists ─────────────────────────────────────────

      pinSetlist: (ref) =>
        set((state) => ({
          pinnedSetlistIds: state.pinnedSetlistIds.some((p) => p.id === ref.id)
            ? state.pinnedSetlistIds
            : [...state.pinnedSetlistIds, ref],
        })),

      unpinSetlist: (id) =>
        set((state) => ({
          pinnedSetlistIds: state.pinnedSetlistIds.filter((p) => p.id !== id),
        })),

      addRecentSetlist: (ref) =>
        set((state) => {
          // Remove existing entry (dedupe), prepend, cap at MAX_RECENT_SETLISTS
          const filtered = state.recentSetlistIds.filter((r) => r.id !== ref.id)
          return {
            recentSetlistIds: [ref, ...filtered].slice(0, MAX_RECENT_SETLISTS),
          }
        }),
    }),
    {
      name: 'gfe-chord-setlists',
      // Only persist navigation state — ephemeral data is intentionally excluded
      partialize: (state) => ({
        activeSetlistId: state.activeSetlistId,
        currentSongIndex: state.currentSongIndex,
        pinnedSetlistIds: state.pinnedSetlistIds,
        recentSetlistIds: state.recentSetlistIds,
      }),
    }
  )
)
