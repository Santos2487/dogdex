import Constants from 'expo-constants';

import { auth } from '@/lib/firebase';
import type { IdentifyResult } from '@/types';

/** Resolve an API route URL. Web is same-origin; native needs an absolute URL. */
export function apiUrl(path: string): string {
  const base = process.env.EXPO_PUBLIC_API_URL;
  if (base) return base.replace(/\/$/, '') + path;
  if (process.env.EXPO_OS === 'web') return path;
  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.10:8081" in development
  if (hostUri) return `http://${hostUri}${path}`;
  throw new Error('EXPO_PUBLIC_API_URL is not set');
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function identifyDog(imageBase64: string, mimeType = 'image/jpeg'): Promise<IdentifyResult> {
  const user = auth.currentUser;
  if (!user) throw new ApiError(401, 'Not signed in');
  const token = await user.getIdToken();
  const res = await fetch(apiUrl('/api/identify'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ imageBase64, mimeType }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json.error || `Request failed (${res.status})`);
  return json as IdentifyResult;
}
