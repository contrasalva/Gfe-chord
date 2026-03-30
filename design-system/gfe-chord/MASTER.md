# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/gfe-chord/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** GFE Chord
**Generated:** 2026-03-30 (aligned with project PRD — replaces auto-generated incorrect content)
**Category:** Church Worship Songbook — PWA, dark, mobile-first, live performance

---

## Global Rules

### Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| Primary | `#754456` | Botones principales, acciones primarias, highlights |
| Accent / Chords | `#515486` | Acordes, badges, elementos secundarios interactivos |
| Background | `#1F211F` | Fondo base de toda la app |
| Surface | `#2A2D2A` | Cards, panels, bottom sheets |
| Surface Elevated | `#333633` | Modales, dropdowns, hover states de cards |
| Text | `#E0E1E3` | Texto principal (cuerpo, títulos) |
| Text Muted | `#B1B3B1` | Texto secundario, placeholders, labels |
| Border | `#3A3D3A` | Bordes sutiles entre elementos |
| Danger | `#C0392B` | Errores, acciones destructivas |
| Success | `#27AE60` | Confirmaciones, éxito |

**Color Notes:**
- Paleta oscura pensada para uso en culto (salón oscuro, pantalla brillante)
- `#754456` bordó/vino — serio, ministerial, no distractivo
- `#515486` slate-azul — distingue acordes del texto de letra sin romper la lectura
- NUNCA usar `var(--color-*)` en className de Tailwind v4 — usar hex directo

### Tailwind v4 — Regla crítica

```tsx
// ✅ CORRECTO
<div className="bg-[#1F211F] text-[#E0E1E3]" />

// ❌ INCORRECTO
<div className="bg-[var(--color-bg)] text-[var(--color-text)]" />
<div className="bg-dark text-primary" />
```

Los tokens están definidos en `client/src/index.css` vía `@theme {}`. Los valores hex directos son la forma canónica en este proyecto.

### Typography

- **Heading Font:** Inter o system-ui (legible en pantallas de culto a distancia)
- **Body Font:** Inter o system-ui
- **Chord Font:** `font-mono` — OBLIGATORIO para acordes sobre sílabas (alineamiento preciso)
- **Minimum body size:** 16px (legible desde el atril)
- **Leading (line-height):** 1.6 mínimo para letras de canciones

```tsx
// Acordes siempre en font-mono
<span className="font-mono text-[#515486]">Am7</span>
```

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Gaps internos, íconos inline |
| sm | 8px | Gap MÍNIMO entre touch targets |
| md | 16px | Padding estándar de secciones |
| lg | 24px | Padding de cards, separación de bloques |
| xl | 32px | Secciones grandes |
| 2xl | 48px | Hero padding, separación de secciones principales |

### Touch Targets

- **Mínimo absoluto:** 44×44px en TODOS los elementos interactivos
- **Gap mínimo entre targets:** 8px
- **Bottom nav:** items de al menos 56px de alto (zona pulgar)
- **Botones de acción en modo presentación:** 64px+ (se toca con dedos gruesos en culto)

```tsx
// ✅ CORRECTO
<button className="min-h-[44px] min-w-[44px] px-4" />

// ❌ INCORRECTO
<button className="w-6 h-6" />
```

---

## Component Specs

### Buttons

```tsx
// Primary — acción principal
<button className="bg-[#754456] text-[#E0E1E3] px-6 py-3 rounded-lg font-semibold
                   min-h-[44px] cursor-pointer transition-colors duration-200
                   hover:bg-[#8a5167] active:bg-[#5e3645]" />

// Secondary — acción secundaria
<button className="bg-transparent text-[#E0E1E3] border border-[#3A3D3A] px-6 py-3
                   rounded-lg font-semibold min-h-[44px] cursor-pointer
                   transition-colors duration-200 hover:bg-[#2A2D2A]" />

// Danger — destructivo
<button className="bg-[#C0392B] text-white px-6 py-3 rounded-lg font-semibold
                   min-h-[44px] cursor-pointer transition-colors duration-200
                   hover:bg-[#a93226]" />
```

### Cards

```tsx
<div className="bg-[#2A2D2A] rounded-xl p-4 cursor-pointer
                transition-colors duration-200 hover:bg-[#333633]
                border border-[#3A3D3A]" />
```

### Inputs

```tsx
<input className="bg-[#2A2D2A] text-[#E0E1E3] border border-[#3A3D3A]
                  rounded-lg px-4 py-3 min-h-[44px] w-full
                  placeholder:text-[#B1B3B1]
                  focus:outline-none focus:border-[#754456]
                  focus:ring-2 focus:ring-[#754456]/20
                  transition-colors duration-200" />
```

### Bottom Sheet / Modal

```tsx
// Overlay
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

// Sheet
<div className="bg-[#2A2D2A] rounded-t-2xl p-6 border-t border-[#3A3D3A]" />
```

### Badge / Chip

```tsx
<span className="bg-[#515486]/20 text-[#515486] px-2 py-1
                 rounded-md text-xs font-medium" />
```

---

## Navigation

### Bottom Navigation (mobile-first)

- Altura: 56px mínimo + safe-area-inset-bottom
- Íconos: Lucide React, 24×24px
- Label: texto debajo del ícono, 10-11px
- Estado activo: color `#754456`
- Estado inactivo: color `#B1B3B1`

```tsx
<nav className="fixed bottom-0 left-0 right-0
                bg-[#2A2D2A] border-t border-[#3A3D3A]
                pb-[env(safe-area-inset-bottom)]" />
```

### Sticky Nav — regla crítica

> Si hay un nav fijo (top o bottom), el contenido DEBE tener padding de compensación.
> De lo contrario el nav tapa el primer/último elemento.

---

## Style Guidelines

**Estilo:** Dark, minimal, legible — optimizado para uso en culto en vivo

**Keywords:** Dark mode, high contrast text, minimal distraction, touch-friendly, readable at distance

**Principios:**
1. **Legibilidad sobre estética** — en culto, la pantalla se lee desde 2m+
2. **Mínima distracción** — sin animaciones llamativas, sin colores vibrantes
3. **Touch-first** — todo diseñado para dedos, no para cursor
4. **Modo presentación** — font-size escalable, sin UI chrome innecesario en pantalla completa

**Anti-patterns para este proyecto:**
- ❌ Fondos claros o blancos (deslumbran en culto nocturno)
- ❌ Texto pequeño (<16px en cuerpo)
- ❌ Animaciones largas (>300ms en acciones críticas)
- ❌ Hover states que desplazan layout (`transform scale`)
- ❌ `var()` en className de Tailwind v4
- ❌ Emojis como íconos (usar Lucide React)
- ❌ Targets menores a 44×44px
- ❌ Swipe horizontal como ÚNICA forma de navegar (conflicto con gestos del sistema)
- ❌ Pull-to-refresh accidental en listas scrolleables

---

## Accessibility

- `aria-label` en TODOS los botones de solo ícono
- Tab order visual = tab order lógico
- `prefers-reduced-motion`: sin animaciones de entrada si el usuario lo prefiere
- `overscroll-behavior: contain` en listas scrolleables (evitar pull-to-refresh accidental)
- Focus ring visible: `focus-visible:ring-2 focus-visible:ring-[#754456]`
- Color NO es el único indicador de estado (usar también ícono o texto)

---

## Responsive Breakpoints

| Breakpoint | Width | Uso |
|------------|-------|-----|
| Mobile | 375px | Diseño base (uso en culto, phone) |
| Tablet | 768px | Tableta en atril |
| Desktop | 1024px | Admin desde PC |
| Wide | 1440px | Pantalla grande |

**Mobile-first siempre.** Estilos base = mobile, luego `md:` y `lg:` para ampliar.

---

## Pre-Delivery Checklist

Verificar ANTES de entregar cualquier componente UI:

### Visual
- [ ] Fondo oscuro (`#1F211F` base, `#2A2D2A` surface)
- [ ] Texto legible (mínimo `#E0E1E3` sobre `#1F211F`)
- [ ] Acordes en `font-mono text-[#515486]`
- [ ] Sin emojis como íconos (usar Lucide React)
- [ ] Íconos consistentes: Lucide, 24×24px

### Interaction
- [ ] `cursor-pointer` en todos los elementos clickeables
- [ ] Touch targets ≥ 44×44px
- [ ] Gap ≥ 8px entre targets adyacentes
- [ ] Hover states con `transition-colors duration-200`
- [ ] Sin layout shift en hover (no `scale`)
- [ ] Focus visible: `focus-visible:ring-2 focus-visible:ring-[#754456]`

### Tailwind v4
- [ ] Hex directo en className — NO `var()`, NO tokens semánticos no definidos
- [ ] React 19: sin `useMemo`/`useCallback` innecesarios

### Responsive
- [ ] Funciona en 375px (mobile culto)
- [ ] Sin scroll horizontal en ningún breakpoint
- [ ] Contenido no tapado por nav fijo (padding compensatorio)
- [ ] `pb-[env(safe-area-inset-bottom)]` en bottom nav

### Accessibility
- [ ] `aria-label` en botones de solo ícono
- [ ] `prefers-reduced-motion` respetado
- [ ] `overscroll-behavior: contain` en listas
