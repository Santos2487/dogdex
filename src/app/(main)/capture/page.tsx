'use client';

import { Camera } from 'lucide-react';
import ImageUploader from '@/components/capture/ImageUploader';
import Balancer from 'react-wrap-balancer';
import useLanguageStore from '@/store/language-store';

export default function CapturePage() {
  const { language } = useLanguageStore();

  return (
    <div className="container mx-auto flex max-w-2xl flex-col items-center p-4 text-center">
      <div className="mb-8 flex flex-col items-center">
        <Camera className="mb-4 h-12 w-12 text-primary" />

        <h1 className="text-4xl font-bold font-headline text-foreground">
          <Balancer>
            {language === 'es'
              ? 'Captura un perro'
              : 'Capture a Dog'}
          </Balancer>
        </h1>

        <p className="mt-2 max-w-md text-lg text-muted-foreground">
          <Balancer>
            {language === 'es'
              ? 'Usa tu cámara o sube una imagen para que nuestra IA identifique la raza del perro.'
              : 'Use your camera or upload a file to have our AI identify a dog breed.'}
          </Balancer>
        </p>
      </div>

      <ImageUploader />
    </div>
  );
}