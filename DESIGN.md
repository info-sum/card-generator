# Cardstudio Design System

## 1. Atmosphere & Identity

Cardstudio feels like a warm, editorial creator tool with a polished product surface. The signature is a soft off-white canvas with blue/orange accents, rounded cards, and clear hierarchy that makes the app feel friendly without becoming playful.

The studio surface uses a warm peach halo against a cool blue edge light. Raised panels keep a crisp white center, a soft tinted shadow, and a subtle inner highlight so the interface feels tactile without glass or neon.

## 2. Color

### Palette

| Role | Token | Value | Usage |
|---|---|---|---|
| Surface / page | `--color-background-light` | `#f8f8f8` | App shell, soft panels |
| Surface / base | `--color-background-white` | `#ffffff` | Cards, modals, inputs |
| Surface / border | `--color-border-light` | `#e9f2fe` | Light dividers, shell edge |
| Text / primary | `--color-text-primary` | `#1c2b42` | Headlines, body text |
| Text / secondary | `--color-text-secondary` | `#42526e` | Supporting copy |
| Text / muted | `--color-text-muted` | `#63666b` | Helper text, low-emphasis labels |
| Accent / blue | `--color-primary-blue` | `#1868db` | Links, informational emphasis |
| Accent / orange | `--color-primary-orange` | `#f15a24` | Primary action, active state |
| Accent / orange hover | `--color-primary-orange-hover` | `#df4d19` | Hover state for primary orange |
| Accent / blue hover | `--color-primary-blue-hover` | `#1558bc` | Hover state for blue actions |
| Action / accessible orange | `--color-action-orange` | `#b83d12` | White-text marketing CTAs (5.65:1 contrast) |
| Action / accessible orange hover | `--color-action-orange-hover` | `#99310e` | White-text marketing CTA hover (7.50:1 contrast) |
| Success | `--status-success` | `#166534` | Success confirmations |
| Info | `--status-info` | `#1d4ed8` | Checking / loading confirmations |
| Warning | `--status-warning` | `#d97706` | Cautions |
| Error | `--status-error` | `#b91c1c` | Errors, destructive feedback |

### Rules

- Keep the page mostly neutral with blue and orange as the only saturated accents.
- Use orange for primary actions and active states.
- Use blue for informational emphasis and secondary utility states.
- Keep status messages short and readable. Do not surface raw provider errors verbatim in the UI.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| Display | 40px | 700 | 1.2 | Top hero headings |
| Marketing display | up to 72px | 800 | 0.95 | Intro hero only; responsive clamp, never editor UI |
| H1 | 32px | 700 | 1.2 | Major section titles |
| H2 | 22px | 700 | 1.15 | Modal titles, panel headers |
| H3 | 20px | 700 | 1.1 | Brand titles, card headers |
| Body | 16px | 400 | 1.6 | Default copy |
| Body small | 14px | 400 | 1.5 | Supporting copy |
| Label | 14px | 500 | 1.0 | Field labels, pill labels |
| Caption | 12px | 500 | 1.4 | Helper text, microcopy |

### Font Stack

- Heading: `Plus Jakarta Sans`, `Manrope`, sans-serif
- Body: `Manrope`, `Apple SD Gothic Neo`, sans-serif

### Rules

- Use the heading stack for brand and modal titles.
- Keep labels compact and slightly heavier than body copy.
- Body text stays at 14px or 16px minimum.

## 4. Spacing & Layout

### Base Unit

The spacing system is built from a 4px grid.

| Token | Value | Usage |
|---|---|---|
| `--spacing-xs` | 4px | Tight icon spacing |
| `--spacing-sm` | 8px | Inline gaps |
| `--spacing-md` | 16px | Default padding / field rhythm |
| `--spacing-lg` | 24px | Panel gaps |
| `--spacing-xl` | 32px | Section separation |
| `--spacing-2xl` | 48px | Major breaks |
| `--spacing-3xl` | 60px | Large content spacing |
| `--spacing-4xl` | 64px | Page-level spacing |

### Interaction Tokens

| Token | Value | Usage |
|---|---|---|
| `--ease-out-emil` | `cubic-bezier(0.23, 1, 0.32, 1)` | Enter, hover, and direct feedback |
| `--ease-in-out-emil` | `cubic-bezier(0.77, 0, 0.175, 1)` | Elements moving between visible states |
| `--motion-press` | `140ms` | Press feedback |
| `--motion-ui` | `180ms` | Hover, focus, and compact controls |
| `--motion-enter` | `240ms` | Panels, modals, and rare entrances |
| `--focus-ring` | `0 0 0 4px rgba(24, 104, 219, 0.18)` | Keyboard focus |

### Layout

- Main shell max width: 1320px
- Desktop content uses roomy cards and a centered canvas
- Modals are narrow and stacked vertically
- Mobile should keep cards full-width and avoid horizontal overflow

### Rules

- Prefer 4px multiples for new spacing values.
- Keep modal content stacked and vertically readable.
- Long feedback text should wrap instead of forcing width growth.

## 5. Components

### API Key Modal

- **Structure**: title, provider switch, key field, status banner, actions
- **Variants**: idle, checking, success, error
- **States**: keyboard focus, selected provider, saving disabled, validation banner
- **Accessibility**: `aria-live` banner, radio group for provider choice, clear close button

### Primary Action Button

- **Structure**: rounded full-width or pill CTA with strong color fill
- **Variants**: orange primary, white secondary, disabled
- **States**: hover, active, focus-visible, loading

### Card Grid / Preview Rail

- **Structure**: selectable cards in a grid or rail with consistent spacing
- **Variants**: generated cards, preview cards, result cards
- **States**: active, hover, disabled, selected

### Wizard Navigation

- **Structure**: progress track, numbered steps, current-step label, next/previous actions
- **States**: current, completed, disabled, keyboard focus
- **Behavior**: progress changes use transform/size-safe transitions; repeated navigation stays under 200ms

### Marketing / Legal Actions

- **Structure**: primary link or button plus optional quiet secondary action
- **States**: hover on fine pointers, 0.97 press feedback, visible keyboard focus
- **Accessibility**: minimum 44px target, natural Korean line wrapping, reduced-motion fallback

### Product Story Preview

- **Structure**: a compact, non-interactive Studio-window capture framed as a product preview
- **Purpose**: show the real starting point of the AI-to-export workflow without presenting the editor as a clickable control
- **Content**: use a static capture of the current Studio start screen, refreshed when that flow materially changes; use the responsive Studio capture on narrow screens so both start choices remain readable
- **Surface**: inherit the shared off-white canvas, white panels, blue information accents, and accessible dark-orange actions used by the Studio

### Capability Bento

- **Structure**: one emphasized workflow card with a compact process rail, plus supporting capability cards with a short outcome statement and concrete feature tags
- **Variants**: emphasized, standard
- **Accessibility**: cards are semantic articles and remain static; no hover motion on non-interactive surfaces

## 6. Motion & Interaction

### Timing

| Type | Duration | Usage |
|---|---|---|
| Micro | 100-150ms | Button hover and press |
| Standard | 200-300ms | Modal / panel transitions |

### Rules

- Animate opacity and transform only.
- Keep hover states subtle and responsive.
- Error and success banners should appear without layout shift.
- Never use `transition: all`; list the properties that actually change.
- Gate hover-only movement behind `(hover: hover) and (pointer: fine)`.
- Pressable controls use `scale(0.97)` for immediate feedback.
- `prefers-reduced-motion` keeps useful color/opacity feedback but removes spatial movement.

## 7. Depth & Surface

### Strategy

Mixed. Soft borders define core surfaces, while modals and elevated shells use gentle shadows.

### Rules

- Use white surfaces on top of the tinted shell.
- Keep shadows soft and warm-toned.
- Do not use heavy glass or neon treatment.

## 8. Accessibility Constraints & Accepted Debt

- Keyboard focus remains visible on every actionable control and form field.
- Touch targets are at least 44px where layout permits; compact editor utilities remain visually compact but retain focus rings.
- Korean display copy uses `word-break: keep-all` plus balanced or pretty wrapping to avoid orphaned particles.
- Accepted debt: `App.css` still contains legacy selectors from earlier studio versions. This pass overrides active modern primitives instead of restructuring the large editor stylesheet; consolidate only when the editor is split into smaller components.
