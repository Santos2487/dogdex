'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useCaptureStore from '@/store/capture-store';
import { identifyDogBreed } from '@/ai/flows/identify-dog-breed-from-image';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PawPrint } from 'lucide-react';
import { motion } from 'framer-motion';
import Balancer from 'react-wrap-balancer';

export default function AnalyzingPage() {
  const router = useRouter();
  const { toast } = useToast();

  const photoDataUri = useCaptureStore((s) => s.photoDataUri);
  const setCaptureData = useCaptureStore((s) => s.setCaptureData);
  const clearCaptureData = useCaptureStore((s) => s.clearCaptureData);

  useEffect(() => {
    if (!photoDataUri) {
      router.replace('/capture');
      return;
    }

    const analyzeImage = async () => {
      try {
        const result = await identifyDogBreed({ photoDataUri });

        setCaptureData({
          breedName: result.breedName,
          confidence: result.confidence,
          rarity: result.rarity,
          isMixed: result.isMixed,
          candidateBreeds: result.candidateBreeds,
        });

        router.push('/review');
      } catch (error) {
        console.error('AI analysis failed:', error);

        toast({
          title: 'Analysis Failed',
          description: 'Could not identify the dog. Please try another photo.',
          variant: 'destructive',
        });

        clearCaptureData();
        router.replace('/capture');
      }
    };

    const timer = setTimeout(analyzeImage, 1500);
    return () => clearTimeout(timer);
  }, [photoDataUri, router, toast, setCaptureData, clearCaptureData]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <PawPrint className="h-24 w-24 text-primary" />
      </motion.div>

      <h1 className="mt-8 text-3xl font-bold font-headline text-foreground">
        <Balancer>Analyzing...</Balancer>
      </h1>

      <p className="mt-2 text-muted-foreground">
        <Balancer>Our AI is sniffing out the breed!</Balancer>
      </p>

      <Loader2 className="mt-8 h-8 w-8 animate-spin text-primary" />
    </div>
  );
}