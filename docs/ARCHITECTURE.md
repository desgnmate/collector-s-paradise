# Technical Architecture — Collector's Paradise

This document outlines the technical design, directory structure, and component hierarchy of the Collector's Paradise website.

## 🏗️ Core Architecture

The project is built on **Next.js 16** using the **App Router** paradigm. It leverages React 19 features and follows a modular component-based architecture.

### Tech Stack Details

- **Framework**: Next.js 16 (App Router)
- **Runtime**: Node.js (via Cloudflare Workers/Pages)
- **Styling**: Vanilla CSS with a centralized Design System (Design Tokens)
- **Animations**: native CSS transitions + Lenis for smooth momentum scrolling
- **Type Safety**: TypeScript

## 📁 Directory Structure

```text
/
├── app/                # Next.js App Router
│   ├── globals.css     # Design Tokens and Global Styles
│   ├── layout.tsx      # Root Layout & Metadata
│   └── page.tsx        # Homepage Entry Point
├── components/         # Reusable UI Components
├── public/             # Static Assets
│   ├── fonts/          # Brand Typography (Baloo)
│   ├── images/         # Optimized Brand Assets
│   └── videos/         # Hero Video Backgrounds
└── docs/               # Technical Documentation
```

## 🧩 Component Breakdown

The homepage is composed of the following high-level components:

| Component | Responsibility |
|-----------|----------------|
| `Navbar` | Sticky navigation with a Pokeball dropdown menu. |
| `Hero` | High-impact visual introduction with video background and card animations. |
| `About` | Mission statement and overview of the platform. |
| `Experience` | Details on what to expect at the event. |
| `Highlights` | Curated showcase of rare cards and featured highlights. |
| `Brands` | Brand logos and community partners. |
| `VendorShowcase` | Directory of featured event vendors. |
| `Footer` | Site map, contact info, and legal links. |
| `ChatWidget` | Interactive support widget with Pokeball aesthetics. |
| `SmoothScroll` | Wrapper for Lenis to provide consistent scrolling behavior. |

## 🔄 Data Flow

Currently, the application is static. Content is managed within the component files or exported as local constants.

## ⚡ Performance Optimization

- **Image Optimization**: Using `next/image` (if applicable) or optimized assets in `public/`.
- **Global CSS**: Minimized styles with reusable variable-based tokens to avoid duplicate rules.
- **Scroll Handling**: Lenis is used to Normalize scrolling across different browsers and input devices.

---

[Back to README](../README.md)
