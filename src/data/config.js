export const gameConfig = {
  baseTickRate: 100,          // ms per tick
  maxOfflineHours: 24,
  saveInterval: 15000,        // 15 seconds (used by saveSystem.js)
  awakeningMultiplier: 1.5,
  baseXpMultiplier: 0.1,
  dropRates: {
    base: 0.3,
    perStage: 0.05
  }
};
