import type { Song } from '../types'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SongGroup {
  letter: string
  songs: Song[]
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Groups an array of songs alphabetically by the first letter of their title.
 *
 * - Letter = title[0].toUpperCase()
 * - Titles that start with a number, symbol, or are empty → grouped under '#'
 * - Ordered: A–Z first, '#' always last
 * - Within each group: songs sorted by title ascending (locale-aware)
 */
export function groupSongsByLetter(songs: Song[]): SongGroup[] {
  const SPECIAL = '#'

  const map = new Map<string, Song[]>()

  for (const song of songs) {
    const firstChar = song.title?.charAt(0) ?? ''
    // Normalize accented chars: Á → A, É → E, etc.
    const normalized = firstChar.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase()
    const isAlpha = /^[A-Z]$/.test(normalized)
    const letter = isAlpha ? normalized : SPECIAL

    const bucket = map.get(letter) ?? []
    bucket.push(song)
    map.set(letter, bucket)
  }

  // Sort songs within each group
  for (const [, bucket] of map) {
    bucket.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    )
  }

  // Extract and sort group keys: A-Z first, '#' last
  const letters = Array.from(map.keys()).sort((a, b) => {
    if (a === SPECIAL) return 1
    if (b === SPECIAL) return -1
    return a.localeCompare(b)
  })

  return letters.map((letter) => ({
    letter,
    songs: map.get(letter)!,
  }))
}
