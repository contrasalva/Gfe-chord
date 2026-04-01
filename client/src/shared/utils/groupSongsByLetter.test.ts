import { describe, it, expect } from 'vitest'
import { groupSongsByLetter } from './groupSongsByLetter'
import type { Song } from '../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSong(title: string, id = title): Song {
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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('groupSongsByLetter', () => {
  it('returns empty array for empty input', () => {
    expect(groupSongsByLetter([])).toEqual([])
  })

  it('groups songs by first letter, A-Z', () => {
    const songs = [
      makeSong('Blessed'),
      makeSong('Amazing Grace'),
      makeSong('Amazing Love'),
    ]
    const groups = groupSongsByLetter(songs)

    expect(groups.map((g) => g.letter)).toEqual(['A', 'B'])
    expect(groups[0].songs.map((s) => s.title)).toEqual(['Amazing Grace', 'Amazing Love'])
    expect(groups[1].songs.map((s) => s.title)).toEqual(['Blessed'])
  })

  it('normalizes first letter to uppercase', () => {
    const songs = [makeSong('amazing grace'), makeSong('Amazing Love')]
    const groups = groupSongsByLetter(songs)

    expect(groups).toHaveLength(1)
    expect(groups[0].letter).toBe('A')
    expect(groups[0].songs).toHaveLength(2)
  })

  it('groups numbers and symbols under "#"', () => {
    const songs = [
      makeSong('10,000 Reasons'),
      makeSong('1 Thing'),
      makeSong('#Blessed'),
    ]
    const groups = groupSongsByLetter(songs)

    expect(groups).toHaveLength(1)
    expect(groups[0].letter).toBe('#')
    expect(groups[0].songs).toHaveLength(3)
  })

  it('groups empty title under "#"', () => {
    const songs = [makeSong('')]
    const groups = groupSongsByLetter(songs)

    expect(groups[0].letter).toBe('#')
  })

  it('places "#" group last after A-Z letters', () => {
    const songs = [
      makeSong('10,000 Reasons'),
      makeSong('Zeal'),
      makeSong('Alpha'),
    ]
    const groups = groupSongsByLetter(songs)

    const letters = groups.map((g) => g.letter)
    expect(letters[letters.length - 1]).toBe('#')
    expect(letters[0]).toBe('A')
    expect(letters[1]).toBe('Z')
  })

  it('sorts songs within each group by title ascending', () => {
    const songs = [
      makeSong('Cornerstone'),
      makeSong('Come Now Is The Time'),
      makeSong('Christ Is Enough'),
    ]
    const groups = groupSongsByLetter(songs)

    expect(groups[0].songs.map((s) => s.title)).toEqual([
      'Christ Is Enough',
      'Come Now Is The Time',
      'Cornerstone',
    ])
  })

  it('handles accented characters correctly', () => {
    const songs = [makeSong('Ángel'), makeSong('Amor')]
    const groups = groupSongsByLetter(songs)

    // Both start with 'A' (Á normalizes to A group)
    const letterA = groups.find((g) => g.letter === 'A')
    expect(letterA).toBeDefined()
    expect(letterA!.songs).toHaveLength(2)
  })
})
