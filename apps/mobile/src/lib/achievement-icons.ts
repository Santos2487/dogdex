import { Award, Bone, Gem, Star, Target, type LucideIcon } from 'lucide-react-native';

import type { AchievementIcon } from '@/lib/data';

export const achievementIcons: Record<AchievementIcon, LucideIcon> = { bone: Bone, award: Award, target: Target, star: Star, gem: Gem };
