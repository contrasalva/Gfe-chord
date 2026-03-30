import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Minus, Plus, RotateCcw } from 'lucide-react'
import { songsService } from './songs.service'
import { useTranspose } from './useTranspose'
import ChordRenderer from './ChordRenderer'
import type { Song } from '../../shared/types'

// ─── Skeleton de detalle ───────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="animate-pulse px-4 pt-4 space-y-3">
      <div className="h-7 bg-[#353835] rounded w-2/3" />
      <div className="h-4 bg-[#353835] rounded w-1/3" />
      <div className="h-10 bg-[#353835] rounded mt-4" />
      <div className="space-y-2 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 bg-[#353835] rounded" style={{ width: `${60 + (i % 3) * 15}%` }} />
        ))}
      </div>
    </div>
  )
}

// ─── Transpositor ──────────────────────────────────────────────────────────

interface TranspositorProps {
  semitones: number
  originalKey?: string | null
  onIncrement: () => void
  onDecrement: () => void
  onReset: () => void
}

function Transpositor({ semitones, originalKey, onIncrement, onDecrement, onReset }: TranspositorProps) {
  const sign = semitones > 0 ? '+' : ''
  const label = semitones === 0
    ? 'Original'
    : `${sign}${semitones} semitono${Math.abs(semitones) !== 1 ? 's' : ''}`

  return (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-3 border border-[#454845]"
      style={{ backgroundColor: '#2a2d2a' }}
    >
      {/* Info de tonalidad */}
      <div className="flex items-center gap-2">
        {originalKey && (
          <span
            className="font-mono text-sm font-semibold px-2.5 py-1 rounded-md border border-[#454845]"
            style={{ color: '#515486', backgroundColor: '#1F211F' }}
          >
            {originalKey}
          </span>
        )}
        <span className="text-xs" style={{ color: '#B1B3B1' }}>
          {label}
        </span>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-1">
        {semitones !== 0 && (
          <button
            onClick={onReset}
            className="flex items-center justify-center rounded-lg
                       hover:bg-[#353835] transition-colors duration-200
                       cursor-pointer min-w-[36px] min-h-[36px]"
            aria-label="Restablecer tonalidad original"
          >
            <RotateCcw size={15} style={{ color: '#B1B3B1' }} />
          </button>
        )}
        <button
          onClick={onDecrement}
          className="flex items-center justify-center rounded-lg
                     hover:bg-[#353835] transition-colors duration-200
                     cursor-pointer min-w-[44px] min-h-[44px]"
          aria-label="Bajar un semitono"
        >
          <Minus size={18} style={{ color: '#E0E1E3' }} />
        </button>
        <button
          onClick={onIncrement}
          className="flex items-center justify-center rounded-lg
                     hover:bg-[#353835] transition-colors duration-200
                     cursor-pointer min-w-[44px] min-h-[44px]"
          aria-label="Subir un semitono"
        >
          <Plus size={18} style={{ color: '#E0E1E3' }} />
        </button>
      </div>
    </div>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────

export default function SongDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [song, setSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { semitones, transpose, increment, decrement, reset } = useTranspose(song?.key)

  useEffect(() => {
    if (!id) return

    setLoading(true)
    setError(null)

    songsService
      .getById(id)
      .then((data) => {
        setSong(data)
      })
      .catch(() => {
        setError('No se pudo cargar la canción')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id])

  const handleBack = () => navigate('/songs')

  return (
    <div className="flex flex-col min-h-svh" style={{ backgroundColor: '#1F211F' }}>
      {/* Header con botón volver */}
      <header
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3
                   border-b border-[#353835]"
        style={{ backgroundColor: '#1F211F' }}
      >
        <button
          onClick={handleBack}
          className="flex items-center justify-center rounded-lg
                     hover:bg-[#2a2d2a] transition-colors duration-200
                     cursor-pointer min-w-[44px] min-h-[44px] -ml-2"
          aria-label="Volver a canciones"
        >
          <ArrowLeft size={22} style={{ color: '#E0E1E3' }} />
        </button>

        {song && !loading && (
          <div className="flex-1 min-w-0">
            <h1
              className="font-sans text-base font-semibold truncate"
              style={{ color: '#E0E1E3' }}
            >
              {song.title}
            </h1>
            {song.artist && (
              <p className="text-xs truncate" style={{ color: '#B1B3B1' }}>
                {song.artist}
              </p>
            )}
          </div>
        )}
      </header>

      {/* Contenido */}
      <main className="flex-1 px-4 pb-24">
        {loading && <DetailSkeleton />}

        {!loading && error && (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: '#B1B3B1' }}>{error}</p>
            <button
              onClick={handleBack}
              className="mt-4 text-sm underline cursor-pointer"
              style={{ color: '#515486' }}
            >
              Volver a la lista
            </button>
          </div>
        )}

        {!loading && song && (
          <>
            {/* Título completo y metadata */}
            <div className="pt-5 mb-4">
              <h2
                className="font-sans text-2xl font-bold leading-tight"
                style={{ color: '#E0E1E3' }}
              >
                {song.title}
              </h2>
              {song.artist && (
                <p className="text-sm mt-1" style={{ color: '#B1B3B1' }}>
                  {song.artist}
                </p>
              )}

              {/* Badges de metadata */}
              <div className="flex flex-wrap gap-2 mt-3">
                {song.key && (
                  <span
                    className="font-mono text-xs font-semibold px-3 py-1 rounded-full
                               border border-[#454845]"
                    style={{ color: '#515486', backgroundColor: '#1F211F' }}
                  >
                    Clave: {song.key}
                  </span>
                )}
                {song.capo > 0 && (
                  <span
                    className="text-xs px-3 py-1 rounded-full border border-[#454845]"
                    style={{ color: '#B1B3B1', backgroundColor: '#1F211F' }}
                  >
                    Capo {song.capo}
                  </span>
                )}
                {song.bpm && (
                  <span
                    className="text-xs px-3 py-1 rounded-full border border-[#454845]"
                    style={{ color: '#B1B3B1', backgroundColor: '#1F211F' }}
                  >
                    {song.bpm} BPM
                  </span>
                )}
                {song.timeSignature && (
                  <span
                    className="font-mono text-xs px-3 py-1 rounded-full border border-[#454845]"
                    style={{ color: '#B1B3B1', backgroundColor: '#1F211F' }}
                  >
                    {song.timeSignature}
                  </span>
                )}
              </div>
            </div>

            {/* Transpositor */}
            <div className="mb-6">
              <Transpositor
                semitones={semitones}
                originalKey={song.key}
                onIncrement={increment}
                onDecrement={decrement}
                onReset={reset}
              />
            </div>

            {/* Contenido ChordPro */}
            <ChordRenderer content={song.content} transpose={transpose} />
          </>
        )}
      </main>
    </div>
  )
}
