import { create } from 'zustand';

type CandidateBreed = {
  breed: string;
  confidence: number;
};

interface CaptureState {
  photoDataUri: string | null;

  breedName: string | null;

  confidence: number | null;

  rarity: 'Common' | 'Uncommon' | 'Rare' | null;

  isMixed: boolean;

  candidateBreeds: CandidateBreed[];

  setCaptureData: (data: {
    photoDataUri: string;
    breedName: string;
    confidence: number;
    rarity: 'Common' | 'Uncommon' | 'Rare';
    isMixed: boolean;
    candidateBreeds?: CandidateBreed[];
  }) => void;

  clearCapture: () => void;
}

const useCaptureStore = create<CaptureState>((set) => ({
  photoDataUri: null,

  breedName: null,

  confidence: null,

  rarity: null,

  isMixed: false,

  candidateBreeds: [],

  setCaptureData: ({
    photoDataUri,
    breedName,
    confidence,
    rarity,
    isMixed,
    candidateBreeds = [],
  }) =>
    set({
      photoDataUri,
      breedName,
      confidence,
      rarity,
      isMixed,
      candidateBreeds,
    }),

  clearCapture: () =>
    set({
      photoDataUri: null,
      breedName: null,
      confidence: null,
      rarity: null,
      isMixed: false,
      candidateBreeds: [],
    }),
}));

export default useCaptureStore;