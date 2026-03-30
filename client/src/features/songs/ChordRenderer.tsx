interface ChordRendererProps {
  content: string
  transpose: (chord: string) => string
}

// Regex para detectar si una línea es una sección (ej: [Verso 1], [Coro], [Puente])
// Una línea de sección tiene SOLO un token entre corchetes (puede tener espacios dentro)
const SECTION_REGEX = /^\[([^\]]+)\]$/

// Regex para encontrar acordes inline dentro de una línea de letra
// Ej: "[G]Santo, [D]Santo" — captura [G], [D], etc.
const CHORD_INLINE_REGEX = /\[([^\]]+)\]/g

/**
 * Determina si una línea es un heading de sección.
 * Una sección tiene exactamente un par de corchetes que ocupa toda la línea.
 */
function isSectionLine(line: string): boolean {
  return SECTION_REGEX.test(line.trim())
}

/**
 * Determina si una línea contiene acordes inline (tiene corchetes pero no es sección).
 */
function hasInlineChords(line: string): boolean {
  return CHORD_INLINE_REGEX.test(line) && !isSectionLine(line)
}

interface ChordSegment {
  chord: string
  lyric: string
}

/**
 * Parsea una línea con acordes inline y retorna segmentos {chord, lyric}.
 * Cada segmento es: el acorde que aparece antes de esa sílaba, y el texto hasta el próximo acorde.
 *
 * Ejemplo: "[G]Santo, [D]Santo"
 * → [{ chord: "G", lyric: "Santo, " }, { chord: "D", lyric: "Santo" }]
 *
 * Si hay texto antes del primer acorde:
 * "[C]Es el [G]Señor"
 * → [{ chord: "", lyric: "" }, { chord: "C", lyric: "Es el " }, { chord: "G", lyric: "Señor" }]
 */
function parseChordLine(line: string): ChordSegment[] {
  const segments: ChordSegment[] = []
  let lastIndex = 0

  // Reiniciar el regex (necesario porque es stateful con 'g' flag)
  const regex = /\[([^\]]+)\]/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(line)) !== null) {
    const chord = match[1]
    const chordStart = match.index
    const chordEnd = match.index + match[0].length

    // Texto antes de este acorde (desde el final del acorde anterior)
    const textBefore = line.slice(lastIndex, chordStart)

    // Si hay texto antes del primer acorde, es un segmento sin acorde
    if (segments.length === 0 && textBefore.length > 0) {
      segments.push({ chord: '', lyric: textBefore })
    } else if (segments.length > 0 && textBefore.length > 0) {
      // Agregar el texto como la letra del segmento anterior
      segments[segments.length - 1].lyric = textBefore
    }

    // Este acorde empieza un nuevo segmento; la letra se completa en la siguiente iteración
    segments.push({ chord, lyric: '' })
    lastIndex = chordEnd
  }

  // Texto restante después del último acorde
  if (lastIndex < line.length && segments.length > 0) {
    segments[segments.length - 1].lyric = line.slice(lastIndex)
  }

  return segments
}

// ─── Sub-componentes ───────────────────────────────────────────────────────

interface ChordLineProps {
  line: string
  transpose: (chord: string) => string
}

/**
 * Renderiza una línea que contiene acordes inline.
 * Los acordes aparecen encima de las sílabas correspondientes.
 * Usa inline-block + whitespace-pre para alineación precisa.
 */
function ChordLine({ line, transpose }: ChordLineProps) {
  const segments = parseChordLine(line)

  if (segments.length === 0) return null

  return (
    <div className="flex flex-wrap leading-none mb-1">
      {segments.map((seg, i) => (
        <span
          key={i}
          className="inline-flex flex-col"
          style={{ whiteSpace: 'pre' }}
        >
          {/* Acorde encima */}
          <span
            className="font-mono text-sm font-medium leading-tight"
            style={{ color: '#515486', minHeight: '1.25rem' }}
          >
            {seg.chord ? transpose(seg.chord) : '\u00A0'}
          </span>
          {/* Letra debajo */}
          <span
            className="font-body text-base leading-tight"
            style={{ color: '#E0E1E3' }}
          >
            {seg.lyric || '\u00A0'}
          </span>
        </span>
      ))}
    </div>
  )
}

/**
 * Renderiza una línea de letra pura (sin acordes).
 */
function LyricLine({ line }: { line: string }) {
  if (line.trim() === '') return <div className="h-4" />
  return (
    <p
      className="font-body text-base leading-relaxed"
      style={{ color: '#E0E1E3' }}
    >
      {line}
    </p>
  )
}

/**
 * Renderiza el heading de una sección musical.
 */
function SectionHeading({ label }: { label: string }) {
  return (
    <h3
      className="font-sans text-sm font-semibold uppercase tracking-wider mt-6 mb-2 first:mt-0"
      style={{ color: '#B1B3B1' }}
    >
      {label}
    </h3>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────

/**
 * ChordRenderer — Renderiza contenido ChordPro con transposición en tiempo real.
 *
 * Formato soportado:
 * - [Verso 1] → heading de sección
 * - [G]Santo, [D]Santo → acordes sobre sílabas
 * - Texto puro → letra sin acordes
 * - Líneas vacías → separación visual
 */
export default function ChordRenderer({ content, transpose }: ChordRendererProps) {
  const lines = content.split('\n')

  return (
    <div className="space-y-0.5">
      {lines.map((line, index) => {
        const trimmed = line.trim()

        // Línea vacía → separador visual
        if (trimmed === '') {
          return <div key={index} className="h-3" />
        }

        // Línea de sección
        const sectionMatch = SECTION_REGEX.exec(trimmed)
        if (sectionMatch) {
          return <SectionHeading key={index} label={sectionMatch[1]} />
        }

        // Línea con acordes inline
        if (hasInlineChords(trimmed)) {
          return <ChordLine key={index} line={trimmed} transpose={transpose} />
        }

        // Línea de letra pura
        return <LyricLine key={index} line={trimmed} />
      })}
    </div>
  )
}
