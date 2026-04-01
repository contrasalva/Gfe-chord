# Design: songs-alphabetical-index

## Technical Approach

Elevar el estado de canciones a un Zustand store compartido (`songs.store.ts`), extraer el Sidebar de AppLayout a componente dedicado, crear un componente `AlphabeticAccordion` reutilizable, y extender `setlists.store.ts` con pinned/recent IDs persistidos. Función pura `groupSongsByLetter` como utility. Todo frontend, cero cambios server.

## Architecture Decisions

| # | Decision | Choice | Alternatives | Rationale |
|---|----------|--------|-------------|-----------|
| 1 | Songs store location | `client/src/store/songs.store.ts` | Feature folder `features/songs/store/` | Convención existente: `auth.store.ts` y `setlists.store.ts` ambos en `src/store/` |
| 2 | Grouping logic | Función pura en `shared/utils/groupSongsByLetter.ts` | Derivado dentro del store | Testeable independiente, reutilizable en SongsPage y Sidebar sin duplicar |
| 3 | Accordion state | Estado local `useState<Set<string>>` en cada consumidor | Estado en store | No necesita persistencia ni compartirse — cada vista (Page vs Sidebar) tiene sus propias letras expandidas |
| 4 | Sidebar component | `shared/components/Sidebar.tsx` | Inline en AppLayout | AppLayout tiene 94 líneas — sidebar con secciones la llevaría a 200+. Separación de responsabilidades |
| 5 | Search mode | Búsqueda activa → lista flat (bypass acordeón) | Filtrar dentro del acordeón | UX más clara: resultados filtrados no necesitan agrupamiento. Consistente con behavior actual |
| 6 | Songs persistence | Ninguna (ephemeral) | localStorage cache | Songs se refrescan desde API. Cache innecesario dado que el fetch es rápido y evita stale data |
| 7 | '#' group position | Al final (después de Z) | Al inicio | Convención estándar en índices musicales. Grupo infrecuente, no debe desplazar A-Z |

## Data Flow

```
songsService.getAll()
       │
       ▼
 songs.store.ts ─────────────────────────┐
  (songs[], searchQuery, isLoading)      │
       │                                 │
       ├──► SongsPage.tsx                │
       │    └─ groupSongsByLetter()      │
       │       └─ AlphabeticAccordion    │
       │          (local expandedLetters)│
       │                                 │
       └──► Sidebar.tsx ─────────────────┘
            ├─ Songs section
            │  └─ groupSongsByLetter() (compact)
            └─ Setlists section
               └─ setlists.store.ts
                  (pinnedSetlistIds, recentSetlistIds)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `client/src/store/songs.store.ts` | Create | Zustand 5 store: songs[], searchQuery, isLoading, error, fetchSongs(), setSearchQuery() |
| `client/src/shared/utils/groupSongsByLetter.ts` | Create | Función pura: `Song[] → { letter: string; songs: Song[] }[]` ordenado A-Z + '#' al final |
| `client/src/shared/components/AlphabeticAccordion.tsx` | Create | Componente genérico: recibe grupos, maneja toggle de letras expandidas internamente |
| `client/src/shared/components/Sidebar.tsx` | Create | Sidebar desktop: secciones de canciones (agrupadas) y setlists (pinned + recent) |
| `client/src/features/songs/SongsPage.tsx` | Modify | Reemplazar useState local → useSongsStore. Renderizar AlphabeticAccordion o flat list según búsqueda |
| `client/src/shared/components/AppLayout.tsx` | Modify | Reemplazar sidebar inline por `<Sidebar />`. Mantener bottom nav y Routes intactos |
| `client/src/store/setlists.store.ts` | Modify | Añadir `SetlistRef[]` persistidos para `pinnedSetlistIds` y `recentSetlistIds`, con acciones de pin/unpin/recents y `partialize` |

## Interfaces / Contracts

```typescript
// ─── songs.store.ts ─────────────────────────────────────────────────
interface SongsState {
  songs: Song[]
  searchQuery: string
  isLoading: boolean
  error: string | null

  fetchSongs: (search?: string) => Promise<void>
  setSearchQuery: (query: string) => void
}
// No persist — 100% ephemeral

// ─── groupSongsByLetter.ts ──────────────────────────────────────────
interface SongGroup {
  letter: string  // 'A'-'Z' | '#'
  songs: Song[]
}
function groupSongsByLetter(songs: Song[]): SongGroup[]
// Rules: title[0] → uppercase; /[^A-Z]/ → '#'; '#' always last; empty title → '#'

// ─── AlphabeticAccordion.tsx ────────────────────────────────────────
interface AlphabeticAccordionProps {
  groups: SongGroup[]
  onSongClick: (songId: string) => void
  compact?: boolean  // true → sidebar variant (smaller text, less padding)
}
// Internal state: useState<Set<string>>() — initial empty (all collapsed)
// Toggle: click header → add/remove letter from Set

// ─── Sidebar.tsx ────────────────────────────────────────────────────
// No external props — reads from stores directly (useSongsStore, useSetlistsStore)
// Fetches songs on mount if store is empty (dedup: store tracks isLoading)

// ─── setlists.store.ts extension ────────────────────────────────────
interface SetlistRef {
  id: string
  name: string
}

// New fields:
  pinnedSetlistIds: SetlistRef[]   // persisted
  recentSetlistIds: SetlistRef[]   // persisted, max 5, LIFO

// New actions:
  pinSetlist: (ref: SetlistRef) => void
  unpinSetlist: (id: string) => void
  addRecentSetlist: (ref: SetlistRef) => void // prepend, dedup, cap at 5

// partialize update:
  partialize: (state) => ({
    activeSetlistId: state.activeSetlistId,
    currentSongIndex: state.currentSongIndex,
    pinnedSetlistIds: state.pinnedSetlistIds,   // NEW
    recentSetlistIds: state.recentSetlistIds,    // NEW
  })
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `groupSongsByLetter` — sorting, '#' group, empty titles, single letter | Vitest — función pura, sin mocks |
| Unit | `songs.store.ts` — fetchSongs, setSearchQuery | Vitest — `useStore.getState()` directo |
| Unit | `setlists.store.ts` — pin/unpin, addRecent (max 5, dedup) | Vitest — store actions |
| Component | AlphabeticAccordion — expand/collapse, compact variant | Vitest + Testing Library |

## Migration / Rollout

No migration required. Nuevos campos en `setlists.store.ts` (`pinnedSetlistIds`, `recentSetlistIds`) tienen default `[]` — compatible con estado persistido existente. Zustand `persist` ignora campos nuevos en rehydration.

## Open Questions

- [ ] ¿Sidebar debe mostrar canciones incluso sin haber visitado SongsPage? (Recomendación: sí, fetch on mount del sidebar si store vacío)
- [ ] ¿Límite de recientes configurable o hardcoded a 5? (Recomendación: constante `MAX_RECENT_SETLISTS = 5`)
