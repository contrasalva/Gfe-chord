import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListMusic, ChevronRight, Plus, Calendar, Pin, PinOff } from 'lucide-react'
import { setlistsService } from './setlists.service'
import { useAuthStore } from '../../store/auth.store'
import { useSetlistsStore } from '../../store/setlists.store'
import type { Setlist } from '../../shared/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SetlistSkeleton() {
  return (
    <div className="bg-[#2A2D2A] rounded-xl p-4 border border-[#3A3D3A] animate-pulse">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-4 bg-[#353835] rounded w-3/4" />
          <div className="h-3 bg-[#353835] rounded w-1/2" />
        </div>
        <div className="h-5 w-5 bg-[#353835] rounded" />
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  canCreate: boolean
  onCreate: () => void
}

function EmptyState({ canCreate, onCreate }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center px-6">
      <ListMusic size={48} className="text-[#B1B3B1]" />
      <p className="text-[#B1B3B1]">No hay setlists creados aún</p>
      {canCreate && (
        <button
          onClick={onCreate}
          className="bg-[#754456] text-[#E0E1E3] px-6 py-3 rounded-lg
                     font-semibold min-h-[44px] cursor-pointer
                     transition-colors duration-200 hover:bg-[#8a5167]"
        >
          Crear setlist
        </button>
      )}
    </div>
  )
}

// ─── Setlist Card ─────────────────────────────────────────────────────────────

interface SetlistCardProps {
  setlist: Setlist
  isPinned: boolean
  onClick: (id: string) => void
  onPin: (setlist: Setlist) => void
  onUnpin: (id: string) => void
}

function SetlistCard({ setlist, isPinned, onClick, onPin, onUnpin }: SetlistCardProps) {
  const songCount = setlist.songs.length
  const songLabel = songCount === 1 ? '1 canción' : `${songCount} canciones`

  return (
    <div className="w-full bg-[#2A2D2A] rounded-xl border border-[#3A3D3A] flex items-center gap-2">
      <button
        onClick={() => onClick(setlist.id)}
        className="flex-1 min-w-0 p-4 cursor-pointer
                   transition-colors duration-200
                   hover:bg-[#333633] active:bg-[#333633]
                   flex items-center justify-between gap-3 text-left
                   rounded-xl min-h-[44px]"
      >
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <span className="text-[#E0E1E3] font-semibold text-base truncate">
            {setlist.name}
          </span>
          <span className="text-[#B1B3B1] text-sm flex items-center gap-1.5">
            {setlist.serviceDate && (
              <>
                <Calendar size={13} className="shrink-0 text-[#B1B3B1]" />
                <span>{formatDate(setlist.serviceDate)}</span>
                <span>·</span>
              </>
            )}
            <span>{songLabel}</span>
          </span>
        </div>
        <ChevronRight size={20} className="text-[#B1B3B1] shrink-0" />
      </button>

      {/* Pin / Unpin button */}
      <button
        onClick={() => isPinned ? onUnpin(setlist.id) : onPin(setlist)}
        className="flex items-center justify-center min-w-[44px] min-h-[44px] mr-2
                   rounded-lg text-[#B1B3B1] hover:text-[#754456]
                   hover:bg-[#333633] transition-colors duration-200 cursor-pointer shrink-0"
        aria-label={isPinned ? `Desfijar ${setlist.name}` : `Fijar ${setlist.name}`}
      >
        {isPinned
          ? <PinOff size={16} className="text-[#754456]" />
          : <Pin size={16} />
        }
      </button>
    </div>
  )
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void
  onCreated: (setlist: Setlist) => void
}

function CreateModal({ onClose, onCreated }: CreateModalProps) {
  const [name, setName] = useState('')
  const [serviceDate, setServiceDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      const { data } = await setlistsService.create({
        name: name.trim(),
        ...(serviceDate ? { serviceDate } : {}),
      })
      onCreated(data.setlist)
    } catch {
      setError('No se pudo crear el setlist')
    } finally {
      setLoading(false)
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
        className="relative w-full sm:max-w-sm bg-[#2A2D2A] rounded-t-2xl sm:rounded-2xl
                   p-6 border-t border-[#3A3D3A] sm:border border-[#3A3D3A]"
      >
        <h2 className="text-[#E0E1E3] font-semibold text-lg mb-5">
          Nuevo setlist
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[#B1B3B1] text-sm" htmlFor="setlist-name">
              Nombre *
            </label>
            <input
              id="setlist-name"
              type="text"
              placeholder="Ej: Culto Domingo 8am"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#1F211F] text-[#E0E1E3] border border-[#3A3D3A]
                         rounded-lg px-4 py-3 min-h-[44px] w-full
                         placeholder:text-[#B1B3B1]
                         focus:outline-none focus:border-[#754456]
                         focus:ring-2 focus:ring-[#754456]/20
                         transition-colors duration-200"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[#B1B3B1] text-sm" htmlFor="setlist-date">
              Fecha de servicio
            </label>
            <input
              id="setlist-date"
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              className="bg-[#1F211F] text-[#E0E1E3] border border-[#3A3D3A]
                         rounded-lg px-4 py-3 min-h-[44px] w-full
                         focus:outline-none focus:border-[#754456]
                         focus:ring-2 focus:ring-[#754456]/20
                         transition-colors duration-200"
            />
          </div>

          {error && (
            <p className="text-sm text-[#C0392B]">{error}</p>
          )}

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-transparent text-[#E0E1E3] border border-[#3A3D3A]
                         px-4 py-3 rounded-lg font-semibold min-h-[44px] cursor-pointer
                         transition-colors duration-200 hover:bg-[#333633]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 bg-[#754456] text-[#E0E1E3] px-4 py-3 rounded-lg
                         font-semibold min-h-[44px] cursor-pointer
                         transition-colors duration-200 hover:bg-[#8a5167]
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando…' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SetlistsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { addRecentSetlist, pinnedSetlistIds, pinSetlist, unpinSetlist } = useSetlistsStore()
  const [setlists, setSetlists] = useState<Setlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const canCreate = user?.role === 'ADMIN' || user?.role === 'EDITOR'

  const loadSetlists = () => {
    setLoading(true)
    setError(null)

    setlistsService
      .getAll()
      .then(({ data }) => {
        setSetlists(data.setlists)
      })
      .catch(() => {
        setError('No se pudieron cargar los setlists')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadSetlists()
  }, [])

  const handleCardClick = (id: string) => {
    const setlist = setlists.find((s) => s.id === id)
    if (setlist) addRecentSetlist({ id: setlist.id, name: setlist.name })
    navigate(`/setlists/${id}`)
  }

  const handleCreated = (setlist: Setlist) => {
    setSetlists((prev) => [setlist, ...prev])
    setShowCreate(false)
    navigate(`/setlists/${setlist.id}`)
  }

  return (
    <div className="flex flex-col min-h-svh" style={{ backgroundColor: '#1F211F' }}>
      {/* Sticky header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between
                   px-4 pt-5 pb-3 border-b border-[#3A3D3A]"
        style={{ backgroundColor: '#1F211F' }}
      >
        <h1 className="font-sans text-2xl font-bold text-[#E0E1E3]">
          Setlists
        </h1>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center justify-center rounded-xl
                       bg-[#754456] hover:bg-[#8a5167] transition-colors duration-200
                       cursor-pointer min-w-[44px] min-h-[44px] px-3 gap-1.5"
            aria-label="Crear nuevo setlist"
          >
            <Plus size={18} className="text-[#E0E1E3]" />
            <span className="text-[#E0E1E3] text-sm font-medium hidden sm:inline">
              Nuevo
            </span>
          </button>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-4 pb-24" style={{ overscrollBehavior: 'contain' }}>
        {/* Loading skeletons */}
        {loading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SetlistSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="py-8 text-center">
            <p className="text-sm text-[#B1B3B1]">{error}</p>
            <button
              onClick={loadSetlists}
              className="mt-4 text-sm underline cursor-pointer text-[#515486]"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && setlists.length === 0 && (
          <EmptyState
            canCreate={canCreate}
            onCreate={() => setShowCreate(true)}
          />
        )}

        {/* List */}
        {!loading && !error && setlists.length > 0 && (
          <ul className="flex flex-col gap-3">
            {setlists.map((setlist) => (
              <li key={setlist.id}>
                <SetlistCard
                  setlist={setlist}
                  isPinned={pinnedSetlistIds.some((p) => p.id === setlist.id)}
                  onClick={handleCardClick}
                  onPin={(s) => pinSetlist({ id: s.id, name: s.name })}
                  onUnpin={unpinSetlist}
                />
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Create Modal */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
