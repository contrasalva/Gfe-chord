# Tasks: songs-alphabetical-index

## Phase 1: Foundation

- [x] 1.1 Crear `groupSongsByLetter` con tipos exportados y orden A-Z + `#` al final; títulos vacíos/símbolos → `#` — `client/src/shared/utils/groupSongsByLetter.ts`
- [x] 1.2 Crear `useSongsStore` ephemeral con `songs`, `searchQuery`, `isLoading`, `error`, `fetchSongs(search?)`, `setSearchQuery` y dedupe básico de carga — `client/src/store/songs.store.ts`
- [x] 1.3 Extender `useSetlistsStore` con `pinnedSetlistIds`, `recentSetlistIds`, `pinSetlist`, `unpinSetlist`, `addRecentSetlist`, `MAX_RECENT_SETLISTS = 5` y `partialize` persistente — `client/src/store/setlists.store.ts`

## Phase 2: Components

- [x] 2.1 Crear `AlphabeticAccordion` reutilizable con props tipadas, `useState<Set<string>>`, toggle por teclado/click y variante `compact` — `client/src/shared/components/AlphabeticAccordion.tsx`
- [x] 2.2 Crear `Sidebar` desktop sin props; leer songs/setlists stores, hacer fetch de canciones si el store está vacío y renderizar secciones de canciones, fijados y recientes — `client/src/shared/components/Sidebar.tsx`
- [x] 2.3 Extraer la navegación desktop compartida de `AppLayout` hacia `Sidebar`, manteniendo logo y links existentes sin alterar bottom nav móvil — `client/src/shared/components/AppLayout.tsx`

## Phase 3: SongsPage

- [x] 3.1 Migrar `SongsPage` de estado local a `useSongsStore`, conservando debounce de 300ms y manejo de loading/error — `client/src/features/songs/SongsPage.tsx`
- [x] 3.2 Integrar `groupSongsByLetter` + `AlphabeticAccordion`; sin búsqueda mostrar acordeón cerrado por defecto, con búsqueda mostrar lista flat filtrada — `client/src/features/songs/SongsPage.tsx`
- [x] 3.3 Extraer/reutilizar el item clickeable de canción para que SongsPage y Sidebar naveguen directo a `/songs/:id` con touch targets ≥44px — `client/src/features/songs/SongsPage.tsx`, `client/src/shared/components/Sidebar.tsx`

## Phase 4: Sidebar

- [x] 4.1 Construir sección compacta de canciones en sidebar visible solo en `md:` o superior; en móvil NO debe renderizarse — `client/src/shared/components/Sidebar.tsx`
- [x] 4.2 Construir secciones “Setlists fijados” y “Recientes” con acciones pin/unpin y estados vacíos claros — `client/src/shared/components/Sidebar.tsx`
- [x] 4.3 Registrar `addRecentSetlist` al entrar a detalle de setlist y al navegar desde listados para cubrir navegación normal y deep-link — `client/src/features/setlists/SetlistsPage.tsx`, `client/src/features/setlists/SetlistDetailPage.tsx`

## Phase 5: Wiring & Polish

- [x] 5.1 Añadir pruebas unitarias de agrupamiento: A-Z, `#`, títulos vacíos y orden final de `#` — `client/src/shared/utils/groupSongsByLetter.test.ts`
- [x] 5.2 Añadir pruebas de stores: `fetchSongs`/`setSearchQuery`, pin/unpin, recientes LIFO con dedupe y tope 5 — `client/src/store/songs.store.test.ts`, `client/src/store/setlists.store.test.ts`
- [x] 5.3 Añadir pruebas del acordeón: expand/collapse, keyboard navigation, `compact` variant y links clickeables — `client/src/shared/components/AlphabeticAccordion.test.tsx`
- [x] 5.4 Revisar estilos finales de sidebar/page para targets ≥44px, jerarquía visual y consistencia Tailwind v4/Lucide — `client/src/shared/components/Sidebar.tsx`, `client/src/features/songs/SongsPage.tsx`, `client/src/shared/components/AppLayout.tsx`
