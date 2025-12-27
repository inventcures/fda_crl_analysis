# FDA CRL Analysis: Interactive Visualization Upgrade Specification

## Executive Summary

This document outlines the plan to transform static and semi-interactive visualizations into fully interactive, explorable data experiences. Inspired by Saloni Dattani's visualization principles and modern dataviz best practices.

---

## Current State Analysis

### Existing Visualization Inventory

| Page | Chart Type | Current Tech | Interactivity Level |
|------|-----------|--------------|---------------------|
| Overview | Stacked Bar (App Types) | Recharts | Medium - tooltips only |
| Overview | Line Chart (Yearly Trends) | Recharts | Medium - tooltips only |
| Deficiencies | Bar Chart (Frequency) | Recharts | Medium |
| Deficiencies | Bar Chart (Rescue Rates) | Recharts | Medium |
| Deficiencies | Radar Chart | Recharts | Medium |
| Deficiencies | Heatmap (Co-occurrence) | Static PNG | None |
| Predictive | Model Comparison Bars | Recharts | Medium |
| Predictive | Radar Chart | Recharts | Medium |
| Predictive | Feature Importance | Static PNG | None |
| Predictive | ROC Curves | Static PNG | None |
| Language | Severity/Certainty Bars | Recharts | Medium |
| Language | Word Clouds (x2) | Static PNG | None |
| Language | N-gram Charts | Static PNG | None |
| Language | t-SNE/UMAP Scatter | Static PNG | None |
| Language | Topic Model | Static PNG | None |
| Oncology | All Charts | Static PNG | None |

### Key Gaps Identified

1. **No parameter controls** - Users cannot filter, adjust ranges, or change views
2. **Static embeddings** - t-SNE/UMAP plots are pre-rendered, not explorable
3. **No cross-filtering** - Charts don't communicate with each other
4. **Limited animations** - No entry/transition animations
5. **Basic tooltips** - No rich contextual information on hover
6. **No drill-down** - Cannot click to explore underlying data

---

## Design Principles (from Saloni's Guide)

### Core Tenets to Apply

1. **Answer a precise question** - Each interactive control should serve a clear purpose
2. **Clarity over complexity** - Interactivity should clarify, not overwhelm
3. **Guide the viewer** - Provide annotations and context for complex charts
4. **Standalone comprehension** - Interactive state should preserve chart meaning
5. **Match colors to concepts** - Consistent color language (green=approved, red=unapproved)
6. **Horizontal text always** - No rotated labels, even in interactive states
7. **Direct labeling** - Reduce legend dependence through smart labeling

### Interactive Enhancements Philosophy

> "Interactivity should reveal hidden patterns, not just look impressive."

Each interactive feature must pass the **utility test**:
- Does it answer a question users actually have?
- Does it help compare/explore data in a meaningful way?
- Is the interaction intuitive and discoverable?

---

## Phase 1: Enhanced Recharts Dashboards

### 1.1 Overview Dashboard Upgrades

**Current:** Static bar and line charts with tooltips
**Target:** Filterable, animated, cross-linked dashboard

#### New Features:

```typescript
// New component: InteractiveOverviewDashboard.tsx

interface DashboardState {
  yearRange: [number, number]        // Filter: 2020-2025
  selectedAppTypes: string[]         // Filter: NDA, BLA, ANDA
  viewMode: 'absolute' | 'percentage'
  highlightedYear: number | null     // Cross-chart linking
}
```

**A. Year Range Slider**
- Dual-handle slider for selecting date range
- Charts animate smoothly when range changes
- Shows count of CRLs in selected range

```jsx
<RangeSlider
  min={2020}
  max={2025}
  value={yearRange}
  onChange={setYearRange}
  marks={{ 2020: '2020', 2022: '2022', 2025: '2025' }}
/>
```

**B. Application Type Toggles**
- Pill buttons: [All] [NDA] [BLA] [ANDA]
- Multi-select enabled
- Bar chart segments highlight/dim based on selection

**C. View Mode Toggle**
- Switch between absolute counts and percentages
- Smooth crossfade animation (300ms)
- Y-axis labels update accordingly

**D. Cross-Chart Highlighting**
- Hover on a year in line chart → highlights that year's bar segment
- Click on bar segment → tooltips show detailed breakdown
- Linked cursor across both charts

**E. Entry Animations**
- Bars grow from baseline (500ms ease-out)
- Line draws from left to right (800ms)
- Numbers count up in stat cards

#### Implementation:

```typescript
// Animation config for Recharts
const animationConfig = {
  isAnimationActive: true,
  animationDuration: 500,
  animationEasing: 'ease-out',
  animationBegin: 0,
}

// Custom tooltip with rich context
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null
  return (
    <div className="bg-white shadow-lg rounded-lg p-4 border">
      <p className="font-semibold text-lg">{label}</p>
      <div className="mt-2 space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex justify-between gap-4">
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span className="font-mono">{entry.value}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Click for detailed breakdown
      </p>
    </div>
  )
}
```

---

### 1.2 Deficiencies Dashboard Upgrades

**Current:** Multiple static charts with basic tooltips
**Target:** Interactive exploration with drill-down and comparison tools

#### New Features:

**A. Category Multi-Select**
- Checkbox list of all deficiency categories
- Select/deselect to filter all charts simultaneously
- "Select All" / "Clear" quick actions
- Persist selection in URL params

**B. Sort Controls**
- Dropdown: Sort by Frequency | Rescue Rate | Alphabetical
- Ascending/Descending toggle
- Animated reorder (bars slide to new positions)

**C. Comparison Mode**
- Split view: Side-by-side approved vs unapproved
- Difference bars showing delta
- Toggle: Combined | Split | Difference

**D. Interactive Radar Chart**
- Click axis to highlight that category
- Drag to adjust importance weights (what-if analysis)
- Show/hide individual metrics

**E. Heatmap Interactivity (Replace Static PNG)**
Convert static co-occurrence heatmap to interactive:

```typescript
// New component: InteractiveHeatmap.tsx
interface HeatmapProps {
  data: { row: string; col: string; value: number }[]
  colorScale: 'sequential' | 'diverging'
  onCellClick: (row: string, col: string) => void
  highlightedRow?: string
  highlightedCol?: string
}
```

Features:
- Hover: Highlight row + column, show exact value
- Click: Filter other charts to show only CRLs with both deficiencies
- Zoom: Focus on subset of categories
- Sort: Reorder by total co-occurrence count

**F. Animated Transitions**
```css
/* Smooth bar reordering */
.bar-segment {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Highlight pulse effect */
@keyframes highlight-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

---

### 1.3 Predictive Dashboard Upgrades

**Current:** Model comparison bars, static feature importance
**Target:** Interactive model explorer with feature analysis

#### New Features:

**A. Model Selector**
- Click model bars to "select" as primary
- Selected model shows detailed metrics panel
- Side panel with confusion matrix (interactive)

**B. Feature Importance Explorer**
Convert static PNG to interactive bar chart:

```typescript
// New component: FeatureImportanceChart.tsx
interface Feature {
  name: string
  importance: number
  category: 'clinical' | 'manufacturing' | 'safety' | 'regulatory'
  direction: 'positive' | 'negative'  // Correlation with approval
}
```

Features:
- Color by category (with legend)
- Hover: Show feature description + example CRLs
- Click: Filter document list to CRLs with this feature
- Toggle: Show top 10 / 15 / 20 / All
- Toggle: Show positive only / negative only / both

**C. Interactive ROC Curves**
Replace static PNG with Recharts implementation:

```jsx
<ResponsiveContainer width="100%" height={400}>
  <LineChart data={rocData}>
    <XAxis
      dataKey="fpr"
      label={{ value: 'False Positive Rate', position: 'bottom' }}
      domain={[0, 1]}
    />
    <YAxis
      label={{ value: 'True Positive Rate', angle: -90 }}
      domain={[0, 1]}
    />
    <ReferenceLine
      segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
      stroke="#ccc"
      strokeDasharray="3 3"
    />
    {models.map(model => (
      <Line
        key={model.name}
        dataKey={model.name}
        stroke={model.color}
        dot={false}
        strokeWidth={selectedModel === model.name ? 3 : 1.5}
        opacity={selectedModel && selectedModel !== model.name ? 0.3 : 1}
      />
    ))}
    <Tooltip content={<ROCTooltip />} />
  </LineChart>
</ResponsiveContainer>
```

**D. Threshold Slider**
- Adjust classification threshold (default 0.5)
- See precision/recall/F1 update in real-time
- Show operating point on ROC curve

---

### 1.4 Language Dashboard Upgrades

**Current:** Many static PNGs, basic severity/certainty bars
**Target:** NLP explorer with interactive text analysis

#### New Features:

**A. Severity/Certainty Deep Dive**
- Click on metric card to expand
- Show distribution histogram
- Example quotes from CRLs at different severity levels

**B. Interactive Word Clouds**
Replace static PNGs with react-wordcloud:

```typescript
// New component: InteractiveWordCloud.tsx
import ReactWordcloud from 'react-wordcloud'

const options = {
  colors: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd'],
  enableTooltip: true,
  deterministic: true,
  fontFamily: 'Inter',
  fontSizes: [14, 60],
  fontStyle: 'normal',
  fontWeight: 'bold',
  padding: 2,
  rotations: 2,
  rotationAngles: [0, 0],  // Keep text horizontal (Saloni's rule!)
  scale: 'sqrt',
  spiral: 'rectangular',
  transitionDuration: 500,
}

// Interactive features:
// - Click word: Filter to CRLs containing that term
// - Hover: Show frequency, example context
// - Toggle: Approved / Unapproved / Both
// - Slider: Min frequency threshold
```

**C. N-gram Explorer**
Replace static charts with interactive comparison:

```typescript
interface NgramExplorerProps {
  ngramSize: 2 | 3 | 4  // Bigrams, trigrams, 4-grams
  topN: number          // Show top N
  comparisonMode: 'side-by-side' | 'diverging'
}
```

Features:
- Tabs: Bigrams | Trigrams | 4-grams
- Slider: Top 10 / 20 / 30
- Diverging bar chart (approved left, unapproved right)
- Click phrase: Show in context (KWIC display)

---

## Phase 2: Embedding Visualizations (t-SNE/UMAP)

### 2.1 Interactive Scatter Plot

**Priority: HIGH** - This is the most impactful upgrade

Replace static t-SNE/UMAP PNGs with fully interactive scatter plot.

#### Technology Choice: Plotly.js

Already installed (`plotly.js@2.35.2`), perfect for this use case.

```typescript
// New component: EmbeddingExplorer.tsx

interface EmbeddingPoint {
  x: number
  y: number
  file_hash: string
  drug_name: string
  approval_status: 'approved' | 'unapproved'
  therapeutic_area: string
  deficiency_categories: string[]
  severity_score: number
}

interface EmbeddingExplorerProps {
  data: EmbeddingPoint[]
  method: 'tsne' | 'umap'
  colorBy: 'approval' | 'therapeutic_area' | 'severity' | 'cluster'
}
```

#### Features:

**A. Pan & Zoom**
- Scroll to zoom, drag to pan
- Double-click to reset view
- Box select for filtering

**B. Color Modes**
```jsx
<SegmentedControl
  options={[
    { value: 'approval', label: 'By Outcome' },
    { value: 'therapeutic_area', label: 'By Area' },
    { value: 'severity', label: 'By Severity' },
    { value: 'cluster', label: 'By Cluster' },
  ]}
  value={colorBy}
  onChange={setColorBy}
/>
```

**C. Rich Hover Tooltips**
```jsx
const hovertemplate = `
  <b>%{customdata.drug_name}</b><br>
  Status: %{customdata.approval_status}<br>
  Area: %{customdata.therapeutic_area}<br>
  Severity: %{customdata.severity_score:.2f}<br>
  <extra></extra>
`
```

**D. Click to Open Document**
```typescript
const handlePointClick = (event: PlotlyClickEvent) => {
  const fileHash = event.points[0].customdata.file_hash
  router.push(`/document-view/${fileHash}`)
}
```

**E. Lasso Selection**
- Draw lasso around points
- Selected points populate sidebar list
- "View Selected" button to filter document viewer

**F. Search Highlighting**
- Search box above plot
- Matching documents highlighted (larger, glowing)
- Non-matching documents dimmed

**G. Animation Toggle**
- Optional: Animate between t-SNE and UMAP projections
- Points smoothly interpolate between positions
- Shows how different methods affect clustering

#### Implementation:

```jsx
import Plot from 'react-plotly.js'

const EmbeddingExplorer = ({ data, method, colorBy }) => {
  const colorMap = {
    approved: '#10b981',
    unapproved: '#6b7280',
  }

  return (
    <Plot
      data={[{
        type: 'scatter',
        mode: 'markers',
        x: data.map(d => d.x),
        y: data.map(d => d.y),
        marker: {
          color: data.map(d => colorMap[d.approval_status]),
          size: 10,
          opacity: 0.7,
          line: { color: 'white', width: 1 }
        },
        customdata: data,
        hovertemplate: hovertemplate,
      }]}
      layout={{
        title: `CRL Document Embeddings (${method.toUpperCase()})`,
        xaxis: { title: 'Dimension 1', showgrid: false },
        yaxis: { title: 'Dimension 2', showgrid: false },
        hovermode: 'closest',
        dragmode: 'pan',
      }}
      config={{
        scrollZoom: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      }}
      onClick={handlePointClick}
      style={{ width: '100%', height: '600px' }}
    />
  )
}
```

---

### 2.2 Cluster Analysis Explorer

**Current:** Static K-means plot
**Target:** Interactive cluster explorer with topic labels

#### Features:

**A. Cluster Count Selector**
- Slider: 3 to 10 clusters
- Re-runs clustering on change (or pre-computed)
- Shows silhouette score for current k

**B. Cluster Cards**
- One card per cluster
- Shows: Count, top terms, approval rate
- Click to filter scatter plot

**C. Topic Labels**
- Auto-generated from top TF-IDF terms
- Editable by user for custom naming
- Persist in localStorage

---

## Phase 3: Animated Transitions & Microinteractions

### 3.1 Global Animation System

```typescript
// lib/animations.ts

export const springConfig = {
  tension: 170,
  friction: 26,
}

export const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
}

export const countUp = (end: number, duration = 1000) => {
  // Animate number from 0 to end
}

export const drawLine = {
  initial: { pathLength: 0 },
  animate: { pathLength: 1 },
  transition: { duration: 0.8, ease: 'easeOut' },
}
```

### 3.2 Chart Entry Animations

**Bar Charts:**
```jsx
<Bar
  dataKey="value"
  animationBegin={index * 50}  // Staggered entry
  animationDuration={500}
  animationEasing="ease-out"
/>
```

**Line Charts:**
```jsx
<Line
  dataKey="value"
  strokeDasharray="1000"
  strokeDashoffset="1000"
  className="animate-draw-line"
/>
```

**Stat Cards:**
```jsx
<motion.div
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ delay: index * 0.1, type: 'spring' }}
>
  <CountUp end={stat.value} duration={1.5} />
</motion.div>
```

### 3.3 Interaction Feedback

**Hover States:**
- Bars: Slight lift (translateY: -2px) + brighter color
- Points: Scale up 1.2x + drop shadow
- Cards: Subtle shadow expansion

**Selection States:**
- Selected: Full color, thick border
- Unselected: Dimmed to 40% opacity
- Transition: 200ms ease

**Loading States:**
- Skeleton loaders matching chart shapes
- Subtle shimmer animation
- "Loading data..." text with spinner

---

## Phase 4: Cross-Chart Communication

### 4.1 Dashboard State Management

```typescript
// contexts/DashboardContext.tsx

interface DashboardState {
  // Filters
  yearRange: [number, number]
  selectedCategories: string[]
  selectedTherapeuticAreas: string[]
  approvalFilter: 'all' | 'approved' | 'unapproved'

  // Interactions
  hoveredDocument: string | null
  selectedDocuments: string[]
  highlightedCategory: string | null

  // View state
  comparisonMode: boolean
  showAnnotations: boolean
}

interface DashboardActions {
  setYearRange: (range: [number, number]) => void
  toggleCategory: (category: string) => void
  selectDocument: (fileHash: string) => void
  clearSelection: () => void
  // ... etc
}

const DashboardContext = createContext<{
  state: DashboardState
  actions: DashboardActions
}>()
```

### 4.2 Cross-Filtering Implementation

**Scenario:** User clicks "Manufacturing (CMC)" bar

1. Bar chart highlights "Manufacturing (CMC)"
2. Rescue rate chart highlights same category
3. Radar chart pulses that axis
4. Heatmap highlights that row/column
5. Embedding plot dims non-matching points
6. Document list filters to CMC-related CRLs

```typescript
// Event flow
const handleCategoryClick = (category: string) => {
  // Update global state
  actions.setHighlightedCategory(category)

  // GA tracking
  sendGAEvent('chart_interaction', {
    action: 'category_select',
    category,
    page: '/deficiencies'
  })
}

// All charts subscribe to highlighted category
const { highlightedCategory } = useDashboard()

// In bar chart
<Bar
  fill={item.category === highlightedCategory ? '#2563eb' : '#94a3b8'}
  opacity={highlightedCategory && item.category !== highlightedCategory ? 0.3 : 1}
/>
```

### 4.3 URL State Sync

Persist dashboard state in URL for shareability:

```typescript
// hooks/useDashboardURL.ts

const useDashboardURL = () => {
  const searchParams = useSearchParams()
  const router = useRouter()

  const state = useMemo(() => ({
    yearRange: parseRange(searchParams.get('years')),
    categories: parseArray(searchParams.get('cats')),
    approval: searchParams.get('approval') || 'all',
  }), [searchParams])

  const updateURL = (newState: Partial<DashboardState>) => {
    const params = new URLSearchParams(searchParams)
    if (newState.yearRange) params.set('years', newState.yearRange.join('-'))
    if (newState.categories) params.set('cats', newState.categories.join(','))
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return { state, updateURL }
}

// Shareable URL example:
// /deficiencies?years=2022-2024&cats=cmc,safety&approval=unapproved
```

---

## Phase 5: New Visualization Types

### 5.1 Sankey Diagram: CRL Journey

Show flow from initial deficiencies to outcomes:

```
[CMC Issues] ─────────┐
                      ├──▶ [Approved] ──▶ [< 1 year]
[Safety Issues] ──────┤                ──▶ [1-2 years]
                      ├──▶ [Unapproved]
[Efficacy Issues] ────┘
```

**Implementation:** `react-flow` or `d3-sankey`

### 5.2 Timeline View

Horizontal timeline showing:
- CRL submission dates
- Resubmission events
- Final outcome dates
- Time-to-resolution metrics

**Implementation:** Custom with Recharts AreaChart or dedicated timeline library

### 5.3 Comparison Tool

Side-by-side CRL comparison:
- Select 2-4 CRLs
- Compare deficiency profiles
- Radar chart overlay
- Text diff of key sections

---

## Implementation Roadmap

### Sprint 1: Foundation (Week 1-2)
- [ ] Set up DashboardContext for global state
- [ ] Implement animation utilities
- [ ] Add Framer Motion to project
- [ ] Create reusable tooltip components

### Sprint 2: Overview Dashboard (Week 2-3)
- [ ] Add year range slider
- [ ] Add app type toggles
- [ ] Implement cross-chart highlighting
- [ ] Add entry animations

### Sprint 3: Deficiencies Dashboard (Week 3-4)
- [ ] Convert heatmap to interactive
- [ ] Add category multi-select
- [ ] Implement sort controls
- [ ] Add comparison mode

### Sprint 4: Embedding Explorer (Week 4-5)
- [ ] Build Plotly scatter component
- [ ] Add color mode toggles
- [ ] Implement click-to-view
- [ ] Add lasso selection

### Sprint 5: Language Dashboard (Week 5-6)
- [ ] Interactive word clouds
- [ ] N-gram explorer
- [ ] Severity deep dive

### Sprint 6: Polish & Testing (Week 6-7)
- [ ] Cross-browser testing
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Accessibility audit

---

## Technical Dependencies

### New Packages Required

```json
{
  "framer-motion": "^11.0.0",
  "react-wordcloud": "^1.2.7",
  "react-range": "^1.8.14",
  "react-countup": "^6.5.0",
  "@visx/heatmap": "^3.3.0"
}
```

### Existing Packages to Leverage

- `recharts` - Already installed, primary charting
- `plotly.js` / `react-plotly.js` - Already installed, for scatter plots
- `matter-js` - Already installed, could use for physics animations
- `@next/third-parties` - GA tracking for interactions

---

## Performance Considerations

### Data Loading Strategy

1. **Lazy load chart data** - Only fetch when section scrolls into view
2. **Pre-compute embeddings** - Store t-SNE/UMAP coordinates in JSON
3. **Memoize filtered data** - Prevent re-computation on every render
4. **Virtual scrolling** - For document lists with many items

### Bundle Size

- Plotly: ~1MB (load dynamically with next/dynamic)
- Framer Motion: ~40KB (tree-shakeable)
- WordCloud: ~30KB

### Rendering Performance

```typescript
// Use React.memo for expensive components
const MemoizedChart = React.memo(({ data }) => (
  <ResponsiveContainer>
    <BarChart data={data}>...</BarChart>
  </ResponsiveContainer>
), (prev, next) => prev.data === next.data)

// Use useMemo for filtered/sorted data
const sortedData = useMemo(() =>
  [...data].sort((a, b) => b.value - a.value),
  [data]
)
```

---

## Accessibility Requirements

1. **Keyboard Navigation**
   - Tab through chart elements
   - Enter/Space to select
   - Arrow keys for sliders

2. **Screen Reader Support**
   - ARIA labels on all controls
   - Data table fallback for charts
   - Announcements on value changes

3. **Color Contrast**
   - Minimum 4.5:1 for text
   - Use patterns in addition to color
   - Test with colorblind simulators

4. **Motion Sensitivity**
   - Respect `prefers-reduced-motion`
   - Disable animations if preference set
   - Provide static fallbacks

```css
@media (prefers-reduced-motion: reduce) {
  .animated-chart {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## Success Metrics

### User Engagement
- Time spent on dashboard pages (target: +50%)
- Interaction events per session (target: 10+ clicks)
- Return visits (target: 30% increase)

### Technical Performance
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Animation frame rate > 55fps

### Quality
- Zero critical accessibility violations
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Mobile-friendly (responsive at all breakpoints)

---

## References

- [Saloni's Guide to Data Visualization](https://www.scientificdiscovery.dev/p/salonis-guide-to-data-visualization)
- [Recharts Documentation](https://recharts.org/en-US/)
- [Plotly.js Documentation](https://plotly.com/javascript/)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [The Science of Visual Data Communication: What Works](https://journals.sagepub.com/doi/10.1177/15291006211051956)

---

*Document Version: 1.0*
*Created: December 2025*
*Status: Ready for Implementation*
