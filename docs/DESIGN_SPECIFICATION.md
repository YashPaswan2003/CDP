# CDP Marketing Platform - Design Specification v2.0

**Version:** 2.0 (UI/UX Redesign)  
**Date:** 2026-04-06  
**Status:** Ready for Implementation  
**Inspiration:** Google Analytics 4, Amplitude, industry-standard CDPs

---

## 1. Color System

### Core Palette (6-Color Theme)
```
Deep Blue      #003f5c  → Primary, navigation, main CTAs
Blue-Purple    #464c89  → Secondary, hover states, accents
Purple         #954e9b  → Data emphasis, highlights
Pink           #dd4d88  → Warnings, secondary actions
Orange         #ff6b59  → Alerts, positive increases
Gold           #ffa600  → Success, achievements
```

### Extended Palette (Backgrounds & Neutrals)
```
Background     #0a0e27  → Base dark (slightly warmer than pure black)
Surface        #151a35  → Cards, elevated surfaces
Border         #2a2f4a  → Subtle dividers
Text Primary   #f5f5f5  → Main content
Text Secondary #a0a5b8  → Metadata, labels
Text Tertiary  #6b7280  → Disabled, hints
```

### Semantic Colors
```
Success   #10b981  → Positive metrics, ✓ actions
Warning   #f59e0b  → Caution, requires attention
Error     #ef4444  → Critical, failed actions
Info      #3b82f6  → Informational
```

### Gradient System
```
Primary Gradient    → #003f5c to #464c89 (left to right)
Accent Gradient     → #dd4d88 to #ff6b59 (diagonal)
Subtle BG Gradient  → #0a0e27 to #151a35 (top to bottom)
```

---

## 2. Typography

### Font Stack
```
Headings (h1-h6): Fira Code 600-700 weight
Body Text:        Fira Sans 400-500 weight
Code/Mono:        Fira Code 400
```

### Scale
```
h1: 32px / 1.2    → Page titles
h2: 24px / 1.3    → Section headers
h3: 20px / 1.4    → Card titles
h4: 16px / 1.4    → Subheadings
Body: 14px / 1.6  → Content text
Small: 12px / 1.5 → Labels, captions
```

---

## 3. Component Library

### 3.1 KPICard
**Purpose:** Dashboard metric display (impressions, revenue, ROAS, etc.)

**Props:**
```typescript
interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: { value: number; direction: 'up' | 'down' };
  icon: React.ReactNode;
  highlight?: 'primary' | 'success' | 'warning' | 'error';
}
```

**Styling:**
- Background: `surface` with subtle border
- Icon: 32px, colored by `highlight` prop
- Trend arrow: `#10b981` (up) or `#ef4444` (down)
- Hover: Slight scale + border color to `primary`

### 3.2 DataTable
**Purpose:** Campaign metrics, client data, performance tables

**Props:**
```typescript
interface DataTableProps {
  columns: Array<{ key: string; label: string; align?: 'left'|'center'|'right' }>;
  data: Record<string, any>[];
  sortable?: boolean;
  rowActions?: Array<{ label: string; action: (row) => void }>;
  striped?: boolean;
}
```

**Styling:**
- Header: `primary` background, white text, font weight 600
- Rows: Alternating `surface` and transparent (striped)
- Hover: Row background → `#1f2947` (slightly lighter)
- Borders: `border` color, horizontal lines only
- Cell padding: 12px 16px
- Row actions: Icon buttons with tooltip

### 3.3 MetricBadge
**Purpose:** Status indicators, campaign status, metric flags

**Props:**
```typescript
interface MetricBadgeProps {
  label: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}
```

**Styling:**
- Colors: Semantic (green/yellow/red/blue/gray)
- Opacity: 20% background, 100% text
- Border radius: 4px (slightly more angular than rounded)
- Font: Fira Sans 500, 12px

### 3.4 StatsCard
**Purpose:** Multi-stat cards (spend, revenue, ROAS together)

**Styling:**
- 3-4 metrics in compact grid layout
- Each metric: value + label + optional trend
- Border: Subtle `border` color
- Padding: 20px
- Background gradient: Subtle gradient from `primary` palette (10% opacity)

### 3.5 Chart Container
**Purpose:** Unified wrapper for Recharts/ECharts

**Props:**
```typescript
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'light' | 'bordered';
}
```

**Styling:**
- Card background: `surface`
- Title: `h3` size, Fira Code 600
- Legend: Bottom aligned, using semantic colors
- Grid lines: `border` color at 30% opacity
- Tooltip: Dark background, `text-primary`, rounded 4px

### 3.6 Navigation/Sidebar
**Purpose:** Main navigation structure

**Styling:**
- Background: `#0a0e27` (same as page)
- Active item: Left border `primary`, background `primary` at 10% opacity
- Icons: Lucide React, 20px
- Text: Fira Sans 500, 14px
- Hover: Background `primary` at 15% opacity
- User menu: Bottom section with avatar + settings

### 3.7 Input Fields
**Purpose:** Forms (settings, filters, search)

**Styling:**
- Background: `#1f2947` (lighter than surface)
- Border: `border` color
- Focus: Border `primary`, ring `primary` at 20% opacity
- Placeholder: `text-tertiary`
- Padding: 10px 12px (compact)

---

## 4. Layout Patterns

### 4.1 Dashboard Grid
```
[Sidebar] [Main Content]
Sidebar: 240px fixed
Main: Responsive grid (1-2 columns on mobile, 3-4 on desktop)
KPI cards: 4-column grid on desktop, responsive below
```

### 4.2 Page Layout
```
Page Header
├─ Title (h1)
├─ Description (text-secondary)
└─ Action buttons (right-aligned)

Content Section
├─ Cards/tables with consistent padding
├─ Consistent spacing (gaps)
└─ Full-width responsive
```

### 4.3 Spacing Scale
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
```

---

## 5. Screen-Specific Designs

### 5.1 Dashboard/Portfolio Overview
**Hero Section:**
- Large KPI cards (4-card layout)
- Time period selector
- Export button

**Charts Section:**
- Revenue trend (Recharts LineChart)
- Platform breakdown (pie/donut)
- Campaign performance (table)
- Campaign performance heatmap (ECharts)

### 5.2 Campaigns Page
**Header:**
- Title + "Create Campaign" button (primary)

**Filters Row:**
- Platform filter (dropdown)
- Status filter (multi-select)
- Date range (picker)
- Search (input)

**DataTable:**
- Columns: Campaign, Platform, Status, Spend, Revenue, ROAS
- Status badges: green (active) / gray (paused)
- ROAS highlighted in gold/orange
- Row actions: View, Edit, Pause/Resume

### 5.3 Chat Interface
**Header:**
- Title + client name
- Settings icon

**Message Thread:**
- User messages: Right-aligned, primary background
- Bot messages: Left-aligned, surface background
- Timestamp: text-tertiary, small
- Auto-scroll to latest

**Input:**
- Bottom fixed input with send button
- File attachment button
- Auto-expand textarea

### 5.4 Clients Page
**Grid/List Toggle:**
- Card view (default): 3-column grid
- List view: Full-width data table

**Client Card:**
- Company logo/avatar
- Client name (h3)
- Contact info
- Status badge
- KPIs (spend, revenue, campaigns)
- Action button (View)

### 5.5 Presentations Page
**Grid Layout:**
- 3-column card grid (responsive)

**Presentation Card:**
- Lucide icon (FileText, BarChart) instead of emoji
- Title + client name
- Created date
- Status badge
- Buttons: View, Download

### 5.6 Upload Page
**Drag-Drop Zone:**
- Dashed border, primary color
- Icon: Lucide Upload
- Text: "Drag files here or click"
- Accepted: CSV only

**Preview Table:**
- Shows uploaded data preview
- Columns auto-detected
- Row count displayed

### 5.7 Settings Page
**Sections:**
- Account (name, email)
- Preferences (timezone, notifications)
- Danger Zone (delete account)

**Card Layout:**
- Each section in separate card
- Labels: text-secondary
- Inputs: Standard styling
- Save/Cancel buttons: Primary + Secondary

### 5.8 Authentication Pages
**Login/Register:**
- Centered layout, max-width 400px
- Logo at top
- Form fields stacked
- CTA: Full-width primary button
- Link to other page: text-secondary

### 5.9 Settings/Profile
**Header Section:**
- User avatar
- Name + email
- Edit profile link

**Settings Sections:**
- Account preferences
- Notification settings
- Security settings
- Danger zone

---

## 6. Interactive Elements

### Buttons
```
Primary:     bg-primary, text-white, hover:opacity-90
Secondary:   bg-surface, text-primary, border-border
Danger:      bg-error, text-white
Ghost:       transparent, text-primary, hover:bg-surface
```

### Transitions
```
All transitions: duration-200ms
Hover effects: Scale 1.02, opacity change
Focus: Ring 2px primary at 50% opacity
```

### Icons (Lucide React)
```
Dashboard:        LayoutDashboard (24px)
Campaigns:        Zap (24px)
Chat:             MessageSquare (24px)
Clients:          Users (24px)
Presentations:    BarChart3 (24px)
Upload:           Upload (24px)
Settings:         Settings (24px)
Clients/Person:   User (20px)
Status Active:    CheckCircle2 (16px)
Status Paused:    PauseCircle (16px)
Arrow Up:         TrendingUp (16px)
Arrow Down:       TrendingDown (16px)
Download:         Download (18px)
External Link:    ExternalLink (16px)
```

---

## 7. Responsive Design

### Breakpoints (Tailwind Standard)
```
sm: 640px   → Stack to single column
md: 768px   → 2-column grids
lg: 1024px  → 3-4 column grids
xl: 1280px  → Full layout
```

### Mobile-First Rules
- Sidebar: Collapse to hamburger menu on `sm`
- Tables: Horizontal scroll on `sm`
- KPI cards: 2-column on `sm`, 4-column on `lg`
- Modals: Full-screen on `sm`, centered on `lg`

---

## 8. Implementation Checklist

### Phase 1: Foundation
- [ ] Tailwind config: Update colors + extend theme
- [ ] Globals.css: Update typography, spacing, resets
- [ ] Install lucide-react

### Phase 2: Component Library
- [ ] KPICard component
- [ ] DataTable component
- [ ] MetricBadge component
- [ ] StatsCard component
- [ ] ChartContainer component
- [ ] Navigation/Sidebar component
- [ ] Input/Form components

### Phase 3: Screen Redesigns
- [ ] Dashboard/Portfolio
- [ ] Campaigns
- [ ] Chat
- [ ] Clients
- [ ] Presentations
- [ ] Upload
- [ ] Settings
- [ ] Auth (Login/Register)

### Phase 4: Polish
- [ ] Responsive testing
- [ ] Icon replacements (Lucide)
- [ ] Accessibility audit
- [ ] Animation refinement

---

## 9. Design Resources

### Tokens (CSS Variables)
```css
--color-primary: #003f5c;
--color-primary-light: #464c89;
--color-accent-1: #954e9b;
--color-accent-2: #dd4d88;
--color-accent-3: #ff6b59;
--color-accent-4: #ffa600;
--color-success: #10b981;
--color-warning: #f59e0b;
--color-error: #ef4444;
--color-info: #3b82f6;

--bg-base: #0a0e27;
--bg-surface: #151a35;
--color-border: #2a2f4a;
--color-text-primary: #f5f5f5;
--color-text-secondary: #a0a5b8;
--color-text-tertiary: #6b7280;
```

### Figma/Design Tool Specs
- Frame size: 1440px (desktop)
- Grid: 8px baseline
- Column guides: 4-column (240px + gaps)
- Padding: 20px sides

---

## Status
✅ Design specification complete  
⏳ Ready for component library implementation  
⏳ Ready for screen redesigns  

**Next Steps:**
1. Implement Tailwind config with new colors
2. Create reusable component library (6 core components)
3. Update globals.css with gradient backgrounds
4. Redesign all 9 screens using new components
5. Install lucide-react and replace emoji icons
