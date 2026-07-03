# Cardstudio Design System

## 1. Atmosphere & Identity

Cardstudio feels like a warm, editorial creator tool with a polished product surface. The signature is a soft off-white canvas with blue/orange accents, rounded cards, and clear hierarchy that makes the app feel friendly without becoming playful.

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

## 7. Depth & Surface

### Strategy

Mixed. Soft borders define core surfaces, while modals and elevated shells use gentle shadows.

### Rules

- Use white surfaces on top of the tinted shell.
- Keep shadows soft and warm-toned.
- Do not use heavy glass or neon treatment.

