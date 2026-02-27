import Store, { Schema } from 'electron-store';
import { app } from 'electron';
import * as path from 'path';

export interface Settings {
  savePath: string;
  activationMode: 'manual' | 'hotkey' | 'auto';
  autoSaveEnabled: boolean;
  globalCtrlVEnabled: boolean;
  saveToActiveExplorer: boolean;
  compressionLevel: number;
  format: 'png' | 'jpg' | 'webp';
}

let storeInstance: Store<Settings> | null = null;

export const getStore = (): Store<Settings> => {
  if (!storeInstance) {
    const schema: Schema<Settings> = {
      savePath: {
        type: 'string',
        default: path.join(app.getPath('pictures'), 'ClipboardPNG'),
      },
      activationMode: {
        type: 'string',
        enum: ['manual', 'hotkey', 'auto'],
        default: 'manual',
      },
      autoSaveEnabled: {
        type: 'boolean',
        default: false,
      },
      globalCtrlVEnabled: {
        type: 'boolean',
        default: true,
      },
      saveToActiveExplorer: {
        type: 'boolean',
        default: true,
      },
      compressionLevel: {
        type: 'number',
        minimum: 0,
        maximum: 9,
        default: 6,
      },
      format: {
        type: 'string',
        enum: ['png', 'jpg', 'webp'],
        default: 'png',
      },
    };
    storeInstance = new Store<Settings>({ schema });
  }
  return storeInstance;
};

// For backward compatibility, lazily initialize and delegate methods
export const store = {
  get: <K extends keyof Settings>(key: K): Settings[K] => getStore().get(key),
  set: <K extends keyof Settings>(key: K, value: Settings[K]): void => getStore().set(key, value),
  get store(): Settings {
    return getStore().store;
  },
} as unknown as Store<Settings>;
