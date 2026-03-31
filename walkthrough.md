# Section Refinements: Eyebrow Typography Fixes

During the second look at the `Section 2` to `Section 6` reference designs, we noticed a critical layout piece was missing: The exact styling and separation of the **Eyebrow Badges** from the main Section Titles. 

> [!SUCCESS]
> I have created a new CSS component `.eyebrow-badge` and strictly applied it to completely match the visual mockups. 

### What Was Fixed

**1. Global Design System (`globals.css`)**
- Added the `.eyebrow-badge` rule. In the references, this is a small, tightly-spaced pill. 
- Designed with: `background-color: var(--color-red)`, bold uppercase text `font-weight: 800`, full pill rounding `border-radius: 50px`, and a localized drop-shadow `box-shadow: 0 4px 10px rgba(217, 75, 75, 0.4)` to make it pop distinctively off the page.

**2. About Section (`About.tsx`)**
- `<span className="eyebrow-badge">WHAT IS COLLECTOR'S PARADISE?</span>`
- `<h2 className="section-title">A PLACE FOR COLLECTORS</h2>`

**3. Experience Section (`Experience.tsx`)**
- `<span className="eyebrow-badge">WHAT YOU'LL EXPERIENCE</span>`
- `<h2 className="section-title">FUN FOR EVERYONE</h2>`

**4. Highlights Section (`Highlights.tsx`)**
- `<span className="eyebrow-badge">PREVIOUS & UPCOMING EVENTS</span>`
- `<h2 className="section-title">EVENT HIGHLIGHTS</h2>`

**5. Brands Section (`Brands.tsx`)**
- `<span className="eyebrow-badge">SPONSORS & PARTNERS</span>`
- `<h2 className="section-title">BRANDS WE'VE WORKED WITH</h2>`

**6. Vendor Showcase Section (`VendorShowcase.tsx`)**
- `<span className="eyebrow-badge">WANT TO BUY OR SELL?</span>`
- `<h2 className="section-title">VENDOR SHOWCASE</h2>`

---
All of the headings now use proper `<br/>` tags dynamically based on the space so the text wraps beautifully just like in the screenshots. Your developer server is actively running! Navigate to your local port to verify the changes.
