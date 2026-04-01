import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockSetViewingSetlistId = vi.fn()
const mockNotifySetlistUpdated = vi.fn()
const mockSetDropRef = vi.fn()

// Droppable mock — default: isOver=false
let mockIsOver = false

vi.mock('@dnd-kit/core', () => ({
  useDroppable: vi.fn(() => ({
    setNodeRef: mockSetDropRef,
    isOver: mockIsOver,
  })),
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PointerSensor: vi.fn(),
  TouchSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  closestCenter: vi.fn(),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  })),
  arrayMove: vi.fn((arr: unknown[]) => arr),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn(() => '') } },
}))

vi.mock('../../store/setlists.store', () => ({
  useSetlistsStore: vi.fn(() => ({
    setActiveSetlist: vi.fn(),
    moveSongIndex: vi.fn(),
    addRecentSetlist: vi.fn(),
    pinnedSetlistIds: [],
    pinSetlist: vi.fn(),
    unpinSetlist: vi.fn(),
    setViewingSetlistId: mockSetViewingSetlistId,
    lastAddedAt: 0,
  })),
}))

vi.mock('../../store/auth.store', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'u1', name: 'Test', email: 'test@test.com', role: 'ADMIN' },
  })),
}))

vi.mock('./setlists.service', () => ({
  setlistsService: {
    getById: vi.fn(),
    reorderSongs: vi.fn(),
    removeSong: vi.fn(),
    patchSong: vi.fn(),
    delete: vi.fn(),
    addSong: vi.fn(),
  },
}))

vi.mock('./AddSongModal', () => ({
  default: () => <div data-testid="add-song-modal" />,
}))

vi.mock('./ShareModal', () => ({
  default: () => <div data-testid="share-modal" />,
}))

vi.mock('../songs/useTranspose', () => ({
  transposeChord: vi.fn((key: string) => key),
}))

// ─── Imports after mocks ──────────────────────────────────────────────────────

import { useDroppable } from '@dnd-kit/core'
import { useSetlistsStore } from '../../store/setlists.store'
import { setlistsService } from './setlists.service'
import SetlistDetailPage from './SetlistDetailPage'
import type { Setlist } from '../../shared/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSetlist(id = 'setlist-1'): Setlist {
  return {
    id,
    name: 'My Setlist',
    serviceDate: null,
    createdById: 'u1',
    songs: [],
    shares: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function renderPage(id = 'setlist-1') {
  return render(
    <MemoryRouter initialEntries={[`/setlists/${id}`]}>
      <Routes>
        <Route path="/setlists/:id" element={<SetlistDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SetlistDetailPage — droppable registration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOver = false
    vi.mocked(useDroppable).mockReturnValue({
      setNodeRef: mockSetDropRef,
      isOver: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    vi.mocked(setlistsService.getById).mockResolvedValue({
      data: { ok: true, setlist: makeSetlist() },
      status: 200,
      statusText: 'OK',
      headers: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config: {} as any,
    })
  })

  it('calls useDroppable with "setlist-drop-zone"', async () => {
    await act(async () => {
      renderPage()
    })
    expect(useDroppable).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'setlist-drop-zone' })
    )
  })

  it('on mount: calls setViewingSetlistId with the setlist id from URL params', async () => {
    await act(async () => {
      renderPage('setlist-42')
    })
    expect(mockSetViewingSetlistId).toHaveBeenCalledWith('setlist-42')
  })

  it('on unmount: calls setViewingSetlistId(null)', async () => {
    let unmount!: () => void
    await act(async () => {
      const result = renderPage('setlist-42')
      unmount = result.unmount
    })
    mockSetViewingSetlistId.mockClear()
    act(() => {
      unmount()
    })
    expect(mockSetViewingSetlistId).toHaveBeenCalledWith(null)
  })

  it('when isOver=false: main element does NOT have ring class', async () => {
    vi.mocked(useDroppable).mockReturnValue({
      setNodeRef: mockSetDropRef,
      isOver: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await act(async () => {
      renderPage()
    })

    // The <main> element that uses setDropRef should not have ring-2 class
    const mainEl = document.querySelector('main')
    expect(mainEl?.className).not.toContain('ring-2')
  })

  it('when isOver=true: main element has ring/highlight class', async () => {
    vi.mocked(useDroppable).mockReturnValue({
      setNodeRef: mockSetDropRef,
      isOver: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await act(async () => {
      renderPage()
    })

    const mainEl = document.querySelector('main')
    expect(mainEl?.className).toContain('ring-2')
  })
})

describe('SetlistDetailPage — lastAddedAt reload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useDroppable).mockReturnValue({
      setNodeRef: mockSetDropRef,
      isOver: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  })

  it('when lastAddedAt=0: does NOT trigger an extra loadSetlist beyond the initial one', async () => {
    vi.mocked(useSetlistsStore).mockReturnValue({
      setActiveSetlist: vi.fn(),
      moveSongIndex: vi.fn(),
      addRecentSetlist: vi.fn(),
      pinnedSetlistIds: [],
      pinSetlist: vi.fn(),
      unpinSetlist: vi.fn(),
      setViewingSetlistId: mockSetViewingSetlistId,
      lastAddedAt: 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    vi.mocked(setlistsService.getById).mockResolvedValue({
      data: { ok: true, setlist: makeSetlist() },
      status: 200,
      statusText: 'OK',
      headers: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config: {} as any,
    })

    await act(async () => {
      renderPage()
    })

    // Only 1 call: the initial load (lastAddedAt=0 doesn't trigger reload)
    expect(setlistsService.getById).toHaveBeenCalledTimes(1)
  })

  it('when lastAddedAt > 0: loadSetlist is called again', async () => {
    vi.mocked(useSetlistsStore).mockReturnValue({
      setActiveSetlist: vi.fn(),
      moveSongIndex: vi.fn(),
      addRecentSetlist: vi.fn(),
      pinnedSetlistIds: [],
      pinSetlist: vi.fn(),
      unpinSetlist: vi.fn(),
      setViewingSetlistId: mockSetViewingSetlistId,
      lastAddedAt: Date.now(), // > 0 triggers reload
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    vi.mocked(setlistsService.getById).mockResolvedValue({
      data: { ok: true, setlist: makeSetlist() },
      status: 200,
      statusText: 'OK',
      headers: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config: {} as any,
    })

    await act(async () => {
      renderPage()
    })

    // 2 calls: initial load + reload triggered by lastAddedAt > 0
    expect(setlistsService.getById).toHaveBeenCalledTimes(2)
  })
})
