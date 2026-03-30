import { useState, useEffect, useRef } from 'react'
import { Search, Music, Plus } from 'lucide-react'
import { songsService } from '../songs/songs.service'
import { setlistsService } from './setlists.service'
import type { Song } from '../../shared/types'

interface AddSongModalProps {
  setlistId: string
  existingSongIds: string[]
  onClose: () => void
  /** Called with no arguments after a song is added — parent should reload the setlist */
  onSongAdded: () => void
}

// ─── Song search result row ──────────────────────────────────────────────────

interface SongOptionProps {
  song: Song
  isAdded: boolean
  isLoading: boolean
  onAdd: () => void
}

function SongOption({ song, isAdded, isLoading, onAdd }: SongOptionProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b border-[#3A3D3A]
                 hover:bg-[#333633] transition-colors duration-200"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[#E0E1E3] text-sm font-medium truncate">
          {song.title}
        </p>
        {song.artist && (
          <p className="text-[#B1B3B1] text-xs truncate mt-0.5">
            {song.artist}
          </p>
        )}
      </div>

      {/* Key badge */}
      {song.key && (
        <span className="font-mono text-xs text-[#515486] bg-[#515486]/10
                         px-2 py-0.5 rounded shrink-0">
          {song.key}
        </span>
      )}

      <button
        onClick={onAdd}
        disabled={isAdded || isLoading}
        className="flex items-center justify-center min-w-[44px] min-h-[44px]
                   rounded-lg transition-colors duration-200 cursor-pointer
                   disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          backgroundColor: isAdded ? '#27AE60' : '#754456',
        }}
        aria-label={isAdded ? 'Ya agregada' : `Agregar ${song.title}`}
      >
        <Plus size={16} className="text-[#E0E1E3]" />
      </button>
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function AddSongModal({
  setlistId,
  existingSongIds,
  onClose,
  onSongAdded,
}: AddSongModalProps) {
  const [search, setSearch] = useState('')
  const [songs, setSongs] = useState<Song[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set(existingSongIds))
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Search songs with debounce ─────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const delay = search.length > 0 ? 300 : 0

    debounceRef.current = setTimeout(() => {
      setLoadingSearch(true)
      songsService
        .getAll(search ? { search } : undefined)
        .then((data) => setSongs(data))
        .catch(() => setSongs([]))
        .finally(() => setLoadingSearch(false))
    }, delay)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search])

  const handleAdd = async (songId: string) => {
    if (addedIds.has(songId) || addingId) return
    setAddingId(songId)

    try {
      await setlistsService.addSong(setlistId, { songId })
      setAddedIds((prev) => new Set([...prev, songId]))
      // Backend returns { ok, setlistSong } — call parent to reload full setlist
      onSongAdded()
    } catch {
      // silent — song may already be in setlist or network error
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full sm:max-w-md bg-[#2A2D2A] rounded-t-2xl sm:rounded-2xl
                   border-t border-[#3A3D3A] sm:border border-[#3A3D3A]
                   flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-[#3A3D3A]">
          <h2 className="text-[#E0E1E3] font-semibold text-lg">Agregar canción</h2>
          <button
            onClick={onClose}
            className="text-[#B1B3B1] hover:text-[#E0E1E3] text-sm
                       min-h-[44px] px-3 cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 py-3 border-b border-[#3A3D3A]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B1B3B1]"
            />
            <input
              type="search"
              placeholder="Buscar canciones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#454845]
                         text-sm focus:outline-none focus:border-[#515486]
                         focus:ring-1 focus:ring-[#515486] transition-colors"
              style={{ backgroundColor: '#1F211F', color: '#E0E1E3' }}
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
          {loadingSearch && (
            <div className="flex flex-col divide-y divide-[#3A3D3A]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-[#353835] rounded w-3/4" />
                    <div className="h-2 bg-[#353835] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingSearch && songs.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Music size={36} className="text-[#B1B3B1]" />
              <p className="text-[#B1B3B1] text-sm">
                {search ? 'Sin resultados' : 'No hay canciones'}
              </p>
            </div>
          )}

          {!loadingSearch && songs.length > 0 && (
            <ul>
              {songs.map((song) => (
                <li key={song.id}>
                  <SongOption
                    song={song}
                    isAdded={addedIds.has(song.id)}
                    isLoading={addingId === song.id}
                    onAdd={() => handleAdd(song.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
