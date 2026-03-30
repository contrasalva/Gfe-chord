import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'
import { setlistsService } from './setlists.service'
import { useSetlistsStore } from '../../store/setlists.store'
import ChordRenderer from '../songs/ChordRenderer'
import { transposeChord } from '../songs/useTranspose'
import type { Setlist } from '../../shared/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeDisplayKey(
  originalKey: string | null | undefined,
  offset: number
): string | null {
  if (!originalKey) return null
  if (offset === 0) return originalKey
  return transposeChord(originalKey, offset)
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PresentationSkeleton() {
  return (
    <div className="animate-pulse px-4 pt-4 space-y-3">
      <div className="h-5 bg-[#353835] rounded w-2/3" />
      <div className="h-8 bg-[#353835] rounded mt-4" />
      <div className="space-y-2 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-[#353835] rounded"
            style={{ width: `${50 + (i % 4) * 15}%` }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Main Page — No bottom nav ─────────────────────────────────────────────────

export default function SetlistSongPage() {
  const { id, index: indexParam } = useParams<{ id: string; index: string }>()
  const navigate = useNavigate()

  const {
    activeSetlist,
    currentSongIndex,
    sessionDeltas,
    setActiveSetlist,
    moveSongIndex,
    incrementSessionDelta,
    decrementSessionDelta,
  } = useSetlistsStore()

  const [setlist, setSetlist] = useState<Setlist | null>(activeSetlist)
  const [loading, setLoading] = useState(!activeSetlist)

  // Parse index from URL
  const urlIndex = parseInt(indexParam ?? '0', 10)

  // Sync URL index to store on mount
  useEffect(() => {
    if (!isNaN(urlIndex)) {
      moveSongIndex(urlIndex)
    }
  }, []) // Only on mount

  // Load setlist if not already in store
  useEffect(() => {
    if (activeSetlist?.id === id) {
      setSetlist(activeSetlist)
      setLoading(false)
      return
    }

    if (!id) return
    setLoading(true)

    setlistsService
      .getById(id)
      .then(({ data }) => {
        setSetlist(data.setlist)
        setActiveSetlist(data.setlist)
      })
      .catch(() => {
        // Handle silently — will show nothing
      })
      .finally(() => setLoading(false))
  }, [id])

  // Sync store's active setlist into local state when it updates
  useEffect(() => {
    if (activeSetlist) {
      setSetlist(activeSetlist)
    }
  }, [activeSetlist])

  // Navigate when currentSongIndex changes (after prev/next)
  const handleNavigate = (newIndex: number) => {
    moveSongIndex(newIndex)
    navigate(`/setlists/${id}/songs/${newIndex}`, { replace: true })
  }

  const handlePrev = () => {
    if (currentSongIndex <= 0) return
    handleNavigate(currentSongIndex - 1)
  }

  const handleNext = () => {
    const total = setlist?.songs.length ?? 0
    if (currentSongIndex >= total - 1) return
    handleNavigate(currentSongIndex + 1)
  }

  // ── Current song data ──────────────────────────────────────────────────────

  const songs = setlist?.songs ?? []
  const total = songs.length
  const currentSong = songs[currentSongIndex]

  // Dual transposition: DB base + in-memory session delta
  const transposeOffset = currentSong?.transposeOffset ?? 0
  const sessionDelta = currentSong ? (sessionDeltas[currentSong.songId] ?? 0) : 0
  const finalOffset = transposeOffset + sessionDelta

  const displayKey = currentSong
    ? computeDisplayKey(currentSong.song.key, finalOffset)
    : null

  const transposeFn = (chord: string) => transposeChord(chord, finalOffset)

  // ── Keyboard navigation ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') handleNext()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') handlePrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentSongIndex, total])

  // ─────────────────────────────────────────────────────────────────────────
  // NOTE: This page has NO bottom nav — full screen for presentation mode
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-svh" style={{ backgroundColor: '#1F211F' }}>
      {/* Sticky header with nav + transpositor */}
      <header
        className="sticky top-0 z-10 px-2 py-2 flex items-center gap-1
                   border-b border-[#3A3D3A]"
        style={{ backgroundColor: 'rgba(31,33,31,0.95)', backdropFilter: 'blur(8px)' }}
      >
        {/* Back to setlist */}
        <button
          onClick={() => navigate(`/setlists/${id}`)}
          className="flex items-center justify-center min-h-[44px] min-w-[44px]
                     text-[#B1B3B1] hover:text-[#E0E1E3] transition-colors
                     duration-200 cursor-pointer rounded-lg hover:bg-[#2A2D2A]"
          aria-label="Volver al setlist"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Prev song */}
        <button
          onClick={handlePrev}
          disabled={currentSongIndex <= 0 || loading}
          className="flex items-center justify-center min-h-[44px] min-w-[44px]
                     text-[#B1B3B1] hover:text-[#E0E1E3] transition-colors
                     duration-200 cursor-pointer rounded-lg hover:bg-[#2A2D2A]
                     disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Canción anterior"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Song name + position */}
        <div className="flex-1 min-w-0 text-center px-1">
          <span
            className="text-[#B1B3B1] text-xs tabular-nums block"
          >
            {total > 0 ? `${currentSongIndex + 1}/${total}` : '…'}
          </span>
          <span className="text-[#E0E1E3] font-semibold text-sm truncate block">
            {loading ? '…' : (currentSong?.song.title ?? '—')}
          </span>
        </div>

        {/* Transpositor compacto */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => currentSong && decrementSessionDelta(currentSong.songId)}
            disabled={!currentSong}
            className="flex items-center justify-center min-h-[44px] min-w-[44px]
                       text-[#B1B3B1] hover:text-[#E0E1E3] transition-colors
                       duration-200 cursor-pointer rounded-lg hover:bg-[#2A2D2A]
                       disabled:opacity-30"
            aria-label="Bajar tono"
          >
            <Minus size={16} />
          </button>

          <span className="font-mono text-[#515486] text-sm w-8 text-center tabular-nums">
            {displayKey ?? '—'}
          </span>

          <button
            onClick={() => currentSong && incrementSessionDelta(currentSong.songId)}
            disabled={!currentSong}
            className="flex items-center justify-center min-h-[44px] min-w-[44px]
                       text-[#B1B3B1] hover:text-[#E0E1E3] transition-colors
                       duration-200 cursor-pointer rounded-lg hover:bg-[#2A2D2A]
                       disabled:opacity-30"
            aria-label="Subir tono"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Next song */}
        <button
          onClick={handleNext}
          disabled={currentSongIndex >= total - 1 || loading}
          className="flex items-center justify-center min-h-[44px] min-w-[44px]
                     text-[#B1B3B1] hover:text-[#E0E1E3] transition-colors
                     duration-200 cursor-pointer rounded-lg hover:bg-[#2A2D2A]
                     disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Canción siguiente"
        >
          <ChevronRight size={20} />
        </button>
      </header>

      {/* Song content — scrolleable */}
      <main className="flex-1 px-4 py-5 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
        {loading && <PresentationSkeleton />}

        {!loading && !currentSong && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-[#B1B3B1] text-sm">Canción no encontrada</p>
            <button
              onClick={() => navigate(`/setlists/${id}`)}
              className="text-sm underline cursor-pointer text-[#515486]"
            >
              Volver al setlist
            </button>
          </div>
        )}

        {!loading && currentSong && (
          <>
            {/* Song metadata */}
            <div className="mb-5">
              <h2 className="font-sans text-xl font-bold text-[#E0E1E3] leading-tight">
                {currentSong.song.title}
              </h2>
              {currentSong.song.artist && (
                <p className="text-sm text-[#B1B3B1] mt-1">{currentSong.song.artist}</p>
              )}

              {/* Transpose indicator */}
              {finalOffset !== 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-mono text-xs text-[#515486] bg-[#515486]/10
                                   px-2 py-0.5 rounded">
                    {displayKey}
                  </span>
                  <span className="text-xs text-[#B1B3B1]">
                    {finalOffset > 0 ? `+${finalOffset}` : finalOffset} semitono{Math.abs(finalOffset) !== 1 ? 's' : ''}
                    {sessionDelta !== 0 && (
                      <span className="ml-1 text-[#B1B3B1]">
                        (base {transposeOffset > 0 ? `+${transposeOffset}` : transposeOffset}, sesión {sessionDelta > 0 ? `+${sessionDelta}` : sessionDelta})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Chord content */}
            <ChordRenderer
              content={currentSong.song.content}
              transpose={transposeFn}
            />
          </>
        )}
      </main>
    </div>
  )
}
