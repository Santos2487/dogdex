export const breedTranslations: Record<string, string> = {
  'English Bulldog': 'Bulldog inglés',
  'German Shepherd': 'Pastor alemán',
  'Golden Retriever': 'Golden Retriever',
  'Labrador Retriever': 'Labrador Retriever',
  'French Bulldog': 'Bulldog francés',
  'Poodle': 'Caniche',
  'Beagle': 'Beagle',
  'Rottweiler': 'Rottweiler',
  'Chihuahua': 'Chihuahua',
  'Boxer': 'Bóxer',
  'Mixed Breed': 'Mestizo',
};

export function translateBreed(
  breed: string,
  language: 'en' | 'es'
) {
  if (language === 'en') return breed;

  return breedTranslations[breed] || breed;
}