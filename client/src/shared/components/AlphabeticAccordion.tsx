import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { Song } from '../types'
import type { SongGroup } from '../utils/groupSongsByLetter'

// ─── Letter color palette ─────────────────────────────────────────────────────
// 27 colores (A-Z + #) derivados de la paleta del proyecto.
// Familias: vino (#754456), lila (#515486), y complementarios que armonizan
// con el fondo oscuro #1F211F.

const LETTER_COLORS: Record<string, string> = {
  A: '#754456', // vino — primary
  B: '#515486', // lila — accent
  C: '#7B6BA8', // lila medio
  D: '#C0556A', // rosa fuerte
  E: '#4A7FA5', // azul acero
  F: '#8B4568', // vino oscuro
  G: '#5B8A6F', // verde salvia
  H: '#A0567A', // rosa oscuro
  I: '#4E7E9C', // azul grisáceo
  J: '#9B6B3A', // ocre cálido
  K: '#6B5B8A', // lila oscuro
  L: '#3D8A7A', // teal
  M: '#B05070', // rosa primario
  N: '#5A6E9E', // azul periwinkle
  O: '#A06040', // terracota
  P: '#6A4E8A', // púrpura
  Q: '#4A8A60', // verde esmeralda
  R: '#9A4050', // rojo oscuro
  S: '#4A6EA0', // azul medio
  T: '#7A5590', // violeta
  U: '#C06050', // coral
  V: '#3A7A8A', // cian profundo
  W: '#8A6A3A', // dorado oscuro
  X: '#5A8050', // verde musgo
  Y: '#A05080', // magenta suave
  Z: '#4A5A9A', // índigo
  '#': '#707870', // gris neutro para símbolos/números
}

function getLetterColor(letter: string): string {
  return LETTER_COLORS[letter] ?? '#754456'
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface AlphabeticAccordionProps {
  groups: SongGroup[]
  onSongClick: (song: Song) => void
  compact?: boolean
}

// ─── Letter Header ────────────────────────────────────────────────────────────

interface LetterHeaderProps {
  letter: string
  songCount: number
  isExpanded: boolean
  onToggle: () => void
  compact: boolean
}

function LetterHeader({ letter, songCount, isExpanded, onToggle, compact }: LetterHeaderProps) {
  const color = getLetterColor(letter)

  return (
    <button
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      className={`
        w-full flex items-center gap-3
        border-b border-[#353835]
        transition-colors duration-200 cursor-pointer
        ${isExpanded ? 'bg-[#272A27]' : 'hover:bg-[#242624]'}
        ${compact ? 'px-2 py-1.5 min-h-[44px]' : 'px-3 py-2 min-h-[44px]'}
      `}
      aria-expanded={isExpanded}
      aria-label={`${letter} — ${songCount} ${songCount === 1 ? 'canción' : 'canciones'}`}
    >
      {/* Pastilla de color estilo OneNote */}
      <span
        className={`shrink-0 rounded-sm ${compact ? 'w-[4px] h-[28px]' : 'w-[5px] h-[32px]'}`}
        style={{ backgroundColor: color }}
      />

      {/* Letra */}
      <span
        className={`font-bold leading-none ${compact ? 'text-sm' : 'text-base'}`}
        style={{ color }}
      >
        {letter}
      </span>

      {/* Contador */}
      <span className={`text-[#707870] ${compact ? 'text-[10px]' : 'text-xs'}`}>
        {songCount}
      </span>

      {/* Chevron alineado a la derecha */}
      <span className="ml-auto">
        {isExpanded ? (
          <ChevronDown size={compact ? 12 : 14} className="text-[#707870]" />
        ) : (
          <ChevronRight size={compact ? 12 : 14} className="text-[#707870]" />
        )}
      </span>
    </button>
  )
}

// ─── Song Row ─────────────────────────────────────────────────────────────────

interface SongRowProps {
  song: Song
  onSongClick: (song: Song) => void
  compact: boolean
}

function SongRow({ song, onSongClick, compact }: SongRowProps) {
  return (
    <button
      onClick={() => onSongClick(song)}
      className={`
        w-full flex items-center justify-between
        border-b border-[#353835] last:border-b-0
        hover:bg-[#2A2D2A] transition-colors duration-200 cursor-pointer text-left
        ${compact ? 'px-3 py-2.5 min-h-[44px]' : 'px-4 py-2.5 min-h-[44px]'}
      `}
    >
      <div className="flex-1 min-w-0">
        <p
          className={`font-medium truncate text-[#E0E1E3] ${compact ? 'text-xs' : 'text-sm'}`}
        >
          {song.title}
        </p>
        {!compact && song.artist && (
          <p className="text-xs mt-0.5 truncate text-[#B1B3B1]">
            {song.artist}
          </p>
        )}
      </div>

      {!compact && song.key && (
        <span
          className="font-mono text-xs font-medium px-1.5 py-0.5 rounded
                     border border-[#454845] text-[#515486] bg-[#1F211F] shrink-0 ml-2"
        >
          {song.key}
        </span>
      )}
    </button>
  )
}

// ─── AlphabeticAccordion ─────────────────────────────────────────────────────

export default function AlphabeticAccordion({
  groups,
  onSongClick,
  compact = false,
}: AlphabeticAccordionProps) {
  // All closed by default
  const [expandedLetters, setExpandedLetters] = useState<Set<string>>(new Set())

  const toggle = (letter: string) => {
    setExpandedLetters((prev) => {
      const next = new Set(prev)
      if (next.has(letter)) {
        next.delete(letter)
      } else {
        next.add(letter)
      }
      return next
    })
  }

  if (groups.length === 0) {
    return (
      <p className={`text-[#B1B3B1] text-center py-4 ${compact ? 'text-xs' : 'text-sm'}`}>
        No hay canciones
      </p>
    )
  }

  return (
    <div className="w-full">
      {groups.map((group) => {
        const isExpanded = expandedLetters.has(group.letter)

        return (
          <div key={group.letter}>
            <LetterHeader
              letter={group.letter}
              songCount={group.songs.length}
              isExpanded={isExpanded}
              onToggle={() => toggle(group.letter)}
              compact={compact}
            />

            {isExpanded && (
              <div className="bg-[#1A1C1A]">
                {group.songs.map((song) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    onSongClick={onSongClick}
                    compact={compact}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
