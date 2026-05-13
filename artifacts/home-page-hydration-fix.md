# Home Page Hydration Fix - Completed

**Date**: 2026-05-04  
**Status**: ✅ TESTED & VERIFIED  
**Issue**: Home page was blinking/flashing with blank screen on load

---

## Problem

The home page (`(shop)/page.tsx`) and header component (`header.tsx`) were returning `null` until client-side hydration completed. This caused:
- Blank white page flash on initial load
- Header popping in after mount
- Cart badge appearing suddenly

**Root Cause**: `if (!hydrated) return null;` guard on both components

---

## Solution

### Files Modified

#### 1. `apps/web/app/(shop)/page.tsx`
- **Line 2**: Removed `useEffect` and `useState` imports (no longer needed)
- **Lines 275-284**: Removed hydration state management
  - Deleted: `const [hydrated, setHydrated] = useState(false);`
  - Deleted: `useEffect(() => { setHydrated(true); }, [])`
- **Line 278-280**: Updated `useScroll` to directly use `scrollRef` (no longer conditional)
  - Was: `container: hydrated ? scrollRef : undefined`
  - Now: `container: scrollRef`
- **Line 309**: Removed blank return guard
  - Deleted: `if (!hydrated) return null;`

#### 2. `apps/web/components/layout/header.tsx`
- **Lines 139-175**: Removed hydration state from useEffect
  - Deleted: `const [hydrated, setHydrated] = useState(false);`
  - Removed: `setHydrated(true);` from useEffect initialization
  - Simplified geolocation detection (removed separate hydration setter)
- **Line 187**: Removed blank return guard
  - Deleted: `if (!hydrated) return null;`
- **Line 251**: Simplified cart aria-label
  - Was: `hydrated && cartCount > 0 ? ...`
  - Now: `cartCount > 0 ? ...`
- **Line 267**: Simplified cart badge condition
  - Was: `hydrated && cartCount > 0 &&`
  - Now: `cartCount > 0 &&`

---

## Verification

✅ **Hard reload #1**: Page loads with header, banner, categories, products - no blank flash  
✅ **Hard reload #2**: Consistent smooth load - all content visible immediately  
✅ **Cart badge**: Displays correctly without flashing  
✅ **Location**: Shows "Palembang" without delay  
✅ **Search bar**: Renders immediately  
✅ **Product grid**: Loads with all visible products

---

## Technical Notes

- **Why it works**: Page content doesn't depend on client-side hydration. The scroll listener (`useScroll`) and cart badge already handle their own client-side initialization safely.
- **No data loss**: Cart state and location data still persist via Zustand localStorage (they hydrate after initial render, which is fine)
- **Scroll behavior**: The banner carousel's scroll progress tracking works correctly since the scroll ref is available immediately
- **Responsive**: All layout and styling are preserved - no visual regression

---

## What Changed vs. What Stayed

**Removed**: 
- Hydration guards that blocked rendering
- Hydration state management
- Conditional initialization of useScroll

**Kept**:
- All UI/UX styling and animations
- All product fetching logic
- All category loading
- All banner carousel behavior
- All cart management
- All location detection

---

## Next Steps

Ready for commit when approved.
