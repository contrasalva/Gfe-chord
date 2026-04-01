import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { useSongsStore } from './songs.store'
import { useSetlistsStore, MAX_RECENT_SETLISTS } from './setlists.store'
import type { SetlistRef } from './setlists.store'
import type { Song } from '../shared/types'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../features/songs/songs.service', () => ({
  songsService: {
    getAll: vi.fn(),
  },
}))

const { songsService } = await import('../features/songs/songs.service')

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSong(id: string, title: string): Song {
  return {
    id,
    title,
    artist: null,
    key: null,
    capo: 0,
    bpm: null,
    timeSignature: null,
    content: '',
    tags: [],
    createdById: 'user1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// ─── Songs Store ─────────────────────────────────────────────────────────────

describe('useSongsStore', () => {
  beforeEach(() => {
    useSongsStore.setState({
      songs: [],
      isLoading: false,
      error: null,
      searchQuery: '',
      searchResults: [],
      isSearching: false,
    })
    vi.clearAllMocks()
  })

  it('fetches songs and stores them', async () => {
    const mockSongs = [makeSong('1', 'Amazing Grace')]
    vi.mocked(songsService.getAll).mockResolvedValueOnce(mockSongs)

    await act(() => useSongsStore.getState().fetchSongs())

    expect(useSongsStore.getState().songs).toEqual(mockSongs)
    expect(useSongsStore.getState().isLoading).toBe(false)
  })

  it('does not refetch if songs already loaded (dedupe)', async () => {
    useSongsStore.setState({ songs: [makeSong('1', 'Song')] })

    await act(() => useSongsStore.getState().fetchSongs())

    expect(songsService.getAll).not.toHaveBeenCalled()
  })

  it('sets error on fetch failure', async () => {
    vi.mocked(songsService.getAll).mockRejectedValueOnce(new Error('Network error'))

    await act(() => useSongsStore.getState().fetchSongs())

    expect(useSongsStore.getState().error).toBeTruthy()
    expect(useSongsStore.getState().isLoading).toBe(false)
  })

  it('setSearchQuery updates query', () => {
    useSongsStore.getState().setSearchQuery('praise')
    expect(useSongsStore.getState().searchQuery).toBe('praise')
  })

  it('searchSongs fetches and stores results', async () => {
    const mockResults = [makeSong('2', 'Praise')]
    vi.mocked(songsService.getAll).mockResolvedValueOnce(mockResults)

    await act(() => useSongsStore.getState().searchSongs('praise'))

    expect(useSongsStore.getState().searchResults).toEqual(mockResults)
    expect(useSongsStore.getState().searchQuery).toBe('praise')
    expect(useSongsStore.getState().isSearching).toBe(false)
  })
})

// ─── Setlists Store — pin/unpin/recents ──────────────────────────────────────

function makeRef(id: string): SetlistRef {
  return { id, name: `Setlist ${id}` }
}

describe('useSetlistsStore — pinned/recent', () => {
  beforeEach(() => {
    useSetlistsStore.setState({
      pinnedSetlistIds: [],
      recentSetlistIds: [],
    })
  })

  it('pinSetlist adds ref', () => {
    useSetlistsStore.getState().pinSetlist(makeRef('s1'))
    const pinned = useSetlistsStore.getState().pinnedSetlistIds
    expect(pinned.some((p) => p.id === 's1')).toBe(true)
  })

  it('pinSetlist is idempotent', () => {
    useSetlistsStore.getState().pinSetlist(makeRef('s1'))
    useSetlistsStore.getState().pinSetlist(makeRef('s1'))
    expect(useSetlistsStore.getState().pinnedSetlistIds).toHaveLength(1)
  })

  it('unpinSetlist removes ref by id', () => {
    useSetlistsStore.setState({ pinnedSetlistIds: [makeRef('s1'), makeRef('s2')] })
    useSetlistsStore.getState().unpinSetlist('s1')
    const pinned = useSetlistsStore.getState().pinnedSetlistIds
    expect(pinned.map((p) => p.id)).toEqual(['s2'])
  })

  it('addRecentSetlist prepends (LIFO)', () => {
    useSetlistsStore.getState().addRecentSetlist(makeRef('s1'))
    useSetlistsStore.getState().addRecentSetlist(makeRef('s2'))
    expect(useSetlistsStore.getState().recentSetlistIds[0].id).toBe('s2')
  })

  it('addRecentSetlist dedupes — moves existing to front', () => {
    useSetlistsStore.setState({ recentSetlistIds: [makeRef('s1'), makeRef('s2'), makeRef('s3')] })
    useSetlistsStore.getState().addRecentSetlist(makeRef('s3'))
    const ids = useSetlistsStore.getState().recentSetlistIds.map((r) => r.id)
    expect(ids).toEqual(['s3', 's1', 's2'])
  })

  it(`addRecentSetlist caps at ${MAX_RECENT_SETLISTS}`, () => {
    for (let i = 1; i <= MAX_RECENT_SETLISTS + 2; i++) {
      useSetlistsStore.getState().addRecentSetlist(makeRef(`s${i}`))
    }
    expect(useSetlistsStore.getState().recentSetlistIds).toHaveLength(MAX_RECENT_SETLISTS)
  })
})
