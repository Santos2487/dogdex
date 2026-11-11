import { create } from 'zustand';

import type { Rarity } from '@/lib/data';

/** In-flight capture, shared by capture -> analyzing -> review (same as the web app's store). */
type CaptureState = {
  photoUri: string | null;
  photoBase64: string | null;
  breedName: string | null;
  confidence: number | null;
  rarity: Rarity | null;
  isMixed: boolean | null;
  candidateBreeds: string[];
  setPhoto: (photo: { uri: string; base64: string }) => void;
  setResult: (r: { breedName: string; confidence: number; rarity: Rarity; isMixed: boolean; candidateBreeds: string[] }) => void;
  clear: () => void;
};

const empty = {
  photoUri: null,
  photoBase64: null,
  breedName: null,
  confidence: null,
  rarity: null,
  isMixed: null,
  candidateBreeds: [],
};

export const useCaptureStore = create<CaptureState>((set) => ({
  ...empty,
  setPhoto: ({ uri, base64 }) => set({ ...empty, photoUri: uri, photoBase64: base64 }),
  setResult: (r) => set(r),
  clear: () => set(empty),
}));
