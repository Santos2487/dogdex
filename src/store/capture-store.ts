import { create } from 'zustand';

type CaptureState = {
  photoDataUri: string | null;
  breedName: string | null;
  confidence: number | null;
  candidateBreeds: string[] | null;
  setCaptureData: (data: Partial<Omit<CaptureState, 'setCaptureData' | 'clearCaptureData'>>) => void;
  clearCaptureData: () => void;
};

const useCaptureStore = create<CaptureState>((set) => ({
  photoDataUri: null,
  breedName: null,
  confidence: null,
  candidateBreeds: null,
  setCaptureData: (data) => set((state) => ({ ...state, ...data })),
  clearCaptureData: () => set({ 
    photoDataUri: null, 
    breedName: null, 
    confidence: null, 
    candidateBreeds: null 
  }),
}));

export default useCaptureStore;
