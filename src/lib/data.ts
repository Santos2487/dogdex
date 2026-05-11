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

export const breedRarityMap: Record<string, Rarity> = {
  // Common
  "Labrador Retriever": "Common",
  "Golden Retriever": "Common",
  "German Shepherd": "Common",
  "French Bulldog": "Common",
  "Bulldog": "Common",
  "Poodle": "Common",
  "Beagle": "Common",
  "Chihuahua": "Common",
  "Yorkshire Terrier": "Common",
  "Dachshund": "Common",

  // Uncommon
  "Rottweiler": "Uncommon",
  "German Shorthaired Pointer": "Uncommon",
  "Pembroke Welsh Corgi": "Uncommon",
  "Australian Shepherd": "Uncommon",
  "Siberian Husky": "Uncommon",
  "Boxer": "Uncommon",
  "Great Dane": "Uncommon",
  "Pomeranian": "Uncommon",
  "Doberman Pinscher": "Uncommon",
  "Shih Tzu": "Uncommon",
  "Boston Terrier": "Uncommon",
  "Maltese": "Uncommon",
  "Border Collie": "Uncommon",
  "Basset Hound": "Uncommon",

  // Rare
  "Shetland Sheepdog": "Rare",
  "Bernese Mountain Dog": "Rare",
  "Havanese": "Rare",
  "Cane Corso": "Rare",
  "Shiba Inu": "Rare",
  "Akita": "Rare",
};

export function getRarityFromBreed(breedName: string): Rarity {
  return breedRarityMap[breedName] || "Common";
}

export type InitialAchievement = Omit<
  AchievementType,
  'unlockedAt' | 'progress' | 'unlocked'
> & {
  icon: React.ElementType;
};

export const initialAchievements = [
  {
    id: 'first_capture',

    name: {
      en: 'First Capture',
      es: 'Primera captura',
    },

    description: {
      en: 'Capture your first dog',
      es: 'Captura tu primer perro',
    },

    icon: 'PawPrint',
    requiredCount: 1,
  },

  {
    id: 'collector_10',

    name: {
      en: 'Collector',
      es: 'Coleccionista',
    },

    description: {
      en: 'Capture 10 unique breeds',
      es: 'Captura 10 razas únicas',
    },

    icon: 'Archive',
    requiredCount: 10,
  },

  {
    id: 'collector_25',

    name: {
      en: 'DogDex Expert',
      es: 'Experto DogDex',
    },

    description: {
      en: 'Capture 25 unique breeds',
      es: 'Captura 25 razas únicas',
    },

    icon: 'ShieldCheck',
    requiredCount: 25,
  },

  {
    id: 'rare_hunter',

    name: {
      en: 'Rare Hunter',
      es: 'Cazador de rarezas',
    },

    description: {
      en: 'Capture 5 rare dogs',
      es: 'Captura 5 perros raros',
    },

    icon: 'Gem',
    requiredCount: 5,
  },

  {
    id: 'favorites_master',

    name: {
      en: 'Favorites Master',
      es: 'Maestro de favoritos',
    },

    description: {
      en: 'Mark 10 captures as favorite',
      es: 'Marca 10 capturas como favoritas',
    },

    icon: 'Heart',
    requiredCount: 10,
  },

  {
    id: 'mix_explorer',

    name: {
      en: 'Mix Explorer',
      es: 'Explorador mestizo',
    },

    description: {
      en: 'Capture 5 mixed dogs',
      es: 'Captura 5 perros mestizos',
    },

    icon: 'Sparkles',
    requiredCount: 5,
  },
];

export const getLevelFromXp = (xp: number) => {
  let level = 1;
  let requiredXp = 10;

  while (xp >= requiredXp) {
    xp -= requiredXp;
    level++;
    requiredXp = 10 * level;
  }

  return {
    level,
    progress: xp,
    requiredXpForNextLevel: requiredXp,
  };
};