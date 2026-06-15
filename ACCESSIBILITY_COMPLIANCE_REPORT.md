# Accessibility Compliance Report (WCAG 2.1 AA)

We believe climate action software must be usable by everyone. CarbonWise was developed and audited to comply with the **WCAG 2.1 AA** standards.

## 🎯 Key Accessibility Implementations

### 1. Semantic HTML & ARIA Landmarks
*   All pages utilize proper HTML5 semantic tags (`<header>`, `<main>`, `<nav>`, `<footer>`) to allow screen readers to parse the document outline correctly.
*   Custom interactive components (like the mobile menu drawer or dropdown menus) have explicit `aria-expanded`, `aria-controls`, and `aria-label` attributes.

### 2. Keyboard Navigation
*   **Focus Management**: The entire application can be navigated using only the `Tab` and `Enter` keys.
*   **Focus Indicators**: All buttons, links, and form inputs feature clear, high-contrast `:focus` rings to aid users with motor impairments.

### 3. Screen Reader Support
*   **Alt Text**: All images, avatars, and 3D Eco World visual representations contain descriptive `alt` text or `aria-hidden="true"` where purely decorative.
*   **Dynamic Updates**: Success toasts, error states, and live AI Coach responses are announced to assistive technologies.

### 4. Visual Contrast & Reduced Motion
*   **Color Contrast**: Our Tailwind UI palette (deep greens and neutral grays) strictly adheres to the WCAG 4.5:1 contrast ratio for text readability.
*   **Animations**: Framer Motion animations are subtle and designed not to trigger vestibular disorders. The UI remains fully functional even if CSS animations fail or are disabled.
