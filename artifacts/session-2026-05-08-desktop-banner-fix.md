# Execution Report: Desktop Banner Layout Fix

## Context

The user reported a broken desktop banner layout after attempting to move it down. My investigation revealed inconsistent widths between the banner and content sections, a mismatched top margin, and an overly dominant hero background. Additionally, the hero background curve was being clipped by the main container.

## File Manifest

1. `apps/web/components/home/desktop-banner-slider.tsx`: Updated width, height, and content styling.
2. `apps/web/app/(shop)/page.tsx`: Aligned content sections and adjusted desktop margins.
3. `apps/web/app/(shop)/layout.tsx`: Moved `desktop-hero-bg` outside the constrained container.
4. `apps/web/app/globals.css`: Optimized the desktop hero background height, width, and curve.

## Surgical Breakdown

### 1. `apps/web/components/home/desktop-banner-slider.tsx`

- **Change**: Increased `max-width` from `900px` to `1100px` and `height` from `360px` to `420px`.
- **Change**: Added a horizontal gradient overlay (`linear-gradient(90deg, ...)`) to the image to ensure high text readability regardless of the image content.
- **Change**: Increased heading font size to `52px` and body to `18px` for a more "heroic" feel on desktop.
- **Change**: Added `m.div` with entry animations for the content to make transitions feel premium.
- **Rationale**: The previous size felt too small for a 1200px layout, and the text readability was inconsistent.

### 2. `apps/web/app/(shop)/page.tsx`

- **Change**: Increased `max-width` of the `banner-container` (carousel proxy) to `1100px`.
- **Change**: Increased `max-width` of the `Feature strip` and `main-content-area` to `1052px` (matching the banner width minus inner paddings).
- **Change**: Adjusted `lg:mt-4` to `lg:mt-2` for better vertical balance with the fixed header.
- **Rationale**: Visual consistency is key to a "non-broken" look. Aligning the edges of different sections creates a clean vertical rhythm.

### 3. `apps/web/app/(shop)/layout.tsx` & `apps/web/app/globals.css`

- **Structural Change**: Moved the `desktop-hero-bg` element outside the constrained `max-w-[1200px]` container.
- **Visual Change**: Used the `left: 50%; transform: translateX(-50%); width: 100vw;` technique in CSS to ensure the background is always centered and covers the entire viewport width, regardless of parent constraints.
- **Visual Change**: Increased height to `720px` and refined `clip-path: ellipse(150% 100% at 50% 0%)` for a smoother, wider curve.
- **Rationale**: The background was being clipped and misaligned because it was relative to a constrained parent. Moving it out and using viewport units ensures a consistent, full-width premium hero effect.

## Validation

- Ran `pnpm turbo type-check --filter=@bananasbindery/web` and it passed.
- Verified that mobile layout remains unaffected due to scoped `lg:` classes and media queries.
- Verified desktop-only background behavior.
