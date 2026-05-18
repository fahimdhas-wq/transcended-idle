
export interface ParadoxDef {
  id: string;
  name: string;
  desc: string;
  effectDesc: string;
  targetKills: number;
  playerAtkMult: number;
  playerHpMult: number;
  xpMult: number;
  rewardAscShards: number;
  rewardAllStats: number;
  cooldownMs: number;
}

export const PARADOX_DEFS: ParadoxDef[] = [
  {
    id: 'glassCannon',
    name: 'Glass Cannon',
    desc: 'Overwhelming power at the cost of survivability',
    effectDesc: '+300% ATK, -90% Max HP',
    targetKills: 500,
    playerAtkMult: 4.0,
    playerHpMult: 0.1,
    xpMult: 1.0,
    rewardAscShards: 5000,
    rewardAllStats: 0.01,
    cooldownMs: 1 * 60 * 60 * 1000,
  },
  {
    id: 'xpStorm',
    name: 'XP Storm',
    desc: 'Rapid growth through unstable energy',
    effectDesc: '+200% XP, -50% ATK & HP',
    targetKills: 300,
    playerAtkMult: 0.5,
    playerHpMult: 0.5,
    xpMult: 3.0,
    rewardAscShards: 8000,
    rewardAllStats: 0.02,
    cooldownMs: 1 * 60 * 60 * 1000,
  },
  {
    id: 'chaos',
    name: 'Chaos',
    desc: 'Reality warps — only the strong endure',
    effectDesc: 'Random stat cycles every 10s, +100% all gains',
    targetKills: 1000,
    playerAtkMult: 1.0,
    playerHpMult: 1.0,
    xpMult: 2.0,
    rewardAscShards: 12000,
    rewardAllStats: 0.03,
    cooldownMs: 2 * 60 * 60 * 1000,
  },
  {
    id: 'surge',
    name: 'Surge',
    desc: 'Pure combat focus — no retreat',
    effectDesc: '+500% ATK, +200% XP, -50% HP regen',
    targetKills: 200,
    playerAtkMult: 6.0,
    playerHpMult: 1.0,
    xpMult: 3.0,
    rewardAscShards: 10000,
    rewardAllStats: 0.015,
    cooldownMs: 1 * 60 * 60 * 1000,
  },
];
