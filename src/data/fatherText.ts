import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const textCache = new Map<number, string>();

// Lê o texto de um .md empacotado como asset (Android/iOS via arquivo local, web via fetch)
export async function loadAssetText(moduleId: number): Promise<string> {
  const cached = textCache.get(moduleId);
  if (cached !== undefined) return cached;
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();
  let text: string;
  if (Platform.OS === 'web' || !asset.localUri) {
    const res = await fetch(asset.uri);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    text = await res.text();
  } else {
    text = await FileSystem.readAsStringAsync(asset.localUri);
  }
  textCache.set(moduleId, text);
  return text;
}
