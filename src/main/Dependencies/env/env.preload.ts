import { contextBridge } from 'electron';

export type EnvHandler = {
  get(key: string): string | undefined;
  getAll(): Record<string, string | undefined>;
};

export const envBridge: EnvHandler = {
  get(key) {
    return process.env[key];
  },
  getAll() {
    return {
      KEY_NAME: process.env.KEY_NAME,
      // add more SAFE vars here
    };
  },
};
