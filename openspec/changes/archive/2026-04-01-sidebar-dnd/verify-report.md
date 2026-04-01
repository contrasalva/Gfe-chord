# Verification Report

**Change**: sidebar-dnd  
**Version**: N/A

---

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 15 |
| Tasks complete | 14 |
| Tasks incomplete | 1 |

Incomplete tasks:
- [ ] 4.5 Manually verify desktop behavior across `client/src/shared/components/Sidebar.tsx` and `client/src/features/setlists/SetlistDetailPage.tsx`: editor/owner can drag, viewer cannot, and no active drop zone appears off the detail page.

---

### Build & Tests Execution

**Type check**: ✅ Passed (`npx tsc --noEmit`)
```text
(no output; exit code 0)
```

**Tests**: ✅ 54 passed / ❌ 0 failed / ⚠️ 0 skipped (`npx vitest run`)
```text
RUN  v4.1.2 /home/zakur/proyects/gfe-chord/client


Test Files  6 passed (6)
     Tests  54 passed (54)
  Start at  16:47:18
  Duration  1.34s (transform 331ms, setup 339ms, import 748ms, tests 453ms, environment 3.79s)
```

**Coverage**: ➖ Not configured

---

### Spec Compliance Matrix

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Drag from Sidebar to Setlist Detail | Drag song to empty setlist | `client/src/shared/components/AppLayout.test.tsx > drops on setlist-drop-zone with valid viewingSetlistId → calls addSong, success toast, notifySetlistUpdated`; `client/src/features/setlists/SetlistDetailPage.test.tsx > calls useDroppable with "setlist-drop-zone"`; `client/src/features/setlists/SetlistDetailPage.test.tsx > when lastAddedAt > 0: loadSetlist is called again` | ✅ COMPLIANT |
| Drag from Sidebar to Setlist Detail | Drag song to populated setlist | (none found for populated-setlist append-at-end behavior) | ❌ UNTESTED |
| Drag from Sidebar to Setlist Detail | Drag duplicate song to setlist | `client/src/shared/components/AppLayout.test.tsx > drop that causes 409 → shows warning toast "Esta canción ya está en el setlist"` | ⚠️ PARTIAL |
| Drag from Sidebar to Setlist Detail | Drop outside droppable zone | `client/src/shared/components/AppLayout.test.tsx > drop outside setlist-drop-zone → does NOT call addSong` | ✅ COMPLIANT |
| Drag from Sidebar to Setlist Detail | VIEWER attempts to drag | `client/src/shared/components/AlphabeticAccordion.test.tsx > draggable=false: useDraggable is called with disabled=true`; `client/src/shared/components/AlphabeticAccordion.test.tsx > draggable=false (default): SongRow renders without opacity-50` | ⚠️ PARTIAL |
| Drag from Sidebar to Setlist Detail | Drag when not in SetlistDetailPage | `client/src/features/setlists/SetlistDetailPage.test.tsx > on unmount: calls setViewingSetlistId(null)` | ⚠️ PARTIAL |

**Compliance summary**: 2/6 scenarios compliant

---

### Correctness (Static — Structural Evidence)
| Requirement | Status | Notes |
|------------|--------|-------|
| Allow dragging from sidebar into SetlistDetailPage droppable zone | ✅ Implemented | `AppLayout.tsx` adds outer `DndContext` + `handleSidebarDrop`; `AlphabeticAccordion.tsx` attaches `useDraggable`; `SetlistDetailPage.tsx` registers `useDroppable({ id: 'setlist-drop-zone' })`. |
| Desktop-only availability (`md:` and above) | ✅ Implemented | Drag source exists only in `Sidebar.tsx`, and the sidebar is `hidden md:flex`; mobile uses bottom nav instead. |
| Prevent duplicate drops | ✅ Implemented | `AppLayout.tsx` maps HTTP 409 from `setlistsService.addSong()` to a warning toast and does not call `notifySetlistUpdated()` on failure. |
| Prevent VIEWER drag | ✅ Implemented | `Sidebar.tsx` passes `draggable={user?.role !== 'VIEWER'}` and `AlphabeticAccordion.tsx` disables `useDraggable` when `draggable` is false. |
| Drop zone active only on detail page | ✅ Implemented | `SetlistDetailPage.tsx` sets `viewingSetlistId` on mount, clears it on unmount, and is the only file registering `setlist-drop-zone`. |
| Exact duplicate-toast copy from spec | ⚠️ Partial | Spec says `"Ya está en el setlist"`; implementation and tests use `"Esta canción ya está en el setlist"`. |

---

### Coherence (Design)
| Decision | Followed? | Notes |
|----------|-----------|-------|
| Outer `DndContext` in `AppLayout` | ✅ Yes | Implemented in `client/src/shared/components/AppLayout.tsx`. |
| Ephemeral Zustand fields `viewingSetlistId` and `lastAddedAt` excluded from persistence | ✅ Yes | Implemented in `client/src/store/setlists.store.ts`; `partialize` persists only navigation state. |
| `lastAddedAt` reload mechanism | ✅ Yes | `SetlistDetailPage.tsx` reloads via `useEffect([lastAddedAt])`. |
| Toast library `sonner` | ✅ Yes | `client/package.json` includes `sonner`; `AppLayout.tsx` renders `<Toaster />`. |
| PointerSensor with `distance: 8` | ✅ Yes | Implemented in `AppLayout.tsx`; reorder DnD in `SetlistDetailPage.tsx` also keeps distance activation. |
| Permission gate via `user.role !== 'VIEWER'` | ✅ Yes | Implemented in `Sidebar.tsx`. |
| Custom `DragOverlay` in `AppLayout` | ✅ Yes | Implemented with floating song title card. |

---

### Issues Found

**CRITICAL** (must fix before archive):
- No passing test proves the `Drag song to populated setlist` scenario, specifically the required append-at-end behavior.

**WARNING** (should fix):
- The duplicate warning toast copy does not exactly match the spec: implementation/tests use `"Esta canción ya está en el setlist"`, while the spec requires `"Ya está en el setlist"`.
- `openspec/changes/sidebar-dnd/tasks.md` still has task `4.5` unchecked, so manual desktop verification was not recorded.
- There is no direct automated test that renders `Sidebar` with a `VIEWER` user and proves the permission wiring end-to-end.
- There is no router-level automated test proving the drop zone is not visible/active outside `SetlistDetailPage`; current evidence only covers store cleanup on unmount.

**SUGGESTION** (nice to have):
- Add an integration test that renders `AppLayout`, `Sidebar`, and `SetlistDetailPage` together and exercises real drag/drop behavior for empty, populated, duplicate, VIEWER, and non-detail-page cases.

---

### Verdict
FAIL

Implementation is structurally aligned and the suite passes, but verification does not fully prove spec compliance because one required scenario is untested and several others are only partially evidenced.
