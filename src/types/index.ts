import type { Timestamp } from 'firebase/firestore';
import type { Rarity } from '@/lib/data';

export type DogEntry = {
    id: string;
    photoUrl: string;
    breedName: string;
    confidence: number;
    capturedAt: Timestamp;
    name?: string;
    notes?: string;
    favorite: boolean;
    rarity: Rarity;
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
};

export type Achievement = {
    id: string;
    title: string;
    description: string;
    target: number;
    unlocked: boolean;
    progress: number;
    unlockedAt: Timestamp | null;
    metric: 'totalCaptures' | 'uniqueBreedsCount' | 'rareCaptures';
};
