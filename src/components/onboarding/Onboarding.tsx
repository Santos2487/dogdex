'use client';

import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PawPrint, Camera, Award } from 'lucide-react';
import useLanguageStore, { type Language } from '@/store/language-store';

interface OnboardingProps {
  onComplete: () => void;
}

const onboardingSteps = [
  {
    icon: PawPrint,
    title: {
      en: 'Collect Unique Dog Breeds',
      es: 'Colecciona razas únicas',
    },
    description: {
      en: 'Explore the world and find different dog breeds. Each one you find gets added to your personal CanisQuest collection.',
      es: 'Explora el mundo y encuentra distintas razas de perro. Cada una que encuentres se añade a tu colección personal de CanisQuest.',
    },
    image: PlaceHolderImages.find((img) => img.id === 'onboarding-1'),
  },
  {
    icon: Camera,
    title: {
      en: 'Automatic AI Recognition',
      es: 'Reconocimiento automático con IA',
    },
    description: {
      en: 'Just take a photo of a dog, and our smart AI will automatically identify its breed for you in seconds.',
      es: 'Haz una foto a un perro y nuestra IA identificará su raza automáticamente en segundos.',
    },
    image: PlaceHolderImages.find((img) => img.id === 'onboarding-2'),
  },
  {
    icon: Award,
    title: {
      en: 'Track Your Progress',
      es: 'Sigue tu progreso',
    },
    description: {
      en: 'Level up, earn badges for your discoveries, and see fun stats about your collection. Your journey is private and secure.',
      es: 'Sube de nivel, gana insignias por tus descubrimientos y consulta estadísticas de tu colección. Tu aventura es privada y segura.',
    },
    image: PlaceHolderImages.find((img) => img.id === 'onboarding-3'),
  },
];

const languages: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { language, setLanguage } = useLanguageStore();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6">
       <div className="flex items-center gap-2 mb-8">
          <PawPrint className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">CanisQuest</h1>
        </div>
      <div className="mb-6 flex gap-2" role="group" aria-label="Language">
        {languages.map(({ code, label }) => (
          <Button
            key={code}
            size="sm"
            variant={language === code ? 'default' : 'outline'}
            aria-pressed={language === code}
            onClick={() => setLanguage(code)}
          >
            {label}
          </Button>
        ))}
      </div>
      <Carousel className="w-full max-w-md">
        <CarouselContent>
          {onboardingSteps.map((step, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    {step.image && (
                      <Image
                        src={step.image.imageUrl}
                        alt={step.image.description}
                        width={800}
                        height={600}
                        className="mb-6 aspect-video w-full rounded-lg object-cover"
                        data-ai-hint={step.image.imageHint}
                      />
                    )}
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <step.icon className="h-6 w-6" />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold font-headline">
                      {step.title[language]}
                    </h2>
                    <p className="text-muted-foreground">
                      {step.description[language]}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-4" />
        <CarouselNext className="-right-4" />
      </Carousel>
      <Button onClick={onComplete} className="mt-8 w-full max-w-md" size="lg">
        {language === 'es' ? 'Empezar a coleccionar' : 'Start Collecting'}
      </Button>
    </main>
  );
}
