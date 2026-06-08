import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = 'user_id';
const GAME_MODE_KEY = 'game_mode';

function localAvatarKey(userId: string): string {
  return `local_avatar_${userId}`;
}

export type GameMode = 'real' | 'character';

export async function getStoredUserId(): Promise<string | null> {
  return AsyncStorage.getItem(USER_ID_KEY);
}

export async function setStoredUserId(userId: string): Promise<void> {
  await AsyncStorage.setItem(USER_ID_KEY, userId);
}

export async function clearStoredUserId(): Promise<void> {
  await AsyncStorage.removeItem(USER_ID_KEY);
}

export async function getGameMode(): Promise<GameMode | null> {
  const value = await AsyncStorage.getItem(GAME_MODE_KEY);
  if (value === 'real' || value === 'character') return value;
  return null;
}

export async function setGameMode(mode: GameMode): Promise<void> {
  await AsyncStorage.setItem(GAME_MODE_KEY, mode);
}

export async function getLocalAvatar(userId: string): Promise<string | null> {
  return AsyncStorage.getItem(localAvatarKey(userId));
}

export async function setLocalAvatar(userId: string, uri: string): Promise<void> {
  await AsyncStorage.setItem(localAvatarKey(userId), uri);
}

