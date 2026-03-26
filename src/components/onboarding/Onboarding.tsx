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

interface OnboardingProps {
  onComplete: () => void;
}

const onboardingSteps = [
  {
    icon: PawPrint,
    title: 'Collect Unique Dog Breeds',
    description: 'Explore the world and find different dog breeds. Each one you find gets added to your personal DogExplorer collection.',
    image: PlaceHolderImages.find((img) => img.id === 'onboarding-1'),
  },
  {
    icon: Camera,
    title: 'Automatic AI Recognition',
    description: 'Just take a photo of a dog, and our smart AI will automatically identify its breed for you in seconds.',
    image: PlaceHolderImages.find((img) => img.id === 'onboarding-2'),
  },
  {
    icon: Award,
    title: 'Track Your Progress',
    description: 'Level up, earn badges for your discoveries, and see fun stats about your collection. Your journey is private and secure.',
    image: PlaceHolderImages.find((img) => img.id === 'onboarding-3'),
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6">
       <div className="flex items-center gap-2 mb-8">
          <PawPrint className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">DogExplorer</h1>
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
                      {step.title}
                    </h2>
                    <p className="text-muted-foreground">
                      {step.description}
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
        Start Collecting
      </Button>
    </main>
  );
}
