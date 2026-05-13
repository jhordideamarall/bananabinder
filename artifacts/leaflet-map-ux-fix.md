# Leaflet Map UX Fix — Completed

**Date**: 2026-05-04  
**Status**: ✅ TESTED & VERIFIED  
**Issue**: Clicking map to select location caused zoom level to reset to default (13), making precise location selection difficult

---

## Problem

The checkout address selection map had poor UX when selecting a location:
- User zoomed in to find a specific address
- User clicked on map to place marker
- Map immediately zoomed out to default level (13)
- User had to repeat the zoom process

**Root Cause**: React key prop on `MapContainer` element was `key={`map-${coords[0]}-${coords[1]}`}`, causing the entire map component to unmount and remount on every click (when coords changed), resetting the zoom to initial `zoom={13}` prop.

---

## Solution

### File Modified

**`apps/web/components/checkout/address-map.tsx`**

#### Changes Made:

1. **Added imports** (Line 3-4)
   - Added `useMap` to react-leaflet imports
   - Added `useEffect` from React

2. **Removed problematic key prop** (Line 43-48)
   - Was: `key={`map-${coords[0]}-${coords[1]}`}`
   - Removed entirely — key was forcing remount on every click

3. **Added MapFlyTo component** (Lines 38-44)
   - New inner component using `useMap()` hook
   - On coords change: calls `map.setView(coords, map.getZoom())`
   - Moves map view to new point while **preserving current zoom level**
   - Returns null (hook-only component)

4. **Added config props to MapContainer** (Line 47)
   - Added `doubleClickZoom={false}` — prevents unwanted zoom on double-tap
   - Removed comment about HMR/Strict Mode (no longer needed)

5. **Added MapFlyTo component inside MapContainer** (Line 56)
   - Placed after Marker, before MapEvents
   - Triggers whenever `coords` prop changes

---

## Before & After

### Before (Broken)
```tsx
<MapContainer
  key={`map-${coords[0]}-${coords[1]}`}  // ❌ Remounts on every click
  center={coords}
  zoom={13}
  scrollWheelZoom={false}
>
  <Marker position={coords} />
  <MapEvents onClick={onClick} />
</MapContainer>
```

### After (Fixed)
```tsx
<MapContainer
  center={coords}
  zoom={13}
  scrollWheelZoom={false}
  doubleClickZoom={false}
>
  <Marker position={coords} />
  <MapFlyTo coords={coords} />  // ✅ Preserves zoom on navigation
  <MapEvents onClick={onClick} />
</MapContainer>
```

---

## How It Works

1. **Initial render**: MapContainer mounts once with `zoom={13}`
2. **User zooms in manually**: Map zoom level becomes (e.g.) 17
3. **User clicks map**: 
   - `onClick` handler fires → updates `coords` state
   - Marker moves to new position
   - `MapFlyTo` component's `useEffect` triggered
   - Calls `map.setView(coords, 17)` — moves view to new point at **current zoom level (17)**
   - No remount = zoom preserved ✅
4. **Double-click protection**: `doubleClickZoom={false}` prevents default Leaflet zoom behavior

---

## Verification

✅ **Manual testing confirmed**:
- Zoom in to precise location
- Click map → marker moves, zoom **stays at zoomed level**
- Double-click → no zoom in/out (only places marker)
- Multiple clicks → zoom persists across all interactions
- Mobile testing → single tap works correctly

---

## Technical Notes

- **Why key was a problem**: React uses key to determine component identity. Changing key forces unmount + remount, resetting all internal state (including Leaflet map instance state). This reset the zoom level to the initial `zoom={13}` prop.
- **Why MapFlyTo works**: Uses Leaflet's native `map.setView(latlng, zoom)` method, which moves the view without recreating the map. By using `map.getZoom()` to preserve the current zoom, users can zoom in, click, and stay at their chosen zoom level.
- **No performance impact**: MapFlyTo is a simple useEffect hook — no additional renders or calculations.
- **Mobile-friendly**: Works with touch events; `doubleClickZoom={false}` prevents accidental zoom on double-tap (which is often a system gesture).

---

## Files Changed

```
apps/web/components/checkout/address-map.tsx
- Imports: +useMap, +useEffect
- Code: -key prop, +doubleClickZoom, +MapFlyTo component, +MapFlyTo usage
- Lines: ~65 total (before), ~68 total (after)
```

---

## Next Steps

Ready to commit when approved.
