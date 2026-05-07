import type { ItemRarity } from '../data/items.js';

export interface InventoryItem {
  id: string;
  name: string;
  rarity: ItemRarity;
  count: number;
}

export interface InventoryState {
  items: InventoryItem[];
}

export const inventory: InventoryState = $state({
  items: []
});

let itemMap = new Map<string, InventoryItem>();
let _pendingUpdates = new Map<string, number>();

export function rebuildInventoryMap(): void {
  itemMap = new Map();
  const uniqueItems: InventoryItem[] = [];
  inventory.items.forEach(item => {
    if (!item || !item.name) return;
    const key = `${item.name}|${item.rarity}`;
    if (itemMap.has(key)) {
      itemMap.get(key)!.count += item.count;
    } else {
      itemMap.set(key, item);
      uniqueItems.push(item);
    }
  });
  inventory.items = uniqueItems;
}

export function addItem(name: string, rarity: ItemRarity, amount: number = 1): void {
  if (amount <= 0) return;
  const key = `${name}|${rarity}`;
  _pendingUpdates.set(key, (_pendingUpdates.get(key) || 0) + amount);
}

export function flushInventoryUpdates(): void {
  if (_pendingUpdates.size === 0) return;
  if (itemMap.size === 0 && inventory.items.length > 0) rebuildInventoryMap();

  _pendingUpdates.forEach((delta, key) => {
    if (itemMap.has(key)) {
      itemMap.get(key)!.count += delta;
    } else {
      const [name, rarity] = key.split('|') as [string, ItemRarity];
      const newItem: InventoryItem = {
        id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        name,
        rarity,
        count: delta
      };
      inventory.items.push(newItem);
      itemMap.set(key, newItem);
    }
  });

  _pendingUpdates.clear();
}
