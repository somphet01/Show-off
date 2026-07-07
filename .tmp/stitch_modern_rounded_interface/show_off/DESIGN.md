---
name: Show Off
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c5c9ac'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8f9378'
  outline-variant: '#454932'
  surface-tint: '#b4d400'
  primary: '#ffffff'
  on-primary: '#2b3400'
  primary-container: '#cdf200'
  on-primary-container: '#5a6b00'
  inverse-primary: '#556500'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#ffffff'
  on-tertiary: '#1c333d'
  tertiary-container: '#cee6f2'
  on-tertiary-container: '#516872'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#cdf200'
  primary-fixed-dim: '#b4d400'
  on-primary-fixed: '#181e00'
  on-primary-fixed-variant: '#3f4c00'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#cee6f2'
  tertiary-fixed-dim: '#b2cad6'
  on-tertiary-fixed: '#051e27'
  on-tertiary-fixed-variant: '#334a54'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
  neon-lime: '#D9FF00'
  deep-charcoal: '#121212'
  surface-black: '#0D0D0D'
  card-gray: '#1E1E1E'
  status-red: '#FF4D4D'
  status-blue: '#00E0FF'
  text-muted: '#888888'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  mono-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 32px
  gutter: 24px
  sidebar-width: 280px
  card-gap: 20px
---

## Brand & Style

This design system embodies a **Streetwear-Inspired Modernism**. It is tailored for an admin interface that balances high-density data management with a premium, confident aesthetic. The system rejects generic corporate patterns in favor of a "dark mode" environment that mimics high-end fashion e-commerce and urban subculture visuals.

The visual direction is defined by:
- **High-Contrast Impact:** Neon accents pierce through deep charcoal backgrounds to highlight critical actions and metrics.
- **Urban Utility:** Functional elements (sidebar, tables, inputs) use sharp, bold typography to ensure readability under high-frequency use.
- **Architectural Softness:** Large border radii on primary containers and buttons create a "tactile tech" feel, softening the aggressive color palette to maintain a premium user experience.
- **Confident Professionalism:** The UI feels like a command center for a brand that moves fast, prioritizing clarity and speed without sacrificing style.

## Colors

The palette is anchored in a **Dark-First** strategy.
- **Primary (Neon Lime):** Reserved for high-priority calls to action, active states, and essential data highlights. It creates a "glow" effect against the dark background.
- **Neutral/Background:** We use a tiered system of blacks. `#0D0D0D` serves as the canvas, while `#121212` and `#1E1E1E` define layered surfaces (sidebar and cards).
- **Secondary/Accent:** High-saturation tones are used sparingly for status badges (e.g., paid, pending, error) to maintain the streetwear energy while ensuring functional clarity.
- **Text:** Primary text is pure white (`#FFFFFF`) or near-white (`#F2F2F2`), with a heavily muted gray (`#888888`) for secondary metadata to reduce cognitive load.

## Typography

The typographic hierarchy prioritizes **Power and Precision**.
- **Headlines:** Plus Jakarta Sans provides a modern, slightly geometric feel with high legibility. Bold weights are used for page titles and metric totals.
- **Body:** Inter is the workhorse for all data tables, descriptions, and form labels, chosen for its exceptional readability in dense UI environments.
- **Labels & Data:** Geist (Monospaced/Technical) is used for SKU numbers, Order IDs, and small uppercase labels. This adds to the "command center" aesthetic and ensures alphanumeric strings are easy to parse.

## Layout & Spacing

The design system utilizes a **12-column Fixed Grid** for the main content area with a persistent sidebar.
- **Sidebar Navigation:** 280px fixed width, collapsing to a 72px icon-only rail on smaller viewports.
- **Main Container:** Features a 32px inner margin to create "breathing room" around data-heavy components.
- **Modular Scaling:** All spacing is derived from a base unit of 8px. Card gaps are set to 24px (3x) to maintain a distinct separation between different functional modules.
- **Responsive Behavior:** On tablet, the grid shifts to 6 columns. On mobile, cards stack vertically and the sidebar transitions to a bottom navigation bar or a full-screen drawer.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** rather than traditional drop shadows.
- **Level 0 (App Base):** `#0D0D0D` - The deepest layer, used for the main background.
- **Level 1 (Navigation):** `#121212` - Sidebar and Topbar surfaces.
- **Level 2 (Cards/Modules):** `#1E1E1E` - Primary content containers. 
- **Accents:** Inner glows (0 0 10px rgba(217, 255, 0, 0.1)) are used on active cards to create a "Neon Bloom" effect.
- **Borders:** Low-contrast 1px strokes (`#2A2A2A`) are used on Level 2 containers to define edges without adding visual noise. High-contrast Neon Lime borders (2px) are reserved for focused input states or critical alerts.

## Shapes

The shape language is **Ultra-Rounded**, contrasting with the sharp typography.
- **Main Cards:** 24px (`rounded-xl`) corner radius creates a friendly, modern "shell."
- **Buttons & Inputs:** 12px (`rounded-lg`) for a comfortable, tactile feel.
- **Badges/Chips:** Full pill-shaped (999px) to distinguish them from interactive buttons.
- **Visual Priority:** The consistent use of large radii across all components unifies the streetwear-inspired aesthetic, making the dark theme feel more accessible and less "brutalist."

## Components

### Buttons
- **Primary:** Neon Lime background with Black text. Bold weight. Slight outer glow on hover.
- **Secondary:** Transparent background with 1px gray border. White text.
- **Destructive:** Solid Red background or Red ghost style for confirmation dialogs.

### Navigation & Sidebar
- **Sidebar Items:** High-contrast active states using a vertical Neon Lime bar on the left. Icons use a 24px stroke style.
- **Breadcrumbs:** Muted text with Geist font, using " / " separators.

### Data Display
- **Metric Cards:** Display-sized numbers. Trends (up/down) use small green/red indicators with micro-sparklines.
- **Data Tables:** Zebra-striping is avoided; use 1px bottom borders. Hover states on rows use a subtle background shift to `#252525`.
- **Status Badges:** Low-opacity backgrounds with high-saturation text (e.g., Awaiting Slip: Background `rgba(0, 224, 255, 0.1)`, Text `#00E0FF`).

### Inputs
- **Form Fields:** Darker surface (`#121212`) than the card they sit on. White text. Neon Lime focus ring.
- **Search Bar:** Large, rounded pill shape in the topbar with a subtle glassmorphism effect (backdrop-blur).

### Commerce Specifics
- **Product Variant Matrix:** Compact grid layout using labels in Geist Mono.
- **Slip Preview:** Large, high-radius modal with side-by-side comparison for verification.
- **Inventory Movement:** Timeline view with color-coded dots (Inbound: Lime, Outbound: Gray).