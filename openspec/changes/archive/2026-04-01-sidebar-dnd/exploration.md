# Exploration: sidebar-dnd

**Change**: sidebar-dnd
**Date**: 2026-04-01
**Status**: Ready for Proposal

---

## Current State

### SetlistDetailPage (`client/src/features/setlists/SetlistDetailPage.tsx`)
- Obtiene el setlist activo vía `useParams<{ id: string }>()` — la URL es `/setlists/:id`.
- El setlist se almacena en estado **local** (`useState<Setlist | null>`), cargado via `setlistsService.getById(id)`.
- Ya usa `@dnd-kit/core` + `@dnd-kit/sortable` para **reordenamiento interno** de canciones (drag & drop entre filas del propio setlist).
- Para agregar canciones usa `setlistsService.addSong(setlistId, { songId })` → `POST /setlists/:id/songs`.
- Tras agregar llama `loadSetlist()` para refrescar el estado local.
- `SetlistSong` shape: `{ id, setlistId, songId, order, transposeOffset, song: { id, title, artist, key, content } }`.
- El store expone `activeSetlistId` (persisted) pero **no** el setlist completo hidratado; el setlist completo vive solo en estado local del componente.

### Backend — `POST /setlists/:id/songs`
- Ya existe y funciona: valida ownership (ADMIN o dueño), verifica duplicado (409 `DUPLICATE_SONG`), verifica que la canción existe (404), calcula `order` máximo + 1.
- **El backend ya maneja el caso de duplicado** con un error 409 explícito.
- Retorna `{ ok: true, setlistSong }` con shape `setlistSongSelect`.

### Sidebar (`client/src/shared/components/Sidebar.tsx`)
- No tiene acceso al `id` del setlist activo que el usuario está viendo — solo conoce `pinnedSetlistIds` y `recentSetlistIds` del store.
- Renderiza `<AlphabeticAccordion compact onSongClick={handleSongClick} />`.
- `handleSongClick` actualmente navega a `/songs/:id`.

### AlphabeticAccordion (`client/src/shared/components/AlphabeticAccordion.tsx`)
- `SongRow` es un `<button>` con `onClick={() => onSongClick(song)}`.
- Acepta `compact` prop que ajusta paddings; touch target ya es `min-h-[44px]`.
- Props de la interfaz: `{ groups, onSongClick, compact? }` — no acepta `onSongDragStart` ni nada relacionado con drag.

### @dnd-kit — estado actual
- `@dnd-kit/core@6.3.1` ya instalado.
- `@dnd-kit/sortable@10.0.0` ya instalado.
- Solo `SetlistDetailPage` lo usa (para reordenar canciones del setlist).

### Toast / Notificaciones
- **No existe ningún sistema de toast/notificación** en el proyecto.
- No hay librerías instaladas (sonner, react-hot-toast, react-toastify, notistack).
- Actualmente los errores se manejan silenciosamente (catch sin UI) o con `window.confirm`.

---

## Affected Areas

- `client/src/shared/components/AlphabeticAccordion.tsx` — debe permitir drag desde `SongRow`
- `client/src/shared/components/Sidebar.tsx` — necesita conocer el setlistId activo y manejar el drop
- `client/src/features/setlists/SetlistDetailPage.tsx` — puede necesitar exponer el drop zone o recibir la canción via store
- `client/src/store/setlists.store.ts` — podría exponer `activeSetlistId` (ya lo tiene persisted) como mecanismo de comunicación sidebar → detail
- **Toast system** — necesita crearse desde cero (componente propio o librería)

---

## Key Questions Answered

### ¿Cómo sabe el Sidebar qué setlist está activo?

**Problema**: El Sidebar NO sabe qué setlist está activo. El `SetlistDetailPage` mantiene el setlist en estado local. El store tiene `activeSetlistId` (persisted) pero solo se setea cuando el usuario entra al **modo presentación** (via `setActiveSetlist`).

**Opciones**:
1. **Derivar de URL**: Leer `useLocation().pathname` en Sidebar, extraer el id con regex `/setlists/([^/]+)$`. Funciona hoy sin cambios de store.
2. **Nuevo campo en store** `viewingSetlistId: string | null` que `SetlistDetailPage` setea en `useEffect([id])`. Más explícito, pero requiere hydration.
3. **Ambos**: `SetlistDetailPage` actualiza `viewingSetlistId` en el store, el Sidebar lo consume.

**Recomendación**: Opción 3 — `SetlistDetailPage` hace `setViewingSetlistId(id)` en mount y `clearViewingSetlistId()` en unmount. Más robusto que regex en URL.

### ¿El backend ya soporta agregar canciones?

**Sí, completamente.** `POST /setlists/:id/songs` con `{ songId }` ya existe, valida duplicados (409), y funciona para el flujo de `AddSongModal`.

### ¿Existe toast?

**No.** Hay que crearlo. Opciones:
1. **Librería `sonner`** — minimalista, API simple, compatible con React 19, sin config extra.
2. **Toast propio** — un componente simple `<Toast>` con Zustand o useState en AppLayout.

**Recomendación**: `sonner` — evita reinventar la rueda, la API es 2 líneas, y es la estándar en el ecosistema Vite/React moderno.

### ¿`SongRow` puede ser draggable sin romper el click?

**Sí, con precaución.** `@dnd-kit` distingue drag de click via `activationConstraint: { distance: 8 }` (mismo patrón que ya usa `SetlistDetailPage`). El `<button>` existente puede convertirse en `useDraggable` wrapeando el div o el propio `SongRow`. La clave: separar el drag handle del click area, o usar la restricción de distancia.

---

## Approaches

### Approach 1: Drop Zone en SetlistDetailPage (contenedor de drop)

`SetlistDetailPage` agrega un `<DroppableZone>` sobre su `<DndContext>` global.
El Sidebar envuelve cada `SongRow` con `useDraggable`.
El drop event llega al `DndContext` más cercano... **PROBLEMA**: Los dos `DndContext` son independientes (sidebar y detail están en árboles separados). No es posible compartir un drag entre dos `DndContext` hermanos sin elevar el contexto a un ancestro común.

- Pros: Más aislado
- Cons: Requiere elevar `DndContext` a `AppLayout` — cambio de mayor impacto. Complejidad alta.
- Effort: High

### Approach 2: Drag sin Drop Zone — comunicación via store

Al soltar sobre el área del setlist (drop detection visual), el Sidebar llama directamente `setlistsService.addSong(viewingSetlistId, { songId })`.
No usa el sistema de drop de dnd-kit — usa el `DragOverlay` y coordenadas manuales para detectar si se soltó sobre la columna main.

- Pros: No requiere modificar SetlistDetailPage
- Cons: Detección de drop por coordenadas es frágil; rompe el modelo mental de dnd-kit
- Effort: High, fragile

### Approach 3: DndContext elevado a AppLayout + Drop Zone en SetlistDetailPage ✅ RECOMENDADO

Elevar un `DndContext` al `AppLayout` que maneje únicamente el drag del sidebar.
`SongRow` usa `useDraggable({ id: song.id, data: { song } })`.
`SetlistDetailPage` usa `useDroppable({ id: 'setlist-drop-zone' })`.
Al `onDragEnd` en el `DndContext` del `AppLayout`, si `over.id === 'setlist-drop-zone'` → llama `setlistsService.addSong(viewingSetlistId, { songId })`.
El `DndContext` interno del `SetlistDetailPage` (para reordenar) se mantiene separado e independiente.

- Pros: Patrón correcto de dnd-kit. Los dos contextos no colisionan (el interno de reorder ignora drops externos). Limpio.
- Cons: `AppLayout` toca un poco más de lógica. Necesita `viewingSetlistId` en store.
- Effort: Medium

### Approach 4: Solo feedback visual con click (sin drag real)

Agregar un botón "+" en cada `SongRow` cuando la ruta activa es `/setlists/:id`.
No drag & drop real — UX más simple.

- Pros: Sin dnd-kit complejidad. Sin problemas de contexto.
- Cons: No cumple el requisito de drag & drop. Descartado.
- Effort: Low (pero no satisface el requisito)

---

## Architecture: Approach 3 Detail

```
AppLayout
  ├── <DndContext onDragEnd={handleSidebarDrop}>   ← NEW (solo sidebar-to-setlist)
  │     ├── Sidebar
  │     │     └── AlphabeticAccordion
  │     │           └── SongRow → useDraggable({ id: song.id, data: { song } })
  │     └── main
  │           └── SetlistDetailPage
  │                 ├── <useDroppable id="setlist-drop-zone">   ← NEW
  │                 └── <DndContext onDragEnd={handleReorder}>   ← EXISTING (reorder interno)
```

**Store changes needed**:
```ts
// setlists.store.ts — add:
viewingSetlistId: string | null
setViewingSetlistId: (id: string) => void
clearViewingSetlistId: () => void
```

**SetlistDetailPage changes**:
```ts
useEffect(() => {
  setViewingSetlistId(id!)
  return () => clearViewingSetlistId()
}, [id])
```

**AppLayout handleSidebarDrop**:
```ts
const handleSidebarDrop = async (event: DragEndEvent) => {
  if (event.over?.id !== 'setlist-drop-zone') return
  const song = event.active.data.current?.song as Song
  const setlistId = useSetlistsStore.getState().viewingSetlistId
  if (!setlistId || !song) return
  try {
    await setlistsService.addSong(setlistId, { songId: song.id })
    toast.success(`"${song.title}" agregada al setlist`)
    // Signal SetlistDetailPage to reload — via store flag or event
  } catch (e: any) {
    if (e?.response?.status === 409) toast.error('La canción ya está en el setlist')
    else toast.error('Error al agregar la canción')
  }
}
```

**Reload after drop**: `SetlistDetailPage` necesita saber que se agregó una canción desde afuera.
Opciones:
- `pendingReload: boolean` flag en store (simple)
- Custom event `window.dispatchEvent(new CustomEvent('setlist-song-added'))` (desacoplado)
- Refactor para que `SetlistDetailPage` escuche `viewingSetlistId` changes (ya tiene effect)

**Recomendación**: Flag `lastAddedAt: number | null` en store — SetlistDetailPage hace effect sobre él para reload.

---

## Toast: Sonner

```bash
npm install sonner
```

```tsx
// AppLayout.tsx
import { Toaster } from 'sonner'
// <Toaster position="bottom-right" theme="dark" />

// En handlers:
import { toast } from 'sonner'
toast.success('Canción agregada al setlist')
toast.error('La canción ya está en el setlist')
```

---

## Recommendation

**Approach 3** — DndContext elevado a AppLayout + Drop Zone en SetlistDetailPage.

Razones:
1. Es el patrón correcto de `@dnd-kit` para drag cross-component.
2. No rompe el DnD de reordenamiento existente.
3. Centraliza la lógica de "drop desde sidebar" en AppLayout, donde tiene visibilidad de ambos lados.
4. El store solo necesita un campo extra (`viewingSetlistId`) — bajo acoplamiento.
5. Sonner para toast — sin inventar infraestructura nueva.

---

## Risks

1. **Conflicto de DndContext anidados**: El DndContext de AppLayout y el interno de SetlistDetailPage deben ser cuidadosamente separados. dnd-kit soporta contextos anidados, pero el outer context NO debe interferir con el reorder interno. Mitigación: el drop de sidebar solo activa cuando `over.id === 'setlist-drop-zone'`; el reorder interno tiene sus propios `SortableContext` items.

2. **Sidebar visible solo en `md:`**: El drag & drop solo funciona en desktop. En móvil no hay sidebar — no hay problema. Pero hay que asegurarse de que el droppable no se registre en mobile.

3. **Toast y UX del setlist activo**: Si el usuario está en `/setlists` (lista de setlists) y arrastra, `viewingSetlistId` es null — la operación no hace nada. Hay que comunicar visualmente que el drop solo funciona cuando hay un setlist abierto. Mitigación: el DragOverlay puede mostrar un hint diferente cuando no hay setlist activo.

4. **Reload del setlist**: Después del drop, `SetlistDetailPage` necesita recargar. Si el reload es lento (red), el usuario puede no ver la canción inmediatamente. Mitigación: optimistic update + reload background.

5. **Permisos**: Solo owner o ADMIN puede agregar canciones. Si el usuario es VIEWER y arrastra, el backend devuelve 403. Mitigación: verificar `isOwnerOrAdmin` antes del drag o manejar el 403 con toast específico.

6. **DragOverlay**: Sin `DragOverlay`, el elemento "fantasma" del drag usa el elemento original. En un sidebar compacto el visual puede verse extraño. Agregar `DragOverlay` mejora UX.

---

## Ready for Proposal

**Sí.** Todos los puntos clave están resueltos. El approach está definido. El scope es acotado: 4-6 archivos a modificar, 0 cambios de backend.
