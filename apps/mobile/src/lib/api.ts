import Constants from 'expo-constants';

import { auth } from '@/lib/firebase';
import type { IdentifyResult } from '@/types';

/** Port of the Next.js dev server (`npm run dev` at the repo root). */
const NEXT_DEV_PORT = 9002;

/**
 * Base URL of the Next.js app that serves /api/identify.
 * Set EXPO_PUBLIC_API_URL for builds (the deployed Next site). In development it falls back
 * to the machine running Metro on the Next dev port, which also works on a physical device.
 */
export function apiBaseUrl(): string {
  const base = process.env.EXPO_PUBLIC_API_URL;
  if (base) return base.replace(/\/$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0]; // e.g. "192.168.1.10:8081"
  if (__DEV__ && host) return `http://${host}:${NEXT_DEV_PORT}`;
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
  const res = await fetch(`${apiBaseUrl()}/api/identify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ imageBase64, mimeType }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json.error || `Request failed (${res.status})`);
  return json as IdentifyResult;
}
