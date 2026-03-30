import { useState } from 'react'
import { Share2, Trash2, User, Info } from 'lucide-react'
import { setlistsService } from './setlists.service'
import type { Setlist } from '../../shared/types'

interface ShareModalProps {
  setlist: Setlist
  onClose: () => void
  onUpdated: (setlist: Setlist) => void
}

export default function ShareModal({ setlist, onClose, onUpdated }: ShareModalProps) {
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedId = userId.trim()
    if (!trimmedId) return

    // Check if already shared
    const alreadyShared = setlist.shares.some(
      (s) => s.userId === trimmedId || s.user.email === trimmedId
    )
    if (alreadyShared) {
      setError('Este usuario ya tiene acceso al setlist')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await setlistsService.share(setlist.id, trimmedId)
      setSuccess('Acceso concedido correctamente')
      setUserId('')

      // Reload setlist to get updated shares list
      const { data } = await setlistsService.getById(setlist.id)
      onUpdated(data.setlist)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'No se pudo compartir el setlist'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleUnshare = async (shareUserId: string) => {
    setRemovingId(shareUserId)
    setError(null)
    setSuccess(null)

    try {
      await setlistsService.unshare(setlist.id, shareUserId)

      // Optimistic update
      onUpdated({
        ...setlist,
        shares: setlist.shares.filter((s) => s.userId !== shareUserId),
      })
    } catch {
      setError('No se pudo revocar el acceso')
    } finally {
      setRemovingId(null)
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
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-[#B1B3B1]" />
            <h2 className="text-[#E0E1E3] font-semibold text-lg">Compartir setlist</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#B1B3B1] hover:text-[#E0E1E3] text-sm
                       min-h-[44px] px-3 cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
          {/* Share form */}
          <form onSubmit={handleShare} className="flex flex-col gap-3">
            <p className="text-[#B1B3B1] text-sm">
              Ingresa el ID de usuario para conceder acceso.
            </p>
            <p className="text-[#B1B3B1] text-xs bg-[#1F211F] rounded-lg px-3 py-2 border border-[#3A3D3A] flex items-center gap-1.5">
              <Info size={14} className="shrink-0" />
              La búsqueda por email estará disponible en la gestión de usuarios (Fase 4).
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ID de usuario..."
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value)
                  setError(null)
                  setSuccess(null)
                }}
                className="flex-1 bg-[#1F211F] text-[#E0E1E3] border border-[#3A3D3A]
                           rounded-lg px-4 py-2.5 min-h-[44px]
                           placeholder:text-[#B1B3B1]
                           focus:outline-none focus:border-[#754456]
                           focus:ring-2 focus:ring-[#754456]/20
                           transition-colors duration-200 text-sm"
              />
              <button
                type="submit"
                disabled={loading || !userId.trim()}
                className="bg-[#754456] text-[#E0E1E3] px-4 rounded-lg
                           min-h-[44px] font-semibold cursor-pointer
                           transition-colors duration-200 hover:bg-[#8a5167]
                           disabled:opacity-50 disabled:cursor-not-allowed
                           shrink-0 text-sm"
              >
                {loading ? '…' : 'Compartir'}
              </button>
            </div>

            {error && <p className="text-sm text-[#C0392B]">{error}</p>}
            {success && <p className="text-sm text-[#27AE60]">{success}</p>}
          </form>

          {/* Shared users list */}
          {setlist.shares.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-[#B1B3B1] text-xs font-semibold uppercase tracking-wider">
                Con acceso ({setlist.shares.length})
              </h3>
              <ul className="flex flex-col gap-2">
                {setlist.shares.map((share) => (
                  <li
                    key={share.userId}
                    className="flex items-center gap-3 bg-[#1F211F] rounded-xl px-3 py-2.5
                               border border-[#3A3D3A]"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full
                                    bg-[#333633] shrink-0">
                      <User size={14} className="text-[#B1B3B1]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#E0E1E3] text-sm font-medium truncate">
                        {share.user.name}
                      </p>
                      <p className="text-[#B1B3B1] text-xs truncate">
                        {share.user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnshare(share.userId)}
                      disabled={removingId === share.userId}
                      className="flex items-center justify-center min-w-[44px] min-h-[44px]
                                 rounded-lg text-[#B1B3B1] hover:text-[#C0392B]
                                 hover:bg-[#333633] transition-colors duration-200
                                 cursor-pointer disabled:opacity-40"
                      aria-label={`Revocar acceso a ${share.user.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {setlist.shares.length === 0 && (
            <p className="text-[#B1B3B1] text-sm text-center py-4">
              Este setlist no ha sido compartido con nadie aún.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
