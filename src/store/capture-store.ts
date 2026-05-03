import { create } from 'zustand';

type Rarity = 'Common' | 'Uncommon' | 'Rare';

type CaptureState = {
  photoDataUri: string | null;
  breedName: string | null;
  confidence: number | null;
  rarity: Rarity | null;
  isMixed: boolean | null;

  setCaptureData: (data: Partial<{
    photoDataUri: string;
    breedName: string;
    confidence: number;
    rarity: Rarity;
    isMixed: boolean;
  }>) => void;

  clearCaptureData: () => void;
};

const useCaptureStore = create<CaptureState>((set) => ({
  photoDataUri: null,
  breedName: null,
  confidence: null,
  rarity: null,
  isMixed: null,

  setCaptureData: (data) =>
    set((state) => ({
      ...state,
      ...data,
    })),

  clearCaptureData: () =>
    set({
      photoDataUri: null,
      breedName: null,
      confidence: null,
      rarity: null,
      isMixed: null,
    }),
}));

export default useCaptureStore;