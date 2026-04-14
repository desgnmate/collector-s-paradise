# Collector's Paradise — Pokémon TCG Events

> Melbourne's premier Pokémon trading card event. Where collectors meet, trade, and connect.

Collector's Paradise is a high-performance, modern web application for an exclusive Melbourne-based Pokémon TCG community event. The platform showcases event highlights, featured vendors, and provides an immersive experience for enthusiasts to buy, sell, and trade.

## 🚀 Key Features

- **Immersive 3D Experience**: Smooth scrolling and interactive elements.
- **Vendor Showcase**: Discover the best in the TCG community.
- **Dynamic Highlights**: Stay updated on the latest event cards and deals.
- **Community Focused**: Integrated support and interactive "Pokeball" chat widget.
- **Fully Responsive**: Optimized for high-end desktops down to mobile devices.

## 🛠️ Technology Stack

- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/)
- **Styling**: Vanilla CSS (Custom Token System)
- **Smooth Scroll**: [Lenis](https://github.com/darkroomengineering/lenis)
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com/) via [OpenNext](https://opennext.js.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## 📦 Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗️ Project Structure

- `app/`: Next.js App Router pages and global styles.
- `components/`: Modular React components.
- `public/`: Static assets (images, videos, fonts).
- `docs/`: Detailed technical documentation.

## 🚢 Deployment

The project is deployed to Cloudflare Pages.

```bash
# Build the project
npm run build

# Deploy via Wrangler
npx wrangler pages deploy .open-next/assets
```

For more details, see [docs/DEPLOYMENT.md](file:///Volumes/External/Desgnmate/Collectors%20Paradise/CP%20Landing%20page/collectors-paradise-web/docs/DEPLOYMENT.md).

---

© 2026 Collector's Paradise. Designed with passion by DesgnMate.
