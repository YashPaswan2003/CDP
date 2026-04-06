# Frontend - CDP Marketing Platform

Next.js 14 application with shadcn/ui and Tailwind CSS.

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

Server runs at `http://localhost:3000`

## Structure

```
app/                     # Next.js app directory
├── (auth)/              # Authentication routes (login, register)
├── (dashboard)/         # Main dashboard routes
│   ├── page.tsx         # Portfolio overview
│   ├── clients/         # Client dashboard
│   ├── chat/            # AI chat interface
│   ├── presentations/   # Presentation gallery
│   ├── upload/          # CSV upload
│   └── settings/        # Settings panel
components/              # Reusable React components
├── charts/              # ECharts & Recharts wrappers
├── dashboard/           # Dashboard-specific components
├── layout/              # Layout components
└── ui/                  # shadcn/ui primitives
lib/
├── mockData.ts          # Sample data for Phase 0
├── api.ts               # API client functions
└── utils.ts             # Helper functions
public/                  # Static assets
```

## Design System

See `../DESIGN_SYSTEM.md` for complete UI specifications:
- Dark mode OLED palette
- Fira Code (headings) + Fira Sans (body)
- Blue (#1E40AF, #3B82F6) + Amber (#F59E0B)
- Chart types: line, bar, area, heatmap, sankey, pie
- 9 screens total

## Phase 0 - Mock Data

All 9 screens use mock data from `lib/mockData.ts`:
- 2 sample clients (TechStore E-commerce, RealEstate Luxury)
- 3 platforms (Google Ads, DV360, Meta)
- ~15K rows per platform
- Role-based filtering (Leader/Manager/Executive)

## Commands

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run deploy           # Deploy to Cloudflare Pages
```

## Phase 1+ Changes

Mock API calls → Real API calls to FastAPI backend
Local mock data → Real data from DuckDB (via API)
No UI changes required — all component interfaces remain the same
