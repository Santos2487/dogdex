import { Award, Bone, Star, Gem, Target } from "lucide-react";
import type { Achievement as AchievementType } from '@/types';

export const dogBreeds = [
  "Labrador Retriever", "German Shepherd", "Golden Retriever", "French Bulldog",
  "Bulldog", "Poodle", "Beagle", "Rottweiler", "German Shorthaired Pointer",
  "Dachshund", "Pembroke Welsh Corgi", "Australian Shepherd", "Yorkshire Terrier",
  "Siberian Husky", "Boxer", "Great Dane", "Pomeranian", "Doberman Pinscher",
  "Shih Tzu", "Shetland Sheepdog", "Boston Terrier", "Bernese Mountain Dog",
  "Havanese", "Cane Corso", "Maltese", "Chihuahua", "Border Collie",
  "Basset Hound", "Shiba Inu", "Akita"
].sort();

export const rarities = ['Common', 'Uncommon', 'Rare'] as const;
export type Rarity = (typeof rarities)[number];

export type InitialAchievement = Omit<AchievementType, 'unlockedAt' | 'progress' | 'unlocked'> & {
    icon: React.ElementType;
};

export const initialAchievements: InitialAchievement[] = [
  {
    id: 'first-capture',
    title: 'First Capture!',
    description: 'You\'ve collected your first dog.',
    target: 1,
    metric: 'totalCaptures',
    icon: Bone,
  },
  {
    id: 'five-unique',
    title: 'Pack Starter',
    description: 'Collect 5 unique dog breeds.',
    target: 5,
    metric: 'uniqueBreedsCount',
    icon: Target,
  },
  {
    id: 'ten-unique',
    title: 'Breed Enthusiast',
    description: 'Collect 10 unique dog breeds.',
    target: 10,
    metric: 'uniqueBreedsCount',
    icon: Target,
  },
    {
    id: 'twenty-unique',
    title: 'Breed Expert',
    description: 'Collect 20 unique dog breeds.',
    target: 20,
    metric: 'uniqueBreedsCount',
    icon: Award,
  },
  {
    id: 'first-rare',
    title: 'Lucky Find',
    description: 'Capture your first rare dog.',
    target: 1,
    metric: 'rareCaptures',
    icon: Star,
  },
  {
    id: 'five-rare',
    title: 'Gem Hunter',
    description: 'Capture 5 rare dogs.',
    target: 5,
    metric: 'rareCaptures',
    icon: Gem,
  },
];


export const getLevelFromXp = (xp: number) => {
    // Simple exponential curve: level up every 10 * level points
    let level = 1;
    let requiredXp = 10;
    while (xp >= requiredXp) {
        xp -= requiredXp;
        level++;
        requiredXp = 10 * level;
    }
    return { level, progress: xp, requiredXpForNextLevel: requiredXp };
};
