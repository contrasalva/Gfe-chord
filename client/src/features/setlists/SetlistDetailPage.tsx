import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  Play,
  Share2,
  Trash2,
  Plus,
  Music,
  GripVertical,
  Calendar,
  Minus,
  Pin,
  PinOff,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { setlistsService } from './setlists.service'
import { useAuthStore } from '../../store/auth.store'
import { useSetlistsStore } from '../../store/setlists.store'
import AddSongModal from './AddSongModal'
import ShareModal from './ShareModal'
import type { Setlist, SetlistSong } from '../../shared/types'
import { transposeChord } from '../songs/useTranspose'

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

function computeTransposedKey(originalKey: string | null | undefined, offset: number): string | null {
  if (!originalKey) return null
  if (offset === 0) return originalKey
  return transposeChord(originalKey, offset)
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="animate-pulse px-4 pt-4 space-y-3">
      <div className="h-7 bg-[#353835] rounded w-2/3" />
      <div className="h-4 bg-[#353835] rounded w-1/3" />
      <div className="h-10 bg-[#353835] rounded mt-4" />
      <div className="space-y-3 mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-[#353835] rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Sortable Song Row ────────────────────────────────────────────────────────

interface SortableSongRowProps {
  setlistSong: SetlistSong
  isOwnerOrAdmin: boolean
  onNavigate: () => void
  onRemove: () => void
  onTransposeChange: (delta: number) => void
}

function SortableSongRow({
  setlistSong,
  isOwnerOrAdmin,
  onNavigate,
  onRemove,
  onTransposeChange,
}: SortableSongRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: setlistSong.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  }

  const computedKey = computeTransposedKey(
    setlistSong.song.key,
    setlistSong.transposeOffset
  )

  const hasBadge = setlistSong.transposeOffset !== 0 && computedKey

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-[#2A2D2A] rounded-xl border border-[#3A3D3A] flex items-center gap-2 p-3"
    >
      {/* Drag handle — only for owner/admin */}
      {isOwnerOrAdmin && (
        <button
          {...attributes}
          {...listeners}
          className="flex items-center justify-center min-w-[44px] min-h-[44px]
                     cursor-grab active:cursor-grabbing text-[#B1B3B1]
                     hover:text-[#E0E1E3] transition-colors"
          aria-label="Arrastrar para reordenar"
        >
          <GripVertical size={20} />
        </button>
      )}

      {/* Song info — clickable to navigate */}
      <button
        onClick={onNavigate}
        className="flex flex-col gap-0.5 flex-1 min-w-0 text-left cursor-pointer py-1"
      >
        <span className="text-[#E0E1E3] font-medium truncate text-sm">
          {setlistSong.song.title}
        </span>
        {setlistSong.song.artist && (
          <span className="text-[#B1B3B1] text-xs truncate">
            {setlistSong.song.artist}
          </span>
        )}
      </button>

      {/* Transpose badge + controls */}
      <div className="flex items-center gap-1 shrink-0">
        {hasBadge && (
          <span className="bg-[#515486]/20 text-[#515486] px-2 py-0.5
                           rounded text-xs font-mono shrink-0">
            {computedKey}
          </span>
        )}

        {isOwnerOrAdmin && (
          <>
            <button
              onClick={() => onTransposeChange(-1)}
              className="flex items-center justify-center min-w-[44px] min-h-[44px]
                         rounded-lg text-[#B1B3B1] hover:text-[#E0E1E3]
                         hover:bg-[#333633] transition-colors duration-200 cursor-pointer"
              aria-label={`Bajar tono de ${setlistSong.song.title}`}
            >
              <Minus size={14} />
            </button>
            <button
              onClick={() => onTransposeChange(1)}
              className="flex items-center justify-center min-w-[44px] min-h-[44px]
                         rounded-lg text-[#B1B3B1] hover:text-[#E0E1E3]
                         hover:bg-[#333633] transition-colors duration-200 cursor-pointer"
              aria-label={`Subir tono de ${setlistSong.song.title}`}
            >
              <Plus size={14} />
            </button>
            <button
              onClick={onRemove}
              className="flex items-center justify-center min-w-[44px] min-h-[44px]
                         rounded-lg text-[#B1B3B1] hover:text-[#C0392B]
                         hover:bg-[#333633] transition-colors duration-200 cursor-pointer"
              aria-label={`Eliminar ${setlistSong.song.title} del setlist`}
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SetlistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { setActiveSetlist, moveSongIndex, addRecentSetlist, pinnedSetlistIds, pinSetlist, unpinSetlist } = useSetlistsStore()

  const [setlist, setSetlist] = useState<Setlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddSong, setShowAddSong] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [isReordering, setIsReordering] = useState(false)

  const isOwnerOrAdmin =
    user?.role === 'ADMIN' || (setlist ? setlist.createdById === user?.id : false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const loadSetlist = () => {
    if (!id) return
    setLoading(true)
    setError(null)

    setlistsService
      .getById(id)
      .then(({ data }) => {
        setSetlist(data.setlist)
        addRecentSetlist({ id: data.setlist.id, name: data.setlist.name })
      })
      .catch(() => {
        setError('No se pudo cargar el setlist')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadSetlist()
  }, [id])

  // ── Drag and drop ─────────────────────────────────────────────────────────

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !setlist) return

    const oldIndex = setlist.songs.findIndex((s) => s.id === active.id)
    const newIndex = setlist.songs.findIndex((s) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newSongs = arrayMove(setlist.songs, oldIndex, newIndex)
    const reordered = newSongs.map((s, i) => ({ ...s, order: i + 1 }))

    // Optimistic update
    setSetlist({ ...setlist, songs: reordered })
    setIsReordering(true)

    try {
      await setlistsService.reorderSongs(
        setlist.id,
        reordered.map((s) => ({ id: s.id, order: s.order }))
      )
    } catch {
      // Rollback on error
      setSetlist(setlist)
    } finally {
      setIsReordering(false)
    }
  }

  // ── Remove song ───────────────────────────────────────────────────────────

  const handleRemoveSong = async (setlistSongId: string) => {
    if (!setlist) return
    const optimistic = {
      ...setlist,
      songs: setlist.songs.filter((s) => s.id !== setlistSongId),
    }
    setSetlist(optimistic)

    try {
      await setlistsService.removeSong(setlist.id, setlistSongId)
      // Backend returns { ok, message } — reload to get the authoritative state
      loadSetlist()
    } catch {
      setSetlist(setlist)
    }
  }

  // ── Transpose ─────────────────────────────────────────────────────────────

  const handleTransposeChange = async (setlistSongId: string, currentOffset: number, delta: number) => {
    if (!setlist) return
    const newOffset = Math.max(-6, Math.min(6, currentOffset + delta))

    // Optimistic update — match by SetlistSong PK (id)
    setSetlist({
      ...setlist,
      songs: setlist.songs.map((s) =>
        s.id === setlistSongId ? { ...s, transposeOffset: newOffset } : s
      ),
    })

    try {
      await setlistsService.patchSong(setlist.id, setlistSongId, { transposeOffset: newOffset })
    } catch {
      // Revert
      setSetlist(setlist)
    }
  }

  // ── Add song ──────────────────────────────────────────────────────────────

  const handleSongAdded = () => {
    setShowAddSong(false)
    // Backend returns setlistSong, not the full setlist — reload to get updated list
    loadSetlist()
  }

  // ── Navigate to presentation ──────────────────────────────────────────────

  const handlePresent = (startIndex: number = 0) => {
    if (!setlist) return
    setActiveSetlist(setlist)
    moveSongIndex(startIndex)
    navigate(`/setlists/${setlist.id}/songs/${startIndex}`)
  }

  // ── Delete setlist ────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!setlist) return
    if (!window.confirm(`¿Eliminar el setlist "${setlist.name}"?`)) return

    try {
      await setlistsService.delete(setlist.id)
      navigate('/setlists')
    } catch {
      // Keep on page — show nothing (UX improvement possible)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-svh" style={{ backgroundColor: '#1F211F' }}>
      {/* Sticky Header */}
      <header
        className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3
                   border-b border-[#3A3D3A]"
        style={{ backgroundColor: '#1F211F' }}
      >
        <button
          onClick={() => navigate('/setlists')}
          className="flex items-center justify-center min-w-[44px] min-h-[44px]
                     -ml-2 rounded-lg hover:bg-[#2A2D2A] transition-colors
                     duration-200 cursor-pointer"
          aria-label="Volver a setlists"
        >
          <ChevronLeft size={22} className="text-[#E0E1E3]" />
        </button>

        {setlist && !loading && (
          <div className="flex-1 min-w-0">
            <h1 className="font-sans text-base font-semibold truncate text-[#E0E1E3]">
              {setlist.name}
            </h1>
            {setlist.serviceDate && (
              <p className="text-xs text-[#B1B3B1] flex items-center gap-1">
                <Calendar size={11} />
                {formatDate(setlist.serviceDate)}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        {setlist && !loading && (
          <div className="flex items-center gap-1 shrink-0">
            {/* Present button */}
            {setlist.songs.length > 0 && (
              <button
                onClick={() => handlePresent(0)}
                className="flex items-center justify-center gap-1.5 min-h-[44px]
                           px-3 rounded-lg bg-[#754456] hover:bg-[#8a5167]
                           transition-colors duration-200 cursor-pointer"
                aria-label="Modo presentación"
              >
                <Play size={16} className="text-[#E0E1E3]" />
                <span className="text-[#E0E1E3] text-sm font-medium hidden sm:inline">
                  Presentar
                </span>
              </button>
            )}

            {/* Pin / Unpin */}
            {(() => {
              const isPinned = pinnedSetlistIds.some((p) => p.id === setlist.id)
              return (
                <button
                  onClick={() =>
                    isPinned
                      ? unpinSetlist(setlist.id)
                      : pinSetlist({ id: setlist.id, name: setlist.name })
                  }
                  className="flex items-center justify-center min-w-[44px] min-h-[44px]
                             rounded-lg hover:bg-[#2A2D2A] transition-colors
                             duration-200 cursor-pointer"
                  aria-label={isPinned ? 'Desfijar setlist' : 'Fijar setlist'}
                >
                  {isPinned
                    ? <PinOff size={18} className="text-[#754456]" />
                    : <Pin size={18} className="text-[#B1B3B1]" />
                  }
                </button>
              )
            })()}

            {/* Owner/Admin actions */}
            {isOwnerOrAdmin && (
              <>
                <button
                  onClick={() => setShowShare(true)}
                  className="flex items-center justify-center min-w-[44px] min-h-[44px]
                             rounded-lg hover:bg-[#2A2D2A] transition-colors
                             duration-200 cursor-pointer"
                  aria-label="Compartir setlist"
                >
                  <Share2 size={18} className="text-[#B1B3B1]" />
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center justify-center min-w-[44px] min-h-[44px]
                             rounded-lg hover:bg-[#2A2D2A] transition-colors
                             duration-200 cursor-pointer"
                  aria-label="Eliminar setlist"
                >
                  <Trash2 size={18} className="text-[#B1B3B1] hover:text-[#C0392B]" />
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Content */}
      <main
        className="flex-1 px-4 py-4 pb-24"
        style={{ overscrollBehavior: 'contain' }}
      >
        {loading && <DetailSkeleton />}

        {!loading && error && (
          <div className="py-16 text-center">
            <p className="text-sm text-[#B1B3B1]">{error}</p>
            <button
              onClick={loadSetlist}
              className="mt-4 text-sm underline cursor-pointer text-[#515486]"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && setlist && (
          <>
            {/* Song list with DnD */}
            {setlist.songs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Music size={40} className="text-[#B1B3B1]" />
                <p className="text-[#B1B3B1] text-sm">
                  Agrega canciones a este setlist
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={setlist.songs.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="flex flex-col gap-2">
                    {setlist.songs.map((setlistSong, index) => (
                      <li key={setlistSong.id}>
                        <SortableSongRow
                          setlistSong={setlistSong}
                          isOwnerOrAdmin={isOwnerOrAdmin}
                          onNavigate={() => handlePresent(index)}
                          onRemove={() => handleRemoveSong(setlistSong.id)}
                          onTransposeChange={(delta) =>
                            handleTransposeChange(
                              setlistSong.id,
                              setlistSong.transposeOffset,
                              delta
                            )
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}

            {/* Add song button — owner/admin only */}
            {isOwnerOrAdmin && (
              <button
                onClick={() => setShowAddSong(true)}
                className="mt-4 w-full flex items-center justify-center gap-2
                           border-2 border-dashed border-[#3A3D3A]
                           rounded-xl py-4 min-h-[56px] cursor-pointer
                           text-[#B1B3B1] hover:text-[#E0E1E3]
                           hover:border-[#515486] transition-colors duration-200"
                disabled={isReordering}
              >
                <Plus size={18} />
                <span className="text-sm font-medium">Agregar canción</span>
              </button>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {showAddSong && setlist && (
        <AddSongModal
          setlistId={setlist.id}
          existingSongIds={setlist.songs.map((s) => s.songId)}
          onClose={() => setShowAddSong(false)}
          onSongAdded={handleSongAdded}
        />
      )}

      {showShare && setlist && (
        <ShareModal
          setlist={setlist}
          onClose={() => setShowShare(false)}
          onUpdated={setSetlist}
        />
      )}
    </div>
  )
}
