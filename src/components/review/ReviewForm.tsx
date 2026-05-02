'use client';

import { useRouter } from 'next/navigation';
import useCaptureStore from '@/store/capture-store';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getRarityFromBreed } from '@/lib/data';
import { saveCapture } from '@/app/actions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

import { storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Wand, Gem } from 'lucide-react';
import Balancer from 'react-wrap-balancer';

export const reviewSchema = z.object({
  name: z.string().max(50).optional(),
  breedName: z.string().min(1),
  notes: z.string().max(500).optional(),
  favorite: z.boolean().default(false),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

const LOW_CONFIDENCE_THRESHOLD = 0.7;

export default function ReviewForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    photoDataUri,
    breedName,
    confidence,
    rarity: aiRarity,
    clearCaptureData,
  } = useCaptureStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLowConfidence = confidence === null || confidence < LOW_CONFIDENCE_THRESHOLD;

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      name: '',
      breedName: breedName || '',
      notes: '',
      favorite: false,
    },
  });

  const selectedBreed = form.watch('breedName');

  // IA manda, fallback por si acaso
  const finalRarity = aiRarity || getRarityFromBreed(selectedBreed || '');

  async function onSubmit(data: ReviewFormData) {
    if (!user || !photoDataUri || confidence === null) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Missing required data to save.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const entryId = uuidv4();
      const storageRef = ref(storage, `users/${user.uid}/entries/${entryId}.jpg`);

      await uploadString(storageRef, photoDataUri, 'data_url');
      const photoUrl = await getDownloadURL(storageRef);

      const result = await saveCapture(
        user.uid,
        {
          ...data,
          rarity: finalRarity,
        },
        photoUrl,
        confidence
      );

if (result.success) {
  const meta = result.meta;

  if (meta) {
    if (meta.isNewBreed) {
      toast({
        title: '✨ New Breed Discovered!',
        description: `${data.breedName} added to your DogDex (+${meta.xpGained} XP)`,
      });
    } else if (meta.isRare) {
      toast({
        title: '🔥 Rare Capture!',
        description: `${data.breedName} is uncommon (+${meta.xpGained} XP)`,
      });
    } else {
      toast({
        title: '📸 Captured!',
        description: `${data.breedName} saved (+${meta.xpGained} XP)`,
      });
    }
  } else {
    toast({
      title: 'Saved!',
      description: `${data.breedName} added to your collection.`,
    });
  }

  clearCaptureData();
  router.push('/collection');
} else {
        toast({
          variant: 'destructive',
          title: 'Save Failed',
          description: result.error,
        });
      }
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: e?.message || 'Upload failed.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Analysis Complete</CardTitle>
            <CardDescription>
              <Balancer>
                Review the AI result and save it to your collection.
              </Balancer>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {photoDataUri && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                <Image src={photoDataUri} alt="Dog" fill className="object-cover" />
              </div>
            )}

            {isLowConfidence && (
              <Alert>
                <Wand className="h-4 w-4" />
                <AlertTitle>Low Confidence</AlertTitle>
                <AlertDescription>
                  The AI is not very confident. Please double-check the breed.
                </AlertDescription>
              </Alert>
            )}

            {/* Confidence */}
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Confidence
              </span>
              <span className="font-bold">
                {((confidence || 0) * 100).toFixed(0)}%
              </span>
            </div>

            {/* Rarity */}
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <span className="flex items-center gap-2">
                <Gem className="h-4 w-4" />
                Rarity
              </span>

              <Badge
                variant={
                  finalRarity === 'Rare'
                    ? 'destructive'
                    : finalRarity === 'Uncommon'
                    ? 'secondary'
                    : 'default'
                }
              >
                {finalRarity}
              </Badge>
            </div>

            {/* Breed (INPUT libre 🔥) */}
            <FormField
              control={form.control}
              name="breedName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Breed</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., English Bulldog" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nickname */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nickname</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Buddy" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Very friendly dog" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Favorite */}
            <FormField
              control={form.control}
              name="favorite"
              render={({ field }) => (
                <FormItem className="flex justify-between items-center border p-4 rounded-lg">
                  <FormLabel>Favorite</FormLabel>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter>
            <Button className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
              Save to Collection
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}