# Document Viewer UI - V1 Specifications

## User Prompt
> 1. read https://deepwiki.com/inventcures/fda_crl_analysis
> for a thorough understanding/comprehension of this repo & the existing code
>
> 2. we want to add a document viewer ui in the vercel app ( a new tab below
> the header - "See live document view in action"
>
> 3. We will show a list of URLs, & on clicking a particular CRL, we will :
> a. render the CRL in a web document view
> b. want to visually show to the user by highlighting the relevant text of
> the CRL - which is likely to cause the various rejection sublcasses using :
> i. color highlighting (use appropriate color for rejections & eventual
> approvals
> ii. intuitive & self-explanatory(to the user)tooltips & animations
> iii. NOt a rigid architectural choice - but maybe use matter.js
> See attached SS used in https://readsomethingwonderful.com/
>
> We want to try to reccreate an experience like this
>
> 4.
> a. formulate a detailed high level plan & detailed
> @docs/v1_specficiations.md to implement this which ensures a great ui
> experience, performant and sound architecture.
> b. feeding this @docs/v1_specifications.md to you(cc) to implement should
> result in the feature implementation, although, in phases, iteratively
> c. write this prompt, in totality, and your reponse to it(in the next turn),
> at the top of the .md, with appropriate section headings

## Agent Response & Plan
This document outlines the specifications for the new **Document Viewer UI** feature for the FDA CRL Analysis platform. The goal is to create an immersive, interactive experience that allows users to explore Complete Response Letters (CRLs) directly in the browser, with intelligent highlighting of rejection reasons and key text.

The implementation will be divided into three phases:
1.  **Data Pipeline Enhancement**: Upgrading the extraction logic to locate specific text coordinates for highlighting.
2.  **Core Viewer Implementation**: Building the Next.js pages and components to render PDFs and overlays.
3.  **Visual Polish & Interactivity**: Integrating `matter.js` and advanced animations.

---

# V1 Specifications: Live Document Viewer

## 1. Architecture Overview

The feature will be built within the existing Next.js application (`website/`).

### 1.1 Frontend
-   **Route**: `/document-view`
    -   **Landing**: Displays a curated list/grid of interesting CRLs to explore.
    -   **Viewer**: `/document-view/[id]` renders the specific CRL.
-   **Libraries**:
    -   `react-pdf`: For rendering the PDF pages.
    -   `framer-motion`: For smooth UI transitions and tooltip animations.
    -   `matter.js` (Optional/Polish): For physics-based interaction (e.g., deficiency categories "falling" into place).

### 1.2 Data Source
To support "highlighting relevant text," we cannot rely solely on the existing `enriched_crls.json`, which only contains document-level categories. We need a new data artifact: `crl_highlights.json`.
-   **Structure**:
    ```json
    {
      "file_hash": {
        "highlights": [
          {
            "page": 1,
            "rect": [x, y, width, height],
            "text": "The efficacy data failed to demonstrate statistical significance...",
            "category": "efficacy",
            "type": "deficiency" // or "approval_note"
          }
        ]
      }
    }
    ```

## 2. Implementation Plan

### Phase 1: Data Pipeline Upgrade (Backend)
**Objective**: Extract spatial data for rejection reasons.
1.  **Modify `src/pdf_parser.py`**:
    -   Utilize `pdfplumber` or `fitz` (PyMuPDF) to search for the specific keywords/sentences that triggered the classification.
    -   Extract the bounding box (bbox) coordinates for these matches.
    -   Map these to the standardized deficiency categories (Safety, Efficacy, CMC, etc.).
2.  **Generate `crl_highlights.json`**:
    -   Run the updated parser on the dataset.
    -   Save the output to `website/public/data/`.

### Phase 2: Core Document Viewer (Frontend)
**Objective**: Functional PDF viewing with static highlights.
1.  **Navigation**: Add "Document View" to the main header (`website/components/Navigation.tsx`).
2.  **Listing Page (`/document-view/page.tsx`)**:
    -   Fetch `enriched_crls.json`.
    -   Display a grid of cards showing Drug Name, Date, and Key Deficiencies.
3.  **Viewer Page (`/document-view/[id]/page.tsx`)**:
    -   Reuse/Adapt `PDFViewer` component.
    -   Implement a `HighlightOverlay` component that sits on top of the PDF canvas.
    -   Read coordinates from `crl_highlights.json` and draw colored boxes (Red for Deficiencies, Green for Rescue/Approvals).
    -   **Color Palette**:
        -   Deficiency (Safety): `#EF4444` (Red-500) with low opacity background.
        -   Deficiency (Efficacy): `#F97316` (Orange-500).
        -   CMC/Manufacturing: `#EAB308` (Yellow-500).
        -   Approval/Positive: `#22C55E` (Green-500).

### Phase 3: Interactive Experience (Polish)
**Objective**: "Read Something Wonderful" vibe + Matter.js.
1.  **Tooltips**:
    -   On hover over a highlight, show a floating tooltip explaining *why* this text is important.
2.  **Physics Interaction (`matter.js`)**:
    -   **Idea**: On the Listing Page, represent common deficiencies as physical balls dropping into a container. Clicking a ball filters the document list.
    -   **Alternative**: On the Viewer Page, a sidebar "Bucket" where found deficiencies "fall" into as you scroll past them.
3.  **Refined Animations**:
    -   Smooth scrolling to highlights.
    -   Fade-in effects for the document load.

## 3. Technical Requirements
-   **Performance**: PDF rendering must be lazy-loaded. Highlights must scale correctly with zoom.
-   **Responsiveness**: Viewer must work on desktop and tablet (mobile is lower priority for complex PDF analysis but should be functional).
-   **Accessibility**: Highlights must have `aria-labels` describing the deficiency.

## 4. Next Steps
The AI agent will begin with **Phase 1**, modifying `src/pdf_parser.py` to generate the necessary coordinate data.
