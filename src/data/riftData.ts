
export interface RiftDef {
  id: string;
  name: string;
  desc: string;
  effect: string;
  resourceCost: {
    miningEnergy?: number;
    forestryEnergy?: number;
    dataFragments?: number;
    dnaFragments?: number;
    miningResource?: { id: string; amount: number };
    forestryResource?: { id: string; amount: number };
  };
  bonus: { type: 'atk' | 'hp' | 'allStats' | 'xp' | 'critDmg'; perLevel: number };
  cooldownMs: number;
}

export const RIFT_DEFS: RiftDef[] = [
  {
    id: 'overcharge',
    name: 'Overcharge Rift',
    desc: 'Channel raw energy into combat protocols',
    effect: '+5% permanent ATK per activation',
    resourceCost: { miningEnergy: 500, dataFragments: 10000 },
    bonus: { type: 'atk', perLevel: 0.05 },
    cooldownMs: 24 * 60 * 60 * 1000,
  },
  {
    id: 'bloom',
    name: 'Bloom Rift',
    desc: 'Infuse life force into cellular regeneration',
    effect: '+5% permanent HP per activation',
    resourceCost: { forestryEnergy: 500, dnaFragments: 10000 },
    bonus: { type: 'hp', perLevel: 0.05 },
    cooldownMs: 24 * 60 * 60 * 1000,
  },
  {
    id: 'fusion',
    name: 'Fusion Rift',
    desc: 'Merge mining and forestry essences',
    effect: '+3% permanent All Stats per activation',
    resourceCost: { miningEnergy: 300, forestryEnergy: 300, dataFragments: 5000, dnaFragments: 5000 },
    bonus: { type: 'allStats', perLevel: 0.03 },
    cooldownMs: 24 * 60 * 60 * 1000,
  },
  {
    id: 'data',
    name: 'Data Rift',
    desc: 'Extract knowledge from raw data streams',
    effect: '+8% permanent XP gain per activation',
    resourceCost: { dataFragments: 25000, dnaFragments: 25000 },
    bonus: { type: 'xp', perLevel: 0.08 },
    cooldownMs: 24 * 60 * 60 * 1000,
  },
  {
    id: 'core',
    name: 'Core Rift',
    desc: 'Forge advanced materials into critical damage',
    effect: '+10% permanent Crit Damage per activation',
    resourceCost: { miningResource: { id: 'cosmicCore', amount: 5 }, forestryResource: { id: 'etherealCore', amount: 5 } },
    bonus: { type: 'critDmg', perLevel: 0.10 },
    cooldownMs: 24 * 60 * 60 * 1000,
  },
];
