import AsyncStorage from "@react-native-async-storage/async-storage";
import { IStorage } from "@thrifty/core";

/**
 * React Native implementation of IStorage using AsyncStorage
 */
export const reactNativeStorage: IStorage = {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async multiRemove(keys: string[]): Promise<void> {
    await AsyncStorage.multiRemove(keys);
  }
};
