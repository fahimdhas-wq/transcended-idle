
export interface GameConfig {
  baseTickRate: number;
  maxOfflineHours: number;
  saveInterval: number;
  awakeningMultiplier: number;
  baseXpMultiplier: number;
  dropRates: {
    base: number;
    perStage: number;
  };
}

export const gameConfig: GameConfig = {
  baseTickRate: 100,
  maxOfflineHours: 24,
  saveInterval: 15000,
  awakeningMultiplier: 1.5,
  baseXpMultiplier: 0.1,
  dropRates: {
    base: 0.3,
    perStage: 0.05
  }
};

