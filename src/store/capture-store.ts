import { create } from 'zustand';

type CaptureState = {
  photoDataUri: string | null;
  breedName: string | null;
  confidence: number | null;
  rarity: 'Common' | 'Uncommon' | 'Rare' | null;
  isMixed: boolean | null; // 👈 NUEVO

  setCaptureData: (data: {
    photoDataUri: string;
    breedName: string;
    confidence: number;
    rarity: 'Common' | 'Uncommon' | 'Rare';
    isMixed: boolean;
  }) => void;

  clearCaptureData: () => void;
};

const useCaptureStore = create<CaptureState>((set) => ({
  photoDataUri: null,
  breedName: null,
  confidence: null,
  rarity: null,
  isMixed: null, // 👈 NUEVO

  setCaptureData: ({ photoDataUri, breedName, confidence, rarity, isMixed }) =>
    set({
      photoDataUri,
      breedName,
      confidence,
      rarity,
      isMixed, // 👈 NUEVO
    }),

  clearCaptureData: () =>
    set({
      photoDataUri: null,
      breedName: null,
      confidence: null,
      rarity: null,
      isMixed: null, // 👈 NUEVO
    }),
}));

export default useCaptureStore;