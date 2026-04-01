import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Minus, Plus, RotateCcw, Pencil, X, Check, Loader2 } from 'lucide-react'
import { songsService } from './songs.service'
import type { UpdateSongPayload } from './songs.service'
import { useTranspose } from './useTranspose'
import ChordRenderer from './ChordRenderer'
import type { Song } from '../../shared/types'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

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

// ─── Transpositor ──────────────────────────────────────────────────────────────

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
    <div className="flex items-center justify-between rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 border border-[#3A3D3A] bg-[#2A2D2A]">
      <div className="flex items-center gap-1.5 sm:gap-2">
        {originalKey && (
          <span className="font-mono text-xs sm:text-sm font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border border-[#3A3D3A] bg-[#1F211F] text-[#515486]">
            {originalKey}
          </span>
        )}
        <span className="text-[10px] sm:text-xs text-[#B1B3B1]">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        {semitones !== 0 && (
          <button
            onClick={onReset}
            className="flex items-center justify-center rounded-lg hover:bg-[#333633] transition-colors duration-200 cursor-pointer min-w-[36px] min-h-[36px]"
            aria-label="Restablecer tonalidad original"
          >
            <RotateCcw size={15} className="text-[#B1B3B1]" />
          </button>
        )}
        <button
          onClick={onDecrement}
          className="flex items-center justify-center rounded-lg hover:bg-[#333633] transition-colors duration-200 cursor-pointer min-w-[44px] min-h-[44px]"
          aria-label="Bajar un semitono"
        >
          <Minus size={18} className="text-[#E0E1E3]" />
        </button>
        <button
          onClick={onIncrement}
          className="flex items-center justify-center rounded-lg hover:bg-[#333633] transition-colors duration-200 cursor-pointer min-w-[44px] min-h-[44px]"
          aria-label="Subir un semitono"
        >
          <Plus size={18} className="text-[#E0E1E3]" />
        </button>
      </div>
    </div>
  )
}

// ─── Form field helpers ────────────────────────────────────────────────────────

interface FieldProps {
  label: string
  children: React.ReactNode
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-[#B1B3B1] uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

const inputCls = `
  bg-[#2A2D2A] text-[#E0E1E3] border border-[#3A3D3A] rounded-lg px-4 py-2.5
  min-h-[44px] w-full placeholder:text-[#B1B3B1]
  focus:outline-none focus:border-[#754456] focus:ring-2 focus:ring-[#754456]/20
  transition-colors duration-200 text-sm
`.trim()

// ─── Página principal ──────────────────────────────────────────────────────────

export default function SongDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [song, setSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modo edición
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Form state (sólo activo en modo edición)
  const [form, setForm] = useState<UpdateSongPayload>({})

  const { semitones, transpose, increment, decrement, reset } = useTranspose(song?.key)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    songsService
      .getById(id)
      .then((data) => setSong(data))
      .catch(() => setError('No se pudo cargar la canción'))
      .finally(() => setLoading(false))
  }, [id])

  // Al entrar en modo edición, inicializar el form con los valores actuales
  const handleStartEdit = () => {
    if (!song) return
    setForm({
      title: song.title,
      artist: song.artist ?? '',
      key: song.key ?? '',
      capo: song.capo,
      bpm: song.bpm ?? undefined,
      timeSignature: song.timeSignature ?? '',
      content: song.content,
      tags: song.tags,
    })
    setSaveError(null)
    setEditing(true)
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setSaveError(null)
  }

  const handleSave = async () => {
    if (!id || !song) return
    setSaving(true)
    setSaveError(null)
    try {
      // Construir payload con SOLO los campos que cambiaron respecto al song original.
      // Esto evita sobreescribir content (u otros campos) con valores del estado local
      // que podrían estar corruptos si el song fue cargado con una versión vieja del servicio.
      const payload: UpdateSongPayload = {}

      const title = form.title?.trim()
      if (title && title !== song.title) payload.title = title

      const artist = form.artist?.trim() || null
      if (artist !== (song.artist ?? null)) payload.artist = artist

      const key = (form.key as string)?.trim() || null
      if (key !== (song.key ?? null)) payload.key = key

      const capo = Number(form.capo) || 0
      if (capo !== song.capo) payload.capo = capo

      const bpm = form.bpm ? Number(form.bpm) : null
      if (bpm !== (song.bpm ?? null)) payload.bpm = bpm

      const timeSignature = (form.timeSignature as string)?.trim() || null
      if (timeSignature !== (song.timeSignature ?? null)) payload.timeSignature = timeSignature

      const content = form.content as string
      if (content !== song.content) payload.content = content

      // Si no cambió nada, salir sin llamar a la API
      if (Object.keys(payload).length === 0) {
        setEditing(false)
        return
      }

      await songsService.update(id, payload)
      // Recargar desde el servidor — fuente de verdad
      const fresh = await songsService.getById(id)
      setSong(fresh)
      setEditing(false)
    } catch {
      setSaveError('No se pudo guardar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const set = (field: keyof UpdateSongPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleBack = () => navigate('/songs')

  return (
    <div className="flex flex-col min-h-svh bg-[#1F211F]">

      {/* ── Header ── */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-[#3A3D3A] bg-[#1F211F]">
        {/* Volver */}
        {!editing && (
          <button
            onClick={handleBack}
            className="flex items-center justify-center rounded-lg hover:bg-[#2A2D2A] transition-colors duration-200 cursor-pointer min-w-[44px] min-h-[44px] -ml-2"
            aria-label="Volver a canciones"
          >
            <ArrowLeft size={22} className="text-[#E0E1E3]" />
          </button>
        )}

        {/* Título en header */}
        {song && !loading && (
          <div className="flex-1 min-w-0">
            <h1 className="font-sans text-base font-semibold truncate text-[#E0E1E3]">
              {editing ? 'Editar canción' : song.title}
            </h1>
            {!editing && song.artist && (
              <p className="text-xs truncate text-[#B1B3B1]">{song.artist}</p>
            )}
          </div>
        )}

        {/* Acciones del header */}
        {song && !loading && (
          <div className="flex items-center gap-1 ml-auto shrink-0">
            {editing ? (
              <>
                {/* Cancelar */}
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex items-center justify-center rounded-lg hover:bg-[#2A2D2A] transition-colors duration-200 cursor-pointer min-w-[44px] min-h-[44px] disabled:opacity-50"
                  aria-label="Cancelar edición"
                >
                  <X size={20} className="text-[#B1B3B1]" />
                </button>
                {/* Guardar */}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-[#754456] text-[#E0E1E3] px-4 rounded-lg font-semibold min-h-[44px] cursor-pointer transition-colors duration-200 hover:bg-[#8a5167] active:bg-[#5e3645] disabled:opacity-50 text-sm"
                >
                  {saving
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Check size={16} />
                  }
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </>
            ) : (
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-2 text-[#E0E1E3] border border-[#3A3D3A] px-4 rounded-lg font-medium min-h-[44px] cursor-pointer transition-colors duration-200 hover:bg-[#2A2D2A] text-sm"
                aria-label="Editar canción"
              >
                <Pencil size={15} />
                Editar
              </button>
            )}
          </div>
        )}
      </header>

      {/* ── Contenido ── */}
      <main className="flex-1 px-3 sm:px-4 pb-24">
        {loading && <DetailSkeleton />}

        {!loading && error && (
          <div className="py-16 text-center">
            <p className="text-sm text-[#B1B3B1]">{error}</p>
            <button onClick={handleBack} className="mt-4 text-sm underline cursor-pointer text-[#515486]">
              Volver a la lista
            </button>
          </div>
        )}

        {!loading && song && !editing && (
          <>
            {/* Metadatos — modo lectura */}
            <div className="pt-2 sm:pt-4 mb-2 sm:mb-4">
              <h2 className="font-sans text-base sm:text-xl md:text-2xl font-bold leading-tight text-[#E0E1E3]">{song.title}</h2>
              {song.artist && <p className="text-[11px] sm:text-sm mt-0.5 text-[#B1B3B1]">{song.artist}</p>}
              <div className="flex flex-wrap gap-1 sm:gap-2 mt-1.5 sm:mt-3">
                {song.key && (
                  <span className="font-mono text-[9px] sm:text-xs font-semibold px-1.5 sm:px-3 py-0.5 rounded-full border border-[#3A3D3A] bg-[#1F211F] text-[#515486]">
                    Clave: {song.key}
                  </span>
                )}
                {song.capo > 0 && (
                  <span className="text-[9px] sm:text-xs px-1.5 sm:px-3 py-0.5 rounded-full border border-[#3A3D3A] bg-[#1F211F] text-[#B1B3B1]">
                    Capo {song.capo}
                  </span>
                )}
                {song.bpm && (
                  <span className="text-[9px] sm:text-xs px-1.5 sm:px-3 py-0.5 rounded-full border border-[#3A3D3A] bg-[#1F211F] text-[#B1B3B1]">
                    {song.bpm} BPM
                  </span>
                )}
                {song.timeSignature && (
                  <span className="font-mono text-[9px] sm:text-xs px-1.5 sm:px-3 py-0.5 rounded-full border border-[#3A3D3A] bg-[#1F211F] text-[#B1B3B1]">
                    {song.timeSignature}
                  </span>
                )}
              </div>
            </div>

            {/* Transpositor */}
            <div className="mb-3 sm:mb-6">
              <Transpositor
                semitones={semitones}
                originalKey={song.key}
                onIncrement={increment}
                onDecrement={decrement}
                onReset={reset}
              />
            </div>

            {/* Letra + acordes */}
            <ChordRenderer content={song.content} transpose={transpose} />
          </>
        )}

        {!loading && song && editing && (
          <div className="pt-5 space-y-5">

            {/* Error de guardado */}
            {saveError && (
              <div className="bg-[#C0392B]/10 border border-[#C0392B]/30 rounded-lg px-4 py-3">
                <p className="text-sm text-[#C0392B]">{saveError}</p>
              </div>
            )}

            {/* ── Metadatos ── */}
            <div className="bg-[#2A2D2A] rounded-xl p-4 border border-[#3A3D3A] space-y-4">
              <p className="text-xs font-semibold text-[#B1B3B1] uppercase tracking-wide">Metadatos</p>

              <Field label="Título *">
                <input
                  className={inputCls}
                  value={form.title ?? ''}
                  onChange={set('title')}
                  placeholder="Nombre de la canción"
                />
              </Field>

              <Field label="Artista">
                <input
                  className={inputCls}
                  value={(form.artist as string) ?? ''}
                  onChange={set('artist')}
                  placeholder="Artista o banda"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Clave">
                  <input
                    className={inputCls}
                    value={(form.key as string) ?? ''}
                    onChange={set('key')}
                    placeholder="Ej: G, Am, F#"
                  />
                </Field>
                <Field label="Capo">
                  <input
                    className={inputCls}
                    type="number"
                    min={0}
                    max={11}
                    value={form.capo ?? 0}
                    onChange={set('capo')}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="BPM">
                  <input
                    className={inputCls}
                    type="number"
                    min={1}
                    value={form.bpm ?? ''}
                    onChange={set('bpm')}
                    placeholder="Ej: 72"
                  />
                </Field>
                <Field label="Compás">
                  <input
                    className={inputCls}
                    value={(form.timeSignature as string) ?? ''}
                    onChange={set('timeSignature')}
                    placeholder="Ej: 4/4"
                  />
                </Field>
              </div>
            </div>

            {/* ── Letra + acordes ── */}
            <div className="bg-[#2A2D2A] rounded-xl p-4 border border-[#3A3D3A] space-y-3">
              <p className="text-xs font-semibold text-[#B1B3B1] uppercase tracking-wide">Letra y acordes</p>
              <p className="text-xs text-[#B1B3B1]">
                Usá <span className="font-mono text-[#515486]">[G]</span> antes de la sílaba para insertar un acorde.
                Secciones con <span className="font-mono text-[#515486]">[Verso 1]</span>, <span className="font-mono text-[#515486]">[Coro]</span>, etc.
              </p>
              <textarea
                className={`${inputCls} font-mono resize-none leading-relaxed`}
                rows={20}
                value={(form.content as string) ?? ''}
                onChange={set('content')}
                placeholder="[Verso 1]&#10;[G]Tu letra con [D]acordes aquí..."
                spellCheck={false}
              />
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
