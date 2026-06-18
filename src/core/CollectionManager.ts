/**
 * Collection Manager Module
 * Manages player panda collection and search
 */

import { PandaType } from './FusionEngine';

export class CollectionManager {
  private collection: PandaType[] = [];

  addOrIncrement(panda: PandaType): void {
    const existing = this.collection.find(p => p.id === panda.id);
    if (existing && existing.count !== undefined) {
      existing.count++;
    } else {
      this.collection.push({ ...panda, count: 1 });
    }
  }

  search(filters: Record<string, any>): PandaType[] {
    return this.collection.filter(panda => {
      for (const [key, value] of Object.entries(filters)) {
        if (panda[key as keyof PandaType] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  getAll(): PandaType[] {
    return [...this.collection];
  }

  getTotalPower(): number {
    return this.collection.reduce((sum, p) => sum + (p.power || 0), 0);
  }
}
