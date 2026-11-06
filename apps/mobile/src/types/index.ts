import type { Timestamp } from 'firebase/firestore';
import type { Rarity, AchievementMetric } from '@/lib/data';

export type DogEntry = {
  id: string;
  photoUrl: string;
  breedName: string;
  confidence: number;
  capturedAt: Timestamp | Date;
  name?: string;
  notes?: string;
  favorite: boolean;
  rarity: Rarity;
  isMixed?: boolean;
  location?: { lat: number; lng: number };
  aiProvider: string;
  aiCandidates?: string[];
};

export type UserProfile = {
  uid: string;
  createdAt: Timestamp;
  authProvider: 'anonymous' | 'email' | 'google';
  level: number;
  xp: number;
  totalCaptures: number;
  uniqueBreedsCount: number;
  trainerName?: string;
  trainerNameLower?: string;
  trainerNameSetAt?: Timestamp;
};

export type AchievementDoc = {
  id: string;
  target: number;
  unlocked: boolean;
  progress: number;
  unlockedAt: Timestamp | Date | null;
  metric: AchievementMetric;
};

export type PublicProfile = {
  uid: string;
  trainerName: string;
  level: number;
  xp: number;
  totalCaptures: number;
  uniqueBreedsCount: number;
};

export type IdentifyResult = {
  breedName: string;
  isMixed: boolean;
  confidence: number;
  rarity: Rarity;
  candidateBreeds: string[];
};
