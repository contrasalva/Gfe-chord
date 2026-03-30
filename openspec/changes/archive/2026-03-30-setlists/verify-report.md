# Verification Report — Setlists

**Change**: setlists  
**Project**: gfe-chord  
**Artifact store**: hybrid  
**Date**: 2026-03-30

## Executive Summary

Resultado: **PASS WITH WARNINGS**.

La ronda de fixes críticos SÍ quedó aplicada: frontend y backend vuelven a estar alineados para remove/patch por `SetlistSong.id`, reorder por `{ id, order }`, share por path param, recarga del setlist después de agregar canción, touch targets mínimos, reemplazo del emoji por `Info` de Lucide, y ruta de presentación fuera del nav shell. Además, `npx tsc --noEmit` pasa en `client/` y `server/`.

LO QUE SIGUE FLOJO es la evidencia runtime: no hay tests del feature ni `test_command` configurado, así que los escenarios conductuales siguen **UNTESTED** por política de este proyecto. También quedó deriva documental entre spec/design y la implementación final ya corregida.

## Completeness

| Metric | Value |
|---|---:|
| Tasks total | 23 |
| Tasks complete | 22 |
| Tasks incomplete | 1 |

### Incomplete tasks

- [ ] 5.3 Verify the integrated flow against `openspec/changes/setlists/specs/setlists/spec.md`

## Build & Type Check Execution

### TypeScript — client

**Command**: `cd /home/zakur/proyects/gfe-chord/client && npx tsc --noEmit`

```text
TYPECHECK_OK
```

### TypeScript — server

**Command**: `cd /home/zakur/proyects/gfe-chord/server && npx tsc --noEmit`

```text
TYPECHECK_OK
```

### Build

**Status**: ➖ No configurado / no ejecutado  
`openspec/config.yaml` no define `rules.verify.build_command`, y la instrucción operativa del repositorio prohíbe ejecutar builds no solicitados.

## Testing Status

### Test discovery

- `client/src/features/setlists/**/*.test.*` → no files found
- `client/src/features/setlists/**/*.spec.*` → no files found
- `server/src/**/*.test.*` → no files found
- `openspec/config.yaml` → no `rules.verify.test_command`
- `openspec/config.yaml` → no `rules.verify.coverage_threshold`

### Test execution

**Status**: ➖ No configurado / no ejecutado

No existe runner de tests configurado en OpenSpec para verify y no se encontraron archivos de test relacionados al cambio. Por instrucción explícita de esta verificación, los escenarios conductuales se marcan como **UNTESTED (WARNING, no CRITICAL)**.

## Spec Compliance Matrix (behavioral evidence)

| Requirement | Scenario | Test | Result |
|---|---|---|---|
| Backend | LEADER creates setlist → 201 Created + ID | (none found) | ⚠️ UNTESTED |
| Backend | MEMBER attempts to create setlist → 403 | (none found) | ⚠️ UNTESTED |
| Backend | LEADER accesses another LEADER setlist not shared → 403/404 | (none found) | ⚠️ UNTESTED |
| Backend | MEMBER accesses shared setlist → 200 | (none found) | ⚠️ UNTESTED |
| Backend | Reorder handles `@@unique(setlistId, order)` safely | (none found) | ⚠️ UNTESTED |
| Backend | Adding same song twice → rejected | (none found) | ⚠️ UNTESTED |
| Backend | `transposeOffset` outside `-6..6` → rejected | (none found) | ⚠️ UNTESTED |
| Frontend | `SetlistsPage` renders only authorized setlists | (none found) | ⚠️ UNTESTED |
| Frontend | `SetlistDetailPage` shows drag handles only for owner/admin | (none found) | ⚠️ UNTESTED |
| Frontend | `SetlistSongPage` enters presentation mode without nav shell | (none found) | ⚠️ UNTESTED |
| Frontend | Transpositor applies `baseOffset + sessionDelta` instantly | (none found) | ⚠️ UNTESTED |

**Compliance summary**: 0/11 escenarios probados por test aprobado; 11/11 permanecen **UNTESTED** por ausencia de tests/configuración.

## Correctness (Static — Structural Evidence)

| Requirement | Status | Notes |
|---|---|---|
| Prisma schema additions | ✅ Implemented | `transposeOffset`, `SetlistShare.user`, `User.sharedSetlists`, `Setlist.shares` presentes en `server/prisma/schema.prisma`. |
| CRUD + role-based backend access | ✅ Implemented | `server/src/routes/setlists.routes.ts` aplica reglas inline para ADMIN / EDITOR / VIEWER según spec y diseño. |
| Song management endpoints | ✅ Implemented | Add/remove/patch/reorder existen; duplicate rejection, gap closing y validación `-6..6` presentes. |
| Reorder transaction strategy | ✅ Implemented | `PUT /:id/songs/reorder` usa `$transaction` + órdenes temporales negativas. |
| Sharing flow | ✅ Implemented | Frontend y backend quedaron alineados en `POST /api/setlists/:id/share/:userId` sin body. |
| `SetlistsPage` authorized list | ✅ Implemented | El filtro real vive en backend; la página renderiza la respuesta autorizada. |
| `SetlistDetailPage` owner/admin controls | ✅ Implemented | Drag handle, share, delete, transpose y remove se muestran sólo para owner/admin. |
| Presentation mode route | ✅ Implemented | `SetlistSongPage` sale del shell en `client/src/App.tsx`; `AppLayout.tsx` ya no monta esa ruta. |
| Dual transposition | ✅ Implemented | `finalOffset = transposeOffset + sessionDelta` en `SetlistSongPage.tsx`. |

## Critical Fix Verification

### Fix 1 — remove/patch must use `setlistSong.id`

**Status**: ✅ Fixed

- `SetlistDetailPage.tsx` llama `handleRemoveSong(setlistSong.id)`.
- `SetlistDetailPage.tsx` llama `handleTransposeChange(setlistSong.id, ...)`.
- `setlists.service.ts` documenta y usa `setlistSongId` para `removeSong` y `patchSong`.
- `server/src/routes/setlists.routes.ts` resuelve `:songId` contra `SetlistSong.id`.

### Fix 2 — reorder payload must use `{ id, order }`

**Status**: ✅ Fixed

- `setlists.service.ts` define `ReorderSongsPayload { id: string; order: number }`.
- `SetlistDetailPage.tsx` genera `reordered.map((s) => ({ id: s.id, order: s.order }))`.
- Backend valida `songs: [{ id, order }]` en `reorderSchema`.

### Fix 3 — share must use path param, no body

**Status**: ✅ Fixed

- `setlists.service.ts` ejecuta `api.post(`/setlists/${id}/share/${userId}`)`.
- `server/src/routes/setlists.routes.ts` expone `POST /:id/share/:userId`.

### Fix 4 — add-song callback must reload setlist

**Status**: ✅ Fixed

- `AddSongModal.tsx` define `onSongAdded: () => void`.
- `AddSongModal.tsx` ya no depende de `data.setlist`; invoca `onSongAdded()`.
- `SetlistDetailPage.tsx` implementa `handleSongAdded()` cerrando modal y llamando `loadSetlist()`.

## Warning Fix Verification

### Warning Fix 1 — touch targets ≥ 44px

**Status**: ✅ Fixed

- `SetlistDetailPage.tsx` transpose/remove/drag/header actions usan `min-w-[44px]` y/o `min-h-[44px]`.
- `AddSongModal.tsx` botón add usa `min-w-[44px] min-h-[44px]`.
- `ShareModal.tsx` botón revoke usa `min-w-[44px] min-h-[44px]`.

### Warning Fix 2 — no emoji in `ShareModal.tsx`

**Status**: ✅ Fixed

- El helper usa `<Info />` desde `lucide-react`.
- No queda rastro del emoji `💡` en el archivo verificado.

### Warning Fix 3 — presentation route must be outside nav shell

**Status**: ✅ Fixed

- `client/src/App.tsx` declara `/setlists/:id/songs/:index` como ruta standalone protegida.
- `client/src/shared/components/AppLayout.tsx` sólo contiene `/setlists` y `/setlists/:id` dentro del shell con bottom nav.

## Coherence (Design)

| Decision | Followed? | Notes |
|---|---|---|
| Single migration for schema additions | ✅ Yes | La migración `20260330035420_add_setlist_transpose_and_share_relation` agrupa `transposeOffset` + FK de `SetlistShare`. |
| Inline access control per endpoint | ✅ Yes | `setlists.routes.ts` sigue el patrón inline descrito en el diseño. |
| VIEWER shared-only access policy | ✅ Yes | `GET /api/setlists` filtra VIEWER sólo por `shares.some({ userId })`. |
| Zustand with `partialize` | ✅ Yes | `activeSetlistId` y `currentSongIndex` persisten; `sessionDeltas` queda efímero. |
| Dual transposition model | ✅ Yes | `SetlistSongPage` suma offset persistido + delta de sesión. |
| `@dnd-kit` for reorder UX | ✅ Yes | `DndContext`, `SortableContext`, `useSortable`, `arrayMove` en `SetlistDetailPage.tsx`. |
| Workbox cache for `/api/setlists` | ✅ Yes | `client/vite.config.ts` usa `StaleWhileRevalidate` con `setlists-cache`. |
| Presentation mode outside shell | ✅ Yes | Implementado en `App.tsx`, coherente con el objetivo funcional del diseño. |
| Design/spec API contracts fully up to date | ⚠️ No | La implementación final corregida ya no coincide 100% con `spec.md` / `design.md` para share y nomenclatura de payload/params. |

## Issues Found

### CRITICAL

None.

### WARNING

1. **No automated tests exist for the change**, no test command is configured, and all 11 behavioral scenarios remain **UNTESTED**.
2. **`tasks.md` still leaves task 5.3 unchecked**, even though this verification rerun was performed. Eso afecta la trazabilidad de archive.
3. **OpenSpec artifacts are partially stale**:
   - `spec.md` todavía documenta `POST /api/setlists/:id/share` con body `{ userId }`.
   - `spec.md` todavía documenta reorder como `{ songId, order }`.
   - La implementación final verificada usa `POST /api/setlists/:id/share/:userId` y reorder con `{ id, order }`.
   - El param `:songId` en PATCH/DELETE se usa semánticamente como `SetlistSong.id`, no como `Song.id`.

### SUGGESTION

1. Agregar tests mínimos de integración para los 7 escenarios backend críticos: creación por rol, acceso compartido, duplicate rejection, transpose bounds y reorder transaction safety.
2. Agregar al menos 2 tests frontend: drag handles por permisos y presentation route fuera del shell.
3. Actualizar `spec.md`, `design.md` y `tasks.md` para que el audit trail quede consistente con la implementación aprobada.

## Verdict

**PASS WITH WARNINGS**

La implementación YA NO presenta los fallos críticos del reporte anterior y pasa type-check en client/server. No está bloqueada técnicamente, pero sigue faltando lo más importante para un cierre serio de SDD: evidencia automática de comportamiento y artefactos OpenSpec completamente alineados.

## Verification Metadata

- **Status**: success
- **Artifacts**: `openspec/changes/setlists/verify-report.md` + Engram `sdd/setlists/verify-report`
- **Next recommended**: sdd-apply (solo si quieren cerrar warnings de tests/documentación) o sdd-archive si aceptan esas advertencias
- **Risks**: ausencia de tests puede esconder regresiones futuras; drift documental puede confundir una siguiente iteración
- **Skill resolution**: injected
