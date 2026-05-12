# TRANSCENDED — Major Upgrade Plan v2.1

## Vision
Transform TRANSCENDED from a basic idle RPG into a deep incremental experience with layered prestige, meaningful cross-system synergies, procedural late-game challenges, and genuine player agency.

---

## PHASE 1: Prestige Layer 2.0 — "Ascension"

### Problem
Overclock is a soft reset that feels punishing. Players lose momentum, overcharge, level, XP, and seals progress. The reward (core threads) is abstract and disconnected from gameplay.

### Solution
Replace Overclock with **Ascension** — a multi-layered prestige system with meaningful choices:

#### New Resource: **Ascension Shards**
- Earned by breaking level walls (at level 1e3, 1e6, 1e9, etc.)
- Can be spent on **Ascension Upgrades** that persist through resets
- Each ascension tier unlocks new upgrade trees

#### Ascension Tiers
| Tier | Name | Requirement | Unlock |
|------|------|-------------|--------|
| 0 | Mortal | Start | — |
| 1 | Ascended | 1 ascension | +2 upgrade slots |
| 2 | Transcended | 5 ascensions | Unlock Fractures |
| 3 | Cosmic | 10 ascensions | Unlock Rifts |
| 4 | Eternal | 25 ascensions | Unlock Paradox |
| 5 | Infinite | 50 ascensions | Custom ascension path |

#### Ascension Upgrades (spend shards)
```
SHARD TREE 1 — Power
├── Essence Resonance I-III: +50/100/200% ATK per ascension
├── Vitality Core I-III: +50/100/200% HP per ascension
├── Momentum Mastery I-III: Momentum decays 20/40/60% slower
└── Fragment Adept I-III: +25/50/100% skill fragments

SHARD TREE 2 — Economy
├── Quick Start I-III: Start with 100/500/2000 gold per ascension
├── Resource Memory I-III: Keep 10/25/50% of mining/forestry resources
├── Knowledge Vault I-III: Start with 25/50/100% of max skill tiers
└── Bestiary Retention I-III: Keep 25/50/100% of soul fragments

SHARD TREE 3 — Multiplier
├── Exponential Growth I-III: +5/10/20% to all multipliers per ascension
├── Chain Ascension: Each ascension grants +1 additional core thread
└── Prestige Acceleration: Ascensions cost 10% less shards each time
```

#### Ascension Mechanic
- **When**: Available at level 1,000,000 (1e6)
- **What you keep**: Ascension shards, ascension upgrades, achievements, bestiary, souls, skills
- **What you reset**: Level, XP, gold, momentum, overcharge, seals, mining, forestry
- **Shards earned**: `floor(log10(level) × ascension_tier × 10)`
- **Ascension counter**: Each reset increases counter → unlocks tiers

#### Benefits over current Overclock
- Multiple upgrade paths (player agency!)
- Resource retention options
- Tangible permanent power (shards → upgrades)
- Progressive unlocking keeps long-term goals

---

## PHASE 2: Fracture System — Procedural Challenges

### Problem
Late game is static. Same mobs, same scaling. No challenges or variety.

### Solution
**Fractures** — procedural challenge dungeons unlocked at Ascension Tier 2:

#### Fracture Generation
```
Each Fracture has:
├── Theme: ["Corrupted", "Frozen", "Burning", "Void", "Quantum", "Temporal"]
├── Difficulty: 1-100 (scales with player power)
├── Modifiers: 2-4 random effects
│   ├── "Enemies deal 2x damage"
│   ├── "Your crit chance is halved"
│   ├── "Boss appears every 5 enemies"
│   ├── "Healing is disabled"
│   ├── "Gold drops are tripled"
│   └── "You cannot use skills"
├── Floors: 10-50 (random)
└── Reward: Ascension Shards + rare resources
```

#### Fracture Mechanics
- Enter from Overclock tab (replaces "Do Overclock" with "Enter Fracture")
- **No overcharge/momentum** — pure combat challenge
- **Boss floors** — Every 5 floors, a boss with 10x HP and unique abilities
- **Fracture Currency**: Earned from clearing floors, spent in Fracture Shop

#### Fracture Shop
```
Fracture Currency buys:
├── Persistent Boosts: +5% damage for ALL fractals cleared (permanent)
├── Recaller: Refund shards spent on a single upgrade
├── Time Warp: Multiply offline progress by 2x (one-time, stacks)
├── Fracture Key: Unlock a guaranteed high-difficulty fracture
└── Memory Crystal: Keep 1 ascension upgrade across resets
```

---

## PHASE 3: Rift System — Cross-System Synergy

### Problem
Mining and Forestry are isolated systems. No reason to engage with both.

### Solution
**Rifts** — endgame zones that require BOTH mining and forestry resources:

#### Rift Types
| Rift | Resources Required | Reward |
|------|-------------------|--------|
| Forge Rift | Ferrite + Biomass | +10% to all crafting yields |
| Circuit Rift | Alloy-X + Biofiber | +15% crit damage |
| Core Rift | Titan Core + Bio Core | +20% all stats |
| Void Rift | Voidite + Voidwood | +1% skip damage per rift cleared |
| Cosmic Rift | Cosmic Core + Ethereal Core | +50% ascension shard gain |

#### Rift Mechanic
- Unlock at Ascension Tier 3
- Each rift costs resources from BOTH mining and forestry
- Clearing a rift grants a **permanent passive bonus**
- Rifts respawn after 24 hours (or currency to instant-refresh)

---

## PHASE 4: Paradox Challenges — True Endgame

### Problem
Once you can overclock, there's no real challenge. Numbers go up but nothing stops you.

### Solution
**Paradox Challenges** — hard-capped challenges at Ascension Tier 4:

#### Paradox Types
```
1. NO RESTRICTION CHALLENGE
   - Cannot level up (no XP gain)
   - Must reach 1000 kills using only base stats
   - Reward: "Level 0 Master" — permanent +100% base ATK

2. THE SPEEDRUN
   - Must reach ascension level (1e6) in under 10 minutes
   - Uses accelerated tick rate
   - Reward: "Speed Demon" — +50% momentum gain

3. GLASS CANNON
   - Max HP reduced to 10
   - Cannot use shield regeneration
   - Must kill 100 enemies
   - Reward: "Glass Cannon" — +200% ATK, -50% HP

4. THE INFINITE
   - No caps on anything
   - Enemies scale 1000x faster
   - Kill count determines reward tier
   - Reward: Multiplicative damage based on kills (1e15+ target)
```

---

## PHASE 5: Daily/Weekly Challenges

### Problem
No recurring content or events.

### Solution
**Temporal Events** — time-limited challenges that rotate:

#### Daily Challenge (resets every 24h)
```
随机挑战类型:
├── "Double XP Day" — All XP gains doubled
├── "Fragment Rush" — Skill fragments +200%
├── "Loot Frenzy" — Drop rate 100%
├── "Mining Surge" — Mining speed 3x
└── "Boss Rush" — Bosses appear every floor

奖励:
├── Bonus shards (10-50 based on performance)
├── Leaderboard position (local only)
└── Achievement: "Daily Veteran" (complete 7/30/100 dailies)
```

#### Weekly Challenge (resets every Monday)
```
更强挑战:
├── "The Gauntlet" — Clear 10 floors of hardest available fractal
├── "Resource Tycoon" — Earn 1e12 of each resource type
└── "Ascension Speedrun" — Complete ascension in record time

奖励:
├── 100-500 ascension shards
├── "Weekly Champion" badge
└── Permanent multiplier bonus
```

---

## PHASE 6: Active Play Mechanics

### Problem
Idle games become too passive. No reason to engage actively.

### Solution
**Active Power** — optional mechanics for players who want engagement:

#### Quick Actions (NGU Idle style)
```
3 button slots unlocked at level 10:
├── POWER BUTTON: Click for instant 0.1% of max HP as damage (scales with level)
│   └── Cooldown: 1 second
│   └── Upgradeable: Faster cooldown, more damage
├── BOOST BUTTON: Click to gain 10 seconds of 2x all gains
│   └── Cooldown: 60 seconds
│   └── Upgradeable: Shorter cooldown, longer duration
└── COLLECT BUTTON: Click to instantly collect 10 seconds of resource generation
    └── Cooldown: 5 seconds
    └── Upgradeable: Collect more, faster cooldown
```

#### Manual Overclock
- Instead of auto-overclock, require manual click at level 1e6
- Gives player agency over timing
- Add "Overclock Now" button with confirmation

---

## PHASE 7: Procedural Mob/Resource Generation

### Problem
Game runs out of content eventually.

### Solution
**Procedural Generation** — infinite content via algorithm:

#### Procedural Mobs (unlock after first ascension)
```
Name generation: [Prefix] + [Base] + [Suffix]
├── Prefixes: "Corrupted", "Ancient", "Mutant", "Cyber", "Void", "Quantum"
├── Bases: "Hound", "Drone", "Merc", "Beast", "AI", "Guardian"
├── Suffixes: "Mk.II", "Prime", "Omega", "X", "Zero", "Alpha"

Stats scale with: floor(log10(player_level)) + mob_id
Type distribution: weighted random based on bestiary progress

Special ability every 10th procedural mob:
├── "Regenerator" — Heals 1% HP per tick
├── "Armored" — 50% damage reduction
├── "Swift" — Attacks twice
└── "Phasing" — 30% chance to dodge attacks
```

#### Procedural Resources (unlock after 5 ascensions)
```
Name: [Material] + [Form]
├── Materials: "Dark", "Light", "Prismatic", "Chaotic", "Stellar", "Nebula"
├── Forms: "Essence", "Core", "Shards", "Matrix", "Fragment", "Crystal"

Tier determined by: ascension_count × depth_in_tree
Each tier provides unique bonuses in Rifts
```

---

## Implementation Priority

### Tier 1 — Must Have (Core Loop)
1. **Ascension System** — New prestige layer replacing Overclock
2. **Ascension Upgrades** — Shard-spendable permanent upgrades
3. **Ascension Tab UI** — Panel to view/buy upgrades
4. **Save System Update** — Persist ascension data

### Tier 2 — Should Have (Content Depth)
5. **Fracture System** — Procedural challenges
6. **Fracture UI** — Fracture selection and progress
7. **Fracture Shop** — Spend fractal currency

### Tier 3 — Nice to Have (Engagement)
8. **Daily Challenges** — Rotating daily events
9. **Weekly Challenges** — Stronger weekly content
10. **Active Power Buttons** — Quick actions for active play

### Tier 4 — Endgame (Longevity)
11. **Rift System** — Cross-system synergy
12. **Paradox Challenges** — Hard-capped challenges
13. **Procedural Generation** — Infinite content

---

## File Changes

### New Files
```
src/modules/ascension.svelte.ts      # Ascension state and logic
src/modules/fracture.svelte.ts      # Fracture generation and state
src/systems/ascensionUpgrades.ts    # Upgrade definitions
src/systems/fractureGenerator.ts   # Procedural fracture generation
src/components/AscensionPanel.svelte # UI for ascension
src/components/FracturePanel.svelte # UI for fractals
src/components/DailyChallenge.svelte # Daily challenge display
src/data/challenges.ts              # Challenge definitions
```

### Modified Files
```
src/modules/overclock.svelte.ts     # Replace with ascension logic
src/modules/overclockState.svelte.ts # Update state structure
src/core/gameLoop.svelte.ts          # Add ascension tick processing
src/core/saveSystem.ts              # Save/load ascension data
src/data/config.ts                  # Add ascension constants
src/App.svelte                      # Add new tab (ASCENSION/FRACTALS)
src/components/OverclockPanel.svelte # Update to ascension UI
src/components/SystemPanel.svelte   # Update overclock reference
src/components/OfflineModal.svelte   # Show ascension count
```

---

## Migration Strategy

1. **Backward Compatibility**: If player has existing save with overclock data, migrate to ascension format:
   - `coreThreads` → `ascensionUpgrades` (convert to shard equivalent)
   - `timesOverclocked` → `ascensionCount`

2. **Phased Rollout**: Add new content without breaking existing progression

3. **Feature Flags**: Gate new systems behind ascension count thresholds
