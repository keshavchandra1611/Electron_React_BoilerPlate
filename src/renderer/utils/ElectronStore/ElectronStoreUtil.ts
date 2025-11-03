export const getWithKey = (key: string): any => {
  return window.electron.electronStore.get(key);
};

export const setWithKey = (key: string, data: any) => {
  window.electron.electronStore.set(key, data);
};

export const deleteWithKey = (key: string) => {
  window.electron.electronStore.delete(key);
};

export const getAllStorage = (): Record<string, any> => {
  return window.electron.electronStore.getAll(); // ✅ added return
};

export const clearAllStorage = () => {
  window.electron.electronStore.clear();
};
