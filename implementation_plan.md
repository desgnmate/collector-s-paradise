# Comprehensive Refinement Plan: Sections 2-6

Thank you for providing the full images again. Based on the strict pink-bordered eyebrow box style we confirmed in Section 2, it is clear that all sections need this exact treatment to match the reference headers perfectly. 

I will systematically revise the headers across all 5 sections.

## Proposed Changes

### 1. Global Styles (`app/globals.css`)
- **Eyebrow Variations**: The pink-bordered box `.eyebrow-badge` we added has dark text inside it. If any of the sections (like Section 4 or 5) have a dark background (e.g., dark blue), the dark text will become unreadable inside the transparent box. I will add an `.eyebrow-light-text` utility class to swap the text to white/cream when placed on dark backgrounds while keeping the thick pink box styling consistent.
- **Header Structure Alignment**: Center all headers exactly as seen in the mockups, ensuring the gap between the eyebrow box and the main title is consistent across all components.

### 2. Header Content Corrections
I will## Proposed Changes

### Section 2: About
#### [MODIFY] [About.tsx](file:///Users/jhunlytapaya/Downloads/Client%202026/Collector's%20paradise/CP%20Landing%20page/collectors-paradise-web/components/About.tsx)
- Update Eyebrow Text: `ABOUT THE EVENT` (using the newly updated `.eyebrow-badge` class)
- Update Heading: `WHAT IS COLLECTOR'S PARADISE?`
- *Will ensure the subheadline paragraph matches the reference image exactly.*

### Section 3: Experience
#### [MODIFY] [Experience.tsx](file:///Users/jhunlytapaya/Downloads/Client%202026/Collector's%20paradise/CP%20Landing%20page/collectors-paradise-web/components/Experience.tsx)
- Update Eyebrow Text: `WHAT YOU'LL EXPERIENCE` or `EXPERIENCE THE EXCITEMENT` (as determined by the reference)
- *Will transcribe and insert the missing subheadline paragraph directly below the heading.*

### Section 4: Highlights
#### [MODIFY] [Highlights.tsx](file:///Users/jhunlytapaya/Downloads/Client%202026/Collector's%20paradise/CP%20Landing%20page/collectors-paradise-web/components/Highlights.tsx)
- Update Eyebrow Text: `EVENT HIGHLIGHTS` or similar tracking from the image
- Update Title and align text
- *Will transcribe and insert the missing subheadline string from the design image.*

### Section 5: Brands
#### [MODIFY] [Brands.tsx](file:///Users/jhunlytapaya/Downloads/Client%202026/Collector's%20paradise/CP%20Landing%20page/collectors-paradise-web/components/Brands.tsx)
- Update Eyebrow Text: `OUR PARTNERS` 
- Update heading format.
- *Will ensure any subheadline copy is included under the partners title.*

### Section 6: Vendor Showcase
#### [MODIFY] [VendorShowcase.tsx](file:///Users/jhunlytapaya/Downloads/Client%202026/Collector's%20paradise/CP%20Landing%20page/collectors-paradise-web/components/VendorShowcase.tsx)
- Update Eyebrow Text: `VENDOR OPPORTUNITIES`
- Update heading format.
- *Will transcribe and insert the associated subheadline paragraph.*`VENDOR SHOWCASE`

*(Note: If the exact text read from the images for the eyebrow tags above is slightly off, I will rely on your confirmation before coding!)*

### 3. Structural Visuals per Section
While applying the eyebrow fixes, I will also implement these critical structural corrections visible in the references:
- **Subheadline Integration**: I will add the missing subheadline text blocks to all sections to ensure the content hierarchy matches the provided design references.
- **Section 2**: Refine the 3 stacked pill buttons (alignment and icon spacing).
- **Section 3**: Ensure the white overlay card handles padding gracefully.
- **Section 4**: Lock in the segmented control (Past/Upcoming) spacing.
- **Section 5**: Ensure the SVG placeholder grid fits the designated container width perfectly.
- **Section 6**: Fine-tune the CSS 3D perspectives on the two character silhouettes so their rotation perfectly matches the vanishing point seen in the reference.

## User Review Required
> [!IMPORTANT]  
> Please review the eyebrow text for sections 3-6 listed above. Do those strings match the reference images perfectly? 
> Once approved, I will immediately execute these changes and mark the components complete!
