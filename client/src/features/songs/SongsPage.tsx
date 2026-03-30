import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Music, ChevronRight } from 'lucide-react'
import { songsService } from './songs.service'
import type { Song } from '../../shared/types'

// ─── Skeleton ─────────────────────────────────────────────────────────────

function SongSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-[#353835] animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-[#353835] rounded w-3/4" />
        <div className="h-3 bg-[#353835] rounded w-1/2" />
      </div>
      <div className="h-6 w-10 bg-[#353835] rounded" />
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <Music size={48} className="mb-4" style={{ color: '#454845' }} />
      <p className="font-sans text-lg font-semibold" style={{ color: '#B1B3B1' }}>
        {hasSearch ? 'Sin resultados' : 'No hay canciones'}
      </p>
      <p className="text-sm mt-1" style={{ color: '#B1B3B1' }}>
        {hasSearch
          ? 'Intenta con otra búsqueda'
          : 'La biblioteca de canciones está vacía'}
      </p>
    </div>
  )
}

// ─── Song Item ─────────────────────────────────────────────────────────────

interface SongItemProps {
  song: Song
  onClick: (id: string) => void
}

function SongItem({ song, onClick }: SongItemProps) {
  return (
    <button
      onClick={() => onClick(song.id)}
      className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#353835]
                 hover:bg-[#2a2d2a] transition-colors duration-200 cursor-pointer
                 text-left min-h-[56px]"
    >
      {/* Info principal */}
      <div className="flex-1 min-w-0">
        <p
          className="font-sans text-sm font-semibold truncate"
          style={{ color: '#E0E1E3' }}
        >
          {song.title}
        </p>
        {song.artist && (
          <p className="text-xs mt-0.5 truncate" style={{ color: '#B1B3B1' }}>
            {song.artist}
          </p>
        )}
      </div>

      {/* Badges: tonalidad y capo */}
      <div className="flex items-center gap-2 shrink-0">
        {song.key && (
          <span
            className="font-mono text-xs font-medium px-2 py-0.5 rounded
                       border border-[#454845]"
            style={{ color: '#515486', backgroundColor: '#1F211F' }}
          >
            {song.key}
          </span>
        )}
        {song.capo > 0 && (
          <span
            className="text-xs px-2 py-0.5 rounded border border-[#454845]"
            style={{ color: '#B1B3B1', backgroundColor: '#1F211F' }}
          >
            cpo {song.capo}
          </span>
        )}
        <ChevronRight size={16} style={{ color: '#454845' }} />
      </div>
    </button>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function SongsPage() {
  const navigate = useNavigate()
  const [songs, setSongs] = useState<Song[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Ref para el debounce timer
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cargar canciones (con debounce en búsqueda)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    const delay = search.length > 0 ? 300 : 0

    debounceRef.current = setTimeout(() => {
      setLoading(true)
      setError(null)

      songsService
        .getAll(search ? { search } : undefined)
        .then((data) => {
          setSongs(data)
        })
        .catch(() => {
          setError('No se pudieron cargar las canciones')
        })
        .finally(() => {
          setLoading(false)
        })
    }, delay)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [search])

  const handleSongClick = (id: string) => {
    navigate(`/songs/${id}`)
  }

  return (
    <div className="flex flex-col min-h-svh" style={{ backgroundColor: '#1F211F' }}>
      {/* Header sticky */}
      <header
        className="sticky top-0 z-10 border-b border-[#353835]"
        style={{ backgroundColor: '#1F211F' }}
      >
        <div className="px-4 pt-5 pb-3">
          <h1
            className="font-sans text-2xl font-bold mb-4"
            style={{ color: '#E0E1E3' }}
          >
            Canciones
          </h1>

          {/* Buscador */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: '#B1B3B1' }}
            />
            <input
              type="search"
              placeholder="Buscar canciones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#454845]
                         text-sm focus:outline-none focus:border-[#515486]
                         focus:ring-1 focus:ring-[#515486] transition-colors"
              style={{
                backgroundColor: '#2a2d2a',
                color: '#E0E1E3',
              }}
            />
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1">
        {loading && (
          <div>
            {Array.from({ length: 8 }).map((_, i) => (
              <SongSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm" style={{ color: '#B1B3B1' }}>{error}</p>
          </div>
        )}

        {!loading && !error && songs.length === 0 && (
          <EmptyState hasSearch={search.length > 0} />
        )}

        {!loading && !error && songs.length > 0 && (
          <ul>
            {songs.map((song) => (
              <li key={song.id}>
                <SongItem song={song} onClick={handleSongClick} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
