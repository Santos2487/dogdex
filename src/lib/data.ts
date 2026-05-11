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

type LocalizedText = {
  en: string;
  es: string;
};

export type InitialAchievement = Omit<
  AchievementType,
  'unlockedAt' | 'progress' | 'unlocked' | 'title' | 'description'
> & {
  title: LocalizedText;
  description: LocalizedText;
  icon: React.ElementType;
};

export const initialAchievements: InitialAchievement[] = [
  {
    id: 'first-capture',
    title: {
      en: 'First Capture!',
      es: '¡Primera captura!',
    },
    description: {
      en: "You've collected your first dog.",
      es: 'Has coleccionado tu primer perro.',
    },
    target: 1,
    metric: 'totalCaptures',
    icon: Bone,
  },
  {
    id: 'five-unique',
    title: {
      en: 'Pack Starter',
      es: 'Inicio de manada',
    },
    description: {
      en: 'Collect 5 unique dog breeds.',
      es: 'Colecciona 5 razas de perro únicas.',
    },
    target: 5,
    metric: 'uniqueBreedsCount',
    icon: Target,
  },
  {
    id: 'ten-unique',
    title: {
      en: 'Breed Enthusiast',
      es: 'Entusiasta de razas',
    },
    description: {
      en: 'Collect 10 unique dog breeds.',
      es: 'Colecciona 10 razas de perro únicas.',
    },
    target: 10,
    metric: 'uniqueBreedsCount',
    icon: Target,
  },
  {
    id: 'twenty-unique',
    title: {
      en: 'Breed Expert',
      es: 'Experto en razas',
    },
    description: {
      en: 'Collect 20 unique dog breeds.',
      es: 'Colecciona 20 razas de perro únicas.',
    },
    target: 20,
    metric: 'uniqueBreedsCount',
    icon: Award,
  },
  {
    id: 'first-rare',
    title: {
      en: 'Lucky Find',
      es: 'Hallazgo afortunado',
    },
    description: {
      en: 'Capture your first rare dog.',
      es: 'Captura tu primer perro raro.',
    },
    target: 1,
    metric: 'rareCaptures',
    icon: Star,
  },
  {
    id: 'five-rare',
    title: {
      en: 'Gem Hunter',
      es: 'Cazador de joyas',
    },
    description: {
      en: 'Capture 5 rare dogs.',
      es: 'Captura 5 perros raros.',
    },
    target: 5,
    metric: 'rareCaptures',
    icon: Gem,
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