# TRANSCENDED v2.0

A cyberpunk idle RPG built with **Svelte 5**. Fight, mine, and evolve beyond limits in a neon-drenched future.

## 🚀 Features

- **Combat Arena**: Battle organic, robotic, and spectral enemies across multiple stages.
- **Resource Gathering**: Deep mining and forestry systems with scaling rewards.
- **Character Progression**: Advanced leveling, skill trees, and stat-altering matrix systems.
- **Bestiary**: Track your kills and unlock permanent bonuses for every mob type.
- **Overclocking**: Transcend your limits to gain massive multipliers.
- **Seals & Awakening**: Break ancient seals to unlock high-tier power.
- **Offline Progress**: Continue your journey even when the app is closed.

## 🛠️ Technical Stack

- **Framework**: [Svelte 5](https://svelte.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **State Management**: Svelte Runes (`$state`, `$derived`, `$effect`)
- **Styling**: Vanilla CSS with Cyberpunk/Neon aesthetics

## 📦 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run in development mode**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## 📜 Project Structure

- `src/components`: UI components (Panels, Modals, HUD)
- `src/modules`: Core game logic modules (Combat, Inventory, Skills)
- `src/systems`: Background systems (Achievement, Reward, Scaling)
- `src/data`: Game balance data (Items, Mobs, Resources)
- `src/core`: Game loop and save system
