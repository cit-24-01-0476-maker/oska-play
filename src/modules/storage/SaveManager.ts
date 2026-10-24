import { SaveMetadata } from '../../types/game';

const DB_NAME = 'oska_play_saves';
const DB_VERSION = 1;
const STORE_NAME = 'game_saves';

export interface StoredSave {
  key: string; // `${gameId}:${slotId}`
  gameId: string;
  slotId: string;
  timestamp: number;
  saveName: string;
  data: Uint8Array | string;
}

export class SaveManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    if (typeof indexedDB === 'undefined') {
      return Promise.reject(new Error('IndexedDB is not supported in this environment'));
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('gameId', 'gameId', { unique: false });
        }
      };
    });

    return this.dbPromise;
  }

  public async saveGame(
    gameId: string,
    slotId: string,
    saveName: string,
    data: Uint8Array | string
  ): Promise<SaveMetadata> {
    const db = await this.getDB();
    const key = `${gameId}:${slotId}`;
    const timestamp = Date.now();
    const dataSize = typeof data === 'string' ? new Blob([data]).size : data.byteLength;

    const record: StoredSave = {
      key,
      gameId,
      slotId,
      timestamp,
      saveName,
      data,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => {
        resolve({
          gameId,
          slotId,
          timestamp,
          saveName,
          dataSizeBytes: dataSize,
        });
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async loadGame(gameId: string, slotId: string): Promise<StoredSave | null> {
    const db = await this.getDB();
    const key = `${gameId}:${slotId}`;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  public async listSavesForGame(gameId: string): Promise<SaveMetadata[]> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('gameId');
      const req = index.getAll(gameId);
      req.onsuccess = () => {
        const results: StoredSave[] = req.result || [];
        const metadata: SaveMetadata[] = results.map((r) => ({
          gameId: r.gameId,
          slotId: r.slotId,
          timestamp: r.timestamp,
          saveName: r.saveName,
          dataSizeBytes: typeof r.data === 'string' ? r.data.length : r.data.byteLength,
        }));
        resolve(metadata.sort((a, b) => b.timestamp - a.timestamp));
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async deleteSave(gameId: string, slotId: string): Promise<boolean> {
    const db = await this.getDB();
    const key = `${gameId}:${slotId}`;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  public async exportSaveJson(gameId: string, slotId: string): Promise<string> {
    const save = await this.loadGame(gameId, slotId);
    if (!save) throw new Error(`Save ${slotId} not found for game ${gameId}`);

    let exportableData: string;
    if (typeof save.data === 'string') {
      exportableData = save.data;
    } else {
      // Uint8Array to base64
      let binary = '';
      const bytes = new Uint8Array(save.data);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      exportableData = btoa(binary);
    }

    return JSON.stringify({
      version: 1,
      gameId: save.gameId,
      slotId: save.slotId,
      timestamp: save.timestamp,
      saveName: save.saveName,
      isBase64: typeof save.data !== 'string',
      payload: exportableData,
    }, null, 2);
  }

  public async importSaveJson(jsonString: string): Promise<SaveMetadata> {
    const parsed = JSON.parse(jsonString);
    if (!parsed.gameId || !parsed.slotId || !parsed.payload) {
      throw new Error('Invalid save package format');
    }

    let rawData: Uint8Array | string;
    if (parsed.isBase64) {
      const binaryString = atob(parsed.payload);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      rawData = bytes;
    } else {
      rawData = parsed.payload;
    }

    return this.saveGame(
      parsed.gameId,
      parsed.slotId,
      parsed.saveName || `Imported Save (${new Date().toLocaleDateString()})`,
      rawData
    );
  }
}

export const saveManager = new SaveManager();
