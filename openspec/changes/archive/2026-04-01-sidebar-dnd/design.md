# Design: Sidebar Drag & Drop to Setlist

## Technical Approach

Elevate a `DndContext` to `AppLayout` to bridge Sidebar (draggable songs) and `SetlistDetailPage` (droppable zone). The existing internal `DndContext` in `SetlistDetailPage` for reorder remains untouched — dnd-kit supports nested contexts, and each handles its own `id` namespace.

Communication flows through two ephemeral Zustand fields (`viewingSetlistId`, `lastAddedAt`) that are NOT persisted to localStorage.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| DnD context placement | Outer `DndContext` in `AppLayout` | Coordinate-based detection; shared single context | dnd-kit requires a common ancestor `DndContext` for cross-component drag. Nested contexts work because the inner (reorder) has its own `SortableContext` items — the outer only reacts to `over.id === 'setlist-drop-zone'`. |
| Reload mechanism | `lastAddedAt: number` timestamp in store | Custom events; direct callback prop; refetch interval | Store-based reactivity is the project's convention (Zustand). A timestamp avoids boolean-flag reset logic — each new value triggers the `useEffect`. |
| Toast library | `sonner` (new dependency) | react-hot-toast; custom component | Sonner: ~3KB gzip, zero-config dark theme, React 19 compatible. Matches project's minimalist dependency approach. |
| Drag activation | `activationConstraint: { distance: 8 }` | `delay` constraint; separate drag handle | Distance-based preserves click behavior on `SongRow` without adding a visible handle. Same pattern already used in `SetlistDetailPage` sensors. |
| Permission check | `draggable` prop driven by `user.role !== 'VIEWER'` from `useAuthStore` | Check at drop time only | Prevents the drag affordance from appearing for unauthorized users — better UX than showing drag then rejecting. |
| DragOverlay | Custom floating component in `AppLayout` | Default dnd-kit clone; none | Default clone inherits sidebar's compact layout. A dedicated overlay gives consistent styling and song title visibility. |

## Data Flow

```
Sidebar                       Store                     SetlistDetailPage
  │                             │                              │
  │ SongRow: useDraggable       │                              │
  │ (id=song.id, data={song})   │ viewingSetlistId ◄───────────┤ useEffect: setViewingSetlistId(id)
  │                             │                              │ cleanup: setViewingSetlistId(null)
  │         drag starts         │                              │
  │ ──────────────────────────► │                              │ useDroppable('setlist-drop-zone')
  │                             │                              │ isOver → visual highlight
  │         onDragEnd           │                              │
  │ ────────► AppLayout ────────┤                              │
  │   over.id='setlist-drop-zone'                              │
  │   setlistsService.addSong(viewingSetlistId, songId)        │
  │   success → notifySetlistUpdated()                         │
  │                             │ lastAddedAt = Date.now() ──► │ useEffect([lastAddedAt])
  │                             │                              │ → loadSetlist()
  │   409 → toast.warning       │                              │
  │   error → toast.error       │                              │
```

## File Changes

| File | Action | Responsibility |
|------|--------|---------------|
| `client/src/store/setlists.store.ts` | Modify | Add `viewingSetlistId`, `lastAddedAt`, `setViewingSetlistId()`, `notifySetlistUpdated()` — ephemeral, excluded from `partialize` |
| `client/src/shared/components/AppLayout.tsx` | Modify | Wrap content in `DndContext` with `PointerSensor` (distance: 8), add `onDragEnd` handler, add `DragOverlay`, add `<Toaster />` from sonner |
| `client/src/shared/components/AlphabeticAccordion.tsx` | Modify | Accept `draggable?: boolean` prop. `SongRow` conditionally wraps in `useDraggable`. When `isDragging`: `opacity-50`. |
| `client/src/features/setlists/SetlistDetailPage.tsx` | Modify | Add `useDroppable('setlist-drop-zone')` on content area. Lifecycle: `setViewingSetlistId(id)` on mount, clear on unmount. `useEffect([lastAddedAt])` triggers `loadSetlist()`. Visual highlight when `isOver`. |
| `client/src/shared/components/Sidebar.tsx` | Modify | Read `user.role` from `useAuthStore`, pass `draggable={role !== 'VIEWER'}` to `AlphabeticAccordion`. |
| `package.json` | Modify | Add `sonner` dependency |

## Interfaces / Contracts

```ts
// setlists.store.ts — NEW fields (ephemeral)
viewingSetlistId: string | null      // set by SetlistDetailPage on mount
lastAddedAt: number                  // 0 = never, Date.now() on each successful drop

// NEW actions
setViewingSetlistId: (id: string | null) => void
notifySetlistUpdated: () => void     // set({ lastAddedAt: Date.now() })
```

```ts
// AlphabeticAccordion — EXTENDED props
interface AlphabeticAccordionProps {
  groups: SongGroup[]
  onSongClick: (song: Song) => void
  compact?: boolean
  draggable?: boolean   // NEW — default false
}
```

```ts
// AppLayout — onDragEnd handler (pseudo)
async function handleSidebarDrop(event: DragEndEvent) {
  if (event.over?.id !== 'setlist-drop-zone') return
  const song = event.active.data.current?.song as Song
  const setlistId = useSetlistsStore.getState().viewingSetlistId
  if (!setlistId || !song) return
  try {
    await setlistsService.addSong(setlistId, { songId: song.id })
    toast.success(`"${song.title}" agregada al setlist`)
    useSetlistsStore.getState().notifySetlistUpdated()
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 409) {
      toast.warning('Esta canción ya está en el setlist')
    } else {
      toast.error('Error al agregar canción')
    }
  }
}
```

```tsx
// DragOverlay — visual component in AppLayout
<DragOverlay>
  {activeSong && (
    <div className="bg-[#2A2D2A] border border-[#754456] rounded-lg
                    px-3 py-2 text-sm text-[#E0E1E3] shadow-lg opacity-90
                    pointer-events-none max-w-[200px] truncate">
      {activeSong.title}
    </div>
  )}
</DragOverlay>
```

```tsx
// Sonner — in AppLayout, after closing </div>
<Toaster theme="dark" position="bottom-right" toastOptions={{
  style: { background: '#2A2D2A', border: '1px solid #3A3D3A', color: '#E0E1E3' }
}} />
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Manual | Full drag flow, 409 toast, permission gate | Desktop browser — verify drag starts after 8px, toast appears, setlist reloads |
| Unit | `notifySetlistUpdated` sets timestamp | Assert store state change |
| Integration | `onDragEnd` handler with mocked service | Verify `addSong` called with correct args; verify toast on 409 |

## Migration / Rollout

No migration required. Install `sonner` (`npm install sonner`). No feature flags — the drag is only visible on desktop (`md:`) where sidebar exists.

## Open Questions

None — all architectural questions were resolved in the exploration phase.
