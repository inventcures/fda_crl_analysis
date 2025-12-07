# Deployment Guide

## Quick Start: Deploy to Vercel (Recommended)

Vercel offers the best experience for Next.js apps and has a generous free tier.

### Method 1: Vercel CLI (Fastest)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy from the website directory**
```bash
cd website
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Select your account
- **Link to existing project?** No
- **Project name?** fda-crl-analysis (or your preferred name)
- **In which directory is your code located?** ./
- **Want to override settings?** No

4. **Deploy to production**
```bash
vercel --prod
```

Your site is now live! Vercel will provide a URL like `fda-crl-analysis.vercel.app`.

### Method 2: Vercel GitHub Integration

1. **Push to GitHub**
```bash
# From project root
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/fda-crl-analysis.git
git push -u origin main
```

2. **Import to Vercel**
- Go to [vercel.com](https://vercel.com)
- Click **Add New** → **Project**
- Import your GitHub repository
- Configure:
  - **Root Directory**: `website` (if your repo includes parent project, otherwise leave blank)
  - **Framework Preset**: Next.js
  - **Build Command**: `npm run build`
  - **Output Directory**: (leave blank, Next.js handles this)
- Click **Deploy**

3. **Automatic Deployments**
- Every push to `main` branch auto-deploys to production
- Pull requests get preview deployments

### Method 3: Other Hosting Providers

The site exports to static HTML, so it works with any static host:

#### Netlify

```bash
npm run build
# Upload the `out/` directory to Netlify
```

Or use Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy --dir=out --prod
```

#### GitHub Pages

```bash
npm run build
# Push the `out/` directory to gh-pages branch
```

Update `next.config.js` first:
```javascript
basePath: '/your-repo-name'
```

#### AWS S3 + CloudFront

```bash
npm run build
aws s3 sync out/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

## Configuration

### Custom Domain

On Vercel:
1. Go to project settings → Domains
2. Add your domain (e.g., `crl-analysis.yoursite.com`)
3. Configure DNS with your provider (Vercel provides instructions)

### Environment Variables

This site doesn't need any environment variables since all data is precomputed.

### Base Path (Subdirectory Deployment)

If deploying to a subdirectory (e.g., `example.com/fda-analysis`):

Edit `website/next.config.js`:
```javascript
const nextConfig = {
  output: 'export',
  basePath: '/fda-analysis',  // Add this line
  images: { unoptimized: true },
}
```

Then rebuild:
```bash
npm run build
```

## Updating Data

When new CRL data is available:

1. **Run analysis pipeline**
```bash
cd /path/to/project
python main.py --download --parse --analyze --language
```

2. **Export for web**
```bash
python export_for_web.py
```

3. **Rebuild and deploy**
```bash
cd website
npm run build
vercel --prod  # If using Vercel CLI
# Or push to GitHub for auto-deployment
```

## Performance Optimization

The site is already optimized:
- ✅ Static export (no server needed)
- ✅ All data precomputed as JSON
- ✅ Images served statically
- ✅ Lazy loading for large images
- ✅ Code splitting by route
- ✅ Responsive charts with Recharts

### Further Optimizations

1. **Compress images** (if sizes are large)
```bash
npm install -g sharp-cli
sharp -i public/images/*.png -o public/images/ --format webp
```

2. **Enable Brotli compression** (automatic on Vercel)

3. **Add analytics** (optional)
```bash
# Vercel Analytics
npm install @vercel/analytics
```

Add to `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

## Troubleshooting

### Build fails with "Module not found"
```bash
cd website
npm install
```

### Data not loading
- Ensure `export_for_web.py` was run
- Check `website/public/data/` contains JSON files
- Check `website/public/images/` contains PNG files
- Check browser console for 404 errors

### Images not displaying
- Verify images exist in `public/images/`
- Check file paths match exactly (case-sensitive)
- On some hosts, add `images: { unoptimized: true }` to `next.config.js`

### 404 on page refresh
- With static export, ensure host is configured for SPA routing
- Vercel handles this automatically
- For other hosts, configure rewrite rules to serve `index.html`

## Cost

### Vercel Free Tier
- ✅ 100GB bandwidth/month
- ✅ Unlimited sites
- ✅ Automatic SSL
- ✅ Global CDN
- ✅ Preview deployments
- **Cost**: $0

This project should stay well within free limits.

### Upgrade Needs
Only upgrade if you exceed:
- 100GB/month bandwidth
- 100 deployments/day

## Support

For deployment issues:
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Project Issues: https://github.com/yourusername/fda-crl-analysis/issues
