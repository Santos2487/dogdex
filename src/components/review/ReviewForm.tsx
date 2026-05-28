'use client';

import { useRouter } from 'next/navigation';
import useCaptureStore from '@/store/capture-store';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getRarityFromBreed, getLevelFromXp, initialAchievements } from '@/lib/data';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { motion } from 'framer-motion';
import useLanguageStore from '@/store/language-store';
import { translateBreed } from '@/lib/breed-translations';

import { db, storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
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
  const { language } = useLanguageStore();

  const {
    photoDataUri,
    breedName,
    confidence,
    rarity: aiRarity,
    isMixed,
    candidateBreeds,
  } = useCaptureStore();

  const aiCandidateBreeds = candidateBreeds || [];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revealData, setRevealData] = useState<any>(null);
  const [isContinuing, setIsContinuing] = useState(false);

  const t = {
    reviewCapture: language === 'es' ? 'Revisar captura' : 'Review Capture',
    aiConfidence: language === 'es' ? 'Confianza IA' : 'AI Confidence',
    rarity: language === 'es' ? 'Rareza' : 'Rarity',
    breed: language === 'es' ? 'Raza' : 'Breed',
    nickname: language === 'es' ? 'Apodo' : 'Nickname',
    notes: language === 'es' ? 'Notas' : 'Notes',
    favorite: language === 'es' ? 'Favorito' : 'Favorite',
    save: language === 'es' ? 'Guardar captura' : 'Save Capture',
    continue: language === 'es' ? 'Continuar' : 'Continue',
    loading: language === 'es' ? 'Cargando colección...' : 'Loading collection...',
    newBreed: language === 'es' ? '✨ ¡Nueva raza!' : '✨ New Breed!',
    captured: language === 'es' ? '📸 ¡Capturado!' : '📸 Captured!',
    nicknamePlaceholder: language === 'es' ? 'Ej: Buddy' : 'e.g., Buddy',
    notesPlaceholder:
      language === 'es'
        ? 'Ej: Muy amigable en el parque'
        : 'e.g., Very friendly dog at the park',
    common: language === 'es' ? 'Común' : 'Common',
    uncommon: language === 'es' ? 'Poco común' : 'Uncommon',
    rare: language === 'es' ? 'Raro' : 'Rare',
    alternatives:
      language === 'es'
        ? 'Posibles alternativas'
        : 'Possible alternatives',
  };

  const getRarityLabel = (rarity: string) => {
    if (rarity === 'Common') return t.common;
    if (rarity === 'Uncommon') return t.uncommon;
    return t.rare;
  };

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

      const storageRef = ref(
        storage,
        `users/${user.uid}/entries/${entryId}.jpg`
      );

      await uploadString(storageRef, photoDataUri, 'data_url');
      const photoUrl = await getDownloadURL(storageRef);

      const entriesRef = collection(db, 'users', user.uid, 'entries');

      const existingBreedDocs = await getDocs(
        query(entriesRef, where('breedName', '==', data.breedName))
      );

      const rareCapturesSnapshot = await getDocs(
        query(entriesRef, where('rarity', 'in', ['Uncommon', 'Rare']))
      );

      const achievementsRef = collection(
        db,
        'users',
        user.uid,
        'achievements'
      );

      const achievementsSnapshot = await getDocs(query(achievementsRef));

      const achievements = achievementsSnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as any[];

      const isNewBreed = existingBreedDocs.empty;
      const isRare = finalRarity !== 'Common';

      let xpGained = 1;
      if (isNewBreed) xpGained += 2;
      if (finalRarity === 'Rare') xpGained += 1;

      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          throw new Error('User profile not found.');
        }

        const userData = userDoc.data();

        const currentXp = userData.xp || 0;
        const currentTotalCaptures = userData.totalCaptures || 0;
        const currentUniqueBreedsCount = userData.uniqueBreedsCount || 0;

        const newXp = currentXp + xpGained;
        const newTotalCaptures = currentTotalCaptures + 1;
        const newUniqueBreedsCount = isNewBreed
          ? currentUniqueBreedsCount + 1
          : currentUniqueBreedsCount;

        const newLevel = getLevelFromXp(newXp).level;

        const entryRef = doc(
          db,
          'users',
          user.uid,
          'entries',
          entryId
        );

        transaction.set(entryRef, {
          photoUrl,
          ...data,
          rarity: finalRarity,
          isMixed: isMixed || false,
          confidence,
          candidateBreeds: aiCandidateBreeds,
          capturedAt: new Date(),
          userId: user.uid,
          aiProvider: 'gemini',
        });

        const newRareCapturesCount =
          rareCapturesSnapshot.size + (finalRarity !== 'Common' ? 1 : 0);

        for (const achDef of initialAchievements) {
          const achievement = achievements.find((a) => a.id === achDef.id);

          if (achievement && !achievement.unlocked) {
            let currentProgress = 0;

            if (achDef.metric === 'totalCaptures') {
              currentProgress = newTotalCaptures;
            }

            if (achDef.metric === 'uniqueBreedsCount') {
              currentProgress = newUniqueBreedsCount;
            }

            if (achDef.metric === 'rareCaptures') {
              currentProgress = newRareCapturesCount;
            }

            const achRef = doc(
              db,
              'users',
              user.uid,
              'achievements',
              achDef.id
            );

            if (currentProgress >= achDef.target) {
              transaction.update(achRef, {
                progress: currentProgress,
                unlocked: true,
                unlockedAt: new Date(),
              });
            } else {
              transaction.update(achRef, {
                progress: currentProgress,
              });
            }
          }
        }

        transaction.update(userRef, {
          xp: newXp,
          level: newLevel,
          totalCaptures: newTotalCaptures,
          uniqueBreedsCount: newUniqueBreedsCount,
        });
      });

      setRevealData({
        breed: data.breedName,
        rarity: finalRarity,
        isMixed,
        meta: {
          isNewBreed,
          isRare,
          xpGained,
        },
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: e?.message || 'Upload failed.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (revealData) {
    const { breed, rarity, meta, isMixed } = revealData;

    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center space-y-6 p-8 rounded-xl border shadow-xl"
        >
          <div className="text-4xl font-bold">
            {meta?.isNewBreed ? t.newBreed : t.captured}
          </div>

          <div className="text-2xl font-semibold">
            {translateBreed(breed, language)} {isMixed ? '(Mix)' : ''}
          </div>

          <Badge>
            <Gem className="mr-2 h-4 w-4" />
            {getRarityLabel(rarity)}
          </Badge>

          <div className="text-lg text-muted-foreground">
            +{meta?.xpGained || 1} XP
          </div>

          <Button
            size="lg"
            disabled={isContinuing}
            onClick={() => {
              setIsContinuing(true);
              router.replace('/collection');
            }}
          >
            {isContinuing ? t.loading : t.continue}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>{t.reviewCapture}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {photoDataUri && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                <Image
                  src={photoDataUri}
                  alt="Dog"
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {t.aiConfidence}
              </span>
              <span className="font-bold">
                {((confidence || 0) * 100).toFixed(0)}%
              </span>
            </div>

            <div className="flex justify-between items-center p-3 border rounded-lg">
              <span className="flex items-center gap-2">
                <Gem className="h-4 w-4" />
                {t.rarity}
              </span>
              <Badge>{getRarityLabel(finalRarity)}</Badge>
            </div>

            {aiCandidateBreeds.length > 0 && (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {t.alternatives}
                </div>

                <div className="space-y-3">
                  {aiCandidateBreeds.map((candidate, index) => (
                    <div key={`${candidate.breed}-${index}`} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          {translateBreed(candidate.breed, language)}
                        </span>

                        <span className="font-medium">
                          {(candidate.confidence * 100).toFixed(0)}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{
                            width: `${Math.min(candidate.confidence * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="breedName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.breed}</FormLabel>
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
                  <FormLabel>{t.nickname}</FormLabel>
                  <Input placeholder={t.nicknamePlaceholder} {...field} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.notes}</FormLabel>
                  <Textarea placeholder={t.notesPlaceholder} {...field} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="favorite"
              render={({ field }) => (
                <FormItem className="flex justify-between items-center border p-4 rounded-lg">
                  <FormLabel>{t.favorite}</FormLabel>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter>
            <Button className="w-full" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t.save}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}