// ============================================================
// FORESTRY WORKER MODULE
// Handles Forestry simulation off the main thread
// ============================================================

import { Decimal } from '../systems/decimal.js';
import {
  ResourceArray,
  FORESTRY_INDEX_MAP,
  ALL_FORESTRY_IDS,
  type SerializedResourceArray
} from '../systems/resourceArray.js';

// ============================================================
// FORESTRY STATE SERIALIZATION
// ============================================================

export interface ForestryWorkerState {
  unlocked: boolean;
  toolTier: number;
  growthChambers: number;
  mutationChance: number;
  reforestation: number;
  energy: number;
  maxEnergy: number;
  isOverclocked: boolean;
  overclockTicks: number;
  chainsawFuel: number;
  ancientSaplings: number;
  mutationPower: number;
  overclockPower: number;
  efficiency: number;
  resources: SerializedResourceArray;
  autoRefine: Record<string, boolean>;
}

// ============================================================
// WORKER FORESTRY SIMULATION
// Runs in Web Worker context
// ============================================================

export class WorkerForestrySimulator {
  private state: ForestryWorkerState;
  private resourceArray: ResourceArray;

  // Constants (copied from config to avoid import issues in worker)
  private readonly REFINE_RATIO = 50;
  private readonly OVERCLOCK_DURATION = 600;
  private readonly BASE_RATE = 0.001;
  private readonly AUTOMATION_BONUS = 0.01;
  private readonly BASE_ENERGY_COST = 0.01;
  private readonly BASE_REGEN_RATE = 0.001;
  private readonly AUTOMATION_REGEN = 0.002;
  private readonly PROGRESS_THRESHOLD = 1000;
  private readonly TICK_RATE = 0.1;
  private readonly CRIT_CHANCE_BASE = 0.001;
  private readonly CRIT_MULTIPLIER = 5;

  constructor() {
    this.resourceArray = new ResourceArray(ALL_FORESTRY_IDS, FORESTRY_INDEX_MAP);
    this.state = this.createDefaultState();
  }

  private createDefaultState(): ForestryWorkerState {
    return {
      unlocked: false,
      toolTier: 1,
      growthChambers: 1,
      mutationChance: 0.05,
      reforestation: 0,
      energy: 100,
      maxEnergy: 100,
      isOverclocked: false,
      overclockTicks: 0,
      chainsawFuel: 0,
      ancientSaplings: 0,
      mutationPower: 0,
      overclockPower: 0,
      efficiency: 0,
      resources: {
        ids: [...ALL_FORESTRY_IDS],
        values: new Array(ALL_FORESTRY_IDS.length).fill(0)
      },
      autoRefine: {}
    };
  }

  // Load state from main thread
  loadState(state: ForestryWorkerState): void {
    this.state = state;
    this.resourceArray.fromRecord(
      Object.fromEntries(
        state.resources.ids.map((id, i) => [id, new Decimal(state.resources.values[i] ?? 0)])
      )
    );
  }

  // Export state to main thread
  exportState(): ForestryWorkerState {
    return {
      ...this.state,
      resources: {
        ids: [...ALL_FORESTRY_IDS],
        values: Array.from(this.resourceArray.getBuffer())
      }
    };
  }

  // Get resource value (raw number for hot path)
  getResource(id: string): number {
    return this.resourceArray.getRaw(id);
  }

  // Add resource value
  addResource(id: string, amount: number): void {
    this.resourceArray.add(id, amount);
  }

  // Sub resource value
  subResource(id: string, amount: number): void {
    this.resourceArray.sub(id, amount);
  }

  // Check if player level meets unlock requirement
  checkUnlock(playerLevel: number): boolean {
    if (playerLevel >= 200 && !this.state.unlocked) {
      this.state.unlocked = true;
      this.state.toolTier = 1;
      return true; // Newly unlocked
    }
    return this.state.unlocked;
  }

  // Perform Forestry tick simulation
  tick(ticks: number, playerLevel: number, speedBonus: number = 1, energyEff: number = 1): {
    harvested: boolean;
    harvestCount: number;
  } {
    // Check unlock
    if (playerLevel < 200) {
      this.state.unlocked = false;
      return { harvested: false, harvestCount: 0 };
    }

    if (!this.state.unlocked) {
      this.state.unlocked = true;
      this.state.toolTier = 1;
    }

    // Calculate speed
    let activeSpeed =
      (this.BASE_RATE + this.state.growthChambers * this.AUTOMATION_BONUS) *
      (this.state.chainsawFuel + 1) *
      (this.state.reforestation + 1) *
      speedBonus * 2;

    if (this.state.isOverclocked) {
      const ocMult = 1.5 + (this.state.overclockPower + 1) * 0.5;
      activeSpeed *= ocMult;
      this.state.overclockTicks -= ticks;
      if (this.state.overclockTicks <= 0) {
        this.state.isOverclocked = false;
      }
    }

    // Energy calculations
    const effReduction = 1 / (1 + this.state.efficiency * 0.1);
    const speedLog = Math.max(1, Math.log10(activeSpeed + 1));
    const actualCostPerTick = this.BASE_ENERGY_COST * speedLog * speedLog * effReduction;

    const regenPerTick =
      (this.state.maxEnergy * this.BASE_REGEN_RATE * this.state.toolTier +
       this.state.growthChambers * this.state.maxEnergy * this.AUTOMATION_REGEN * this.state.toolTier) *
      energyEff;

    let yieldMult = 1.0;
    if (!this.state.isOverclocked) {
      const totalCost = actualCostPerTick * ticks;
      const totalAvail = this.state.energy + regenPerTick * ticks;
      if (totalCost > 0) {
        if (totalAvail < totalCost) {
          yieldMult = Math.max(0, totalAvail / totalCost);
          this.state.energy = 0;
        } else {
          this.state.energy = Math.max(0, Math.min(this.state.maxEnergy, totalAvail - totalCost));
        }
      }
    } else {
      this.state.energy = Math.max(0, Math.min(this.state.maxEnergy, this.state.energy + regenPerTick * ticks));
    }

    let harvestCount = 0;
    if (yieldMult > 0) {
      const progressGain = activeSpeed * this.TICK_RATE * yieldMult * ticks;
      // Simulate progress (we don't track this separately in worker)
      const simulatedProgress = progressGain;

      if (simulatedProgress >= this.PROGRESS_THRESHOLD) {
        harvestCount = Math.floor(simulatedProgress / this.PROGRESS_THRESHOLD);
        const activeYield = (this.state.chainsawFuel + 1) + this.state.growthChambers * 5;

        // Process harvests
        for (let i = 0; i < harvestCount; i++) {
          this.processHarvest(activeYield);
        }
      }
    }

    return { harvested: harvestCount > 0, harvestCount };
  }

  private processHarvest(baseYield: number): void {
    const critMult = Math.random() < this.CRIT_CHANCE_BASE ? this.CRIT_MULTIPLIER : 1;
    const totalAmount = baseYield * critMult * 10; // Simplified yield calculation

    const maxTier = Math.max(1, Math.min(10, this.state.ancientSaplings + 1));
    const availableTiers = [
      'biomass','oakron','birchon','pynex','willix',
      'mahorix','tecron','ironwood','darkwood','voidwood'
    ].slice(0, maxTier);

    const amountPerTier = Math.floor(totalAmount / availableTiers.length);
    const remainder = totalAmount % availableTiers.length;

    for (let i = 0; i < availableTiers.length; i++) {
      let finalAmount = amountPerTier;
      if (i < remainder) finalAmount += 1;
      if (finalAmount > 0) {
        this.addResource(availableTiers[i], finalAmount);
        this.processRefining(availableTiers[i]);
      }
    }
  }

  private processRefining(id: string): void {
    const refineMap: Record<string, string> = {
      biomass: 'biofiber', oakron: 'reinforcedFiber', birchon: 'lightPanel',
      pynex: 'resinGel', willix: 'flexFiber', mahorix: 'denseCore',
      tecron: 'armorFiber', ironwood: 'darkMatterFiber', darkwood: 'crystalGrowth',
      voidwood: 'spiritFlux',
      biofiber: 'bioCore', reinforcedFiber: 'terraCore', lightPanel: 'photonBark',
      resinGel: 'cryoCore', flexFiber: 'psiCore', denseCore: 'royalMatrix',
      armorFiber: 'guardianCore', darkMatterFiber: 'shadowCore', crystalGrowth: 'lumenCore',
      spiritFlux: 'etherealCore'
    };

    let currentId: string | undefined = id;
    while (currentId) {
      const target = refineMap[currentId];
      if (!target) break;

      const resource = this.getResource(currentId);
      if (resource < this.REFINE_RATIO) break;
      if (!this.state.autoRefine[currentId]) break;

      const count = Math.floor(resource / this.REFINE_RATIO);
      if (count <= 0) break;

      this.subResource(currentId, count * this.REFINE_RATIO);
      this.addResource(target, count);
      currentId = target;
    }
  }

  // Get dirty flags for state updates
  getDirtyFlags(): {
    energy: boolean;
    resources: boolean;
  } {
    return {
      energy: true, // Always report energy changes
      resources: true // Resource changes
    };
  }
}
