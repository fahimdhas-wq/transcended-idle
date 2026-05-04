export const inventory = $state({
  items: [], // Array of { id, name, rarity, count }
});

// Private map for fast lookups, synced with inventory.items
let itemMap = new Map();

/**
 * Rebuilds the internal lookup map from the items array.
 * Also deduplicates the array to fix legacy bloating bugs.
 */
export function rebuildInventoryMap() {
  itemMap = new Map();
  const uniqueItems = [];

  inventory.items.forEach(item => {
    if (!item || !item.name) return;
    const key = `${item.name}|${item.rarity}`;
    
    if (itemMap.has(key)) {
      // Deduplicate: merge count into existing entry
      itemMap.get(key).count += item.count;
    } else {
      itemMap.set(key, item);
      uniqueItems.push(item);
    }
  });

  // Update the reactive array with deduplicated items
  inventory.items = uniqueItems;
}

export function addItem(name, rarity, amount = 1) {
  if (amount <= 0) return;
  
  const key = `${name}|${rarity}`;
  
  // If map is empty but array isn't, we need to rebuild (safety for hot-reloads/loading)
  if (itemMap.size === 0 && inventory.items.length > 0) {
    rebuildInventoryMap();
  }

  if (itemMap.has(key)) {
    itemMap.get(key).count += amount;
  } else {
    const newItem = {
      id: Date.now() + Math.random(),
      name,
      rarity,
      count: amount
    };
    inventory.items.push(newItem);
    itemMap.set(key, newItem);
  }
}
