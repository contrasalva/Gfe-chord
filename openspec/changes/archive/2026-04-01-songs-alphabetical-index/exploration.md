# Exploration: songs-alphabetical-index

**Project**: gfe-chord  
**Date**: 2026-04-01  
**Status**: Done — Ready for Proposal

---

## Current State

### SongsPage (`client/src/features/songs/SongsPage.tsx`)

- Carga canciones via `songsService.getAll({ search? })` — búsqueda via **API con debounce 300ms**
- Renderiza **lista flat** (`<ul>/<li>`) con `SongItem` por cada canción
- **No hay agrupamiento por letra** — implementación desde cero
- Búsqueda existe (input controlled + debounce) pero no cambia vista — filtra la misma lista flat
- Click en canción → `navigate('/songs/:id')`
- **Sin Zustand store para songs** — estado local (`useState`) únicamente
- `songs.service.ts` soporta params `{ search?, tag?, key? }` — la API ya filtra server-side

### AppLayout / Sidebar (`client/src/shared/components/AppLayout.tsx`)

- Sidebar visible solo en `md:` breakpoint, ancho fijo `w-56`, fondo `#2A2D2A`
- Actualmente: Logo + 3 `NavLink` planos (Canciones, Setlists, Perfil) + `overflow` sin especificar
- **Sin secciones expandibles** ni grupos en sidebar
- Sin canciones por letra ni setlists fijados/recientes
- Layout shell: `aside` (sidebar) + `main` (`<Routes>`) + `nav` (bottom bar móvil, `md:hidden`)
- `AppLayout` mezcla shell y routing — candidato a refactorizar

### Setlists Store (`client/src/store/setlists.store.ts`)

- `setlists: Setlist[]` — ephemeral (NO persistido en localStorage)
- `persist()` con `partialize` solo persiste `activeSetlistId` y `currentSongIndex`
- **Sin `pinnedSetlistIds` ni `recentSetlistIds`** — hay que añadirlos
- Para "recientes": necesita lógica nueva — registrar ID al visitar `SetlistDetailPage`
- Para "fijados": necesita persistir array de IDs con toggle explícito del usuario

### Tipos (`client/src/shared/types/index.ts`)

- `Song.title: string` — campo suficiente para derivar letra inicial (`title[0].toUpperCase()`)
- Sin campo de sort especial; sin campo `letter` en el servidor — grouping es 100% frontend

### Componentes reutilizables existentes

| Componente | Existe | Notas |
|---|---|---|
| Accordion / Collapsible | ❌ No | Hay que crearlo |
| AlphabeticIndex | ❌ No | Hay que crearlo |
| Sidebar (separado) | ❌ No | Embebido en AppLayout |

### Dependencias disponibles

- **Lucide React** — `ChevronDown`, `ChevronRight`, `Pin`, `Clock` disponibles
- **Zustand 5** con `persist` middleware — para pinned/recent setlists
- **Tailwind CSS v4** — animaciones con `transition`, `duration-200`, sin `useMemo`/`useCallback`
- Sin Radix UI, Headless UI, ni shadcn — componentes 100% custom

---

## Affected Areas

| Archivo | Acción | Motivo |
|---|---|---|
| `client/src/features/songs/SongsPage.tsx` | Refactor | Acordeón alfabético, colapsar con búsqueda |
| `client/src/shared/components/AppLayout.tsx` | Refactor | Extraer Sidebar, añadir secciones |
| `client/src/store/setlists.store.ts` | Extender | Añadir `pinnedSetlistIds`, `recentSetlistIds`, persist |
| `client/src/shared/components/AlphabeticAccordion.tsx` | Crear | Componente genérico reutilizable (songs + sidebar) |
| `client/src/shared/components/Sidebar.tsx` | Crear | Componente dedicado extraído de AppLayout |
| `client/src/store/songs.store.ts` | Crear | Cache compartido (sidebar + SongsPage sin double fetch) |
| `client/src/shared/types/index.ts` | Sin cambios | `Song.title` suficiente |
| `server/` | Sin cambios | Feature 100% frontend |

---

## Approaches

### 1. SongsPage: Grouping Strategy

```ts
// Derivar grupos desde array de canciones
type LetterGroup = { letter: string; songs: Song[] }

function groupByLetter(songs: Song[]): LetterGroup[] {
  const map = new Map<string, Song[]>()
  for (const song of songs) {
    const letter = song.title[0]?.toUpperCase() ?? '#'
    const group = map.get(letter) ?? []
    group.push(song)
    map.set(letter, group)
  }
  // Sort: A-Z, luego '#' al final
  return Array.from(map.entries())
    .map(([letter, songs]) => ({ letter, songs }))
    .sort((a, b) => {
      if (a.letter === '#') return 1
      if (b.letter === '#') return -1
      return a.letter.localeCompare(b.letter)
    })
}
```

### 2. Accordion State: Local `Set<string>`

- `openLetters: Set<string>` — estado local en SongsPage (NO en store global)
- Inicial: vacío → todas cerradas
- Toggle: `setOpenLetters(prev => { const next = new Set(prev); if (next.has(l)) next.delete(l); else next.add(l); return next })`
- Cuando hay búsqueda activa (`search.length > 0`): ignorar acordeón, mostrar lista flat filtrada
- Comportamiento confirmado: búsqueda colapsa el índice (no hay estado de "which letters were open before search")

### 3. Recent Setlists — Opción A vs B

| Enfoque | Descripción | Pros | Contras |
|---|---|---|---|
| **A: Historial explícito** | Registrar `setlistId` al visitar `SetlistDetailPage`; persiste en localStorage | Funciona offline, robusto, independiente del estado de carga | Requiere instrumentar `SetlistDetailPage` |
| **B: Derivado por `updatedAt`** | Ordenar `setlists[]` por `updatedAt` desc, tomar primeros N | Sin persistencia adicional | `setlists` es ephemeral — no disponible hasta fetch |

**Recomendación: Opción A** — más robusto y offline-first.

### 4. Songs Store compartido

- Crear `client/src/store/songs.store.ts` con Zustand (sin persist — ephemeral)
- `{ songs: Song[], isLoading: boolean, error: string | null, fetchSongs, search }`
- Tanto `SongsPage` como `Sidebar` consumen el mismo store → un solo fetch
- Si `songs.length > 0`, no re-fetch (cache ephemeral de sesión)

### 5. Sidebar: Arquitectura de secciones

```
[Logo]
─────────────────────
[Nav: Canciones | Setlists | Perfil]
─────────────────────
[Section: Canciones]          ← scrollable
  A ▶ (3)
  C ▶ (1)
  ...
─────────────────────
[Section: Setlists]
  📌 Fijados
    · Culto Domingo
  🕐 Recientes
    · Culto Viernes
```

- Sidebar debe tener `overflow-y-auto` para muchas canciones
- Secciones colapsables opcionales (toggle per-section), pero inicialmente siempre abiertas
- Links de canciones en sidebar → `navigate('/songs/:id')` directamente (not via SongsPage)

---

## Recommendation

1. **Crear `songs.store.ts`** — Zustand ephemeral; evita double-fetch sidebar + SongsPage
2. **Crear `AlphabeticAccordion.tsx`** — componente presentacional genérico reutilizable
3. **Refactorizar `SongsPage.tsx`** — consumir songs store, mostrar acordeón (sin búsqueda) / lista flat (con búsqueda)
4. **Extraer `Sidebar.tsx`** de `AppLayout.tsx` — secciones scrollables, canciones por letra + setlists
5. **Extender `setlists.store.ts`** — añadir `pinnedSetlistIds: string[]` y `recentSetlistIds: string[]` (ambos persistidos), con acciones `pinSetlist`, `unpinSetlist`, `recordRecentSetlist`
6. **Instrumentar `SetlistDetailPage`** — llamar `recordRecentSetlist(id)` al montar

---

## Risks

1. **Double fetch sidebar + SongsPage**: mitigado con songs store compartido (ephemeral cache)
2. **Sidebar no aplica en móvil**: secciones son desktop-only (`md:`), bottom nav sin cambios
3. **Canciones con caracteres especiales**: títulos que empiezan con número o símbolo → agrupar bajo `'#'`
4. **Persist migration de setlists store**: añadir campos nuevos a `partialize` es safe (Zustand merge, no reemplaza)
5. **Performance con muchas canciones**: groupByLetter es O(n) — suficiente para bibliotecas de iglesia (≤500 canciones)

---

## Ready for Proposal

**Sí** — scope claro, 100% frontend, sin cambios de API ni DB. Puede proceder a `sdd-propose`.
