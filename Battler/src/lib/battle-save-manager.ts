import { BattleSession, BattleSaveData } from '@/types/simulation';

const STORAGE_KEY = 'pnw_battle_saves';
const SAVE_VERSION = '1.0.0';

export class BattleSaveManager {
  /**
   * Save a battle session to localStorage
   */
  static saveBattle(session: BattleSession, saveName?: string): boolean {
    try {
      const saves = this.getAllSaves();
      const saveId = saveName || `battle_${session.id}_${Date.now()}`;
      
      const saveData: BattleSaveData = {
        sessionState: {
          id: session.id,
          mode: session.mode,
          settings: session.settings,
          multiplayerSettings: session.multiplayerSettings,
          participants: session.participants,
          currentTurn: session.currentTurn,
          turnTimer: session.turnTimer,
          turnStartTime: session.turnStartTime,
          lastUnitBuyTurn: session.lastUnitBuyTurn,
          isActive: session.isActive,
          winner: session.winner,
          battleHistory: session.battleHistory,
          created_at: session.created_at,
          updated_at: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        version: SAVE_VERSION
      };

      saves[saveId] = saveData;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
      
      return true;
    } catch (error) {
      console.error('Failed to save battle:', error);
      return false;
    }
  }

  /**
   * Load a battle session from localStorage
   */
  static loadBattle(saveId: string): BattleSession | null {
    try {
      const saves = this.getAllSaves();
      const saveData = saves[saveId];
      
      if (!saveData) {
        return null;
      }

      // Validate save version compatibility
      if (!this.isVersionCompatible(saveData.version)) {
        console.warn(`Save version ${saveData.version} is not compatible with current version ${SAVE_VERSION}`);
        return null;
      }

      // Restore the battle session
      const restoredSession: BattleSession = {
        ...saveData.sessionState,
        updated_at: new Date().toISOString()
      };

      return restoredSession;
    } catch (error) {
      console.error('Failed to load battle:', error);
      return null;
    }
  }

  /**
   * Get all saved battles
   */
  static getAllSaves(): Record<string, BattleSaveData> {
    try {
      const savesJson = localStorage.getItem(STORAGE_KEY);
      return savesJson ? JSON.parse(savesJson) : {};
    } catch (error) {
      console.error('Failed to load saves:', error);
      return {};
    }
  }

  /**
   * Get save metadata for display
   */
  static getSaveList(): Array<{
    id: string;
    name: string;
    timestamp: string;
    participants: string[];
    currentTurn: number;
    isActive: boolean;
  }> {
    const saves = this.getAllSaves();
    
    return Object.entries(saves).map(([id, saveData]) => ({
      id,
      name: this.generateSaveName(saveData),
      timestamp: saveData.timestamp,
      participants: saveData.sessionState.participants.map(p => p.nation_name),
      currentTurn: saveData.sessionState.currentTurn,
      isActive: saveData.sessionState.isActive
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Delete a saved battle
   */
  static deleteSave(saveId: string): boolean {
    try {
      const saves = this.getAllSaves();
      delete saves[saveId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
      return true;
    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }

  /**
   * Auto-save current battle progress
   */
  static autoSave(session: BattleSession): boolean {
    const autoSaveId = `autosave_${session.id}`;
    return this.saveBattle(session, autoSaveId);
  }

  /**
   * Get the most recent auto-save for a session
   */
  static getAutoSave(sessionId: string): BattleSession | null {
    const autoSaveId = `autosave_${sessionId}`;
    return this.loadBattle(autoSaveId);
  }

  /**
   * Clear all saves (for testing or cleanup)
   */
  static clearAllSaves(): boolean {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear saves:', error);
      return false;
    }
  }

  /**
   * Export saves as JSON for backup
   */
  static exportSaves(): string {
    const saves = this.getAllSaves();
    return JSON.stringify(saves, null, 2);
  }

  /**
   * Import saves from JSON backup
   */
  static importSaves(savesJson: string): boolean {
    try {
      const importedSaves = JSON.parse(savesJson);
      const currentSaves = this.getAllSaves();
      
      // Merge with current saves (imported saves take precedence)
      const mergedSaves = { ...currentSaves, ...importedSaves };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedSaves));
      return true;
    } catch (error) {
      console.error('Failed to import saves:', error);
      return false;
    }
  }

  /**
   * Check if a save version is compatible with current version
   */
  private static isVersionCompatible(saveVersion: string): boolean {
    // For now, only exact version match is supported
    // In future, we could implement version migration logic
    return saveVersion === SAVE_VERSION;
  }

  /**
   * Generate a human-readable save name
   */
  private static generateSaveName(saveData: BattleSaveData): string {
    const session = saveData.sessionState;
    const participants = session.participants.map(p => p.nation_name).join(' vs ');
    const date = new Date(saveData.timestamp).toLocaleDateString();
    const time = new Date(saveData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `${participants} - Turn ${session.currentTurn} (${date} ${time})`;
  }

  /**
   * Get storage usage information
   */
  static getStorageInfo(): {
    totalSaves: number;
    storageUsed: number;
    availableStorage: number;
  } {
    const saves = this.getAllSaves();
    const savesJson = JSON.stringify(saves);
    const storageUsed = new Blob([savesJson]).size;
    
    // Estimate available localStorage space (most browsers allow ~5-10MB)
    const estimatedLimit = 5 * 1024 * 1024; // 5MB
    
    return {
      totalSaves: Object.keys(saves).length,
      storageUsed,
      availableStorage: Math.max(0, estimatedLimit - storageUsed)
    };
  }
}
