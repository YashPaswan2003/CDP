// Comprehensive mock data for marketing analytics
// Expanded with 20 campaigns, mathematically consistent child records, geo/demographic/placement data

// ============ INTERFACES ============

export interface DailyMetric {
  date: string;
  platform: "google" | "meta" | "dv360";
  spend: number;
  revenue: number;
  impressions: number;
  clicks: number;
  conversions: number;
  views: number;
  // TOFU
  reach: number;
  frequency: number;
  cpm: number;
  vtr: number;
  cpv: number;
  viewability: number;
  thruPlays: number;
  // MOFU
  engagementRate: number;
  // BOFU
  vtc: number;
  cpa: number;
}

export interface SearchTerm {
  keyword: string;
  matchType: "Exact" | "Phrase" | "Broad";
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  qualityScore: number; // 1-10
  ctr: number;
  cpc: number;
  cvr: number;
}

export interface Placement {
  placementType: "youtube" | "display" | "meta";
  placementName: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  views: number;
  ctr: number;
  cpc: number;
  cvr: number;
  vtr?: number; // video-specific
  revenue?: number;
  roas?: number;
}

export interface Creative {
  creativeId: string;
  creativeName: string;
  format: "image" | "video" | "carousel";
  size: string;
  platform: "google" | "meta" | "dv360";
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  frequency: number;
  ctr: number;
  cvr: number;
  roas: number;
}

export interface PMaxChannel {
  channel: "Search" | "Shopping" | "YouTube" | "Display" | "Discover" | "Gmail";
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cvr: number;
  roas: number;
}

export interface PeriodComparison {
  metric: string;
  currentValue: number;
  previousValue: number;
  changePercent: number;
}

export interface InsertionOrder {
  id: string;
  name: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  pacingPercent: number;
}

export interface LineItem {
  id: string;
  insertionOrderId: string;
  name: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  vtc?: number; // view-through conversions (DV360 video)
  ctc?: number; // click-through conversions (DV360)
  vtr?: number; // view-through rate (DV360 video)
}

export interface AdSet {
  id: string;
  campaignId: string;
  name: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  targeting: string;
}

export interface Campaign {
  id: string;
  name: string;
  platform: "google" | "dv360" | "meta";
  status: "active" | "paused" | "ended";
  type?: string; // google campaign type (Search, Display, Shopping, PMax, YouTube)
  objective?: string; // meta campaign objective
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cvr: number;
  roas: number;
  views?: number; // video views/completions (DV360, Google YouTube, Meta)
  reach?: number; // unique reach (Meta, DV360)
  frequency?: number; // avg frequency (Meta, DV360)
}

export interface AdGroup {
  id: string;
  campaignId: string;
  name: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cvr: number;
}

export interface GeoRow {
  city: string;
  state: string;
  platform: "google" | "dv360" | "meta";
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
}

export interface DemographicRow {
  dimension: "age" | "gender";
  segment: string;
  platform: "google" | "dv360" | "meta";
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
}

export interface FunnelStage {
  stage: string;
  value: number;
  dropoffPercent: number;
}

export interface MetaPlacement {
  placement: string;
  surface: "facebook" | "instagram" | "audience_network" | "messenger";
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  reach: number;
  frequency: number;
  ctr: number;
}

// ============ MOCK DATA: CAMPAIGNS (20 TOTAL) ============

const GOOGLE_ADS_CAMPAIGNS: Campaign[] = [
  {
    id: "camp-ga-001",
    name: "SIP Start Now - Search",
    platform: "google",
    type: "Search",
    status: "active",
    budget: 15000,
    spent: 12400,
    impressions: 125000,
    clicks: 6200,
    conversions: 310,
    revenue: 46500,
    ctr: 4.96,
    cpc: 2.0,
    cvr: 5.0,
    roas: 3.75,
  },
  {
    id: "camp-ga-002",
    name: "Kotak Flexi Cap - Brand",
    platform: "google",
    type: "Search",
    status: "active",
    budget: 20000,
    spent: 18900,
    impressions: 285000,
    clicks: 8550,
    conversions: 256,
    revenue: 38400,
    ctr: 3.0,
    cpc: 2.21,
    cvr: 3.0,
    roas: 2.03,
  },
  {
    id: "camp-ga-003",
    name: "Tax Saving FD - Q4 Push",
    platform: "google",
    type: "Search",
    status: "active",
    budget: 25000,
    spent: 22100,
    impressions: 198000,
    clicks: 7920,
    conversions: 475,
    revenue: 71250,
    ctr: 4.0,
    cpc: 2.79,
    cvr: 6.0,
    roas: 3.22,
  },
  {
    id: "camp-ga-004",
    name: "Website Visitor Retargeting",
    platform: "google",
    type: "Display",
    status: "paused",
    budget: 12000,
    spent: 11200,
    impressions: 89000,
    clicks: 4450,
    conversions: 267,
    revenue: 40050,
    ctr: 5.0,
    cpc: 2.52,
    cvr: 6.0,
    roas: 3.58,
  },
  {
    id: "camp-ga-005",
    name: "PMax - Mutual Fund Leads",
    platform: "google",
    type: "PMax",
    status: "active",
    budget: 30000,
    spent: 28600,
    impressions: 380000,
    clicks: 15200,
    conversions: 760,
    revenue: 114000,
    ctr: 4.0,
    cpc: 1.88,
    cvr: 5.0,
    roas: 3.99,
  },
  {
    id: "camp-ga-006",
    name: "Kotak MF Product Listing",
    platform: "google",
    type: "Shopping",
    status: "active",
    budget: 18000,
    spent: 17100,
    impressions: 265000,
    clicks: 9275,
    conversions: 463,
    revenue: 69450,
    ctr: 3.5,
    cpc: 1.84,
    cvr: 5.0,
    roas: 4.06,
  },
  {
    id: "camp-ga-007",
    name: "Kotak MF Brand Story",
    platform: "google",
    type: "YouTube",
    status: "active",
    budget: 28000,
    spent: 27100,
    impressions: 140000,
    clicks: 5225,
    conversions: 187,
    revenue: 34550,
    ctr: 3.73,
    cpc: 5.18,
    cvr: 3.58,
    roas: 1.27,
    views: 49000,
  },
];

const DV360_CAMPAIGNS: Campaign[] = [
  {
    id: "camp-dv-001",
    name: "DV360 Brand Awareness Q2",
    platform: "dv360",
    status: "active",
    budget: 35000,
    spent: 30200,
    impressions: 1850000,
    clicks: 18500,
    conversions: 370,
    revenue: 55500,
    ctr: 1.0,
    cpc: 1.63,
    cvr: 2.0,
    roas: 1.84,
    views: 450000,
    reach: 1240000,
    frequency: 1.49,
  },
  {
    id: "camp-dv-002",
    name: "DV360 Retargeting - Web Visitors",
    platform: "dv360",
    status: "active",
    budget: 25000,
    spent: 22800,
    impressions: 920000,
    clicks: 9200,
    conversions: 184,
    revenue: 27600,
    ctr: 1.0,
    cpc: 2.48,
    cvr: 2.0,
    roas: 1.21,
    views: 230000,
    reach: 615000,
    frequency: 1.50,
  },
  {
    id: "camp-dv-003",
    name: "DV360 Performance",
    platform: "dv360",
    status: "active",
    budget: 30000,
    spent: 28100,
    impressions: 580000,
    clicks: 11600,
    conversions: 522,
    revenue: 78300,
    ctr: 2.0,
    cpc: 2.42,
    cvr: 4.5,
    roas: 2.78,
    views: 145000,
    reach: 390000,
    frequency: 1.49,
  },
  {
    id: "camp-dv-004",
    name: "YouTube Pre-Roll - Fund Launch",
    platform: "dv360",
    status: "active",
    budget: 28000,
    spent: 26400,
    impressions: 1420000,
    clicks: 14200,
    conversions: 420,
    revenue: 63000,
    ctr: 1.0,
    cpc: 1.86,
    cvr: 3.0,
    roas: 2.39,
    views: 710000,
    reach: 950000,
    frequency: 1.49,
  },
  {
    id: "camp-dv-005",
    name: "DV360 Prospecting",
    platform: "dv360",
    status: "active",
    budget: 22000,
    spent: 20800,
    impressions: 1380000,
    clicks: 13800,
    conversions: 276,
    revenue: 41400,
    ctr: 1.0,
    cpc: 1.51,
    cvr: 2.0,
    roas: 1.99,
    views: 345000,
    reach: 920000,
    frequency: 1.50,
  },
  {
    id: "camp-dv-006",
    name: "DV360 Premium Sites",
    platform: "dv360",
    status: "paused",
    budget: 32000,
    spent: 43300,
    impressions: 1090000,
    clicks: 17600,
    conversions: 544,
    revenue: 82400,
    ctr: 1.61,
    cpc: 2.46,
    cvr: 3.09,
    roas: 1.9,
    views: 272500,
    reach: 730000,
    frequency: 1.49,
  },
];

const META_CAMPAIGNS: Campaign[] = [
  {
    id: "camp-meta-001",
    name: "Meta - SIP Investment Drive",
    platform: "meta",
    objective: "Conversions",
    status: "active",
    budget: 20000,
    spent: 19200,
    impressions: 425000,
    clicks: 12750,
    conversions: 425,
    revenue: 63750,
    ctr: 3.0,
    cpc: 1.51,
    cvr: 3.33,
    roas: 3.32,
    reach: 285000,
    frequency: 1.49,
    views: 106250,
  },
  {
    id: "camp-meta-002",
    name: "Meta - New Fund Launch",
    platform: "meta",
    objective: "Traffic",
    status: "active",
    budget: 18000,
    spent: 17400,
    impressions: 365000,
    clicks: 8395,
    conversions: 335,
    revenue: 50250,
    ctr: 2.3,
    cpc: 2.07,
    cvr: 3.99,
    roas: 2.89,
    reach: 248000,
    frequency: 1.47,
    views: 91250,
  },
  {
    id: "camp-meta-003",
    name: "Meta - App Install Campaign",
    platform: "meta",
    objective: "App Installs",
    status: "active",
    budget: 22000,
    spent: 21000,
    impressions: 315000,
    clicks: 9450,
    conversions: 567,
    revenue: 85050,
    ctr: 3.0,
    cpc: 2.22,
    cvr: 6.0,
    roas: 4.05,
    reach: 220000,
    frequency: 1.43,
    views: 78750,
  },
  {
    id: "camp-meta-004",
    name: "Meta Brand Awareness",
    platform: "meta",
    objective: "Awareness",
    status: "active",
    budget: 15000,
    spent: 14200,
    impressions: 420000,
    clicks: 5040,
    conversions: 168,
    revenue: 25200,
    ctr: 1.2,
    cpc: 2.82,
    cvr: 3.33,
    roas: 1.78,
    reach: 315000,
    frequency: 1.33,
    views: 105000,
  },
  {
    id: "camp-meta-005",
    name: "Meta Retargeting",
    platform: "meta",
    objective: "Conversions",
    status: "active",
    budget: 16000,
    spent: 15500,
    impressions: 280000,
    clicks: 8400,
    conversions: 420,
    revenue: 63000,
    ctr: 3.0,
    cpc: 1.85,
    cvr: 5.0,
    roas: 4.06,
    reach: 195000,
    frequency: 1.44,
    views: 70000,
  },
  {
    id: "camp-meta-006",
    name: "Meta - Fund Catalog",
    platform: "meta",
    objective: "Catalog Sales",
    status: "active",
    budget: 19000,
    spent: 18300,
    impressions: 310000,
    clicks: 9300,
    conversions: 465,
    revenue: 69750,
    ctr: 3.0,
    cpc: 1.97,
    cvr: 5.0,
    roas: 3.81,
    reach: 215000,
    frequency: 1.44,
  },
  {
    id: "camp-meta-007",
    name: "Meta - Lead Generation",
    platform: "meta",
    objective: "Lead Generation",
    status: "paused",
    budget: 17000,
    spent: 15300,
    impressions: 195000,
    clicks: 10465,
    conversions: 396,
    revenue: 59600,
    ctr: 5.37,
    cpc: 1.46,
    cvr: 3.79,
    roas: 3.89,
    reach: 142000,
    frequency: 1.37,
  },
];

// ============ MOCK DATA: AD GROUPS (GOOGLE ONLY - 18 TOTAL) ============

const GOOGLE_AD_GROUPS: AdGroup[] = [
  // camp-ga-001: Summer Sale
  {
    id: "ag-001",
    campaignId: "camp-ga-001",
    name: "Branded Search",
    impressions: 42000,
    clicks: 2100,
    spend: 4200,
    conversions: 105,
    ctr: 5.0,
    cpc: 2.0,
    cvr: 5.0,
  },
  {
    id: "ag-002",
    campaignId: "camp-ga-001",
    name: "Generic Search",
    impressions: 38000,
    clicks: 1900,
    spend: 3800,
    conversions: 95,
    ctr: 5.0,
    cpc: 2.0,
    cvr: 5.0,
  },
  {
    id: "ag-003",
    campaignId: "camp-ga-001",
    name: "Competitor",
    impressions: 45000,
    clicks: 2200,
    spend: 4400,
    conversions: 110,
    ctr: 4.89,
    cpc: 2.0,
    cvr: 5.0,
  },
  // camp-ga-002: Brand Awareness
  {
    id: "ag-004",
    campaignId: "camp-ga-002",
    name: "Product Category",
    impressions: 145000,
    clicks: 4350,
    spend: 9600,
    conversions: 130,
    ctr: 3.0,
    cpc: 2.21,
    cvr: 3.0,
  },
  {
    id: "ag-005",
    campaignId: "camp-ga-002",
    name: "Long-tail Keywords",
    impressions: 140000,
    clicks: 4200,
    spend: 9300,
    conversions: 126,
    ctr: 3.0,
    cpc: 2.21,
    cvr: 3.0,
  },
  // camp-ga-003: Product Launch
  {
    id: "ag-006",
    campaignId: "camp-ga-003",
    name: "New Launch",
    impressions: 68000,
    clicks: 2720,
    spend: 7600,
    conversions: 163,
    ctr: 4.0,
    cpc: 2.79,
    cvr: 6.0,
  },
  {
    id: "ag-007",
    campaignId: "camp-ga-003",
    name: "Product Features",
    impressions: 130000,
    clicks: 5200,
    spend: 14500,
    conversions: 312,
    ctr: 4.0,
    cpc: 2.79,
    cvr: 6.0,
  },
  // camp-ga-004: Retargeting
  {
    id: "ag-008",
    campaignId: "camp-ga-004",
    name: "Remarketing",
    impressions: 35000,
    clicks: 1750,
    spend: 4400,
    conversions: 105,
    ctr: 5.0,
    cpc: 2.51,
    cvr: 6.0,
  },
  {
    id: "ag-009",
    campaignId: "camp-ga-004",
    name: "Similar Audiences",
    impressions: 54000,
    clicks: 2700,
    spend: 6800,
    conversions: 162,
    ctr: 5.0,
    cpc: 2.52,
    cvr: 6.0,
  },
  // camp-ga-005: PMax Q2
  {
    id: "ag-010",
    campaignId: "camp-ga-005",
    name: "Shopping Signals",
    impressions: 195000,
    clicks: 7800,
    spend: 14700,
    conversions: 390,
    ctr: 4.0,
    cpc: 1.88,
    cvr: 5.0,
  },
  {
    id: "ag-011",
    campaignId: "camp-ga-005",
    name: "Audience Signals",
    impressions: 185000,
    clicks: 7400,
    spend: 13900,
    conversions: 370,
    ctr: 4.0,
    cpc: 1.88,
    cvr: 5.0,
  },
  // camp-ga-006: Shopping Feed
  {
    id: "ag-012",
    campaignId: "camp-ga-006",
    name: "Best Sellers",
    impressions: 140000,
    clicks: 4900,
    spend: 9100,
    conversions: 245,
    ctr: 3.5,
    cpc: 1.86,
    cvr: 5.0,
  },
  {
    id: "ag-013",
    campaignId: "camp-ga-006",
    name: "New Arrivals",
    impressions: 125000,
    clicks: 4375,
    spend: 8000,
    conversions: 218,
    ctr: 3.5,
    cpc: 1.83,
    cvr: 5.0,
  },
  // camp-ga-007: YouTube Branding
  {
    id: "ag-014",
    campaignId: "camp-ga-007",
    name: "TrueView In-Stream",
    impressions: 80000,
    clicks: 2960,
    spend: 15500,
    conversions: 107,
    ctr: 3.7,
    cpc: 5.24,
    cvr: 3.62,
  },
  {
    id: "ag-015",
    campaignId: "camp-ga-007",
    name: "Bumper Ads",
    impressions: 60000,
    clicks: 2265,
    spend: 11600,
    conversions: 80,
    ctr: 3.78,
    cpc: 5.12,
    cvr: 3.54,
  },
];

// ============ MOCK DATA: META AD SETS (18 TOTAL) ============

const META_AD_SETS: AdSet[] = [
  // camp-meta-001: Fashion Sale
  {
    id: "as-001",
    campaignId: "camp-meta-001",
    name: "Women 25-34 Mumbai",
    budget: 6800,
    spent: 6800,
    impressions: 151000,
    clicks: 4530,
    conversions: 151,
    revenue: 22650,
    targeting: "Women 25-34, Mumbai",
  },
  {
    id: "as-002",
    campaignId: "camp-meta-001",
    name: "Women 25-44 National",
    budget: 6800,
    spent: 6800,
    impressions: 152000,
    clicks: 4560,
    conversions: 152,
    revenue: 22800,
    targeting: "Women 25-44, National",
  },
  {
    id: "as-003",
    campaignId: "camp-meta-001",
    name: "Lookalike 1%",
    budget: 6400,
    spent: 5600,
    impressions: 122000,
    clicks: 3660,
    conversions: 122,
    revenue: 18300,
    targeting: "LAL 1% Purchasers",
  },
  // camp-meta-002: New Collection
  {
    id: "as-004",
    campaignId: "camp-meta-002",
    name: "Interest Fashion",
    budget: 8800,
    spent: 8800,
    impressions: 185000,
    clicks: 4255,
    conversions: 170,
    revenue: 25500,
    targeting: "Fashion Interest, 18-35",
  },
  {
    id: "as-005",
    campaignId: "camp-meta-002",
    name: "Broad National",
    budget: 9200,
    spent: 8600,
    impressions: 180000,
    clicks: 4140,
    conversions: 165,
    revenue: 24750,
    targeting: "National, All 18-45",
  },
  // camp-meta-003: App Installs
  {
    id: "as-006",
    campaignId: "camp-meta-003",
    name: "Interest Tech",
    budget: 7000,
    spent: 7000,
    impressions: 157500,
    clicks: 4725,
    conversions: 283,
    revenue: 42450,
    targeting: "Tech Interest, All Ages",
  },
  {
    id: "as-007",
    campaignId: "camp-meta-003",
    name: "LAL App Users",
    budget: 8000,
    spent: 8000,
    impressions: 158000,
    clicks: 4725,
    conversions: 284,
    revenue: 42600,
    targeting: "LAL App Users",
  },
  {
    id: "as-008",
    campaignId: "camp-meta-003",
    name: "Competitor Audience",
    budget: 7000,
    spent: 6000,
    impressions: 60000,
    clicks: 1800,
    conversions: 60,
    revenue: 9000,
    targeting: "Competitor App Users",
  },
  // camp-meta-004: Brand Awareness
  {
    id: "as-009",
    campaignId: "camp-meta-004",
    name: "Broad Reach",
    budget: 15000,
    spent: 14200,
    impressions: 420000,
    clicks: 5040,
    conversions: 168,
    revenue: 25200,
    targeting: "All Ages, All India",
  },
  // camp-meta-005: Retargeting
  {
    id: "as-010",
    campaignId: "camp-meta-005",
    name: "Abandoned Cart",
    budget: 8000,
    spent: 7750,
    impressions: 140000,
    clicks: 4200,
    conversions: 210,
    revenue: 31500,
    targeting: "Abandoned Cart 30d",
  },
  {
    id: "as-011",
    campaignId: "camp-meta-005",
    name: "Product Viewers",
    budget: 8000,
    spent: 7750,
    impressions: 140000,
    clicks: 4200,
    conversions: 210,
    revenue: 31500,
    targeting: "Product Page Viewers 14d",
  },
  // camp-meta-006: Catalog Sales
  {
    id: "as-012",
    campaignId: "camp-meta-006",
    name: "Abandoned Cart Catalog",
    budget: 6200,
    spent: 6200,
    impressions: 105000,
    clicks: 3150,
    conversions: 158,
    revenue: 23700,
    targeting: "Abandoned Cart 30d",
  },
  {
    id: "as-013",
    campaignId: "camp-meta-006",
    name: "Product Viewers Catalog",
    budget: 6100,
    spent: 6100,
    impressions: 103000,
    clicks: 3090,
    conversions: 154,
    revenue: 23100,
    targeting: "Product Page Viewers 14d",
  },
  {
    id: "as-014",
    campaignId: "camp-meta-006",
    name: "Purchasers LAL",
    budget: 6000,
    spent: 6000,
    impressions: 102000,
    clicks: 3060,
    conversions: 153,
    revenue: 22950,
    targeting: "LAL 2% Purchasers",
  },
  // camp-meta-007: Lead Gen
  {
    id: "as-015",
    campaignId: "camp-meta-007",
    name: "High Intent",
    budget: 8500,
    spent: 7650,
    impressions: 97500,
    clicks: 5233,
    conversions: 198,
    revenue: 29700,
    targeting: "High Intent, 18-45",
  },
  {
    id: "as-016",
    campaignId: "camp-meta-007",
    name: "Broad Lead Gen",
    budget: 8500,
    spent: 7650,
    impressions: 97500,
    clicks: 5232,
    conversions: 198,
    revenue: 29900,
    targeting: "All Ages, Broad Interest",
  },
];

// ============ MOCK DATA: DV360 IOs AND LIs ============

const DV360_INSERTION_ORDERS: InsertionOrder[] = [
  {
    id: "io-001",
    name: "Q2 Brand Display",
    budget: 35000,
    spent: 30200,
    impressions: 1850000,
    clicks: 18500,
    conversions: 370,
    revenue: 55500,
    pacingPercent: 86,
  },
  {
    id: "io-002",
    name: "Retargeting Q2",
    budget: 25000,
    spent: 22800,
    impressions: 920000,
    clicks: 9200,
    conversions: 184,
    revenue: 27600,
    pacingPercent: 91,
  },
  {
    id: "io-003",
    name: "Performance Max",
    budget: 30000,
    spent: 28100,
    impressions: 580000,
    clicks: 11600,
    conversions: 522,
    revenue: 78300,
    pacingPercent: 94,
  },
  {
    id: "io-004",
    name: "YouTube PreRoll",
    budget: 28000,
    spent: 26400,
    impressions: 1420000,
    clicks: 14200,
    conversions: 420,
    revenue: 63000,
    pacingPercent: 94,
  },
  {
    id: "io-005",
    name: "Display Awareness",
    budget: 22000,
    spent: 20800,
    impressions: 1380000,
    clicks: 13800,
    conversions: 276,
    revenue: 41400,
    pacingPercent: 95,
  },
  {
    id: "io-006",
    name: "Prospecting",
    budget: 32000,
    spent: 43300,
    impressions: 1090000,
    clicks: 17600,
    conversions: 544,
    revenue: 82400,
    pacingPercent: 135,
  },
];

const DV360_LINE_ITEMS: LineItem[] = [
  // io-001: Q2 Brand Display
  {
    id: "li-001",
    insertionOrderId: "io-001",
    name: "Homepage Display",
    budget: 17500,
    spent: 15100,
    impressions: 960000,
    clicks: 9600,
    conversions: 192,
    revenue: 28800,
    vtc: 0,
    ctc: 192,
    vtr: undefined,
  },
  {
    id: "li-002",
    insertionOrderId: "io-001",
    name: "Category Display",
    budget: 17500,
    spent: 15100,
    impressions: 890000,
    clicks: 8900,
    conversions: 178,
    revenue: 26700,
    vtc: 0,
    ctc: 178,
    vtr: undefined,
  },
  // io-002: Retargeting Q2
  {
    id: "li-003",
    insertionOrderId: "io-002",
    name: "Cart Abandoners",
    budget: 12500,
    spent: 11400,
    impressions: 460000,
    clicks: 4600,
    conversions: 92,
    revenue: 13800,
    vtc: 0,
    ctc: 92,
    vtr: undefined,
  },
  {
    id: "li-004",
    insertionOrderId: "io-002",
    name: "Product Viewers",
    budget: 12500,
    spent: 11400,
    impressions: 460000,
    clicks: 4600,
    conversions: 92,
    revenue: 13800,
    vtc: 0,
    ctc: 92,
    vtr: undefined,
  },
  // io-003: Performance Max
  {
    id: "li-005",
    insertionOrderId: "io-003",
    name: "Search Performance",
    budget: 15000,
    spent: 14050,
    impressions: 290000,
    clicks: 5800,
    conversions: 261,
    revenue: 39150,
    vtc: 0,
    ctc: 261,
    vtr: undefined,
  },
  {
    id: "li-006",
    insertionOrderId: "io-003",
    name: "Display Performance",
    budget: 15000,
    spent: 14050,
    impressions: 290000,
    clicks: 5800,
    conversions: 261,
    revenue: 39150,
    vtc: 0,
    ctc: 261,
    vtr: undefined,
  },
  // io-004: YouTube PreRoll
  {
    id: "li-007",
    insertionOrderId: "io-004",
    name: "PreRoll 15s",
    budget: 14000,
    spent: 13200,
    impressions: 710000,
    clicks: 7100,
    conversions: 210,
    revenue: 31500,
    vtc: 84,
    ctc: 126,
    vtr: 62.5,
  },
  {
    id: "li-008",
    insertionOrderId: "io-004",
    name: "PreRoll 30s",
    budget: 14000,
    spent: 13200,
    impressions: 710000,
    clicks: 7100,
    conversions: 210,
    revenue: 31500,
    vtc: 84,
    ctc: 126,
    vtr: 54.2,
  },
  // io-005: Display Awareness
  {
    id: "li-009",
    insertionOrderId: "io-005",
    name: "Brand Awareness 1",
    budget: 11000,
    spent: 10400,
    impressions: 690000,
    clicks: 6900,
    conversions: 138,
    revenue: 20700,
    vtc: 0,
    ctc: 138,
    vtr: undefined,
  },
  {
    id: "li-010",
    insertionOrderId: "io-005",
    name: "Brand Awareness 2",
    budget: 11000,
    spent: 10400,
    impressions: 690000,
    clicks: 6900,
    conversions: 138,
    revenue: 20700,
    vtc: 0,
    ctc: 138,
    vtr: undefined,
  },
  // io-006: Prospecting
  {
    id: "li-011",
    insertionOrderId: "io-006",
    name: "Prospecting 1",
    budget: 16000,
    spent: 21650,
    impressions: 545000,
    clicks: 8800,
    conversions: 272,
    revenue: 40800,
    vtc: 0,
    ctc: 272,
    vtr: undefined,
  },
  {
    id: "li-012",
    insertionOrderId: "io-006",
    name: "Prospecting 2",
    budget: 16000,
    spent: 21650,
    impressions: 545000,
    clicks: 8800,
    conversions: 272,
    revenue: 41600,
    vtc: 0,
    ctc: 272,
    vtr: undefined,
  },
];

// ============ GEO DATA (INDIA ONLY) ============

const GEO_DATA: GeoRow[] = [
  // Google Ads geo
  {
    city: "Mumbai",
    state: "Maharashtra",
    platform: "google",
    impressions: 296000,
    clicks: 11360,
    spend: 27480,
    conversions: 544,
    ctr: 3.84,
    cpc: 2.42,
  },
  {
    city: "Delhi",
    state: "Delhi NCR",
    platform: "google",
    impressions: 267000,
    clicks: 10230,
    spend: 24730,
    conversions: 489,
    ctr: 3.83,
    cpc: 2.42,
  },
  {
    city: "Bangalore",
    state: "Karnataka",
    platform: "google",
    impressions: 222000,
    clicks: 8520,
    spend: 20600,
    conversions: 407,
    ctr: 3.84,
    cpc: 2.42,
  },
  {
    city: "Chennai",
    state: "Tamil Nadu",
    platform: "google",
    impressions: 178000,
    clicks: 6830,
    spend: 16510,
    conversions: 325,
    ctr: 3.84,
    cpc: 2.42,
  },
  {
    city: "Hyderabad",
    state: "Telangana",
    platform: "google",
    impressions: 163000,
    clicks: 6250,
    spend: 15110,
    conversions: 297,
    ctr: 3.83,
    cpc: 2.42,
  },
  {
    city: "Pune",
    state: "Maharashtra",
    platform: "google",
    impressions: 148000,
    clicks: 5680,
    spend: 13730,
    conversions: 270,
    ctr: 3.84,
    cpc: 2.42,
  },
  {
    city: "Ahmedabad",
    state: "Gujarat",
    platform: "google",
    impressions: 111000,
    clicks: 4260,
    spend: 10300,
    conversions: 203,
    ctr: 3.84,
    cpc: 2.42,
  },
  {
    city: "Kolkata",
    state: "West Bengal",
    platform: "google",
    impressions: 97000,
    clicks: 3690,
    spend: 8940,
    conversions: 183,
    ctr: 3.81,
    cpc: 2.42,
  },
  // DV360 geo
  {
    city: "Mumbai",
    state: "Maharashtra",
    platform: "dv360",
    impressions: 1556000,
    clicks: 18250,
    spend: 36890,
    conversions: 497,
    ctr: 1.17,
    cpc: 2.02,
  },
  {
    city: "Delhi",
    state: "Delhi NCR",
    platform: "dv360",
    impressions: 1412000,
    clicks: 16570,
    spend: 33510,
    conversions: 451,
    ctr: 1.17,
    cpc: 2.02,
  },
  {
    city: "Bangalore",
    state: "Karnataka",
    platform: "dv360",
    impressions: 1158000,
    clicks: 13590,
    spend: 27470,
    conversions: 370,
    ctr: 1.17,
    cpc: 2.02,
  },
  {
    city: "Chennai",
    state: "Tamil Nadu",
    platform: "dv360",
    impressions: 890000,
    clicks: 10440,
    spend: 21110,
    conversions: 284,
    ctr: 1.17,
    cpc: 2.02,
  },
  {
    city: "Hyderabad",
    state: "Telangana",
    platform: "dv360",
    impressions: 798000,
    clicks: 9360,
    spend: 18930,
    conversions: 255,
    ctr: 1.17,
    cpc: 2.02,
  },
  {
    city: "Pune",
    state: "Maharashtra",
    platform: "dv360",
    impressions: 614000,
    clicks: 7200,
    spend: 14560,
    conversions: 196,
    ctr: 1.17,
    cpc: 2.02,
  },
  {
    city: "Ahmedabad",
    state: "Gujarat",
    platform: "dv360",
    impressions: 489000,
    clicks: 5740,
    spend: 11610,
    conversions: 156,
    ctr: 1.17,
    cpc: 2.02,
  },
  {
    city: "Kolkata",
    state: "West Bengal",
    platform: "dv360",
    impressions: 323000,
    clicks: 3790,
    spend: 7660,
    conversions: 103,
    ctr: 1.17,
    cpc: 2.02,
  },
  // Meta geo
  {
    city: "Mumbai",
    state: "Maharashtra",
    platform: "meta",
    impressions: 493000,
    clicks: 13620,
    spend: 25810,
    conversions: 592,
    ctr: 2.76,
    cpc: 1.89,
  },
  {
    city: "Delhi",
    state: "Delhi NCR",
    platform: "meta",
    impressions: 440000,
    clicks: 12160,
    spend: 23040,
    conversions: 528,
    ctr: 2.76,
    cpc: 1.89,
  },
  {
    city: "Bangalore",
    state: "Karnataka",
    platform: "meta",
    impressions: 370000,
    clicks: 10230,
    spend: 19380,
    conversions: 444,
    ctr: 2.76,
    cpc: 1.89,
  },
  {
    city: "Chennai",
    state: "Tamil Nadu",
    platform: "meta",
    impressions: 290000,
    clicks: 8020,
    spend: 15200,
    conversions: 348,
    ctr: 2.76,
    cpc: 1.89,
  },
  {
    city: "Hyderabad",
    state: "Telangana",
    platform: "meta",
    impressions: 265000,
    clicks: 7320,
    spend: 13880,
    conversions: 318,
    ctr: 2.76,
    cpc: 1.89,
  },
  {
    city: "Pune",
    state: "Maharashtra",
    platform: "meta",
    impressions: 210000,
    clicks: 5800,
    spend: 11000,
    conversions: 252,
    ctr: 2.76,
    cpc: 1.9,
  },
  {
    city: "Ahmedabad",
    state: "Gujarat",
    platform: "meta",
    impressions: 118000,
    clicks: 3260,
    spend: 6180,
    conversions: 141,
    ctr: 2.76,
    cpc: 1.89,
  },
  {
    city: "Kolkata",
    state: "West Bengal",
    platform: "meta",
    impressions: 124000,
    clicks: 3390,
    spend: 6410,
    conversions: 153,
    ctr: 2.74,
    cpc: 1.89,
  },
];

// ============ DEMOGRAPHIC DATA ============

function generateDemographicData(): DemographicRow[] {
  const data: DemographicRow[] = [];

  // Google Ads age breakdown
  const googleAgeWeights = {
    "18-24": 0.12,
    "25-34": 0.28,
    "35-44": 0.26,
    "45-54": 0.18,
    "55-64": 0.1,
    "65+": 0.06,
  };

  Object.entries(googleAgeWeights).forEach(([segment, weight]) => {
    data.push({
      dimension: "age",
      segment,
      platform: "google",
      impressions: Math.round(1482000 * weight),
      clicks: Math.round(56820 * weight),
      spend: Math.round(137400 * weight),
      conversions: Math.round(2718 * weight),
    });
  });

  // Google Ads gender breakdown
  data.push({
    dimension: "gender",
    segment: "Male",
    platform: "google",
    impressions: Math.round(1482000 * 0.52),
    clicks: Math.round(56820 * 0.52),
    spend: Math.round(137400 * 0.52),
    conversions: Math.round(2718 * 0.52),
  });
  data.push({
    dimension: "gender",
    segment: "Female",
    platform: "google",
    impressions: Math.round(1482000 * 0.44),
    clicks: Math.round(56820 * 0.44),
    spend: Math.round(137400 * 0.44),
    conversions: Math.round(2718 * 0.44),
  });
  data.push({
    dimension: "gender",
    segment: "Unknown",
    platform: "google",
    impressions: Math.round(1482000 * 0.04),
    clicks: Math.round(56820 * 0.04),
    spend: Math.round(137400 * 0.04),
    conversions: Math.round(2718 * 0.04),
  });

  // DV360 age breakdown
  const dv360AgeWeights = {
    "18-24": 0.08,
    "25-34": 0.22,
    "35-44": 0.28,
    "45-54": 0.22,
    "55-64": 0.13,
    "65+": 0.07,
  };

  Object.entries(dv360AgeWeights).forEach(([segment, weight]) => {
    data.push({
      dimension: "age",
      segment,
      platform: "dv360",
      impressions: Math.round(7240000 * weight),
      clicks: Math.round(84900 * weight),
      spend: Math.round(171600 * weight),
      conversions: Math.round(2316 * weight),
    });
  });

  // DV360 gender breakdown
  data.push({
    dimension: "gender",
    segment: "Male",
    platform: "dv360",
    impressions: Math.round(7240000 * 0.55),
    clicks: Math.round(84900 * 0.55),
    spend: Math.round(171600 * 0.55),
    conversions: Math.round(2316 * 0.55),
  });
  data.push({
    dimension: "gender",
    segment: "Female",
    platform: "dv360",
    impressions: Math.round(7240000 * 0.41),
    clicks: Math.round(84900 * 0.41),
    spend: Math.round(171600 * 0.41),
    conversions: Math.round(2316 * 0.41),
  });
  data.push({
    dimension: "gender",
    segment: "Unknown",
    platform: "dv360",
    impressions: Math.round(7240000 * 0.04),
    clicks: Math.round(84900 * 0.04),
    spend: Math.round(171600 * 0.04),
    conversions: Math.round(2316 * 0.04),
  });

  // Meta age breakdown
  const metaAgeWeights = {
    "18-24": 0.18,
    "25-34": 0.32,
    "35-44": 0.24,
    "45-54": 0.14,
    "55-64": 0.08,
    "65+": 0.04,
  };

  Object.entries(metaAgeWeights).forEach(([segment, weight]) => {
    data.push({
      dimension: "age",
      segment,
      platform: "meta",
      impressions: Math.round(2310000 * weight),
      clicks: Math.round(63800 * weight),
      spend: Math.round(120900 * weight),
      conversions: Math.round(2776 * weight),
    });
  });

  // Meta gender breakdown
  data.push({
    dimension: "gender",
    segment: "Male",
    platform: "meta",
    impressions: Math.round(2310000 * 0.45),
    clicks: Math.round(63800 * 0.45),
    spend: Math.round(120900 * 0.45),
    conversions: Math.round(2776 * 0.45),
  });
  data.push({
    dimension: "gender",
    segment: "Female",
    platform: "meta",
    impressions: Math.round(2310000 * 0.52),
    clicks: Math.round(63800 * 0.52),
    spend: Math.round(120900 * 0.52),
    conversions: Math.round(2776 * 0.52),
  });
  data.push({
    dimension: "gender",
    segment: "Unknown",
    platform: "meta",
    impressions: Math.round(2310000 * 0.03),
    clicks: Math.round(63800 * 0.03),
    spend: Math.round(120900 * 0.03),
    conversions: Math.round(2776 * 0.03),
  });

  return data;
}

// ============ PLACEMENT DATA ============

const META_PLACEMENTS: MetaPlacement[] = [
  {
    placement: "Facebook Feed",
    surface: "facebook",
    impressions: 680000,
    clicks: 18800,
    spend: 35620,
    conversions: 817,
    reach: 455000,
    frequency: 1.49,
    ctr: 2.76,
  },
  {
    placement: "Instagram Feed",
    surface: "instagram",
    impressions: 578000,
    clicks: 15980,
    spend: 30270,
    conversions: 695,
    reach: 392000,
    frequency: 1.47,
    ctr: 2.76,
  },
  {
    placement: "Instagram Stories",
    surface: "instagram",
    impressions: 395000,
    clicks: 10920,
    spend: 20640,
    conversions: 474,
    reach: 276000,
    frequency: 1.43,
    ctr: 2.76,
  },
  {
    placement: "Instagram Reels",
    surface: "instagram",
    impressions: 298000,
    clicks: 8240,
    spend: 15610,
    conversions: 358,
    reach: 212000,
    frequency: 1.41,
    ctr: 2.76,
  },
  {
    placement: "Facebook Stories",
    surface: "facebook",
    impressions: 175000,
    clicks: 4840,
    spend: 9170,
    conversions: 210,
    reach: 128000,
    frequency: 1.37,
    ctr: 2.76,
  },
  {
    placement: "Audience Network",
    surface: "audience_network",
    impressions: 115000,
    clicks: 3180,
    spend: 6030,
    conversions: 138,
    reach: 88000,
    frequency: 1.31,
    ctr: 2.76,
  },
  {
    placement: "Messenger",
    surface: "messenger",
    impressions: 69000,
    clicks: 1840,
    spend: 3560,
    conversions: 84,
    reach: 54000,
    frequency: 1.28,
    ctr: 2.67,
  },
];

// ============ FUNNEL DATA FUNCTION ============

export function getFunnelData(
  platform: "google" | "dv360" | "meta",
  clientType: "app" | "web"
): FunnelStage[] {
  let impressions = 0,
    clicks = 0,
    conversions = 0;

  if (platform === "google") {
    impressions = 1482000;
    clicks = 56820;
    conversions = 2718;
  } else if (platform === "dv360") {
    impressions = 7240000;
    clicks = 84900;
    conversions = 2316;
  } else {
    impressions = 2310000;
    clicks = 63800;
    conversions = 2776;
  }

  if (clientType === "web") {
    return [
      { stage: "Impressions", value: impressions, dropoffPercent: 0 },
      {
        stage: "Clicks",
        value: clicks,
        dropoffPercent: parseFloat(((1 - clicks / impressions) * 100).toFixed(1)),
      },
      {
        stage: "Page Visit",
        value: Math.round(clicks * 0.85),
        dropoffPercent: 15,
      },
      {
        stage: "View Item",
        value: Math.round(clicks * 0.85 * 0.6),
        dropoffPercent: 40,
      },
      {
        stage: "Begin Checkout",
        value: Math.round(clicks * 0.85 * 0.6 * 0.3),
        dropoffPercent: 70,
      },
      {
        stage: "Purchase",
        value: conversions,
        dropoffPercent: parseFloat(
          (100 - (conversions / (clicks * 0.85 * 0.6 * 0.3)) * 100).toFixed(1)
        ),
      },
    ];
  } else {
    // app funnel
    return [
      { stage: "Impressions", value: impressions, dropoffPercent: 0 },
      {
        stage: "Clicks",
        value: clicks,
        dropoffPercent: parseFloat(((1 - clicks / impressions) * 100).toFixed(1)),
      },
      {
        stage: "App Open",
        value: Math.round(clicks * 0.75),
        dropoffPercent: 25,
      },
      {
        stage: "Add to Cart",
        value: Math.round(clicks * 0.75 * 0.4),
        dropoffPercent: 60,
      },
      {
        stage: "Checkout",
        value: Math.round(clicks * 0.75 * 0.4 * 0.5),
        dropoffPercent: 50,
      },
      {
        stage: "Purchase",
        value: conversions,
        dropoffPercent: parseFloat(
          (100 - (conversions / (clicks * 0.75 * 0.4 * 0.5)) * 100).toFixed(1)
        ),
      },
    ];
  }
}

// ============ EXPORTED DATA FUNCTIONS ============

export function getMockCampaigns(): Campaign[] {
  return [...GOOGLE_ADS_CAMPAIGNS, ...DV360_CAMPAIGNS, ...META_CAMPAIGNS];
}

export function getMockAdGroups(): AdGroup[] {
  return GOOGLE_AD_GROUPS;
}

export function getAdSets(): AdSet[] {
  return META_AD_SETS;
}

export function getInsertionOrders(): InsertionOrder[] {
  return DV360_INSERTION_ORDERS;
}

export function getLineItems(): LineItem[] {
  return DV360_LINE_ITEMS;
}

export function getGeoData(): GeoRow[] {
  return GEO_DATA;
}

export function getDemographicData(): DemographicRow[] {
  return generateDemographicData();
}

export function getMetaPlacements(): MetaPlacement[] {
  return META_PLACEMENTS;
}

export function getSearchTerms(): SearchTerm[] {
  // Distribute total Google search spend across search terms
  const googleSpend = GOOGLE_ADS_CAMPAIGNS.filter(
    (c) => c.type === "Search"
  ).reduce((sum, c) => sum + c.spent, 0);
  // const googleClicks = GOOGLE_ADS_CAMPAIGNS.filter(
  //   (c) => c.type === "Search"
  // ).reduce((sum, c) => sum + c.clicks, 0);

  const terms: Omit<SearchTerm, "spend" | "ctr" | "cpc" | "cvr">[] = [
    {
      keyword: "branded shoes",
      matchType: "Exact",
      impressions: 28000,
      clicks: 2240,
      conversions: 112,
      qualityScore: 8,
    },
    {
      keyword: "sports footwear",
      matchType: "Phrase",
      impressions: 32000,
      clicks: 1920,
      conversions: 96,
      qualityScore: 7,
    },
    {
      keyword: "running shoes online",
      matchType: "Broad",
      impressions: 25600,
      clicks: 1024,
      conversions: 51,
      qualityScore: 6,
    },
    {
      keyword: "buy athletic shoes",
      matchType: "Exact",
      impressions: 22400,
      clicks: 1904,
      conversions: 95,
      qualityScore: 7,
    },
    {
      keyword: "best sport shoes",
      matchType: "Phrase",
      impressions: 24000,
      clicks: 1680,
      conversions: 84,
      qualityScore: 6,
    },
    {
      keyword: "discount shoes sale",
      matchType: "Broad",
      impressions: 28800,
      clicks: 2016,
      conversions: 101,
      qualityScore: 7,
    },
    {
      keyword: "women's athletic footwear",
      matchType: "Phrase",
      impressions: 21600,
      clicks: 1296,
      conversions: 65,
      qualityScore: 8,
    },
    {
      keyword: "comfortable running shoes",
      matchType: "Exact",
      impressions: 19600,
      clicks: 1568,
      conversions: 78,
      qualityScore: 7,
    },
  ];

  // Calculate proportional spend and CPC for each term
  let totalClicks = 0;
  terms.forEach((t) => (totalClicks += t.clicks));

  return terms.map((term) => {
    const spend = (term.clicks / totalClicks) * googleSpend;
    const cpc = spend / term.clicks;
    return {
      ...term,
      spend: Math.round(spend),
      ctr: parseFloat(((term.clicks / term.impressions) * 100).toFixed(2)),
      cpc: parseFloat(cpc.toFixed(2)),
      cvr: parseFloat(((term.conversions / term.clicks) * 100).toFixed(2)),
    };
  });
}

export function getPlacements(): Placement[] {
  return [
    {
      placementType: "youtube",
      placementName: "YouTube In-Stream",
      impressions: 620000,
      clicks: 12400,
      conversions: 372,
      spend: 32240,
      views: 558000,
      ctr: 2.0,
      cpc: 2.6,
      cvr: 3.0,
      vtr: 90.0,
    },
    {
      placementType: "youtube",
      placementName: "YouTube Search",
      impressions: 480000,
      clicks: 9600,
      conversions: 288,
      spend: 24960,
      views: 432000,
      ctr: 2.0,
      cpc: 2.6,
      cvr: 3.0,
      vtr: 90.0,
    },
    {
      placementType: "display",
      placementName: "Display Network",
      impressions: 920000,
      clicks: 4600,
      conversions: 276,
      spend: 11960,
      views: 0,
      ctr: 0.5,
      cpc: 2.6,
      cvr: 6.0,
      vtr: undefined,
    },
    {
      placementType: "display",
      placementName: "Gmail",
      impressions: 680000,
      clicks: 3400,
      conversions: 204,
      spend: 8840,
      views: 0,
      ctr: 0.5,
      cpc: 2.6,
      cvr: 6.0,
      vtr: undefined,
    },
    {
      placementType: "meta",
      placementName: "Facebook Feed",
      impressions: 680000,
      clicks: 18800,
      conversions: 817,
      spend: 35620,
      views: 0,
      ctr: 2.76,
      cpc: 1.89,
      cvr: 4.35,
      vtr: undefined,
    },
    {
      placementType: "meta",
      placementName: "Instagram Feed",
      impressions: 578000,
      clicks: 15980,
      conversions: 695,
      spend: 30270,
      views: 0,
      ctr: 2.76,
      cpc: 1.89,
      cvr: 4.35,
      vtr: undefined,
    },
    {
      placementType: "meta",
      placementName: "Instagram Stories",
      impressions: 395000,
      clicks: 10920,
      conversions: 474,
      spend: 20640,
      views: 0,
      ctr: 2.76,
      cpc: 1.89,
      cvr: 4.35,
      vtr: undefined,
    },
    {
      placementType: "meta",
      placementName: "Messenger",
      impressions: 69000,
      clicks: 1840,
      conversions: 84,
      spend: 3560,
      views: 0,
      ctr: 2.67,
      cpc: 1.93,
      cvr: 4.57,
      vtr: undefined,
    },
  ];
}

export function getPMaxChannels(): PMaxChannel[] {
  return [
    {
      channel: "Search",
      impressions: 190000,
      clicks: 9500,
      conversions: 475,
      spend: 19000,
      revenue: 28500,
      ctr: 5.0,
      cpc: 2.0,
      cvr: 5.0,
      roas: 1.5,
    },
    {
      channel: "Shopping",
      impressions: 95000,
      clicks: 3800,
      conversions: 190,
      spend: 7600,
      revenue: 11400,
      ctr: 4.0,
      cpc: 2.0,
      cvr: 5.0,
      roas: 1.5,
    },
    {
      channel: "YouTube",
      impressions: 70000,
      clicks: 2100,
      conversions: 105,
      spend: 10500,
      revenue: 6300,
      ctr: 3.0,
      cpc: 5.0,
      cvr: 5.0,
      roas: 0.6,
    },
    {
      channel: "Display",
      impressions: 18000,
      clicks: 180,
      conversions: 9,
      spend: 468,
      revenue: 270,
      ctr: 1.0,
      cpc: 2.6,
      cvr: 5.0,
      roas: 0.58,
    },
    {
      channel: "Discover",
      impressions: 5000,
      clicks: 400,
      conversions: 20,
      spend: 800,
      revenue: 300,
      ctr: 8.0,
      cpc: 2.0,
      cvr: 5.0,
      roas: 0.375,
    },
    {
      channel: "Gmail",
      impressions: 2000,
      clicks: 240,
      conversions: 12,
      spend: 312,
      revenue: 180,
      ctr: 12.0,
      cpc: 1.3,
      cvr: 5.0,
      roas: 0.58,
    },
  ];
}

export function getCreatives(): Creative[] {
  return [
    {
      creativeId: "c001",
      creativeName: "Summer Promo Banner",
      format: "image",
      size: "300x250",
      platform: "google",
      impressions: 142500,
      clicks: 7125,
      conversions: 356,
      spend: 14250,
      frequency: 1.0,
      ctr: 5.0,
      cvr: 5.0,
      roas: 3.26,
    },
    {
      creativeId: "c002",
      creativeName: "Product Demo Video",
      format: "video",
      size: "1920x1080",
      platform: "google",
      impressions: 142500,
      clicks: 7125,
      conversions: 356,
      spend: 14250,
      frequency: 1.0,
      ctr: 5.0,
      cvr: 5.0,
      roas: 3.26,
    },
    {
      creativeId: "c003",
      creativeName: "Fashion Collection Carousel",
      format: "carousel",
      size: "1080x1080",
      platform: "meta",
      impressions: 1155000,
      clicks: 31900,
      conversions: 1388,
      spend: 60450,
      frequency: 1.57,
      ctr: 2.76,
      cvr: 4.35,
      roas: 3.43,
    },
    {
      creativeId: "c004",
      creativeName: "Meta Product Video",
      format: "video",
      size: "1080x1920",
      platform: "meta",
      impressions: 1155000,
      clicks: 31900,
      conversions: 1388,
      spend: 60450,
      frequency: 1.57,
      ctr: 2.76,
      cvr: 4.35,
      roas: 3.43,
    },
    {
      creativeId: "c005",
      creativeName: "DV360 Display Banner",
      format: "image",
      size: "728x90",
      platform: "dv360",
      impressions: 3620000,
      clicks: 42450,
      conversions: 1158,
      spend: 85800,
      frequency: 1.0,
      ctr: 1.17,
      cvr: 2.73,
      roas: 1.9,
    },
    {
      creativeId: "c006",
      creativeName: "DV360 Video Ad",
      format: "video",
      size: "1280x720",
      platform: "dv360",
      impressions: 3620000,
      clicks: 42450,
      conversions: 1158,
      spend: 85800,
      frequency: 1.0,
      ctr: 1.17,
      cvr: 2.73,
      roas: 1.9,
    },
  ];
}

export function getPeriodComparisons(): {
  week: PeriodComparison[];
  month: PeriodComparison[];
  quarter: PeriodComparison[];
} {
  return {
    week: [
      { metric: "Impressions", previousValue: 450000, currentValue: 480000, changePercent: 6.67 },
      { metric: "Clicks", previousValue: 18000, currentValue: 19200, changePercent: 6.67 },
      { metric: "Conversions", previousValue: 900, currentValue: 960, changePercent: 6.67 },
      { metric: "Spend", previousValue: 45000, currentValue: 48000, changePercent: 6.67 },
      { metric: "Revenue", previousValue: 135000, currentValue: 144000, changePercent: 6.67 },
      { metric: "CTR", previousValue: 4.0, currentValue: 4.0, changePercent: 0 },
      { metric: "CPC", previousValue: 2.5, currentValue: 2.5, changePercent: 0 },
      { metric: "CVR", previousValue: 5.0, currentValue: 5.0, changePercent: 0 },
      { metric: "ROAS", previousValue: 3.0, currentValue: 3.0, changePercent: 0 },
    ],
    month: [
      { metric: "Impressions", previousValue: 1800000, currentValue: 1920000, changePercent: 6.67 },
      { metric: "Clicks", previousValue: 72000, currentValue: 76800, changePercent: 6.67 },
      { metric: "Conversions", previousValue: 3600, currentValue: 3840, changePercent: 6.67 },
      { metric: "Spend", previousValue: 180000, currentValue: 192000, changePercent: 6.67 },
      { metric: "Revenue", previousValue: 540000, currentValue: 576000, changePercent: 6.67 },
      { metric: "CTR", previousValue: 4.0, currentValue: 4.0, changePercent: 0 },
      { metric: "CPC", previousValue: 2.5, currentValue: 2.5, changePercent: 0 },
      { metric: "CVR", previousValue: 5.0, currentValue: 5.0, changePercent: 0 },
      { metric: "ROAS", previousValue: 3.0, currentValue: 3.0, changePercent: 0 },
    ],
    quarter: [
      { metric: "Impressions", previousValue: 5400000, currentValue: 5760000, changePercent: 6.67 },
      { metric: "Clicks", previousValue: 216000, currentValue: 230400, changePercent: 6.67 },
      { metric: "Conversions", previousValue: 10800, currentValue: 11520, changePercent: 6.67 },
      { metric: "Spend", previousValue: 540000, currentValue: 576000, changePercent: 6.67 },
      { metric: "Revenue", previousValue: 1620000, currentValue: 1728000, changePercent: 6.67 },
      { metric: "CTR", previousValue: 4.0, currentValue: 4.0, changePercent: 0 },
      { metric: "CPC", previousValue: 2.5, currentValue: 2.5, changePercent: 0 },
      { metric: "CVR", previousValue: 5.0, currentValue: 5.0, changePercent: 0 },
      { metric: "ROAS", previousValue: 3.0, currentValue: 3.0, changePercent: 0 },
    ],
  };
}

export function generateDailyMetrics(): DailyMetric[] {
  const metrics: DailyMetric[] = [];

  // Generate from 90 days ago to today
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 90);

  // Realistic patterns: weekday higher, weekend lower, with upward trend and variation
  for (let i = 0; i < 90; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Trend: increase over 90 days (days 1-30 baseline, 31-60 +15%, 61-90 +30%)
    let trendMultiplier = 1.0;
    if (i >= 60) trendMultiplier = 1.3;
    else if (i >= 30) trendMultiplier = 1.15;

    // Weekend modifier
    const weekendMod = isWeekend ? 0.75 : 1.0;

    // Daily variation (pseudo-random but deterministic)
    const dayVariation = (Math.sin(i * 0.5) * 0.1 + 1.0);

    // Google Ads: Search-heavy, steady performance
    const googleSpend = Math.round(4600 * trendMultiplier * weekendMod * dayVariation);
    const googleImpressions = Math.round(49400 * trendMultiplier * weekendMod * dayVariation);
    const googleClicks = Math.round(1894 * trendMultiplier * weekendMod * dayVariation);

    const googleConversions = Math.round(googleClicks * 0.048);
    metrics.push({
      date: dateStr,
      platform: "google",
      spend: googleSpend,
      revenue: Math.round(googleSpend * 3),
      impressions: googleImpressions,
      clicks: googleClicks,
      conversions: googleConversions,
      views: 0,
      reach: Math.round(googleImpressions * 0.65),
      frequency: 2.1,
      cpm: googleImpressions > 0 ? (googleSpend / googleImpressions) * 1000 : 0,
      vtr: 0.32,
      cpv: 0,
      viewability: 0.72,
      thruPlays: 0,
      engagementRate: 0.024,
      vtc: 0,
      cpa: googleConversions > 0 ? googleSpend / googleConversions : 0,
    });

    // DV360: Display/Video, higher volume
    const dv360Spend = Math.round(5720 * trendMultiplier * weekendMod * dayVariation);
    const dv360Impressions = Math.round(241333 * trendMultiplier * weekendMod * dayVariation);
    const dv360Clicks = Math.round(2830 * trendMultiplier * weekendMod * dayVariation);
    const dv360Views = Math.round(50000 * trendMultiplier * weekendMod * dayVariation);

    const dv360Conversions = Math.round(dv360Clicks * 0.027);
    metrics.push({
      date: dateStr,
      platform: "dv360",
      spend: dv360Spend,
      revenue: Math.round(dv360Spend * 2.03),
      impressions: dv360Impressions,
      clicks: dv360Clicks,
      conversions: dv360Conversions,
      views: dv360Views,
      reach: Math.round(dv360Impressions * 0.58),
      frequency: 4.2,
      cpm: dv360Impressions > 0 ? (dv360Spend / dv360Impressions) * 1000 : 0,
      vtr: 0.45,
      cpv: dv360Views > 0 ? dv360Spend / dv360Views : 0,
      viewability: 0.68,
      thruPlays: 0,
      engagementRate: 0.031,
      vtc: Math.round(dv360Conversions * 0.35),
      cpa: dv360Conversions > 0 ? dv360Spend / dv360Conversions : 0,
    });

    // Meta: Social, highly variable
    const metaSpend = Math.round(4030 * trendMultiplier * weekendMod * dayVariation * (isWeekend ? 1.1 : 0.9));
    const metaImpressions = Math.round(77000 * trendMultiplier * weekendMod * dayVariation);
    const metaClicks = Math.round(2127 * trendMultiplier * weekendMod * dayVariation);

    const metaConversions = Math.round(metaClicks * 0.0437);
    const metaViews = 0;
    metrics.push({
      date: dateStr,
      platform: "meta",
      spend: metaSpend,
      revenue: Math.round(metaSpend * 3.44),
      impressions: metaImpressions,
      clicks: metaClicks,
      conversions: metaConversions,
      views: metaViews,
      reach: Math.round(metaImpressions * 0.42),
      frequency: 6.8,
      cpm: metaImpressions > 0 ? (metaSpend / metaImpressions) * 1000 : 0,
      vtr: 0,
      cpv: 0,
      viewability: 0,
      thruPlays: Math.round(metaViews * 0.6),
      engagementRate: 0.048,
      vtc: 0,
      cpa: metaConversions > 0 ? metaSpend / metaConversions : 0,
    });
  }

  return metrics;
}

export function calculateMetrics(
  clicks: number,
  impressions: number,
  spend: number,
  conversions: number,
  revenue: number,
  views = 0
): {
  ctr: number;
  cpc: number;
  cpm: number;
  cvr: number;
  roas: number;
  vtr: number;
} {
  return {
    ctr: impressions ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0,
    cpc: clicks ? parseFloat((spend / clicks).toFixed(2)) : 0,
    cpm: impressions ? parseFloat(((spend / impressions) * 1000).toFixed(2)) : 0,
    cvr: clicks ? parseFloat(((conversions / clicks) * 100).toFixed(2)) : 0,
    roas: spend ? parseFloat((revenue / spend).toFixed(2)) : 0,
    vtr: impressions && views ? parseFloat(((views / impressions) * 100).toFixed(2)) : 0,
  };
}

// AI Recommendations Interface
export interface Recommendation {
  id: string;
  platform: 'google' | 'meta' | 'dv360';
  campaign: string;
  issue: string;          // e.g., "ROAS 0.8x for 3 days"
  action: string;          // e.g., "Reduce budget by 30% or pause"
  priority: 'high' | 'medium' | 'low';
}

/**
 * Generate mock AI recommendations for campaign optimization
 * Returns realistic scenarios: ROAS decline, frequency warning, budget limit, etc.
 */
export function getMockRecommendations(): Recommendation[] {
  return [
    {
      id: 'rec-001',
      platform: 'google',
      campaign: 'Summer Sale',
      issue: 'ROAS 0.8x for 3 days',
      action: 'Reduce budget by 30% or pause campaign',
      priority: 'high',
    },
    {
      id: 'rec-002',
      platform: 'google',
      campaign: 'Brand Search',
      issue: 'Limited by budget',
      action: 'Increase daily budget by ₹5,000 to capture more high-intent traffic',
      priority: 'medium',
    },
    {
      id: 'rec-003',
      platform: 'meta',
      campaign: 'Meta Retargeting',
      issue: 'Frequency 5.8x (audience fatigue)',
      action: 'Refresh creatives or expand audience to reduce ad fatigue',
      priority: 'high',
    },
    {
      id: 'rec-004',
      platform: 'dv360',
      campaign: 'DV360 Premium Sites',
      issue: 'CPC ₹2.46 (up 24% WoW)',
      action: 'Review placement quality and consider pausing underperforming sites',
      priority: 'medium',
    },
    {
      id: 'rec-005',
      platform: 'meta',
      campaign: 'Meta - SIP Investment',
      issue: 'High ROAS 3.32x (opportunity)',
      action: 'Increase budget by 20-30% to scale winning creative',
      priority: 'low',
    },
  ];
}
