
export type MobType = 'organic' | 'robotic' | 'spectral';

export interface MobDefinition {
  id: string;
  name: string;
  type: MobType;
}

export const mobs: MobDefinition[] = [
  { id: 'hound', name: 'Glitch Hound', type: 'organic' },
  { id: 'drone', name: 'Neon Drone', type: 'robotic' },
  { id: 'merc', name: 'Cyber Merc', type: 'organic' },
  { id: 'beast', name: 'Synthetic Beast', type: 'organic' },
  { id: 'ai', name: 'Rogue AI', type: 'robotic' },
  { id: 'guardian', name: 'Null Sec Guardian', type: 'robotic' },
  { id: 'striker', name: 'Proxy Striker', type: 'robotic' },
  { id: 'leech', name: 'Data Leech', type: 'spectral' }
];

