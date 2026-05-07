import type { MobType } from './mobs.js';

export interface TypeColor {
  color: string;
  label: string;
}

export const typeColors: Record<MobType, TypeColor> = {
  organic: { color: '#4caf50', label: 'ORGANIC' },
  robotic: { color: 'var(--neon-blue)', label: 'ROBOTIC' },
  spectral: { color: 'var(--neon-pink)', label: 'SPECTRAL' }
};
