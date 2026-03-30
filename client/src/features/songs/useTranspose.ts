import { useState } from 'react'

// Todas las notas en orden cromático (dos representaciones para enarmónicos)
const NOTES = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F',
  'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
]

// Índice canónico: normaliza enarmónicos al sostenido (#)
const NOTE_INDEX: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11,
}

// Escala cromática canónica (12 notas con sostenidos)
const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// Notas que se representan preferentemente con bemol
const PREFER_FLAT = new Set(['Db', 'Eb', 'Gb', 'Ab', 'Bb'])

/**
 * Transpone una nota raíz N semitonos arriba (positivo) o abajo (negativo).
 * Preserva la preferencia bemol/sostenido según el contexto original.
 */
function transposeNote(note: string, semitones: number, preferFlat: boolean): string {
  const index = NOTE_INDEX[note]
  if (index === undefined) return note

  const newIndex = ((index + semitones) % 12 + 12) % 12
  const sharpNote = CHROMATIC[newIndex]

  if (preferFlat) {
    // Buscar equivalente bemol
    const flatEquivalent = NOTES.find(
      (n) => n.includes('b') && NOTE_INDEX[n] === newIndex
    )
    return flatEquivalent ?? sharpNote
  }

  return sharpNote
}

/**
 * Transpone un acorde completo N semitonos.
 * Soporta: Am, Cmaj7, Dm7, G#m, Bb, C/G, Am7/E, etc.
 */
function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord

  // Regex para capturar: nota raíz (con # o b) + modificadores + bajo opcional
  // Ejemplo: "C#m7/G#" → root="C#", modifier="m7", bass="G#"
  const chordRegex = /^([A-G][#b]?)([^/]*)(?:\/([A-G][#b]?))?$/
  const match = chordRegex.exec(chord)
  if (!match) return chord

  const [, root, modifier, bass] = match

  const preferFlat = PREFER_FLAT.has(root)
  const newRoot = transposeNote(root, semitones, preferFlat)

  if (bass) {
    const bassPreferFlat = PREFER_FLAT.has(bass)
    const newBass = transposeNote(bass, semitones, bassPreferFlat)
    return `${newRoot}${modifier}/${newBass}`
  }

  return `${newRoot}${modifier}`
}

// Re-export for use in ChordRenderer
export { transposeChord }

interface UseTransposeReturn {
  semitones: number
  transpose: (chord: string) => string
  increment: () => void
  decrement: () => void
  reset: () => void
}

export function useTranspose(_originalKey?: string | null): UseTransposeReturn {
  const [semitones, setSemitones] = useState(0)

  const transpose = (chord: string) => transposeChord(chord, semitones)

  const increment = () => setSemitones((s) => s + 1)
  const decrement = () => setSemitones((s) => s - 1)
  const reset = () => setSemitones(0)

  return { semitones, transpose, increment, decrement, reset }
}
