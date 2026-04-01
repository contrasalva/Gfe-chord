import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AlphabeticAccordion from './AlphabeticAccordion'
import type { SongGroup } from '../utils/groupSongsByLetter'
import type { Song } from '../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  compact = false
) {
  return render(
    <MemoryRouter>
      <AlphabeticAccordion
        groups={groups}
        onSongClick={onSongClick}
        compact={compact}
      />
    </MemoryRouter>
  )
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
