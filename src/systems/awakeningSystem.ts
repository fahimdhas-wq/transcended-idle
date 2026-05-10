
import { character, updateDerivedStats } from '../modules/character.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { Decimal } from './decimal.js';

export function triggerAwakening() {
  if (character.level.lt(50)) return;

  character.awakeningStage++;
  
  // Reset core progression as per patch
  character.level = new Decimal(1);
  character.xp = new Decimal(0);
  character.momentum = 0; // Reset to number
  character.overcharge = 0; // Reset to number
  
  updateDerivedStats();

  // Permanent scaling boost
  character.stats.awakeningPower += 0.25;
  character.skillFragments = character.skillFragments.add(new Decimal(10));

  addLog(`[SYSTEM] Awakening Stage ${character.awakeningStage} complete! Power scaling boosted.`, 'awakening');
}

