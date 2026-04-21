# Canopi — Ticket Breakdown

## Ticket 1: Project Setup & Data Layer

**Priority:** P0 — everything depends on this
**Estimate:** 30 mins

### Description
Repo is already scaffolded with Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, and ESLint. This ticket adds dependencies, the dataset, type definitions, and data helper functions.

### Technical Details

**Stack (already in place):**
- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS v4 (uses CSS-based config via `@theme` in `app/globals.css`, no `tailwind.config.ts`)
- ESLint

**Tailwind v4 notes:**
- No `tailwind.config.ts` — configuration is done in CSS using `@theme` blocks
- Import via `@import "tailwindcss"` in `globals.css`
- Custom colours defined as CSS custom properties in `@theme`
- All utility classes work the same as v3, just configured differently

**Dependencies to install:**
```bash
npm install @anthropic-ai/sdk lucide-react
```
- `@anthropic-ai/sdk` — Claude API client
- `lucide-react` — icons (lightweight, tree-shakeable)

**File structure (new files to add):**
```
src/
├── app/
│   ├── layout.tsx              # update: fonts, metadata
│   ├── page.tsx                # update: product catalogue
│   └── product/
│       └── [id]/
│           └── page.tsx        # new: product detail + report
├── components/
│   ├── ProductCard.tsx
│   ├── ProductGrid.tsx
│   ├── SearchBar.tsx
│   ├── RiskBadge.tsx
│   ├── Report.tsx
│   ├── ReportSection.tsx
│   ├── AlternativeCard.tsx
│   └── LoadingReport.tsx
├── lib/
│   ├── data.ts                 # dataset import + lookup helpers
│   ├── types.ts                # Commodity, Company, Product types
│   ├── report-types.ts         # DeforestationReport type
│   └── generate-report.ts      # deterministic fallback report generator
├── app/api/
│   └── report/
│       └── route.ts            # POST endpoint for AI report generation
└── data/
    └── dataset.json            # the curated dataset
```

**Data helpers (`lib/data.ts`):**
```typescript
import dataset from '@/data/dataset.json';
import { Product, Company, Commodity, Dataset } from './types';

const data = dataset as Dataset;

export function getAllProducts(): Product[] {
  return data.products;
}

export function getProductById(id: string): Product | undefined {
  return data.products.find(p => p.id === id);
}

export function getCompanyById(id: string): Company | undefined {
  return data.companies.find(c => c.id === id);
}

export function getCommodityById(id: string): Commodity | undefined {
  return data.commodities.find(c => c.id === id);
}

export function getProductContext(productId: string) {
  const product = getProductById(productId);
  if (!product) return null;

  const company = getCompanyById(product.company_id);
  const commodities = product.commodities.map(pc => ({
    ...pc,
    detail: getCommodityById(pc.commodity_id),
  }));

  return { product, company, commodities };
}
```

### Acceptance Criteria
- [ ] Next.js app runs locally with `npm run dev`
- [ ] Dataset imports without errors
- [ ] All type definitions compile
- [ ] `getProductContext()` returns assembled data for any product ID
- [ ] Environment variable `ANTHROPIC_API_KEY` is read but app runs without it

---

## Ticket 2: Product Catalogue Page

**Priority:** P0
**Estimate:** 1 hour
**Depends on:** Ticket 1

### Description
Build the home page — a searchable, browsable grid of the 15 products with risk score badges.

### Technical Details

**Page: `app/page.tsx`**
- Server component — reads products from data layer at build time
- Passes products to `<ProductGrid>` client component
- Page title: "Canopi — Is your product linked to deforestation?"

**Component: `ProductGrid.tsx`** (client component — needs search state)
- Receives `Product[]` as prop
- Local state: `searchQuery: string`
- Filters products by name, brand, or category (case-insensitive includes)
- Renders filtered products as `<ProductCard>` components
- Grid layout: 1 column mobile, 2 tablet, 3 desktop

**Component: `SearchBar.tsx`**
- Controlled input with debounced onChange (no need for a library — just useState)
- Placeholder: "Search products..."
- Clear button when input is non-empty
- Magnifying glass icon from lucide-react

**Component: `ProductCard.tsx`**
- Links to `/product/[id]`
- Displays: product name, brand, category tag, risk score badge
- Subtle hover state
- Uses `next/link` for client-side navigation

**Component: `RiskBadge.tsx`**
- Props: `score: number`
- Derives level: 1-3 = "Low" (green), 4-6 = "Moderate" (amber), 7-10 = "High" (red)
- Renders as a small pill/badge: coloured dot + score + label
- Tailwind classes:
  - Low: `bg-emerald-100 text-emerald-800`
  - Moderate: `bg-amber-100 text-amber-800`
  - High: `bg-red-100 text-red-800`

**Responsive layout:**
```css
/* Tailwind grid classes */
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4
```

### Acceptance Criteria
- [ ] All 15 products visible on page load
- [ ] Search filters products in real time by name, brand, or category
- [ ] Each product card shows name, brand, category, and risk badge
- [ ] Risk badges show correct colour for each score range
- [ ] Clicking a product navigates to `/product/[id]`
- [ ] Layout is responsive — single column on mobile, multi-column on desktop
- [ ] Empty state when search matches nothing: "No products found"

---

## Ticket 3: Product Detail Page (Layout & Loading)

**Priority:** P0
**Estimate:** 45 mins
**Depends on:** Ticket 1, Ticket 2

### Description
Build the product detail page layout, including the loading state while the report generates. This ticket does NOT include the AI call — it sets up the page structure and renders the product header.

### Technical Details

**Page: `app/product/[id]/page.tsx`**
- Server component for initial product data fetch
- Uses `getProductContext(id)` to get product + company + commodities
- Returns 404 if product not found
- Renders product header (server) + report section (client component that fetches)

**Product header section (server-rendered):**
- Back link: "← Back to products"
- Product name (h1), brand, category tag
- Risk badge (large version)
- Commodities present — small pills showing "Palm Oil", "Cocoa" etc.

**Component: `Report.tsx`** (client component)
- Props: `productId: string`
- On mount, calls `POST /api/report` with the product ID
- State: `loading | error | success`
- While loading: renders `<LoadingReport>`
- On success: renders report sections (Ticket 5)
- On error: "Failed to generate report. Please try again." with retry button

**Component: `LoadingReport.tsx`**
- Skeleton UI matching the report layout
- Animated pulse on skeleton blocks
- Text: "Analysing supply chain..." (cycles through messages):
  1. "Checking ingredients..."
  2. "Reviewing certifications..."
  3. "Investigating supply chain..."
  4. "Generating report..."
- Cycle every 2 seconds using `useEffect` + `setInterval`

**Layout structure:**
Something like
```
┌─────────────────────────────┐
│ ← Back to products          │
│                             │
│ Product Name        [Badge] │
│ Brand · Category            │
│ [Cocoa] [Palm Oil] [Soy]    │
│                             │
│ ─────────────────────────── │
│                             │
│ [Report content / Loading]  │
│                             │
└─────────────────────────────┘
```

### Acceptance Criteria
- [ ] Page renders with correct product data from URL param
- [ ] 404 page shown for invalid product IDs - "Sorry we couldn't find this product, browse available products."
- [ ] Back link navigates to home page
- [ ] Loading state shows skeleton + rotating status messages
- [ ] Product header displays name, brand, category, risk badge, commodity pills
- [ ] Page is responsive — comfortable to read on mobile

---

## Ticket 4: AI Report Generation (API Route)

**Priority:** P0
**Estimate:** 1.5 hours
**Depends on:** Ticket 1

### Description
Build the API route that assembles product context from the dataset, sends it to Claude (or falls back to deterministic generation), and returns a structured `DeforestationReport`.

### Technical Details

**API route: `app/api/report/route.ts`**
```typescript
export async function POST(req: Request) {
  const { productId } = await req.json();
  const context = getProductContext(productId);
  if (!context) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const report = process.env.ANTHROPIC_API_KEY
    ? await generateAIReport(context)
    : generateFallbackReport(context);

  return NextResponse.json(report);
}
```

**AI generation (`generateAIReport`):**
- Uses `@anthropic-ai/sdk`
- Model: `claude-sonnet-4-20250514`
- Max tokens: 1024
- System prompt (key instructions):
  - You are a deforestation risk analyst writing for consumers
  - You will receive structured JSON about a product, its parent company, and its commodities
  - Generate a report matching the DeforestationReport JSON schema exactly
  - Write in plain English for a non-expert
  - Be honest about uncertainty — distinguish between company claims and independent evidence
  - Where company claims conflict with NGO findings, highlight the tension
  - Never invent information beyond what's provided
  - Keep each section concise: verdict (1-2 sentences), commodity explanations (1-2 sentences each), certification verdicts (1-2 sentences each), company summary (2-3 sentences), bottom line (2-3 sentences)
- User message: the assembled context as JSON
- Response: parse the JSON from Claude's response into `DeforestationReport`

**Prompt structure:**
```
System: [analyst instructions + output schema]

User:
Product: { ...product data }
Company: { ...company data }
Commodities: [ ...enriched commodity data ]

Respond with a JSON object matching this schema:
{ verdict: {...}, commodities: [...], certifications: [...], company: {...}, bottom_line: "...", alternatives: [...] }
```

**Fallback generation (`lib/generate-report.ts`):**
- Pure function, no API call
- Takes same context, assembles `DeforestationReport` programmatically
- Verdict: template string using score + level + first risk factor
- Commodities: maps commodity data into `ReportCommodity` objects using the commodity reference `deforestation_link` field
- Certifications: maps product certifications with strength-based verdict templates
- Company: assembles from company `traceability_summary` + `incidents`
- Bottom line: template based on risk level (low/moderate/high)
- Alternatives: maps from product.alternatives using dataset lookup

**Error handling:**
- If Claude returns malformed JSON: retry once, then fall back to deterministic
- If Claude API errors (rate limit, auth): fall back to deterministic
- Log errors server-side but never expose API details to client

**Response validation:**
- Parse Claude's response, strip markdown fences if present
- Validate required fields exist before returning
- Type-check against `DeforestationReport`

### Acceptance Criteria
- [ ] `POST /api/report` with valid product ID returns a `DeforestationReport`
- [ ] Works without `ANTHROPIC_API_KEY` (uses fallback)
- [ ] Works with `ANTHROPIC_API_KEY` (uses Claude)
- [ ] AI response is valid JSON matching the report schema
- [ ] Fallback generates a reasonable report for all 15 products
- [ ] Malformed AI responses fall back to deterministic generation
- [ ] Response time: <2s for fallback, <10s for AI

---

## Ticket 5: Report Rendering

**Priority:** P0
**Estimate:** 1 hour
**Depends on:** Ticket 3, Ticket 4

### Description
Render the `DeforestationReport` as a readable, well-structured page section.

### Technical Details

**Component: `Report.tsx`** (update from Ticket 3)
- Receives `DeforestationReport` and renders each section

**Section layout:**
Something like -
```
┌─────────────────────────────┐
│ VERDICT                     │
│ [Score badge]               │
│ "Summary sentence..."       │
│                             │
│ WHAT'S IN IT                │
│ 🌴 Palm Oil — High         │
│ "Explanation..."            │
│ 🍫 Cocoa — Low             │
│ "Explanation..."            │
│                             │
│ CERTIFICATIONS              │
│ ✓ RSPO Segregated          │
│ "What this means..."        │
│                             │
│ THE COMPANY                 │
│ Mondelēz International      │
│ "Summary..."                │
│ ⚠ Incident 1               │
│ ⚠ Incident 2               │
│                             │
│ BOTTOM LINE                 │
│ "What should you do..."     │
│                             │
│ ALTERNATIVES                │
│ [ProductCard] [ProductCard] │
└─────────────────────────────┘
```

**Component: `ReportSection.tsx`**
- Reusable section wrapper
- Props: `title: string`, `children: ReactNode`
- Renders section heading + divider + content
- Consistent spacing

**Commodity rendering:**
- Each commodity gets an icon (use emoji or lucide icon), name, amount pill, and explanation text
- Amount pill uses same colour logic as RiskBadge: high = red, moderate = amber, low/trace = green

**Certification rendering:**
- Checkmark icon + cert name + strength pill + verdict text
- Strength pill colours: very strong/strong = green, moderate = amber, weak = red

**Company rendering:**
- Company name as subheading
- Summary paragraph
- Incidents in a yellow/amber callout box with warning icon
- If no incidents: "No documented deforestation incidents found" in a green callout

**Bottom line:**
- Styled as a distinct callout/card — slightly different background
- Larger text or distinct visual treatment — this is the key takeaway

**Alternatives rendering:**
- Horizontal scroll on mobile, side-by-side on desktop
- Each alternative is a mini card: name, score badge, one-line reason
- Clickable — links to `/product/[id]`
- If no alternatives: don't render this section

### Acceptance Criteria
- [ ] All report sections render correctly for every product
- [ ] Sections with empty data are hidden (e.g. no certifications = no section)
- [ ] Incidents render in warning callouts
- [ ] Alternatives link to correct product pages
- [ ] Report is readable on mobile without horizontal scrolling
- [ ] Visual hierarchy is clear — verdict and bottom line are prominent

---

## Ticket 6: Mobile Polish & Final Styling

**Priority:** P1
**Estimate:** 45 mins
**Depends on:** Tickets 2-5

### Description
Polish the responsive layout, touch targets, typography, and overall visual coherence.

### Technical Details

**Typography:**
- Use `next/font` with Inter or system font stack
- Body: 16px base
- H1 (product name): 24px mobile, 32px desktop
- Section headings: 18px, semi-bold
- Body text: 16px, normal weight, `text-gray-700`

**Spacing:**
- Page max-width: `max-w-2xl mx-auto` (keep it narrow and readable)
- Section spacing: `space-y-6` between report sections
- Card padding: `p-4` mobile, `p-6` desktop

**Touch targets:**
- All clickable elements min 44px height
- Product cards: full card is clickable, not just the text
- Back link: generous padding

**Colour palette (Tailwind v4 — defined in `globals.css` via `@theme`):**
```css
@theme {
  --color-canopi: #059669;        /* emerald-600 — primary accent */
  --color-risk-low: #d1fae5;      /* emerald-100 */
  --color-risk-low-text: #065f46; /* emerald-800 */
  --color-risk-mod: #fef3c7;      /* amber-100 */
  --color-risk-mod-text: #92400e; /* amber-800 */
  --color-risk-high: #fee2e2;     /* red-100 */
  --color-risk-high-text: #991b1b;/* red-800 */
}
```
- Background: `bg-white` or `bg-gray-50`
- Cards: `bg-white` with `border border-gray-200 rounded-xl`
- Primary accent: `text-canopi` / `bg-canopi` (using custom theme token)
- Risk colours: emerald (low), amber (moderate), red (high)

**Loading state polish:**
- Skeleton blocks should match the actual report section heights roughly
- Smooth fade-in when report loads (CSS transition or framer-motion if already installed)

**Metadata:**
- Page title: "Canopi — Is your product linked to deforestation?"
- Product page title: "{Product Name} — Deforestation Risk | Canopi"
- Meta description for SEO
- Favicon: simple leaf or tree emoji as placeholder

### Acceptance Criteria
- [ ] App looks polished on iPhone SE (smallest common viewport)
- [ ] App looks good on desktop (centred, readable width)
- [ ] No horizontal scroll anywhere
- [ ] Touch targets are comfortable on mobile
- [ ] Consistent colour palette throughout
- [ ] Page titles are set correctly

---

## Ticket 7: README & Documentation

**Priority:** P0
**Estimate:** 30 mins
**Depends on:** All other tickets

### Description
Write the README covering the four sections required by the brief, plus setup instructions.

### Structure

```markdown
# Canopi

Find out if everyday products are linked to deforestation.

## The Idea
[What problem are you solving? The consumer deforestation awareness gap.]

## The Thinking
[How did you approach it? Dataset curation, three-entity data model,
AI synthesis layer with deterministic fallback. Which AI models:
Claude Sonnet for report generation. Why structured output over
free-form: predictable rendering, fallback compatibility.]

## Reflections
[Future improvements
- Photo upload / barcode scanning for arbitrary products
- Real-time data from Open Food Facts + Forest 500 APIs
- User accounts + scan history
- Comparison view (product A vs product B)
- Expand beyond deforestation: water, labour, emissions

What are the limitations?
- Fixed catalogue of 15 products
- Dataset is point-in-time, not live
- Risk scores are editorially assigned, not algorithmically derived
- AI can over-interpret sparse data
- No product-level traceability (only company-level claims)]

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Install
git clone https://github.com/anyasoni/canopi.git
cd canopi
npm install

### Run locally
npm run dev
# App runs at http://localhost:3000

### Optional: Enable AI reports
# Create .env.local and add:
ANTHROPIC_API_KEY=your_key_here
# Without a key, reports use the deterministic fallback generator.

### Deploy
# Push to GitHub → connect to Vercel → deploy.
# Add ANTHROPIC_API_KEY as an environment variable in Vercel if desired.
```

### Acceptance Criteria
- [ ] README covers all four required sections (Idea, Thinking, Reflections, Setup)
- [ ] Setup instructions work from a clean clone
- [ ] Clearly documents that the app works without an API key
- [ ] Honest about limitations


---

## Build Order

```
Ticket 1 (setup)         ████ 30 min
Ticket 2 (catalogue)     ████████ 1 hr
Ticket 3 (detail page)   ██████ 45 min
Ticket 4 (AI/API)        ████████████ 1.5 hr
Ticket 5 (report render) ████████ 1 hr
Ticket 6 (polish)        ██████ 45 min
Ticket 7 (README)        ████ 30 min
                         ─────────────
                         Total: ~6 hrs
```

Tickets 1-5 are the critical path. Ticket 6 is polish.
Ticket 7 is required by the brief — don't skip it.

Tickets 3 and 4 can be worked in parallel since 3 is frontend
and 4 is backend — they meet at Ticket 5.
