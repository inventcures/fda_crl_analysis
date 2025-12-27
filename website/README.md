# FDA CRL Analysis Website

Interactive website showcasing analysis of FDA Complete Response Letters (CRLs).

## Features

- **Overview Dashboard**: High-level statistics and trends
- **Deficiency Analysis**: Interactive charts showing deficiency patterns and rescue rates
- **Language Analysis**: NLP insights, word clouds, sentiment analysis, and embeddings
- **Predictive Models**: ML model performance and feature importance
- **Methodology**: Transparent documentation of methods and limitations
- **Hybrid Search**: Advanced BM25 + Vector semantic search across all CRLs
- **PDF Viewer**: Inline PDF viewer with highlight annotations

## Tech Stack

- **Framework**: Next.js 15 (React 18)
- **Styling**: Tailwind CSS
- **Charts**: Recharts (lightweight, responsive)
- **Search**: Hybrid BM25 + Vector search with transformers.js
- **Embeddings**: all-MiniLM-L6-v2 (384 dimensions, ~23MB model)
- **PDF Viewer**: react-pdf with custom highlight overlays
- **Deployment**: Vercel (static export)

## Document View Feature

The website now includes an interactive **Document Viewer** that allows users to explore Complete Response Letters with context-aware highlighting. 

### Features
- **Visual Highlights**: Key deficiency categories (Safety, Efficacy, CMC) are highlighted directly on the PDF.
- **Interactive Tooltips**: Hover over highlights to see the category and extracted text.
- **Deep Linking**: Share specific documents via URL.

### Data Generation
To generate the highlight data (`crl_highlights.json`), run the following script from the root directory:

```bash
# Ensure you have the requirements installed
pip install pdfplumber

# Run the generation script
python scripts/generate_highlights.py
```

## Hybrid Search Feature

The search functionality combines two powerful search methods:

### Search Modes

| Mode | Description | Best For |
|------|-------------|----------|
| **Hybrid** (default) | Combines BM25 + semantic using Reciprocal Rank Fusion | General queries, best of both worlds |
| **Keyword (BM25)** | Exact term matching with TF-IDF weighting | Drug names, application numbers, exact phrases |
| **Semantic (AI)** | Vector similarity using sentence embeddings | Conceptual queries like "manufacturing quality issues" |

### Architecture

```
User Query
    │
    ├──► BM25 Search (client-side, instant)
    │         │
    └──► Vector Search (transformers.js, ~100ms)
              │
    ┌─────────┴─────────┐
    │ Reciprocal Rank   │
    │    Fusion (RRF)   │
    └─────────┬─────────┘
              ▼
       Ranked Results
```

### Embedding Generation

Document embeddings are pre-computed using sentence-transformers:

```bash
# Generate embeddings for all CRL documents
python scripts/generate_embeddings.py
```

This creates `public/data/embeddings.json` (~2.4MB for 297 documents).

### Performance

| Metric | Value |
|--------|-------|
| Model size | ~23 MB (cached in IndexedDB) |
| First load | ~3-5 seconds (model download) |
| Subsequent loads | <500ms (from cache) |
| Query embedding | ~50-100ms |
| BM25 search | <10ms |
| **Total latency** | **~100-150ms** |

## Local Development

### Prerequisites

- Node.js 18+ and npm

### Setup

1. Install dependencies:
```bash
cd website
npm install
```

2. Export data from analysis (run from project root):
```bash
python export_for_web.py
```

This copies JSON data and images to `website/public/`.

3. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
```

This creates a static export in `out/` directory.

## Deployment to Vercel

### Option 1: Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd website
vercel
```

Follow prompts to link to your Vercel account.

### Option 2: GitHub Integration

1. Push the `website/` directory to a GitHub repository

2. Go to [vercel.com](https://vercel.com) and import your repository

3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `website` (if your repo includes the parent project)
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave blank (Next.js handles this)

4. Click **Deploy**

### Option 3: Manual Upload

```bash
cd website
npm run build
```

Upload the `out/` directory contents to any static hosting provider.

## Configuration

### Base Path

If deploying to a subdirectory (e.g., `yourdomain.com/fda-crl-analysis`), update `next.config.js`:

```javascript
basePath: '/fda-crl-analysis'
```

### Environment Variables

None required for static build. All data is precomputed and stored in `public/data/`.

## Data Updates

To update with new CRL data:

1. Run the main analysis pipeline:
```bash
cd ..
python main.py --download --parse --analyze --language
```

2. Export new data:
```bash
python export_for_web.py
```

3. Rebuild and redeploy:
```bash
cd website
npm run build
vercel --prod
```

## File Structure

```
website/
├── app/                      # Next.js app directory
│   ├── page.tsx             # Homepage
│   ├── overview/            # Overview dashboard page
│   ├── deficiencies/        # Deficiency analysis page
│   ├── language/            # Language analysis page
│   ├── predictive/          # ML models page
│   ├── methodology/         # Methodology page
│   ├── search/              # Hybrid search page
│   ├── pdf-viewer/[fileHash]/ # Inline PDF viewer
│   ├── about/               # About & FAQ page
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   ├── Navigation.tsx       # Top navigation bar
│   ├── Footer.tsx           # Footer component
│   ├── SearchBar.tsx        # Search input with mode toggle
│   ├── SearchResults.tsx    # Search results display
│   └── dashboards/          # Dashboard components
│       ├── OverviewDashboard.tsx
│       ├── DeficienciesDashboard.tsx
│       ├── LanguageDashboard.tsx
│       └── PredictiveDashboard.tsx
├── lib/
│   ├── bm25.ts              # BM25 search implementation
│   ├── vectorSearch.ts      # Vector similarity search
│   ├── hybridSearch.ts      # RRF fusion logic
│   ├── embeddingService.ts  # transformers.js wrapper
│   └── useHybridSearch.ts   # React hook for search
├── public/
│   ├── data/                # JSON data files
│   │   ├── overview.json
│   │   ├── deficiencies.json
│   │   ├── language.json
│   │   ├── predictive.json
│   │   ├── search_crls.json # Search index data
│   │   └── embeddings.json  # Pre-computed embeddings
│   ├── pdfs/                # CRL PDF files
│   └── images/              # Analysis visualizations
│       ├── *.png            # Main analysis charts
│       └── language/        # Language analysis charts
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Performance

- All data precomputed and stored as JSON
- Images optimized and served statically
- Static export means no server-side rendering overhead
- Lazy loading for images
- Responsive charts with Recharts

## License

Open-source research project. See parent project LICENSE.

## Support

For issues or questions, open an issue on the [GitHub repository](https://github.com/yourusername/fda-crl-analysis).
