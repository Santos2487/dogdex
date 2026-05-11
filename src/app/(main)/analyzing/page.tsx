'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useCaptureStore from '@/store/capture-store';
import { identifyDogBreed } from '@/ai/flows/identify-dog-breed-from-image';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PawPrint } from 'lucide-react';
import { motion } from 'framer-motion';
import Balancer from 'react-wrap-balancer';
import useLanguageStore from '@/store/language-store';

export default function AnalyzingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useLanguageStore();

  const photoDataUri = useCaptureStore((s) => s.photoDataUri);
  const setCaptureData = useCaptureStore((s) => s.setCaptureData);
  const clearCaptureData = useCaptureStore((s) => s.clearCaptureData);

  const t = {
    analyzing:
      language === 'es' ? 'Analizando...' : 'Analyzing...',

    subtitle:
      language === 'es'
        ? '¡Nuestra IA está olfateando la raza!'
        : 'Our AI is sniffing out the breed!',

    failedTitle:
      language === 'es'
        ? 'Análisis fallido'
        : 'Analysis Failed',

    failedDescription:
      language === 'es'
        ? 'No se pudo identificar el perro. Prueba con otra foto.'
        : 'Could not identify the dog. Please try another photo.',
  };

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
        });

        router.push('/review');
      } catch (error) {
        console.error('AI analysis failed:', error);

        toast({
          title: t.failedTitle,
          description: t.failedDescription,
          variant: 'destructive',
        });

        clearCaptureData();
        router.replace('/capture');
      }
    };

    const timer = setTimeout(analyzeImage, 1500);

    return () => clearTimeout(timer);
  }, [
    photoDataUri,
    router,
    toast,
    setCaptureData,
    clearCaptureData,
    t.failedTitle,
    t.failedDescription,
  ]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <PawPrint className="h-24 w-24 text-primary" />
      </motion.div>

      <h1 className="mt-8 text-3xl font-bold font-headline text-foreground">
        <Balancer>{t.analyzing}</Balancer>
      </h1>

      <p className="mt-2 text-muted-foreground">
        <Balancer>{t.subtitle}</Balancer>
      </p>

      <Loader2 className="mt-8 h-8 w-8 animate-spin text-primary" />
    </div>
  );
}