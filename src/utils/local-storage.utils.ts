import { LocalStorageKeyEnum } from "@reference-data/local-storage-key.enum";

type LocaleStorageObject = Partial<Record<LocalStorageKeyEnum, any>>;

const getValueFromLocalStorage = (key: LocalStorageKeyEnum) => {
  if (window) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }
};

const saveValueInLocalStorage = (
  key: LocalStorageKeyEnum,
  value: any
): void => {
  if (window) {
    const storageValue: LocaleStorageObject = {};
    storageValue[key] = value;
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const clearLocalStorage = () => {
  if (window) {
    localStorage.clear();
  }
};

const removeFromLocalStorage = (key: LocalStorageKeyEnum) => {
  if (window) {
    localStorage.removeItem(key);
  }
};

export const LocalStorageUtils = {
  getValueFromLocalStorage,
  saveValueInLocalStorage,
  clearLocalStorage,
  removeFromLocalStorage,
};
