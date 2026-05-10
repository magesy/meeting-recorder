import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Recording {
  id: string;
  title: string;
  date: string;
  duration: number; // seconds
  transcript: string | null;
  mom: string | null;
  uri: string | null;
}

const KEY = 'recordings';

export const StorageService = {
  async getAll(): Promise<Recording[]> {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  },

  async save(recording: Recording): Promise<void> {
    const all = await StorageService.getAll();
    const updated = [recording, ...all.filter(r => r.id !== recording.id)];
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  },

  async delete(id: string): Promise<void> {
    const all = await StorageService.getAll();
    await AsyncStorage.setItem(KEY, JSON.stringify(all.filter(r => r.id !== id)));
  },
};
