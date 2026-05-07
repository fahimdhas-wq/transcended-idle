# TRANSCENDED — Project Instructions

## 🏛️ Architecture & Conventions

### Framework: Svelte 5
- Use **Runes** (`$state`, `$derived`, `$effect`) for all reactivity.
- Avoid Svelte 4 stores (`writable`, `readable`) unless integrating with legacy code.
- Components are located in `src/components/` and use the `.svelte` extension.
- Logic modules are located in `src/modules/` and use the `.svelte.ts` extension when using runes.

### State Management
- Most global state is managed in `.svelte.ts` files (e.g., `src/modules/character.svelte.ts`).
- Prefer exporting singleton instances of state classes.

### Data Types & Math
- This project uses a custom `Decimal` class for large numbers to prevent overflow and precision issues in idle game mechanics.
- **ALWAYS** use `.gte()`, `.lte()`, `.add()`, `.mul()`, etc., when comparing or calculating with `Decimal` objects.
- Do **NOT** use standard JavaScript math operators (`>`, `<`, `+`, `*`) on `Decimal` instances.

### Styling
- Base styles and global variables are in `src/style.css`.
- Use CSS variables for colors (e.g., `--neon-blue`, `--neon-pink`) to maintain the cyberpunk aesthetic.
- Components should use scoped `<style>` blocks when possible, referencing global variables.

## 🛠️ Common Workflows

### Adding a New Mob
1. Add the mob definition to `src/data/mobs.ts`.
2. Ensure it has appropriate stats and rewards.

### Adding a New Resource
1. Define the resource in `src/data/resources.ts`.
2. Update the corresponding panel (`MiningPanel.svelte` or `ForestryPanel.svelte`) if needed.

### Saving & Loading
- The save system is in `src/core/saveSystem.ts`.
- It automatically handles serialization/deserialization of `Decimal` objects.
- The game auto-saves every 15 seconds (configurable in `src/data/config.ts`).
