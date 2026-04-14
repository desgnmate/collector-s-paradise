# Design System — Collector's Paradise

This document details the Design System tokens used across the Collector's Paradise website. All styling is centralized in `app/globals.css` using CSS Variables.

## 🎨 Color Palette

| Token | Value | Preview | Usage |
|-------|-------|---------|-------|
| `--color-dark` | `#2E2E2E` | ⬛ | Primary text and dark backgrounds. |
| `--color-blue-primary` | `#5C8FC9` | 🟦 | Accent color for labels and specific icons. |
| `--color-blue-light` | `#8DB9E8` | 🧊 | Light backgrounds and secondary accents. |
| `--color-red` | `#D94B4B` | 🟥 | Errors, warnings, and Pokeball accents. |
| `--color-yellow` | `#F4C542` | 🟨 | Primary CTA color and highlights. |
| `--color-cream` | `#F3EFE6` | 🍦 | Main background color (Editorial look). |
| `--color-white` | `#FFFFFF` | ⬜ | Pure white for cards and high contrast elements. |

### Gradients

- `--gradient-blue`: `linear-gradient(135deg, #5C8FC9 0%, #8DB9E8 100%)`
- `--gradient-hero`: Used for the hero background depth.

## 🔡 Typography

We use a combination of modern sans-serif fonts and a custom brand font for headlines.

- **Primary Heading**: `Baloo` (Local) / `Montserrat` (Fallback)
- **Body Text**: `Inter`

### Scale (App Router Variables)

- `--font-heading`: `'Montserrat', sans-serif`
- `--font-body`: `'Inter', sans-serif`

## 📏 Spacing & Layout

The system uses a modular spacing scale to maintain vertical rhythm.

- `--space-xs`: `0.25rem`
- `--space-sm`: `0.5rem`
- `--space-md`: `1rem`
- `--space-lg`: `1.5rem`
- `--space-xl`: `2rem`
- `--space-2xl`: `3rem`
- `--space-3xl`: `4rem`
- `--space-4xl`: `6rem`

### Responsive Containers

- `--container-max`: `1200px` (Desktop) / `1080px` (Laptop)
- `--container-padding`: `1.5rem`

## ✨ UI Elements

- **Border Radius**: Using smooth curves (`--radius-lg: 20px`, `--radius-pill: 50px`).
- **Shadows**: Soft shadows for depth (`--shadow-card`).
- **Transitions**: Standardized easing for consistent feel (`--transition-normal: 0.3s ease`).

---

[Back to README](../README.md)
