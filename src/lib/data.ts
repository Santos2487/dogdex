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
    id: 'ten-captures',
    title: {
      en: 'Dog Spotter',
      es: 'Avistador canino',
    },
    description: {
      en: 'Capture 10 dogs.',
      es: 'Captura 10 perros.',
    },
    target: 10,
    metric: 'totalCaptures',
    icon: Bone,
  },
  {
    id: 'twenty-five-captures',
    title: {
      en: 'Urban Tracker',
      es: 'Rastreador urbano',
    },
    description: {
      en: 'Capture 25 dogs.',
      es: 'Captura 25 perros.',
    },
    target: 25,
    metric: 'totalCaptures',
    icon: Award,
  },
  {
    id: 'fifty-captures',
    title: {
      en: 'DogDex Veteran',
      es: 'Veterano DogDex',
    },
    description: {
      en: 'Capture 50 dogs.',
      es: 'Captura 50 perros.',
    },
    target: 50,
    metric: 'totalCaptures',
    icon: Award,
  },
  {
    id: 'hundred-captures',
    title: {
      en: 'Legendary Tracker',
      es: 'Rastreador legendario',
    },
    description: {
      en: 'Capture 100 dogs.',
      es: 'Captura 100 perros.',
    },
    target: 100,
    metric: 'totalCaptures',
    icon: Award,
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
    id: 'fifty-unique',
    title: {
      en: 'DogDex Master',
      es: 'Maestro DogDex',
    },
    description: {
      en: 'Collect 50 unique dog breeds.',
      es: 'Colecciona 50 razas de perro únicas.',
    },
    target: 50,
    metric: 'uniqueBreedsCount',
    icon: Award,
  },
  {
    id: 'first-uncommon',
    title: {
      en: 'Uncommon Find',
      es: 'Hallazgo poco común',
    },
    description: {
      en: 'Capture your first uncommon dog.',
      es: 'Captura tu primer perro poco común.',
    },
    target: 1,
    metric: 'uncommonCaptures',
    icon: Star,
  },
  {
    id: 'five-uncommon',
    title: {
      en: 'Uncommon Hunter',
      es: 'Cazador de poco comunes',
    },
    description: {
      en: 'Capture 5 uncommon dogs.',
      es: 'Captura 5 perros poco comunes.',
    },
    target: 5,
    metric: 'uncommonCaptures',
    icon: Gem,
  },
  {
    id: 'ten-uncommon',
    title: {
      en: 'Uncommon Expert',
      es: 'Experto en poco comunes',
    },
    description: {
      en: 'Capture 10 uncommon dogs.',
      es: 'Captura 10 perros poco comunes.',
    },
    target: 10,
    metric: 'uncommonCaptures',
    icon: Gem,
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
  {
    id: 'ten-rare',
    title: {
      en: 'Rare Specialist',
      es: 'Especialista en rarezas',
    },
    description: {
      en: 'Capture 10 rare dogs.',
      es: 'Captura 10 perros raros.',
    },
    target: 10,
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