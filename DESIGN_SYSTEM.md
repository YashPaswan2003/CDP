# CDP Marketing Platform — Design System & Specs

## Design Foundation

### Visual Identity
| Element | Value |
|---------|-------|
| **Style** | Dark Mode (OLED) — high contrast, eye-friendly |
| **Primary Font** | Fira Code (headings, data) |
| **Body Font** | Fira Sans (navigation, labels) |
| **Primary Color** | #1E40AF (blue) |
| **Secondary Color** | #3B82F6 (lighter blue) |
| **CTA Color** | #F59E0B (amber) |
| **Background** | #0F172A (slate-900, OLED black) |
| **Surface** | #1E293B (slate-800) |
| **Text Primary** | #F1F5F9 (slate-100) |
| **Text Secondary** | #CBD5E1 (slate-300) |
| **Border** | #334155 (slate-700) |

### Typography System
```
Heading 1: Fira Code 32px/700 - Page titles
Heading 2: Fira Code 24px/600 - Section titles
Heading 3: Fira Code 18px/600 - Subsections
Body: Fira Sans 14px/400 - Content text
Label: Fira Sans 12px/500 - Form labels, captions
Code: Fira Code 12px/400 - Data values, metrics
```

**Line height:** 1.6 (body) | **Letter spacing:** -0.01em (headings)

### Spacing Scale
```
xs: 4px   | sm: 8px  | md: 12px | lg: 16px | xl: 24px
2xl: 32px | 3xl: 48px | 4xl: 64px
```

### Z-Index Scale
```
10: Popovers, tooltips
20: Modals, dropdowns
30: Sticky headers
50: Toast notifications, floating action buttons
```

### Responsive Breakpoints
```
Mobile: 375px  | Tablet: 768px  | Desktop: 1024px  | Wide: 1440px
```

---

## Screen-by-Screen Specs

### 1. Portfolio Dashboard (`/`)

**Purpose:** Executive overview across all clients

**Layout Structure:**
```
┌─────────────────────────────────────────┐
│ Header (fixed)                          │
│  Logo | Navigation | Avatar | Dark Mode │
├─────────────────────────────────────────┤
│ Page Title: "Portfolio"                 │
│ Subtitle: "7-day overview across all clients" │
├─────────────────────────────────────────┤
│ KPI Strip (4 cards, horizontal scroll)  │
│  [Total Spend] [Total Revenue] [ROAS] [Leads] │
├─────────────────────────────────────────┤
│ Platform Mix Donut (right-aligned 40%)  │
│ ┌──────────────────┐  ┌────────┐       │
│ │ Client Cards     │  │ Donut  │       │
│ │ (3-col grid)     │  │ Chart  │       │
│ │                  │  │        │       │
│ └──────────────────┘  └────────┘       │
├─────────────────────────────────────────┤
│ Top 5 Campaigns Table (sortable)        │
│ Campaign | Platform | Budget | Spend... │
└─────────────────────────────────────────┘
```

**Components:**
- **Header:** Sticky, height 64px. Logo (32px), nav items, avatar circle (40px), dark mode toggle
- **KPI Strip:** 4 cards, each 240px wide, horizontal scrollable on mobile. Border-bottom gradient accent on hover
- **Client Cards:** 3-column grid (768px: 2-col, 375px: 1-col). Each 280px × 320px. Shadow on hover, slight scale (1.02)
- **Donut Chart:** ECharts, 300×300px, centered. Labels outside ring
- **Table:** Recharts-compatible, sortable headers. Alternate row colors (hover: bg-slate-700)

**Interactions:**
- KPI card click → navigate to client dashboard (if assigned)
- Client card click → `/clients/[id]`
- Table row hover → highlight, cursor-pointer
- Dark mode toggle → instant theme switch

**Spacing:**
- Page padding: 24px (lg: 32px)
- Section gap: 32px
- Card gaps: 16px (grid), 12px (KPI strip)

**Accessibility:**
- Alt text for all charts
- Sortable table: aria-sort attribute
- Focus ring on card click
- Keyboard nav: Tab through cards

---

### 2. Client Dashboard (`/clients/[id]`)

**Purpose:** Deep dive into one client across all platforms

**Layout Structure:**
```
┌────────────────────────────────────────────┐
│ Header: [Client Logo] Client Name          │
│ [← Back] | Date Range Picker | [Platform Tabs] │
├────────────────────────────────────────────┤
│ KPI Cards (6 cards, 2-row grid)            │
│ [Spend] [Revenue] [ROAS] [CPL] [CTR] [Impr] │
├────────────────────────────────────────────┤
│ Main Trend Chart (Line, 80% width)         │
│ Spend (primary axis) + Conversions (secondary) │
├────────────────────────────────────────────┤
│ Left Panel (30%)    | Right Panel (30%)    │
│ Platform Breakdown  | Budget Pacing        │
│ (Stacked Bar)       | (Progress Bar)       │
├────────────────────────────────────────────┤
│ Performance Heatmap (Day × Hour CTR)       │
└────────────────────────────────────────────┘
```

**Components:**
- **Header:** Client logo (40px), name, back button. Date range picker (calendar icon), platform tabs (Google/Meta/DV360, underline active state)
- **KPI Cards:** 6 per row, 200×140px each. Value (28px bold), label (12px muted), sparkline (optional)
- **Trend Chart:** Line chart, 100% width, height 300px. X-axis: dates, dual-axis (spend left, conversions right)
- **Platform Breakdown:** Stacked bar chart, 100% height 250px. Bars: Google (#4285F4), Meta (#0A66C2), DV360 (#FF6D00)
- **Budget Pacing:** Horizontal progress bar. Spent vs total. Color: red if behind, green if on-pace
- **Heatmap:** Grid of cells, 7×24. Color intensity = CTR. Tooltip on hover

**Interactions:**
- Date range → update all charts
- Platform tab click → filter all data to that platform
- Chart legend click → toggle line/series
- Heatmap cell hover → tooltip (day, hour, CTR%)
- Sparkline click → navigate to campaign detail

**Spacing:**
- Header: 64px height
- KPI section: 24px padding, 12px card gaps
- Chart sections: 32px top padding
- Sidebar panels: 16px padding

**Accessibility:**
- ARIA labels on chart elements
- Focus ring on tab buttons
- Keyboard: arrow keys to switch dates/platforms

---

### 3. Campaign Drill-Down (`/clients/[id]/campaigns`)

**Purpose:** Sortable, filterable campaign-level analysis

**Layout Structure:**
```
┌──────────────────────────────────────────┐
│ Filters (horizontal, collapsible)        │
│ [Platform ▼] [Status ▼] [Objective ▼] [Dates] │
├──────────────────────────────────────────┤
│ Sortable Table                           │
│ Campaign | Plat | Budget | Spend | Impr...│
│ [Row expand for ad groups]               │
│                                          │
│ [Bulk Compare] Button (select 2+ rows)   │
└──────────────────────────────────────────┘
```

**Components:**
- **Filters:** Dropdowns + date picker. Sticky (top: 120px). Reset button on right
- **Table:** Recharts-compatible, sortable headers (arrow indicators). Bordered rows (border-b: border-slate-700)
- **Row Expand:** Click row → inline expand showing ad groups (sub-table, darker bg)
- **Bulk Compare:** Visible only if 2+ rows selected. Button: #F59E0B (amber)

**Interactions:**
- Filter change → update table (Ctrl+F persisted in URL)
- Header click → sort ASC/DESC
- Row click → expand ad groups
- Bulk compare select → checkboxes appear
- Bulk compare button → modal with side-by-side charts

**Spacing:**
- Filter row: 12px gaps between controls
- Table row height: 48px (36px on mobile)
- Expanded content padding: 16px

**Accessibility:**
- Sortable: aria-sort, aria-label
- Filters: label with for attribute
- Bulk compare: aria-selected on rows

---

### 4. Reporting (`/reporting`)

**Purpose:** Custom report builder

**Layout Structure:**
```
┌────────────────────────────────────────┐
│ Left Panel (25%)      | Right Panel (75%) │
├────────────────────────────────────────┤
│ Dimension Picker:    | Chart Output:   │
│ ☑ Geo                │ ┌──────────────┐ │
│ ☑ Creative           │ │ [Dynamic     │ │
│ ☑ Keyword            │ │  Chart]      │ │
│ ☑ Placement          │ │              │ │
│ ☑ Device             │ └──────────────┘ │
│ ☑ Platform           │                  │
│                      │ Metric Selector: │
│ Metric Selector:     │ ☑ Spend, Revenue │
│ ☑ Spend              │ ☑ ROAS, CPL      │
│ ☑ Revenue            │                  │
│ ☑ ROAS               │ Chart Type:      │
│ ☑ CPL, CTR           │ [Line▼] [Bar▼].. │
│                      │                  │
│ Date Range:          │ [Save Report]    │
│ [Picker]             │                  │
│ Client Filter:       │                  │
│ [Dropdown]           │                  │
└────────────────────────────────────────┘
```

**Components:**
- **Left Panel:** Sticky sidebar (width: 280px). Dimension checkboxes, metric multiselect, date range, client dropdown
- **Chart Output:** Dynamic ECharts/Recharts based on selections. 100% width, responsive height
- **Chart Type Toggle:** Bar, Line, Table, Pie (hidden if not applicable)
- **Save Report Button:** #F59E0B, sticky bottom

**Interactions:**
- Dimension check → add to chart grouping
- Metric check → add to chart series
- Date range → filter data
- Chart type → re-render
- Save report → modal, name + confirm

**Spacing:**
- Panel gap: 24px
- Checkbox gaps: 8px
- Section dividers: 24px top/bottom

**Accessibility:**
- Checkboxes: label, aria-checked
- Date picker: aria-label
- Chart: alt text description

---

### 5. Chat (`/chat`)

**Purpose:** Conversational AI interface for campaign insights

**Layout Structure:**
```
┌──────────────────────────────────────┐
│ Sidebar (20%, collapsible):          │
│ [← Collapse]                         │
│ Conversations                        │
│ [Recent convo 1] ← active           │
│ [Recent convo 2]                    │
│ [+ New]                             │
│                                     │
│ Client Selector:                    │
│ [Select Client ▼]                  │
├──────────────────────────────────────┤
│ Chat Area (80%):                    │
│ ┌──────────────────────────────────┐ │
│ │ User: "Best campaign this month?" │ │
│ │                                  │ │
│ │ Assistant: "Based on ROAS..."    │ │
│ │ ▌▌▌ (streaming indicator)        │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│ Quick Chips:                         │
│ [Best Performer] [Budget Pacing]..   │
│ Input Area:                          │
│ [Text input field         ] [→ Send] │
└──────────────────────────────────────┘
```

**Components:**
- **Sidebar:** Width 250px (768px: collapse to 60px icon-only). Sticky top. Recent conversations list (scrollable), new conversation button
- **Chat Messages:** Bubbles, left (assistant, bg-slate-700) right (user, bg-blue-600)
- **Streaming:** Word-by-word reveal animation (duration 50ms per word)
- **Quick Suggestion Chips:** 4 suggestions below input, clickable
- **Input Field:** Placeholder "Ask about campaigns...", multiline (max 4 lines), submit on Ctrl+Enter

**Interactions:**
- Recent convo click → load conversation
- Client selector → scope chatbot responses
- Quick chip click → auto-fill input
- Submit → streaming response animation
- Clear chat → confirm modal

**Spacing:**
- Message bubble padding: 12px
- Bubble margin: 8px
- Suggestion chip gaps: 8px
- Input padding: 12px

**Accessibility:**
- Chat messages: role="region", aria-live="polite"
- Input: aria-label "Message input"
- Send button: aria-label

---

### 6. Presentations (`/presentations`)

**Purpose:** Template picker and generation flow

**Layout Structure:**
```
┌────────────────────────────────────────┐
│ Tab: [Gallery] [Generated]             │
├────────────────────────────────────────┤
│ GALLERY TAB:                           │
│ Template Cards (3-col grid)            │
│ ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│ │Minimal  │  │Branded  │  │Data-    │ │
│ │Template │  │Template │  │Heavy    │ │
│ │[Preview]│  │[Preview]│  │[Preview]│ │
│ │[Select] │  │[Select] │  │[Select] │ │
│ └─────────┘  └─────────┘  └─────────┘ │
├────────────────────────────────────────┤
│ GENERATED TAB:                         │
│ Presentation List:                     │
│ [Thumbnail] Presentation Name | Date   │
│ [Download] [Preview] [Delete]          │
└────────────────────────────────────────┘
```

**Components:**
- **Template Cards:** 280×200px each. Thumbnail image, title, description, select button (#F59E0B)
- **Select Flow:** Opens modal → select client, date range, template → "Generate" button → progress indicator (simulated)
- **Generated List:** Table-like, thumbnail (60px), name, date, actions (download, preview, delete)
- **Preview Modal:** Slide carousel, next/prev buttons, close button

**Interactions:**
- Template card click → selection modal
- Select client/date → enable Generate
- Generate → progress bar (0-100% over 3 seconds)
- Download → triggers .pptx download
- Preview → carousel modal
- Delete → confirm

**Spacing:**
- Template grid gaps: 24px
- Modal padding: 32px
- List item padding: 16px

**Accessibility:**
- Template cards: button role, aria-label
- Modal: role="dialog", aria-modal
- Progress: aria-live="polite"

---

### 7. Upload (`/upload`)

**Purpose:** CSV ingestion with platform detection

**Layout Structure:**
```
┌────────────────────────────────────────┐
│ Drag-Drop Zone:                        │
│ ┌──────────────────────────────────┐   │
│ │ ▲ Drop CSV file here             │   │
│ │ or click to browse               │   │
│ │ (Accepted: .csv, max 50MB)       │   │
│ └──────────────────────────────────┘   │
│                                        │
│ Platform Selector:                     │
│ [Google Ads ▼] (auto-detected)        │
│                                        │
│ Client Selector:                       │
│ [Select Client ▼] (required)          │
│                                        │
│ [Upload Button]                        │
├────────────────────────────────────────┤
│ Job Status Table:                      │
│ Filename | Platform | Rows | Status... │
│ [✓ processed] [⏳ processing] [✗ error] │
└────────────────────────────────────────┘
```

**Components:**
- **Drag-Drop Zone:** 400×200px, dashed border, bg-slate-700 on hover. Border-color: #1E40AF
- **Platform Selector:** Auto-detects from CSV headers. Dropdown override if detection fails
- **Client Selector:** Required. Dropdown with search
- **Upload Button:** Disabled until client selected. Primary blue color
- **Progress Bar:** Shows per-file progress (0-100%)
- **Job Status Table:** Columns: Filename, Platform, Rows, Status (badge), Timestamp. Alternate row colors

**Interactions:**
- File drag → highlight zone
- File drop → validate, parse headers, auto-detect platform
- Platform override → user can change
- Upload → progress bar, disable button
- Job completion → show tick or error tooltip
- Error row click → show error details modal

**Spacing:**
- Zone padding: 40px
- Control gaps: 16px
- Table row height: 48px

**Accessibility:**
- Drop zone: role="button", aria-label
- Progress: aria-live="polite"
- Error modal: role="dialog"

---

### 8. Settings (`/settings`)

**Purpose:** System configuration and templates

**Layout Structure:**
```
┌─────────────────────────────────────┐
│ Tabs: [Users] [Templates] [System]  │
├─────────────────────────────────────┤
│ USERS TAB:                          │
│ User Table: Name | Email | Role... │
│ [Edit] [Delete] buttons per row     │
│ [+ Add User] button                 │
├─────────────────────────────────────┤
│ TEMPLATES TAB:                      │
│ Template Gallery: [Upload] [Delete] │
│ [Minimal] [Branded] [Data-Heavy]    │
├─────────────────────────────────────┤
│ SYSTEM TAB:                         │
│ Agency Name: [Text input]           │
│ Logo: [Upload] [Preview]            │
│ Theme: [Light/Dark toggle]          │
│ [Save Changes] button               │
└─────────────────────────────────────┘
```

**Components:**
- **Users Table:** Columns: Name, Email, Role (badge: Leader/Manager/Executive), Actions. Sortable. Delete confirmation modal
- **Template Upload:** Drag-drop zone or file picker for .pptx
- **System Config:** Form inputs for agency details, logo preview
- **Save Button:** Blue primary, disabled if no changes

**Interactions:**
- Tab switch → content swap
- User row edit → modal form
- Delete → confirmation
- Template upload → preview thumbnail
- Save system config → success toast

**Spacing:**
- Tab padding: 24px
- Table row height: 48px
- Form gaps: 16px

**Accessibility:**
- Tabs: aria-selected, role="tab"
- Form inputs: labels, aria-label
- Delete modal: role="alertdialog"

---

### 9. Role Switcher (Dev Tool)

**Purpose:** Quick role switching in prototype (not in production)

**Layout:**
```
Floating pill in bottom-right corner:
┌──────────────┐
│ Role: Leader │ ▼
└──────────────┘
```

**Behavior:**
- Dropdown: Leader | Manager | Executive
- Clicking option → re-render UI with that role's data scope and features
- Persists in localStorage for session

**Styling:**
- Position: fixed, bottom-right (16px from edges)
- bg-slate-800, border-slate-700
- Z-index: 50

---

## Cross-Screen Standards

### Color Usage in Charts
| Chart Type | Primary | Secondary | Accent |
|----------|---------|-----------|--------|
| Line | #3B82F6 | #F59E0B | #06B6D4 |
| Bar | #1E40AF | #3B82F6 | #F59E0B |
| Stacked | Platform-specific | — | — |
| Heatmap | Green → Red | — | — |
| Pie/Donut | Multi-color palette | — | — |

### Hover & Focus States
```
Card hover: 
  - bg-slate-700 (dark)
  - border-blue-400 (accent)
  - box-shadow: 0 4px 12px rgba(30,64,175,0.1)
  - transition: 150ms

Button hover:
  - opacity-90
  - cursor-pointer
  - transform: none (avoid layout shift)

Input focus:
  - outline: 2px solid #3B82F6
  - box-shadow: 0 0 0 3px rgba(59,130,246,0.1)

Link hover:
  - text-blue-400
  - underline
```

### Loading States
```
Skeleton screens: 
  - bg-slate-700 pulsing animation (opacity 0.5-1)
  - Same dimensions as actual content

Spinners:
  - Animated SVG, blue (#3B82F6)
  - Size: 24px (inline), 48px (full-page)

Progress bars:
  - Linear gradient: blue → cyan
  - Height: 4px
  - Border-radius: 2px
```

### Error & Success States
```
Error: 
  - Badge bg-red-900, text-red-200
  - Tooltip: red border, red text
  - Icon: X (Lucide) or alert triangle

Success:
  - Badge bg-green-900, text-green-200
  - Toast: green border, checkmark icon
  - Duration: 4 seconds auto-dismiss
```

### Responsive Behavior
```
Mobile (375px):
  - Single column layouts
  - Sidebar collapse to icon-only
  - Full-width tables with horizontal scroll
  - Bottom sheet modals instead of center

Tablet (768px):
  - 2-column grids
  - Sidebar 200px width (collapsible)
  - Stacked sidebars (filter left, output bottom)

Desktop (1024px+):
  - 3+ column grids
  - Full sidebar (250px)
  - Side-by-side layouts
  - Floating tooltip popovers
```

### Animation Standards
```
Micro-interactions: 150ms
Page transitions: 200ms
Entering animations: 300ms (fade-in + slide)
Exiting animations: 150ms
Reduced motion: All animations → 0ms duration
```

### Accessibility Standards
```
Contrast: 4.5:1 minimum (WCAG AA)
Focus rings: 2px, always visible
Touch targets: 44×44px minimum
Tab order: Logical, left-to-right
Color alone: Never the only indicator
Keyboard nav: Tab, Shift+Tab, Enter, Escape
Screen reader: All images have alt text, forms labeled
```

---

## Implementation Notes

**Tech Stack:**
- Next.js 14 (App Router)
- shadcn/ui for components
- Tailwind CSS for styling
- ECharts for complex charts
- Recharts for simple charts
- Lucide icons (no emojis)
- NextAuth.js for auth

**Mock Data Location:**
- `lib/mockData.ts` — all KPIs, chart data, campaigns, chat responses
- `lib/chartConfigs.ts` — ECharts/Recharts configuration generators
- Role context: `lib/useRole.ts` (context hook, switches data scope)

**Component Organization:**
```
components/
  ├── charts/
  │   ├── LineChart.tsx
  │   ├── BarChart.tsx
  │   ├── HeatmapChart.tsx
  │   └── ...
  ├── cards/
  │   ├── KPICard.tsx
  │   ├── ClientCard.tsx
  │   └── ...
  ├── layout/
  │   ├── Header.tsx
  │   ├── Sidebar.tsx
  │   └── RoleSwitch.tsx
  └── ...
```

**No AI Slop Principles:**
- Hand-crafted spacing and alignment
- Professional color palette (no gradients without purpose)
- Real data shapes (not lorem ipsum)
- Consistent icon usage (Lucide SVG)
- Proper focus states and keyboard navigation
- Tested for accessibility before deployment
