'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { DogEntry } from '@/types';
import Balancer from 'react-wrap-balancer';

type DogCardProps = {
    entry: DogEntry;
};

export default function DogCard({ entry }: DogCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.03 }}
        >
            <Link href={`/entry/${entry.id}`} passHref>
                <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                    <CardContent className="p-0">
                        <div className="relative aspect-square w-full">
                            <Image
                                src={entry.photoUrl}
                                alt={entry.name || entry.breedName}
                                layout="fill"
                                objectFit="cover"
                                className="transition-transform duration-300 group-hover:scale-105"
                                sizes="(max-width: 768px) 50vw, 33vw"
                            />
                            {entry.favorite && (
                                <div className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/80 backdrop-blur-sm">
                                    <Star className="h-5 w-5 fill-primary-foreground text-primary-foreground" />
                                </div>
                            )}
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold truncate text-lg">
                                <Balancer>{entry.name || entry.breedName}</Balancer>
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">{entry.name ? entry.breedName : ' '}</p>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </motion.div>
    );
}
