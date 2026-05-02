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
import { motion } from 'framer-motion';

import { storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Gem, Sparkles } from 'lucide-react';

export const reviewSchema = z.object({
  name: z.string().max(50).optional(),
  breedName: z.string().min(1),
  notes: z.string().max(500).optional(),
  favorite: z.boolean().default(false),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

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
  const [revealData, setRevealData] = useState<any>(null);

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
  const finalRarity = aiRarity || getRarityFromBreed(selectedBreed || '');

  async function onSubmit(data: ReviewFormData) {
    if (!user || !photoDataUri || confidence === null) return;

    setIsSubmitting(true);

    try {
      const entryId = uuidv4();
      const storageRef = ref(storage, `users/${user.uid}/entries/${entryId}.jpg`);

      await uploadString(storageRef, photoDataUri, 'data_url');
      const photoUrl = await getDownloadURL(storageRef);

      const result = await saveCapture(
        user.uid,
        { ...data, rarity: finalRarity },
        photoUrl,
        confidence
      );

      if (result.success) {
        setRevealData({
          breed: data.breedName,
          rarity: finalRarity,
          meta: result.meta,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // 🎮 REVEAL SCREEN
  if (revealData) {
    const { breed, rarity, meta } = revealData;
    const isRare = rarity === 'Rare';

    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        {/* confetti simple */}
        {isRare && (
          <div className="absolute inset-0 pointer-events-none text-3xl animate-pulse">
            🎉 🎉 🎉 🎉 🎉 🎉 🎉
          </div>
        )}

        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className={`flex flex-col items-center text-center space-y-6 p-8 rounded-xl border shadow-xl ${
            isRare ? 'shadow-red-500/40' : 'shadow-primary/30'
          }`}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold"
          >
            {meta?.isNewBreed ? '✨ New Breed!' : '📸 Captured!'}
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-semibold"
          >
            {breed}
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Badge
              variant={
                rarity === 'Rare'
                  ? 'destructive'
                  : rarity === 'Uncommon'
                  ? 'secondary'
                  : 'default'
              }
              className="text-lg px-4 py-2"
            >
              <Gem className="mr-2 h-4 w-4" />
              {rarity}
            </Badge>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-muted-foreground"
          >
            +{meta?.xpGained || 1} XP
          </motion.div>

          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              size="lg"
              onClick={() => {
                clearCaptureData();
                router.push('/collection');
              }}
              className="px-8 py-6 text-lg"
            >
              Continue
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Review Capture</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {photoDataUri && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                <Image src={photoDataUri} alt="Dog" fill className="object-cover" />
              </div>
            )}

            {/* AI CONFIDENCE */}
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Confidence
              </span>
              <span className="font-bold">
                {((confidence || 0) * 100).toFixed(0)}%
              </span>
            </div>

            {/* RARITY */}
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <span className="flex items-center gap-2">
                <Gem className="h-4 w-4" />
                Rarity
              </span>
              <Badge>{finalRarity}</Badge>
            </div>

            <FormField
              control={form.control}
              name="breedName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Breed</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nickname</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Buddy" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Very friendly dog at the park" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

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
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Capture
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}