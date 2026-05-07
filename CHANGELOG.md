# V2.0 — The Transcendence Update

## Critical Bugs Fixed
- **CharacterPanel CSS**: Fixed all undefined CSS variable references (--neon-pink, --neon-blue, --border-color)
- **SealsPanel Decimal Bug**: Fixed `character.kills >= req` comparison — now uses `.gte()` for Decimal objects
- **CharacterPanel Visibility**: Added CHARACTER tab to App.svelte — panel was completely inaccessible
- **Combat Skip Chance**: Now properly triggers per-tick instead of once per fight
- **CSS Variable Conflicts**: Unified dual CSS systems into single source of truth in style.css

## Security & Safety
- **Dev Commands Gated**: `window.skipTime` and `window.maxSkills` now only available in DEV mode
- **Save System**: Config values now properly wired — `gameConfig.saveInterval` actually used

## New Features & UX
- **Toast Notifications**: Legendary/Mythic drops now show pop-up feedback
- **Offline Return Modal**: Shows summary when returning after 60+ seconds offline
- **Event Log Feed**: Log panel now has SUMMARY | EVENTS toggle with individual notable events
- **Seal Confirmation**: Breaking seals now requires confirmation (prevents accidents)
- **Tab Unlock Indicators**: New tabs pulse gold with dot badge when unlocked
- **Persistent Buy Amount**: x1/x10/x100 selector persists across tab switches via shared store
- **Achievement Progress Bar**: Visual % completion tracker
- **Enemy Type Badge**: Combat shows ORGANIC/ROBOTIC/SPECTRAL badge with color coding
- **HP Low Warning**: HP bar pulses red when below 25%

## Design Improvements
- **Bar Transitions**: HP/Shield/XP bars now smoothly animate (0.25s ease)
- **Rarity Visibility**: Increased glow alpha on Rare/Epic items + colored item names
- **Tab Scroll Indicator**: Right-edge fade gradient shows more tabs exist
- **Responsive Layout**: Two-column grid on desktop (>700px width)
- **Meta Tags**: Proper title, Open Graph tags, favicon configured

## Architecture & Code Quality
- **Shared Utilities**: Created `calculateBulkCost()` — eliminates duplication across 3 panels
- **Resource Data**: Extracted ores/trees from components → `src/data/resources.js`
- **Combat Stats Cache**: `getEffectiveCombatStats()` cached per tick (performance boost)
- **Confirmation Modal**: Reusable component for destructive actions

## Files Changed
- 15 components modified
- 3 new components (ToastNotification, OfflineModal, ConfirmationModal)
- 1 new store (uiStore.svelte.js)
- 1 new utility (bulkCost.js)
- 1 new data file (resources.js)
- CSS unified and responsive breakpoints added
- Save system wired to config
