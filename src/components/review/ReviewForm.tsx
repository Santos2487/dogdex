'use client';

import { useRouter } from 'next/navigation';
import useCaptureStore from '@/store/capture-store';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { dogBreeds, getRarityFromBreed } from '@/lib/data';
import { saveCapture } from '@/app/actions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

import { storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Wand, Gem } from 'lucide-react';
import Balancer from 'react-wrap-balancer';

export const reviewSchema = z.object({
  name: z.string().max(50, 'Name is too long.').optional(),
  breedName: z.string().min(1, 'Breed name is required.'),
  notes: z.string().max(500, 'Notes are too long.').optional(),
  favorite: z.boolean().default(false),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

const LOW_CONFIDENCE_THRESHOLD = 0.7;

export default function ReviewForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { photoDataUri, breedName, confidence, clearCaptureData } = useCaptureStore();
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
  const automaticRarity = getRarityFromBreed(selectedBreed || '');

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

      const dataWithAutomaticRarity = {
        ...data,
        rarity: getRarityFromBreed(data.breedName),
      };

      const result = await saveCapture(user.uid, dataWithAutomaticRarity, photoUrl, confidence);

      if (result.success) {
        toast({
          title: 'Success!',
          description: `${data.breedName} added to your collection.`,
        });
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
        description: e?.message || 'Failed to upload image.',
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
                Here's what our AI found. Review the details and save this good dog to your collection.
              </Balancer>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {photoDataUri && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                <Image src={photoDataUri} alt="Captured dog" fill className="object-cover" />
              </div>
            )}

            {isLowConfidence && (
              <Alert variant="default" className="bg-accent/20 border-accent">
                <Wand className="h-4 w-4 !text-accent-foreground" />
                <AlertTitle className="text-accent-foreground">Low Confidence</AlertTitle>
                <AlertDescription className="text-accent-foreground/80">
                  Our AI wasn't sure about this one. Please select the correct breed below.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">AI Confidence</span>
              </div>
              <span className="font-bold text-lg text-primary">
                {((confidence || 0) * 100).toFixed(0)}%
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Gem className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">Automatic Rarity</span>
              </div>
              <Badge
                variant={
                  automaticRarity === 'Rare'
                    ? 'destructive'
                    : automaticRarity === 'Uncommon'
                    ? 'secondary'
                    : 'default'
                }
              >
                {automaticRarity}
              </Badge>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="breedName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Breed</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a dog breed" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dogBreeds.map((breed) => (
                          <SelectItem key={breed} value={breed}>
                            {breed}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nickname (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Buddy" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Met at the park, very friendly!" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="favorite"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Mark as Favorite</FormLabel>
                      <FormDescription>Favorites are easier to find in your collection.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save to Collection
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}