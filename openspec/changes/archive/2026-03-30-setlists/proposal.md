# Proposal: Setlists

## Intent
Permitir a los líderes (ADMIN/LEADER) crear, gestionar y compartir listas de canciones (setlists) con transposición específica, y a los miembros (MEMBER/VIEWER) visualizar los setlists que les fueron compartidos.

## Scope

### In Scope
- Corrección de esquema de BD (`transposeOffset` en `SetlistSong`, relación en `SetlistShare`) + migración.
- CRUD de Setlists en backend (`server/src/routes/setlists.routes.ts`).
- CRUD de Setlists en frontend (`client/src/features/setlists`).
- Reordenamiento de canciones con `@dnd-kit` (drag & drop touch-friendly).
- Transposición global por canción dentro del setlist (`transposeOffset`).
- Compartir setlists con usuarios específicos (MVP de `SetlistShare`).
- Modo presentación (navegación prev/next entre canciones del setlist).

### Out of Scope
- Tokens públicos para compartir sin login (deferred a Fase 5).
- Offline writes (POST/PUT/DELETE offline). Solo online operations.
- Exportación a PDF.

## Approach
1. **Schema Fix**: Añadir `transposeOffset Int @default(0)` a `SetlistSong` y la relación `@relation` a `SetlistShare` en Prisma. Crear y correr la migración.
2. **Backend (Server)**: Crear endpoints REST bajo `/api/setlists`. Usar `prisma.$transaction` para el reordenamiento mitigando colisiones del constraint `[setlistId, order]`.
3. **Frontend (Client)**: Crear la feature `setlists` con Zustand store, UI components con Tailwind v4 y React 19, integración de `@dnd-kit` para reordenar, y la vista de presentación.
4. **Offline/PWA**: Las operaciones de escritura serán solo online, la caché offline (GET) se manejará con Workbox StaleWhileRevalidate.

## Affected Areas

| Area | Impact | Description | Módulo | Offline Impact |
|------|--------|-------------|--------|----------------|
| `server/prisma/schema.prisma` | Modified | Fix relations and fields | Ambos | Ninguno |
| `server/src/routes/setlists.routes.ts` | New | Endpoints CRUD y reordenamiento | Server | Solo Online |
| `server/src/index.ts` | Modified | Montaje de rutas de setlists | Server | Ninguno |
| `client/src/features/setlists/` | New | Feature module completo (UI, store) | Client | Offline GET support |
| `client/src/shared/types/index.ts` | Modified | Actualizar tipos de Setlist | Client | Ninguno |
| `client/src/shared/components/AppLayout.tsx` | Modified | Reemplazar placeholder por rutas | Client | Ninguno |
| `client/vite.config.ts` | Modified | Caché rule para `/api/setlists` | Client | Cache GET offline |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Colisión `[setlistId, order]` al reordenar | High | Usar `prisma.$transaction` para actualizar órdenes secuencialmente de forma segura. |
| VIEWER sin SetlistShare no ve nada (flujo crítico) | High | Asegurar que el endpoint GET filtre correctamente los setlists compartidos e implementar UI vacía clara. |

## Rollback Plan
- Ejecutar `prisma migrate reset` para revertir cambios en la BD.
- Deshacer el montaje en `server/src/index.ts` y modificaciones en layout.
- Eliminar la carpeta `client/src/features/setlists` y el archivo de rutas `server/src/routes/setlists.routes.ts`.

## Dependencies
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` para el cliente.

## Success Criteria
- [ ] ADMIN/LEADER puede crear un setlist y agregar canciones.
- [ ] ADMIN/LEADER puede reordenar las canciones sin colisiones en BD.
- [ ] ADMIN/LEADER puede establecer el `transposeOffset` de una canción y se refleja globalmente.
- [ ] MEMBER puede ver el setlist y navegar en "modo presentación" si le fue compartido.
