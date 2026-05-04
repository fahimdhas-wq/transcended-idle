import { mobs } from '../data/mobs.js';
import { Decimal } from './decimal.js';

export const aiSystem = {
  generateEnemy(player) {
    const playerLevelDec = player.level instanceof Decimal ? player.level : new Decimal(player.level || 1);
    const enemyLvl = playerLevelDec.add(Math.floor(Math.random() * 3) - 1).max(1);
    const mobData = mobs[Math.floor(Math.random() * mobs.length)];
    
    // Enemy scales at same rate as player ATK (1.15^L) for constant kill time across levels
    const enemyGrowth = new Decimal(1.15).pow(enemyLvl.sub(1).max(0));
    
    let hpBase  = new Decimal(50).mul(enemyGrowth);
    let atkBase = new Decimal(5).mul(enemyGrowth);

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
  
  adjustScaling() {
    // Intentionally left blank. Dynamic scaling causes rubber-banding death-loops.
  }
};
