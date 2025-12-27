# FDA CRL Analysis Website

Interactive website showcasing analysis of FDA Complete Response Letters (CRLs).

## Features

- **Overview Dashboard**: High-level statistics and trends
- **Deficiency Analysis**: Interactive charts showing deficiency patterns and rescue rates
- **Language Analysis**: NLP insights, word clouds, sentiment analysis, and embeddings
- **Predictive Models**: ML model performance and feature importance
- **Methodology**: Transparent documentation of methods and limitations

## Tech Stack

- **Framework**: Next.js 15 (React 18)
- **Styling**: Tailwind CSS
- **Charts**: Recharts (lightweight, responsive)
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
│   ├── about/               # About & FAQ page
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   ├── Navigation.tsx       # Top navigation bar
│   ├── Footer.tsx           # Footer component
│   └── dashboards/          # Dashboard components
│       ├── OverviewDashboard.tsx
│       ├── DeficienciesDashboard.tsx
│       ├── LanguageDashboard.tsx
│       └── PredictiveDashboard.tsx
├── public/
│   ├── data/                # JSON data files
│   │   ├── overview.json
│   │   ├── deficiencies.json
│   │   ├── language.json
│   │   ├── predictive.json
│   │   └── sample_crls.json
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
