# Design System — Page Override: Setlists

> Estas reglas **sobreescriben** el MASTER.md para todas las páginas del feature Setlists.
> Para reglas no mencionadas aquí, aplicar MASTER.md.

---

**Page:** Setlists Feature (SetlistsPage, SetlistDetailPage, SetlistSongPage)
**Generated:** 2026-03-30

---

## Layout Structure

### SetlistsPage — Lista de setlists

```
┌─────────────────────────────┐
│  Header: "Setlists"  [+ New]│  ← sticky top, bg #2A2D2A
├─────────────────────────────┤
│  SetlistCard                │  ← nombre, fecha servicio, N canciones
│  SetlistCard                │
│  SetlistCard                │
│  ...                        │
├─────────────────────────────┤
│  Bottom Nav                 │  ← fixed, pb safe-area
└─────────────────────────────┘
```

### SetlistDetailPage — Detalle + edición

```
┌─────────────────────────────┐
│  ← Back  "Nombre setlist"   │  ← sticky top
│  📅 Fecha  [▶ Presentar]    │
├─────────────────────────────┤
│  SongRow (drag handle ≡)    │  ← reordenable con @dnd-kit
│  SongRow                    │
│  SongRow                    │
│  [+ Agregar canción]        │  ← al final de la lista
├─────────────────────────────┤
│  Bottom Nav                 │
└─────────────────────────────┘
```

### SetlistSongPage — Modo presentación

```
┌─────────────────────────────┐
│  ← 2/8  "Nombre canción"  → │  ← nav prev/next, sin bottom nav
│  [−] Tono: Dm  [+]          │  ← transpositor compacto
├─────────────────────────────┤
│                             │
│   Letra con acordes         │  ← ChordRenderer, font-size grande
│   (scrolleable)             │
│                             │
└─────────────────────────────┘
```

---

## Setlist Card

```tsx
// SetlistCard — item en la lista de setlists
<div className="bg-[#2A2D2A] rounded-xl p-4 cursor-pointer
                border border-[#3A3D3A] transition-colors duration-200
                hover:bg-[#333633] active:bg-[#333633]
                flex items-center justify-between gap-3">
  <div className="flex flex-col gap-1">
    <span className="text-[#E0E1E3] font-semibold text-base">{name}</span>
    <span className="text-[#B1B3B1] text-sm">{date} · {count} canciones</span>
  </div>
  <ChevronRight className="text-[#B1B3B1] w-5 h-5 shrink-0" />
</div>
```

---

## Song Row (en SetlistDetail)

```tsx
// SongRow — reordenable
<div className="bg-[#2A2D2A] rounded-xl p-4
                border border-[#3A3D3A]
                flex items-center gap-3 cursor-pointer">

  {/* Drag handle — solo visible para LEADER/ADMIN */}
  <GripVertical className="text-[#B1B3B1] w-5 h-5 shrink-0 cursor-grab" />

  {/* Info canción */}
  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
    <span className="text-[#E0E1E3] font-medium truncate">{song.title}</span>
    <span className="text-[#B1B3B1] text-sm truncate">{song.artist}</span>
  </div>

  {/* Tono del setlist (si hay offset) */}
  {transposeOffset !== 0 && (
    <span className="bg-[#515486]/20 text-[#515486] px-2 py-0.5
                     rounded text-xs font-mono shrink-0">
      {computedKey}
    </span>
  )}

  <ChevronRight className="text-[#B1B3B1] w-5 h-5 shrink-0" />
</div>
```

---

## Modo Presentación (SetlistSongPage)

### Principios específicos

1. **Sin bottom nav** — pantalla completa para la letra
2. **Font-size mayor** — `text-lg` mínimo para letra, `text-xl` recomendado en tablet
3. **Nav prev/next prominente** — botones grandes en la parte superior (44px+)
4. **Transpositor compacto** — botones `−` / `+` con la nota resultante en el centro
5. **Scroll natural** — sin paginación, scroll vertical libre

### Header de presentación

```tsx
<header className="sticky top-0 z-10 bg-[#1F211F]/95 backdrop-blur-sm
                   px-4 py-3 flex items-center gap-3
                   border-b border-[#3A3D3A]">

  {/* Navegación prev/next */}
  <button aria-label="Canción anterior"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center
                     text-[#B1B3B1] hover:text-[#E0E1E3] transition-colors duration-200
                     disabled:opacity-30">
    <ChevronLeft className="w-6 h-6" />
  </button>

  {/* Indicador posición */}
  <span className="text-[#B1B3B1] text-sm tabular-nums">{index}/{total}</span>

  {/* Nombre canción */}
  <span className="flex-1 text-[#E0E1E3] font-semibold text-center truncate">
    {song.title}
  </span>

  {/* Transpositor */}
  <div className="flex items-center gap-1">
    <button aria-label="Bajar tono"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center
                       text-[#B1B3B1] hover:text-[#E0E1E3] transition-colors duration-200">
      <Minus className="w-4 h-4" />
    </button>
    <span className="font-mono text-[#515486] text-sm w-8 text-center tabular-nums">
      {key}
    </span>
    <button aria-label="Subir tono"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center
                       text-[#B1B3B1] hover:text-[#E0E1E3] transition-colors duration-200">
      <Plus className="w-4 h-4" />
    </button>
  </div>

  {/* Siguiente */}
  <button aria-label="Canción siguiente"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center
                     text-[#B1B3B1] hover:text-[#E0E1E3] transition-colors duration-200
                     disabled:opacity-30">
    <ChevronRight className="w-6 h-6" />
  </button>
</header>
```

---

## Transpositor en detalle (SetlistDetail)

El líder puede ajustar el `transposeOffset` de cada canción individualmente desde la vista de detalle:

- Mostrar nota resultante (key de la canción + offset)
- Guardar via PATCH `/api/setlists/:id/songs/:songId` con `{ transposeOffset }`
- El offset va de -6 a +6 (octava cromática)

---

## Estados vacíos

```tsx
// Sin setlists creados
<div className="flex flex-col items-center gap-4 py-16 text-center">
  <ListMusic className="w-12 h-12 text-[#B1B3B1]" />
  <p className="text-[#B1B3B1]">No hay setlists creados aún</p>
  <button className="bg-[#754456] text-[#E0E1E3] px-6 py-3 rounded-lg
                     font-semibold min-h-[44px] cursor-pointer
                     transition-colors duration-200 hover:bg-[#8a5167]">
    Crear setlist
  </button>
</div>

// Sin canciones en el setlist
<div className="flex flex-col items-center gap-3 py-12 text-center">
  <Music className="w-10 h-10 text-[#B1B3B1]" />
  <p className="text-[#B1B3B1] text-sm">Agrega canciones a este setlist</p>
</div>
```

---

## Acceso por roles

| Acción | ADMIN | LEADER | MEMBER |
|--------|-------|--------|--------|
| Ver setlists propios / compartidos con él | ✅ | ✅ | ✅ |
| Crear setlist | ✅ | ✅ | ❌ |
| Editar / reordenar canciones | ✅ | Solo los propios | ❌ |
| Compartir setlist | ✅ | Solo los propios | ❌ |
| Eliminar setlist | ✅ | Solo los propios | ❌ |

> MEMBER solo ve setlists que le fueron compartidos. Ocultar botones de edición para MEMBER.
> Usar el rol del `auth.store` (`useAuthStore`) para condicionar la UI.

---

## Íconos a usar (Lucide React)

| Concepto | Ícono |
|----------|-------|
| Setlist / lista | `ListMusic` |
| Canción | `Music` |
| Agregar | `Plus` |
| Drag handle | `GripVertical` |
| Navegar | `ChevronLeft`, `ChevronRight` |
| Fecha | `Calendar` |
| Presentar | `Play` |
| Compartir | `Share2` |
| Eliminar | `Trash2` |
| Tono arriba/abajo | `Plus`, `Minus` |
| Editar | `Pencil` |

---

## Pre-Delivery Checklist — Setlists específico

- [ ] SetlistSongPage sin bottom nav (pantalla completa para letra)
- [ ] Transpositor compacto en header de presentación (no modal)
- [ ] `transposeOffset` se guarda al cambiar (PATCH al API)
- [ ] MEMBER no ve botones de crear/editar/eliminar/compartir
- [ ] Drag handle solo visible para LEADER/ADMIN
- [ ] `overscroll-behavior: contain` en la lista de canciones del detalle
- [ ] `aria-label` en todos los botones prev/next y tono +/−
- [ ] Indicador de posición (`2/8`) con `tabular-nums` (no salta el layout)
