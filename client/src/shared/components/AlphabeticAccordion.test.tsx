import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AlphabeticAccordion from './AlphabeticAccordion'
import type { SongGroup } from '../utils/groupSongsByLetter'
import type { Song } from '../types'

// ─── DnD Kit mock ─────────────────────────────────────────────────────────────
// Mock useDraggable to avoid needing a real DndContext in most tests.
// The mock is defined at module level and overridden in drag-specific suites.

const mockSetNodeRef = vi.fn()

vi.mock('@dnd-kit/core', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useDraggable: vi.fn(() => ({
    attributes: {} as any,
    listeners: {},
    setNodeRef: mockSetNodeRef,
    isDragging: false,
    transform: null,
    node: { current: null },
    over: null,
    active: null,
  })),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Import the mocked useDraggable so we can control its return value in drag tests
import { useDraggable } from '@dnd-kit/core'

function makeSong(id: string, title: string): Song {
  return {
    id,
    title,
    artist: 'Artist',
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

const groups: SongGroup[] = [
  {
    letter: 'A',
    songs: [makeSong('a1', 'Amazing Grace'), makeSong('a2', 'Alpha & Omega')],
  },
  {
    letter: 'B',
    songs: [makeSong('b1', 'Blessed Assurance')],
  },
]

function renderAccordion(
  onSongClick = vi.fn(),
  compact = false,
  draggable = false
) {
  return render(
    <MemoryRouter>
      <AlphabeticAccordion
        groups={groups}
        onSongClick={onSongClick}
        compact={compact}
        draggable={draggable}
      />
    </MemoryRouter>
  )
}

/** Expand letter A so SongRow items are in the DOM */
function expandA() {
  fireEvent.click(screen.getByRole('button', { name: /^A/ }))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AlphabeticAccordion', () => {
  it('renders letter headers', () => {
    renderAccordion()
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('starts with all groups closed (songs not visible)', () => {
    renderAccordion()
    expect(screen.queryByText('Amazing Grace')).not.toBeInTheDocument()
    expect(screen.queryByText('Blessed Assurance')).not.toBeInTheDocument()
  })

  it('expands a group on click', () => {
    renderAccordion()
    fireEvent.click(screen.getByRole('button', { name: /^A/ }))
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
  })

  it('collapses an expanded group on second click', () => {
    renderAccordion()
    const header = screen.getByRole('button', { name: /^A/ })
    fireEvent.click(header)
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    fireEvent.click(header)
    expect(screen.queryByText('Amazing Grace')).not.toBeInTheDocument()
  })

  it('toggles independently — opening B does not affect A', () => {
    renderAccordion()
    fireEvent.click(screen.getByRole('button', { name: /^A/ }))
    fireEvent.click(screen.getByRole('button', { name: /^B/ }))
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    expect(screen.getByText('Blessed Assurance')).toBeInTheDocument()
  })

  it('calls onSongClick when a song is clicked', () => {
    const onSongClick = vi.fn()
    renderAccordion(onSongClick)
    fireEvent.click(screen.getByRole('button', { name: /^A/ }))
    fireEvent.click(screen.getByText('Amazing Grace'))
    expect(onSongClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a1', title: 'Amazing Grace' })
    )
  })

  it('keyboard: Enter on header expands group', () => {
    renderAccordion()
    const header = screen.getByRole('button', { name: /^A/ })
    fireEvent.keyDown(header, { key: 'Enter' })
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
  })

  it('keyboard: Space on header expands group', () => {
    renderAccordion()
    const header = screen.getByRole('button', { name: /^A/ })
    fireEvent.keyDown(header, { key: ' ' })
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
  })

  it('compact variant renders without artist info', () => {
    renderAccordion(vi.fn(), true)
    fireEvent.click(screen.getByRole('button', { name: /^A/ }))
    // artist should not be visible in compact mode
    expect(screen.queryByText('Artist')).not.toBeInTheDocument()
  })

  it('renders empty state when groups is empty', () => {
    render(
      <MemoryRouter>
        <AlphabeticAccordion groups={[]} onSongClick={vi.fn()} />
      </MemoryRouter>
    )
    expect(screen.getByText(/no hay canciones/i)).toBeInTheDocument()
  })
})

// ─── Drag behavior tests ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeDraggableMock = (isDragging = false): any => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes: {} as any,
  listeners: {},
  setNodeRef: mockSetNodeRef,
  isDragging,
  transform: null,
  node: { current: null },
  over: null,
  active: null,
})

describe('AlphabeticAccordion — draggable prop', () => {
  beforeEach(() => {
    vi.mocked(useDraggable).mockReturnValue(makeDraggableMock())
  })

  it('draggable=false (default): SongRow renders without opacity-50', () => {
    renderAccordion(vi.fn(), false, false)
    expandA()
    const rows = screen.getAllByRole('button', { name: /Amazing Grace|Alpha/i })
    rows.forEach((row) => {
      expect(row.className).not.toContain('opacity-50')
    })
  })

  it('draggable=false: useDraggable is called with disabled=true', () => {
    renderAccordion(vi.fn(), false, false)
    expandA()
    // useDraggable should have been called with disabled: true for each song
    expect(useDraggable).toHaveBeenCalledWith(
      expect.objectContaining({ disabled: true })
    )
  })

  it('draggable=true: useDraggable is called with disabled=false', () => {
    renderAccordion(vi.fn(), false, true)
    expandA()
    expect(useDraggable).toHaveBeenCalledWith(
      expect.objectContaining({ disabled: false })
    )
  })

  it('draggable=true: SongRow renders without opacity-50 when not dragging', () => {
    renderAccordion(vi.fn(), false, true)
    expandA()
    const rows = screen.getAllByRole('button', { name: /Amazing Grace|Alpha/i })
    rows.forEach((row) => {
      expect(row.className).not.toContain('opacity-50')
    })
  })

  it('draggable=true: SongRow has opacity-50 when isDragging=true', () => {
    vi.mocked(useDraggable).mockReturnValue(makeDraggableMock(true))

    renderAccordion(vi.fn(), false, true)
    expandA()

    // At least one row should have opacity-50 when isDragging is true
    const rows = screen.getAllByRole('button', { name: /Amazing Grace|Alpha/i })
    const draggingRow = rows.find((row) => row.className.includes('opacity-50'))
    expect(draggingRow).toBeDefined()
  })

  it('draggable=true: SongRow data includes song reference', () => {
    renderAccordion(vi.fn(), false, true)
    expandA()
    expect(useDraggable).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ song: expect.objectContaining({ id: 'a1' }) }),
      })
    )
  })
})
