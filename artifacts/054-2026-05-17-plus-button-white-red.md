# Artifact: UI Styling & Dynamic Campaign Update

## Context

Client requested several UI styling and functionality changes:

1. The "plus button" in the product section should have a white background and a red icon.
2. All product prices should be changed to red.
3. The header should be changed to white.
4. The bottom navigation should have a "glass/transparent" (glassmorphism) effect.
5. The "Penawaran Terbaik" countdown should be dynamic (not hardcoded) and manageable via the Campaign page.

## File Manifest

- `packages/ui/src/components/price-tag.tsx`
- `apps/web/components/layout/header.tsx`
- `apps/web/components/layout/bottom-nav.tsx`
- `apps/web/components/shared/product-card.tsx`
- `apps/web/components/shared/category-chip.tsx`
- `apps/web/components/home/flash-sale-countdown.tsx` (New)
- `apps/web/lib/services/campaign-client.ts`
- `apps/web/app/(shop)/layout.tsx`
- `apps/web/app/(shop)/page.tsx`
- `apps/web/app/(shop)/products/[slug]/_client.tsx`
- `apps/web/app/cart/page.tsx`
- `apps/web/app/checkout/page.tsx`
- `apps/web/app/(shop)/account/orders/[id]/page.tsx`
- `apps/web/app/(shop)/account/orders/page.tsx`
- `apps/web/app/(shop)/account/wishlist/page.tsx`

## Surgical Breakdown

### Header & Layout Updates

- **`apps/web/components/layout/header.tsx`**: Updated background from yellow (`#FFD54C`) to white (`#FFFFFF`).
- **Search Bar Restoration**: Per client request, the search bar's border and icon color have been restored to **Yellow** (`#FFD54C`) to maintain its visual identity even on the new white header. The filter button also uses yellow accents.
- **`apps/web/app/(shop)/layout.tsx`**: Removed the yellow background strip that was used behind the header.
- **`apps/web/app/(shop)/page.tsx`**:
  - Changed the top section's background from grey to white to match the new header design.
  - Updated "Artisan binder" feature card background color to **Green Tosca** (`#4DB6AC`).
- **Category Chips**: Updated the active background color of `CategoryChip` from blue (`#7EC8E3`) to **Yellow** (`#FFD54C`) for visual consistency with the header's yellow accents.

### Bottom Navigation Updates

- **`apps/web/components/layout/bottom-nav.tsx`**: Updated background to `rgba(255, 255, 255, 0.3)` with a `blur(20px)` effect to achieve a "glass" (glassmorphism) look. Removed yellow shadows in favor of a neutral soft shadow.

### Plus Button Updates

- **`apps/web/components/shared/product-card.tsx`**: Updated `PlusIcon` stroke to `#E53935` (red) and button background to `#FFFFFF` (white). Added border for visibility.
- **`apps/web/app/(shop)/products/[slug]/_client.tsx`**: Updated plus button in quantity stepper to red.
- **`apps/web/app/cart/page.tsx`**: Updated plus button in quantity stepper to red.

### Price Color Updates

- **`packages/ui/src/components/price-tag.tsx`**: Changed main price color to `#E53935` (red).
- **Global consistency**: Updated prices in Cart, Checkout, Search, and Account pages to use the same red color.
- **Search Modal Badges**:
  - Changed "Promo" section badge from blue to **Green** (`#2D7D52`) with light green background.
  - Updated individual discount badges to **Red** (`#E53935`) to match the new price theme.
  - Updated arrow buttons in search results to red theme accents.

### Dynamic Countdown Updates

- **Dynamic Logic**: Created `FlashSaleCountdown` component which fetches active campaigns from the database using `getActiveCampaigns`.
- **Filtering**: Specifically looks for campaigns with `type = 'flash_sale'` to drive the timer.
- **Visuals**: The countdown text color is set to red (`#E53935`) to match the new price theme.
- **Integration**: Replaced the hardcoded "02:14:38" text in `apps/web/app/(shop)/page.tsx` with the dynamic component.

## Validation

- `pnpm type-check` ran successfully in `apps/web`.
- Visual consistency verified across all modified components.
