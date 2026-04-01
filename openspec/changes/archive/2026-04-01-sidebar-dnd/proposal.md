# Proposal: sidebar-dnd

## Intent

Permitir agregar canciones a un setlist activo arrastrándolas desde el Sidebar hacia el área principal, mejorando la experiencia de armado de repertorios (Drag & Drop).

## Scope

### In Scope
- Configuración de `@dnd-kit/core` con `DndContext` a nivel de `AppLayout`.
- Arrastre de canciones desde el componente `AlphabeticAccordion` (o `SongRow`) en el Sidebar.
- Destino de soltado (droppable) en la vista `SetlistDetailPage`.
- Gestión de estado global con Zustand (`viewingSetlistId`, `lastAddedAt`) para conectar Sidebar y vista activa.
- Notificaciones de feedback instalando `sonner` para avisos de duplicados (HTTP 409).
- Solo habilitado en Desktop (`md:`).

### Out of Scope
- Drag & Drop en dispositivos móviles.
- Cambios o nuevas lógicas en el backend.
- Reordenamiento visual de canciones dentro del propio setlist.

## Approach

1. **DndContext**: Envolver `AppLayout` para que Sidebar y `SetlistDetailPage` compartan el contexto de drag.
2. **Draggable**: Envolver `SongRow` con `useDraggable`, configurando `activationConstraint: { distance: 8 }` para no bloquear los clicks.
3. **Droppable**: Configurar `SetlistDetailPage` con `useDroppable`.
4. **Estado global**: Actualizar `setlists.store.ts` con `viewingSetlistId` (fijado al montar `SetlistDetailPage`) y `lastAddedAt` (actualizado tras un drop exitoso para recargar datos).
5. **Toasts**: Instalar `sonner` para capturar el error 409 del backend y renderizar el aviso amigable.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/layouts/AppLayout` | Modified | Contenedor principal con `DndContext` y handler `onDragEnd`. |
| `src/components/Sidebar/.../SongRow` | Modified | Componente arrastrable (`useDraggable`). |
| `src/pages/SetlistDetailPage` | Modified | Zona de soltado (`useDroppable`) y listener de `lastAddedAt`. |
| `src/store/setlists.store.ts` | Modified | Agregar `viewingSetlistId` y `lastAddedAt`. |
| `package.json` | Modified | Instalación de `sonner`. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Drag bloquea el click de la canción | Medium | Usar sensor con `distance: 8` pixels. |
| Inconsistencia de estado post-drop | Low | Sincronizar recarga del setlist usando `lastAddedAt` en el store. |

## Rollback Plan

- Deshacer cambios en `AppLayout` removiendo el `DndContext` y revertir la integración de `sonner`.

## Dependencies

- `@dnd-kit/core` (existente)
- `sonner` (nueva)

## Success Criteria

- [ ] Se puede arrastrar una canción del Sidebar al Setlist en Desktop.
- [ ] La lista de canciones se refresca automáticamente al soltar.
- [ ] Aparece un toast si la canción ya estaba en el setlist (error 409).
- [ ] En pantallas móviles, el drag & drop está deshabilitado.