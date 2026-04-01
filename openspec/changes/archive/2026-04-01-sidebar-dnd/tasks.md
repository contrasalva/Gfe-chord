# Tasks: Sidebar Drag & Drop to Setlist

## Phase 1: Client Foundation

- [x] 1.1 Update `client/package.json` and generated lockfile by installing `sonner` from `client/`.
- [x] 1.2 Extend `client/src/store/setlists.store.ts` with ephemeral `viewingSetlistId`, `lastAddedAt`, `setViewingSetlistId()`, and `notifySetlistUpdated()`, excluding both fields from `partialize`.
- [x] 1.3 Extend `client/src/shared/components/AlphabeticAccordion.tsx` props with `draggable?: boolean`, defaulting to the current non-draggable behavior.

## Phase 2: Client Drag Source and Drop Target

- [x] 2.1 Update `client/src/shared/components/AlphabeticAccordion.tsx` so each `SongRow` uses `useDraggable` only when `draggable` is true, attaches `data: { song }`, and shows `opacity-50` while dragging.
- [x] 2.2 Update `client/src/shared/components/Sidebar.tsx` to read `user.role` from `useAuthStore` and pass `draggable={role !== 'VIEWER'}` to `AlphabeticAccordion`.
- [x] 2.3 Update `client/src/features/setlists/SetlistDetailPage.tsx` to register `useDroppable('setlist-drop-zone')`, set/clear `viewingSetlistId` on mount lifecycle, reload `loadSetlist()` on `lastAddedAt`, and highlight when `isOver`.
- [x] 2.4 Update `client/src/shared/components/AppLayout.tsx` to add the outer `DndContext`, `PointerSensor` with `distance: 8`, `DragOverlay`, and `Toaster`.

## Phase 3: Client Integration Rules

- [x] 3.1 Implement `handleSidebarDrop` in `client/src/shared/components/AppLayout.tsx` to ignore drops outside `setlist-drop-zone`, read the dragged song plus `viewingSetlistId`, call `setlistsService.addSong`, and trigger `notifySetlistUpdated()`.
- [x] 3.2 In `client/src/shared/components/AppLayout.tsx`, map API outcomes to toasts: success for added songs, warning for HTTP 409 duplicates, and error for other failures.
- [x] 3.3 Verify `client/src/features/setlists/SetlistDetailPage.tsx` only exposes an active drop target while a detail page is mounted and preserves backend append-at-end behavior for successful drops.

## Phase 4: Tests and Verification

- [x] 4.1 Add `client/src/store/setlists.store.test.ts` to assert `setViewingSetlistId()` and `notifySetlistUpdated()` update only the new ephemeral fields.
- [x] 4.2 Extend `client/src/shared/components/AlphabeticAccordion.test.tsx` to cover draggable enabled/disabled states, including the VIEWER-disabled affordance.
- [x] 4.3 Add `client/src/shared/components/AppLayout.test.tsx` to mock dnd-kit, `setlistsService`, and toasts for: successful drop into empty/populated setlists, duplicate 409, and drop outside the zone.
- [x] 4.4 Add `client/src/features/setlists/SetlistDetailPage.test.tsx` to verify droppable registration, mount/unmount store sync, highlight on `isOver`, and reload on `lastAddedAt` changes.
- [x] 4.5 Manually verify desktop behavior across `client/src/shared/components/Sidebar.tsx` and `client/src/features/setlists/SetlistDetailPage.tsx`: editor/owner can drag, viewer cannot, and no active drop zone appears off the detail page.
