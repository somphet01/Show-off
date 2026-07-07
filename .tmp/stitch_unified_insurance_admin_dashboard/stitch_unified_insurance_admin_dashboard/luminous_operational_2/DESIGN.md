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
  on-surface: '#1a1c1c'
  on-surface-variant: '#4c4546'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#4648d4'
  on-secondary: '#ffffff'
  secondary-container: '#6063ee'
  on-secondary-container: '#fffbff'
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
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1b1b1b'
  on-tertiary-fixed-variant: '#474747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  status-pending: '#94a3b8'
  status-urgent: '#f59e0b'
  status-success: '#10b981'
  status-error: '#ef4444'
  status-info: '#3b82f6'
  surface-card: '#ffffff'
  border-subtle: '#e2e8f0'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  sidebar-width: 280px
  header-height: 72px
  container-max-width: 1440px
  gutter: 24px
  margin-page: 32px
  margin-mobile: 16px
---

## Brand & Style

The design system is engineered for high-velocity operational management, blending the sophisticated aesthetics of **iOS-inspired Modernism** with the rigorous functional requirements of an enterprise admin dashboard. The brand personality is **Professional, Technical, and Reliable**, prioritizing clarity and speed of thought for e-commerce operators.

The visual style utilizes a **Minimalist** approach with a focus on depth and layering. By employing clean white surfaces against subtle off-white backgrounds, the system directs attention toward critical data points and status indicators. The emotional response is one of "ordered calm"—reducing the cognitive load of complex inventory and financial data through generous whitespace, high-quality typography, and tactile surface metaphors.

## Colors

The palette is anchored by a stark **Primary Black (#000000)** used for core branding and primary actions, providing a high-contrast anchor against the **Neutral Surface (#f9f9f9)**. 

### Semantic Logic
- **Action & Focus:** Primary black is used for buttons and active states. A secondary indigo is reserved for interactive text or subtle accents.
- **Surface Strategy:** The background uses the neutral hex, while all interactive "cards" and "containers" use pure white (#FFFFFF) to create a clear visual stack.
- **Status Mapping:** Consistency across modules is mandatory.
    - **Success (Paid/Delivered/Active):** Emerald Green.
    - **Warning (Awaiting/Low Stock):** Amber/Orange.
    - **Danger (Cancelled/Rejected/Critical):** Rose/Red.
    - **Neutral (Pending/Archived):** Slate/Gray.

## Typography

This design system uses **Plus Jakarta Sans** as its primary typeface to achieve a modern, approachable, yet professional tone. The typeface's wide apertures ensure legibility in data-heavy tables.

### Hierarchy & Usage
- **Headlines:** Use tighter letter-spacing for large titles to maintain a "tight" editorial feel.
- **Data Display:** For SKUs, currency values (LAK/THB), and tracking numbers, a monospaced font (JetBrains Mono) is introduced to ensure numerical alignment and readability in tables.
- **Labels:** Status badges and table headers use semi-bold weights at smaller sizes to maintain hierarchy without needing excessive scale.
- **Mobile:** Scale `display-lg` down to 24px (`headline-md`) on mobile devices to prevent layout breaking.

## Layout & Spacing

The system employs a **Fixed-Fluid Hybrid Grid**. A permanent structural sidebar provides navigation stability, while the main content area adjusts to the viewport width.

### Layout Rules
- **Sidebar:** Fixed at 280px. It should remain pinned to the left.
- **Header:** A 72px tall fixed navigation bar that stays atop the content area. It should use a backdrop-blur (glassmorphism) to feel integrated with the content below.
- **Content Area:** To solve "content cut-off," the main stage must have a minimum horizontal padding of `32px` on desktop and `16px` on mobile.
- **Grid:** Use a 12-column grid for desktop views. Content cards should span 12 columns for tables and 4 or 6 columns for dashboard widgets.
- **Rhythm:** Spacing follows an 8px base unit (8, 16, 24, 32, 48, 64).

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layering** and **Ambient Shadows**, drawing inspiration from the iOS layered interface style.

- **Base Layer:** The canvas level (#f9f9f9) is the furthest back.
- **Surface Level:** All primary content sits on white cards (#ffffff). These cards use a subtle 1px border (#e2e8f0) and a soft, diffused shadow: `0px 4px 12px rgba(0, 0, 0, 0.05)`.
- **Floating Level:** Modals, dropdowns, and toast notifications use a higher elevation shadow with more spread: `0px 12px 32px rgba(0, 0, 0, 0.12)`.
- **Active State:** Buttons and interactive elements use a slight vertical lift (2px) on hover to provide tactile feedback.

## Shapes

The shape language is defined by **Rounded (0.5rem)** corners as the baseline (ROUND_EIGHT). This provides a friendly, modern feel that softens the "technical" nature of an admin dashboard.

- **Containers & Cards:** Use `rounded-lg` (1rem) for large dashboard sections.
- **Buttons & Inputs:** Use the base `0.5rem` (rounded) for a consistent touch-target feel.
- **Badges:** Status chips utilize a fully rounded (pill-shaped) radius to distinguish them from interactive buttons.
- **Images:** Product thumbnails and slip previews should always include the base `0.5rem` radius to ensure they don't feel "sharp" against the soft UI.

## Components

### Buttons
- **Primary:** Solid Black (#000000) with white text. 
- **Secondary:** White background with a 1px border (#e2e8f0).
- **Destructive:** Solid red or white with red text, reserved for "Delete" or "Reject slip" actions.

### Status Badges
Badges use a "soft-fill" style: a high-transparency version of the status color for the background with the full-saturation color for the text. Text is `label-md` (uppercase or semi-bold).

### Input Fields
Fields are white with a 1px border (#e2e8f0). On focus, the border transitions to Primary Black with a subtle 2px outer glow. Height is standardized at 44px for accessibility.

### Cards & Sections
Every major data section (Order Details, Customer Info) must be encapsulated in a white card. Use `32px` internal padding for desktop and `20px` for mobile.

### Tables
Table headers use a light gray background (#f1f5f9) and `label-md` typography. Rows use a 1px bottom border only. On hover, rows highlight with the background color (#f9f9f9).

### Activity Timelines
A vertical 2px line connects status updates. Each "Log entry" uses `body-md` for description and `label-md` (muted gray) for the timestamp.