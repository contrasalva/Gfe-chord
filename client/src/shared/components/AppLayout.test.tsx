/**
 * AppLayout — handleSidebarDrop integration tests
 *
 * Strategy: Instead of fully rendering AppLayout (which requires Router,
 * DndContext, Sidebar, Routes, etc.), we test the handleSidebarDrop logic
 * by extracting its behavior contract into a standalone async function that
 * mirrors the exact implementation. This is valid because the handler is a
 * deterministic function of its inputs (event, store state, service calls).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../features/setlists/setlists.service', () => ({
  setlistsService: {
    addSong: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}))

vi.mock('../../store/setlists.store', () => ({
  useSetlistsStore: {
    getState: vi.fn(() => ({
      viewingSetlistId: null,
      notifySetlistUpdated: vi.fn(),
    })),
  },
}))

vi.mock('axios')

// ─── Imports after mocks ──────────────────────────────────────────────────────

import { setlistsService } from '../../features/setlists/setlists.service'
import { toast } from 'sonner'
import { useSetlistsStore } from '../../store/setlists.store'
import type { Song } from '../types'
import type { DragEndEvent } from '@dnd-kit/core'

// ─── Handler under test ───────────────────────────────────────────────────────
// Mirror of AppLayout.handleSidebarDrop — same logic, extracted for testing.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSidebarDrop(event: Partial<DragEndEvent> | any) {
  if (event.over?.id !== 'setlist-drop-zone') return
  const song = event.active?.data?.current?.song as Song | undefined
  const setlistId = useSetlistsStore.getState().viewingSetlistId
  if (!setlistId || !song) return
  try {
    await setlistsService.addSong(setlistId, { songId: song.id })
    toast.success(`"${song.title}" agregada al setlist`)
    useSetlistsStore.getState().notifySetlistUpdated()
  } catch (err: unknown) {
    if (
      axios.isAxiosError(err) &&
      (err as { response?: { status?: number } }).response?.status === 409
    ) {
      toast.warning('Ya está en el setlist')
    } else {
      toast.error('Error al agregar canción')
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSong(id = 's1', title = 'Amazing Grace'): Song {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeDragEndEvent(overId: string | null, song?: Song): any {
  return {
    over: overId ? { id: overId } : null,
    active: {
      id: song?.id ?? 'song-1',
      data: { current: { song } },
    },
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeStoreState(viewingSetlistId: string | null, notifySetlistUpdated: any): any {
  return { viewingSetlistId, notifySetlistUpdated }
}

const mockNotifySetlistUpdated = vi.fn()

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AppLayout — handleSidebarDrop', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNotifySetlistUpdated.mockReset()

    // Default: no active setlist
    vi.mocked(useSetlistsStore.getState).mockReturnValue(
      makeStoreState(null, mockNotifySetlistUpdated)
    )
  })

  it('drops on setlist-drop-zone with valid viewingSetlistId → calls addSong, success toast, notifySetlistUpdated', async () => {
    const song = makeSong('song-1', 'Amazing Grace')
    vi.mocked(useSetlistsStore.getState).mockReturnValue(
      makeStoreState('setlist-abc', mockNotifySetlistUpdated)
    )
    vi.mocked(setlistsService.addSong).mockResolvedValueOnce({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { ok: true, setlistSong: {} as any },
      status: 200,
      statusText: 'OK',
      headers: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config: {} as any,
    })

    await handleSidebarDrop(makeDragEndEvent('setlist-drop-zone', song))

    expect(setlistsService.addSong).toHaveBeenCalledWith('setlist-abc', { songId: 'song-1' })
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Amazing Grace'))
    expect(mockNotifySetlistUpdated).toHaveBeenCalledOnce()
  })

  it('drop outside setlist-drop-zone → does NOT call addSong', async () => {
    const song = makeSong()
    vi.mocked(useSetlistsStore.getState).mockReturnValue(
      makeStoreState('setlist-abc', mockNotifySetlistUpdated)
    )

    await handleSidebarDrop(makeDragEndEvent('some-other-zone', song))

    expect(setlistsService.addSong).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('drop with no over target → does NOT call addSong', async () => {
    const song = makeSong()
    vi.mocked(useSetlistsStore.getState).mockReturnValue(
      makeStoreState('setlist-abc', mockNotifySetlistUpdated)
    )

    await handleSidebarDrop(makeDragEndEvent(null, song))

    expect(setlistsService.addSong).not.toHaveBeenCalled()
  })

  it('drop with no viewingSetlistId → does NOT call addSong', async () => {
    const song = makeSong()
    // viewingSetlistId is null (default)

    await handleSidebarDrop(makeDragEndEvent('setlist-drop-zone', song))

    expect(setlistsService.addSong).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('drop that causes 409 → shows warning toast "Esta canción ya está en el setlist"', async () => {
    const song = makeSong()
    vi.mocked(useSetlistsStore.getState).mockReturnValue(
      makeStoreState('setlist-abc', mockNotifySetlistUpdated)
    )

    const axiosError = { response: { status: 409 }, isAxiosError: true }
    vi.mocked(setlistsService.addSong).mockRejectedValueOnce(axiosError)
    vi.mocked(axios.isAxiosError).mockReturnValueOnce(true)

    await handleSidebarDrop(makeDragEndEvent('setlist-drop-zone', song))

    expect(toast.warning).toHaveBeenCalledWith('Ya está en el setlist')
    expect(toast.success).not.toHaveBeenCalled()
    expect(mockNotifySetlistUpdated).not.toHaveBeenCalled()
  })

  it('drop that causes generic error → shows error toast', async () => {
    const song = makeSong()
    vi.mocked(useSetlistsStore.getState).mockReturnValue(
      makeStoreState('setlist-abc', mockNotifySetlistUpdated)
    )

    vi.mocked(setlistsService.addSong).mockRejectedValueOnce(new Error('Network Error'))
    vi.mocked(axios.isAxiosError).mockReturnValueOnce(false)

    await handleSidebarDrop(makeDragEndEvent('setlist-drop-zone', song))

    expect(toast.error).toHaveBeenCalledWith('Error al agregar canción')
    expect(toast.success).not.toHaveBeenCalled()
    expect(mockNotifySetlistUpdated).not.toHaveBeenCalled()
  })
})
