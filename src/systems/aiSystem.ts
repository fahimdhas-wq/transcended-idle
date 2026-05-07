import { mobs, type MobType } from '../data/mobs.js';
import type { Character } from '../modules/character.svelte.js';
import { Decimal } from './decimal.js';

export interface Enemy {
  id: string;
  name: string;
  type: MobType;
  hp: Decimal;
  maxHp: Decimal;
  attack: Decimal;
  level: Decimal;
}

export const aiSystem = {
  generateEnemy(player: Character): Enemy {
    const playerLevelDec = player.level instanceof Decimal ? player.level : new Decimal(player.level || 1);
    const enemyLvl = playerLevelDec.add(Math.floor(Math.random() * 3) - 1).max(1);
    const mobData = mobs[Math.floor(Math.random() * mobs.length)];

    const enemyGrowth = new Decimal(1.15).pow(enemyLvl.sub(1).max(0));

    const hpBase = new Decimal(50).mul(enemyGrowth);
    const atkBase = new Decimal(5).mul(enemyGrowth);

    return {
      id: mobData.id,
      name: mobData.name,
      type: mobData.type,
      maxHp: hpBase,
      hp: hpBase,
      attack: atkBase,
      level: enemyLvl
    };
  },

  adjustScaling(): void {
    // Intentionally left blank. Dynamic scaling causes rubber-banding death-loops.
  }
};
