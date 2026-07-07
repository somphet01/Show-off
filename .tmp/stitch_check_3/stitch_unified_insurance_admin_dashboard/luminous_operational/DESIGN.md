---
name: Luminous Operational
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1b1b1b'
  on-surface-variant: '#4c4546'
  inverse-surface: '#303030'
  inverse-on-surface: '#f1f1f1'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#5c5f60'
  on-secondary: '#ffffff'
  secondary-container: '#dee0e2'
  on-secondary-container: '#606365'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1b1b'
  on-tertiary-container: '#848484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#e1e2e4'
  secondary-fixed-dim: '#c5c6c8'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#444749'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1b1b1b'
  on-tertiary-fixed-variant: '#474747'
  background: '#f9f9f9'
  on-background: '#1b1b1b'
  surface-variant: '#e2e2e2'
  status-paid: '#22C55E'
  status-pending: '#EAB308'
  status-rejected: '#EF4444'
  status-info: '#3B82F6'
  surface-card: '#FFFFFF'
  surface-background: '#F9FAFB'
  accent-vibrant: '#FF5C00'
typography:
  display-metrics:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 2rem
  gutter: 1.5rem
  section-gap: 2rem
  card-padding: 1.5rem
  sidebar-width: 260px
---

## Brand & Style

The design system is engineered for a high-utility e-commerce administrative environment where speed of comprehension and operational accuracy are paramount. The personality is **Professional, Reliable, and Crisp**, balancing the density of financial data with a breathable, modern aesthetic.

The visual style is **Modern Corporate with iOS-inspired soft touches**. It utilizes a "Clean Canvas" approach: high-contrast white backgrounds serve as the foundation, while depth is communicated through soft, layered surfaces rather than heavy lines. The emotional response should be one of "controlled efficiency"—minimizing cognitive load through generous whitespace, soft rounded geometry, and a logical color-coded status system.

## Colors

The palette is rooted in a **neutral monochrome foundation** to ensure that data—not the interface—remains the focus. 

- **Primary Actions:** Reserved for high-contrast black (`#000000`) or the brand's vibrant accent (`#FF5C00`) to draw immediate attention to creation flows.
- **Surface Strategy:** We use a tiered gray system. The global background is a very soft off-white (`#F9FAFB`), while active work containers (cards) are pure white (`#FFFFFF`).
- **Semantic Logic:** Status indicators are non-negotiable. Success/Paid uses a vibrant emerald, Pending uses a warm amber, and Rejected/Error uses a sharp coral-red. These should be used as "Pills" with a low-opacity background tint and a high-opacity text label for maximum legibility.

## Typography

This design system uses a dual-sans pairing to balance personality with utility. 

- **Plus Jakarta Sans** is used for headers and dashboard metrics. Its slightly wider stance and modern apertures provide a welcoming, contemporary feel for the "Show Off" brand.
- **Inter** handles the heavy lifting for table data, form labels, and UI controls. It is chosen for its exceptional legibility at small sizes and its neutral, "invisible" quality.
- **JetBrains Mono** is introduced specifically for technical strings: Order IDs, SKUs, and currency values. This ensures that characters like '0' and 'O' are never confused during high-speed fulfillment.

**Hierarchy Note:** Use `display-metrics` for top-level revenue figures. Use `label-sm` with increased letter spacing for table headers to create clear vertical separation.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model optimized for desktop efficiency. 

- **Navigation:** A fixed-width sidebar (260px) persists on the left, housing the 12 primary functional modules.
- **Grid:** Content is organized into a 12-column fluid grid. Dashboard cards should typically span 3, 4, or 6 columns depending on the data density.
- **Rhythm:** We utilize a strict 8px base grid. All margins and paddings must be multiples of 8. 
- **Density:** While the style is "airy," data tables should remain compact. Use a 48px row height for standard tables to ensure high information density without sacrificing touch/click targets.

## Elevation & Depth

Hierarchy is achieved through **Tonal Layering** and **Ambient Shadows**. 

1.  **Level 0 (Floor):** The base application background in `#F9FAFB`.
2.  **Level 1 (Work Surface):** Main content cards and data tables. These use a white background and a very soft, diffused shadow: `0px 4px 20px rgba(0, 0, 0, 0.03)`.
3.  **Level 2 (Interaction):** Hover states on cards or active dropdowns. The shadow increases in spread and slightly in opacity to `0.06`.
4.  **Level 3 (System Overlays):** Modals, Slip Image Previews, and Notifications. These use a backdrop blur (12px) on the layer beneath them and a more pronounced shadow to create a distinct physical separation from the dashboard.

Avoid harsh black borders. If a border is required for definition (e.g., in a table), use a 1px stroke of `#F3F4F6`.

## Shapes

The shape language is **Soft-Rounded (iOS-style)**. 

- **Cards & Sections:** Use `rounded-xl` (1.5rem) to create a friendly, modern container feel.
- **Buttons & Inputs:** Use `rounded-lg` (1rem) for a more structured but still approachable look.
- **Status Pills:** Always use the "Pill" (fully rounded) shape to distinguish them from interactive buttons.
- **Product Images:** Should feature a consistent `0.5rem` radius to match the UI's softness without distorting the product details.

## Components

- **Buttons:** Primary buttons are solid black or vibrant accent with white text. Secondary buttons should be ghost-style with a light gray border.
- **Data Tables:** Headers must be sticky. Use alternating row tints or a 1px bottom stroke for legibility. The right-most column is reserved for "Quick Actions" (View, Edit, Delete).
- **Status Indicators:** Use small "pills" with 10% opacity backgrounds of the status color and 100% opacity text. Example: `Pending` is amber text on a light amber background.
- **Cards:** Dashboard cards should include a "trend" sparkline (mini graph) where applicable.
- **Form Fields:** Inputs use a light gray background (`#F3F4F6`) in their default state, moving to white with a 1px primary-color border on focus.
- **Search:** The global search in the top bar should be a large, pill-shaped input with a minimalist magnifying glass icon.
- **Risk Confirmation:** A specific modal variant for "Delete" or "Stock Adjustment" that uses a `status-rejected` (red) button to prevent accidental data loss.