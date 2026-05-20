import { Decimal } from '../systems/decimal.js';
import type { GameSnapshot } from './types.js';

const SNAPSHOT_KEYS = [
  'character', 'combat', 'skills', 'mining', 'forestry',
  'bestiary', 'dailyChallenge', 'ascension', 'paradox',
  'rift', 'fracture', 'procedural', 'activePlay', 'inventory'
];

interface OfflineResult {
  levelsGained: number;
  killsGained: number;
  xpGained: { m: number; e: number };
  fragmentsGained: { m: number; e: number };
  dataFragmentsGained: { m: number; e: number };
  dnaFragmentsGained: { m: number; e: number };
  ascensionShardsGained: number;
}

function toDecimal(v: { m: number; e: number }): Decimal {
  return new Decimal(v.m, v.e);
}

function fromDecimal(d: Decimal): { m: number; e: number } {
  return { m: d.m, e: d.e };
}

function processOfflineSimulation(snapshot: GameSnapshot, days: number): OfflineResult {
  const ticks = Math.floor(days * 24 * 3600 * 1000 / 100);
  
  const char = snapshot.character;
  const lvl = toDecimal(char.level);
  const growth = new Decimal(1.15).pow(lvl.sub(1).max(0));
  
  const baseAtk = new Decimal(10).mul(growth);
  const baseHp = new Decimal(100).mul(growth);
  const enemyHp = new Decimal(50).mul(growth);
  const enemyAtk = new Decimal(5).mul(growth);
  
  const sealMult = Math.pow(10, char.seals || 0);
  const omniSkill = snapshot.skills.skills.find(s => s.id === 'omni_stat');
  const omniMult = omniSkill && omniSkill.tierIndex > 0
    ? new Decimal(1.2).mul(Decimal.TWO.pow(omniSkill.tierIndex - 1))
    : Decimal.ONE;
  const xpSkill = snapshot.skills.skills.find(s => s.id === 'xp_boost');
  const xpMult = xpSkill && xpSkill.tierIndex > 0
    ? 1 + 0.5 * Math.pow(2, xpSkill.tierIndex - 1)
    : 1;
  
  const effectiveAtk = baseAtk.mul(sealMult).mul(omniMult).mul(1 + char.dropBonus).toNumber();
  if (effectiveAtk <= 0) {
    return { levelsGained: 0, killsGained: 0, xpGained: { m: 0, e: 0 }, fragmentsGained: { m: 0, e: 0 }, dataFragmentsGained: { m: 0, e: 0 }, dnaFragmentsGained: { m: 0, e: 0 }, ascensionShardsGained: 0 };
  }
  
  const ticksPerKill = Math.max(1, enemyHp.div(effectiveAtk).toNumber());
  const totalKills = Math.floor(ticks / ticksPerKill);
  
  const cleaveSkill = snapshot.skills.skills.find(s => s.id === 'cleave');
  let cleaveMult = 1;
  if (cleaveSkill && cleaveSkill.tierIndex > 0) {
    const baseCleaveAmounts = [0, 2, 5, 12, 25, 50, 100, 250];
    const cleaveKills = cleaveSkill.tierIndex < baseCleaveAmounts.length
      ? baseCleaveAmounts[cleaveSkill.tierIndex]
      : 250 * Math.pow(2, cleaveSkill.tierIndex - 7);
    const activateChance = cleaveSkill.tierIndex >= 21 ? 1.0 : 0.4;
    cleaveMult = 1 + activateChance * cleaveKills * sealMult;
  }
  const effectiveKills = Math.floor(totalKills * cleaveMult);
  
  const baseExp = 10 * Math.pow(1.15, lvl.toNumber() - 1);
  let xpGain = baseExp * effectiveKills * xpMult * sealMult * omniMult.toNumber();
  
  let levelsGained = 0;
  let xpRemaining = xpGain;
  let xpNeeded = toDecimal(char.xpNeeded).toNumber();
  let currentXp = toDecimal(char.xp).add(xpGain);
  
  while (currentXp.gte(toDecimal(char.xpNeeded))) {
    currentXp = currentXp.sub(toDecimal(char.xpNeeded));
    const nextLvl = lvl.add(levelsGained + 1);
    const nextGrowth = new Decimal(1.15).pow(nextLvl.sub(1).max(0));
    xpNeeded = new Decimal(100).mul(nextGrowth).toNumber();
    levelsGained++;
    if (levelsGained > 1000000) break;
  }
  
  const fragBase = lvl.toNumber() / 200 + 0.1;
  let fragGain = fragBase * (1 + (char.seals || 0)) * effectiveKills;
  const siphon = snapshot.skills.skills.find(s => s.id === 'data_siphon');
  if (siphon && siphon.tierIndex > 0) {
    const siphonMult = 25 * Math.pow(2, siphon.tierIndex - 1) * effectiveKills * sealMult;
    fragGain += siphonMult;
  }
  
  const dataFragGain = effectiveKills * 0.1 * (1 + snapshot.bestiary.huntersGreed * 0.1);
  const dnaFragGain = effectiveKills * 0.1 * (1 + snapshot.forestry.reforestation * 0.1);
  
  const ascShardsGain = Math.floor(lvl.toNumber() * effectiveKills * 0.001);
  
  return {
    levelsGained,
    killsGained: effectiveKills,
    xpGained: fromDecimal(currentXp),
    fragmentsGained: { m: fragGain, e: 0 },
    dataFragmentsGained: { m: dataFragGain, e: 0 },
    dnaFragmentsGained: { m: dnaFragGain, e: 0 },
    ascensionShardsGained: ascShardsGain
  };
}

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;
  
  switch (type) {
    case 'PROCESS_OFFLINE':
      const { snapshot, days } = payload as { snapshot: GameSnapshot; days: number };
      const result = processOfflineSimulation(snapshot, days);
      self.postMessage({ type: 'OFFLINE_RESULT', payload: result });
      break;
      
    case 'BATCH_LEVELUPS':
      const { currentXp, currentLevel, xpNeededBase } = payload as {
        currentXp: { m: number; e: number };
        currentLevel: number;
        xpNeededBase: { m: number; e: number };
      };
      
      let xp = toDecimal(currentXp);
      let lvl = currentLevel;
      let levels = 0;
      
      let xpNeeded = new Decimal(100).mul(new Decimal(1.15).pow(lvl - 1));
      
      while (xp.gte(xpNeeded)) {
        xp = xp.sub(xpNeeded);
        lvl++;
        xpNeeded = new Decimal(100).mul(new Decimal(1.15).pow(lvl - 1));
        levels++;
        if (levels > 1000000) break;
      }
      
      self.postMessage({ type: 'BATCH_RESULT', payload: { levelsGained: levels, remainingXp: fromDecimal(xp) } });
      break;
  }
};

self.postMessage({ type: 'READY' });