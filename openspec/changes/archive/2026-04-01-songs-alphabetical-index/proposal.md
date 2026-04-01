# Proposal: songs-alphabetical-index

## Intent
Mejorar la navegación y organización del repertorio y setlists, especialmente para usuarios en desktop. Se reemplazará la lista plana actual por un índice alfabético colapsable y se añadirá un Sidebar en desktop con accesos rápidos a canciones, setlists recientes y fijados.

## Scope

### In Scope
- Creación de componente base `AlphabeticAccordion`.
- Refactor de `SongsPage`: agrupar canciones por inicial (A-Z, #) en acordeón, colapsado por defecto.
- Mantener lista plana al usar búsqueda activa (debounce 300ms).
- Extracción del Sidebar desde `AppLayout.tsx`.
- Sidebar (desktop `md:`): índice alfabético compacto de canciones.
- Sidebar (desktop `md:`): setlists recientes (últimos N visitados automáticamente).
- Sidebar (desktop `md:`): setlists fijados por el usuario.
- Persistencia de setlists fijados/recientes en `localStorage` vía extensión de `setlists.store.ts`.
- Migración de estado de canciones a `songs.store.ts` (Zustand 5) para compartir entre SongsPage y Sidebar.

### Out of Scope
- Cambios en Backend, API o Base de Datos.
- Alteraciones a la navegación móvil (bottom nav).
- Persistencia del estado (abierto/cerrado) de los grupos del acordeón entre visitas.

## Approach
Implementación 100% frontend. Se creará un componente reutilizable de acordeón. La lógica de agrupamiento alfabético manejará casos especiales (números/símbolos al grupo `#`). Dado que `SongsPage` usaba estado local y el nuevo `Sidebar` también requiere las canciones, el estado se elevará a un nuevo store Zustand `songs.store.ts`. El store existente `setlists.store.ts` se extenderá usando el middleware `persist` de Zustand para guardar fijados/recientes en `localStorage`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `client/src/features/songs/pages/SongsPage.tsx` | Modified | Refactor a acordeón y conexión a nuevo store |
| `client/src/components/ui/` | New | Componente `AlphabeticAccordion` (y subcomponentes) |
| `client/src/components/layout/AppLayout.tsx` | Modified | Extracción del Sidebar |
| `client/src/components/layout/Sidebar.tsx` | New | Implementación del Sidebar con canciones y setlists |
| `client/src/features/songs/store/songs.store.ts` | New | Store compartido para SongsPage y Sidebar |
| `client/src/features/setlists/store/setlists.store.ts` | Modified | Extensión con persistencia para recientes/fijados |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Desincronización de estado entre Sidebar y SongsPage | Low | Uso de un único shared store (Zustand) como fuente de verdad |
| Performance al renderizar todas las canciones | Medium | Delegar a React 19 y virtualizar si el volumen de DOM nodes degrada la UX |

## Rollback Plan
Revertir los commits del frontend que modifican `SongsPage` y `AppLayout`, eliminando el componente `Sidebar` y los cambios en los stores. Como no hay cambios en DB/Backend, no se requiere migración de rollback.

## Dependencies
- Ninguna externa (librerías actuales: React 19, Tailwind v4, Zustand 5, Lucide React).

## Success Criteria
- [ ] `SongsPage` muestra canciones agrupadas alfabéticamente en acordeones (cerrados).
- [ ] La búsqueda en `SongsPage` muestra la lista plana filtrada.
- [ ] En desktop (`md:`) se muestra el Sidebar con secciones de canciones y setlists.
- [ ] Es posible fijar/desfijar setlists desde la UI (persiste en `localStorage`).
- [ ] Los últimos setlists visitados se auto-agregan a "Recientes".
