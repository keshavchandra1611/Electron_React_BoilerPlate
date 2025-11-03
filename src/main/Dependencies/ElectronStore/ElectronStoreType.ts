export type ElectronStoreHandler = {
  get: (key: string) => any; // returns whatever electronStore.get(key) returns
  set: (key: string, val: any) => void; // sends value to main
  delete: (key: string) => boolean; // returns true from main
  clear: () => void; // no return value
  getAll: () => any; // returns whatever electronStore.get(key) returns
};
