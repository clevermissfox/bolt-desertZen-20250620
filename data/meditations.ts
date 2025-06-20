import { Meditation } from '@/contexts/AudioContext';

export const CATEGORIES = [
  'breathing',
  'sleep',
  'body-scan',
  'anxiety-relief',
  'women',
  'guided-imagery',
];

export const DURATIONS = ['5m', '10m', '15m', '20m', '30m', '45m'];

export const meditations: Meditation[] = [
  {
    id: "1",
    title: "Finding Calm",
    description: "A meditation to help you find your inner peace and breath.",
    category: "breathing",
    length: "5m",
    audioUrl:
      "https://desert-zenmeditations.com/wp-content/uploads/2025/05/5-Minute-Breathing-Meditation-22Finding-Calm22.m4a",
    imageUrl:
      "https://desert-zenmeditations.com/wp-content/uploads/101-Finding-Calm-5m-breathing-1x1-1-1024x1024.webp",
    featured: false,
    createdAt: "2024-05-01",
  },
  {
    id: "2",
    title: "Drifting into Rest",
    description: "A meditation to bring help you find your dreams.",
    category: "sleep",
    length: "15m",
    audioUrl:
      "https://desert-zenmeditations.com/wp-content/uploads/2025/05/15-Minute-Sleep-Meditation-Drifting-into-rest.mp3",
    imageUrl:
      "https://desert-zenmeditations.com/wp-content/uploads/102-Drifting-Into-Rest-15m-sleep-1x1-1-1024x1024.webp",
    featured: false,
    createdAt: "2024-05-02",
  },
  {
    id: "3",
    title: "Coming Home to Your Body",
    description: "A meditation to help you return to your body.",
    category: "body-scan",
    length: "30m",
    audioUrl:
      "https://desert-zenmeditations.com/wp-content/uploads/2025/05/30-Minute-Body-Scan-Meditation-Coming-Home-to-Your-Body.m4a",
    imageUrl:
      "https://desert-zenmeditations.com/wp-content/uploads/103-Coming-Home-to-Your-Body-30m-body-scan-1x1-1-1024x1024.webp",
    featured: false,
    createdAt: "2024-05-03",
  },
  {
    id: "4",
    title: "Inner Awareness",
    description: "A meditation to help soothe anxious thoughts.",
    category: "anxiety-relief",
    length: "15m",
    audioUrl:
      "https://desert-zenmeditations.com/wp-content/uploads/2025/05/Anxiety-Stress-Relief-10-min.m4a",
    imageUrl:
      "https://desert-zenmeditations.com/wp-content/uploads/104-Inner-Awareness-10m-anxiety-relief-1x1-1-1024x1024.webp",
    featured: false,
    createdAt: "2024-05-04",
  },
  {
    id: "5",
    title: "Head to Toe",
    description: "A body scan meditation to bring you back to yourself.",
    category: "body-scan",
    length: "30m",
    audioUrl:
      "https://desert-zenmeditations.com/wp-content/uploads/Body-Scan-Meditation-for-Deep-Relaxation-15-min.m4a",
    imageUrl:
      "https://desert-zenmeditations.com/wp-content/uploads/105-Head-to-Toe-15m-body-scan-1x1-1-1024x1024.webp",
    featured: true,
    createdAt: "2024-05-05",
  },
  {
    id: "6",
    title: "Breathing Through the Loss",
    description: "A meditation for those who have lost.",
    category: "anxiety-relief",
    length: "5m",
    audioUrl:
      "https://desert-zenmeditations.com/wp-content/uploads/Guided-Imagery-Meditation-for-Grief-and-Loss-10-min.m4a",
    imageUrl:
      "https://desert-zenmeditations.com/wp-content/uploads/106-Anchored-in-Sorrow-20m-grief-and-loss-1x1-1-1024x1024.jpg",
    featured: false,
    createdAt: "2024-05-06",
  },
  {
    id: "7",
    title: "A Walk on the Beach",
    description: "A meditation for Women.",
    category: "women",
    length: "10m",
    audioUrl:
      "https://desert-zenmeditations.com/wp-content/uploads/Guided-Imagery-Meditation-A-Walk-on-the-Beach-10-min.m4a",
    imageUrl:
      "https://desert-zenmeditations.com/wp-content/uploads/107-A-Walk-on-the-Beach-10m-women-1x1-1-1024x1024.webp",
    featured: false,
    createdAt: "2024-05-07",
  },
  {
    id: "8",
    title: "Embracing Inner Strength and Peace",
    description: "A meditation to find your inner strength.",
    category: "women",
    length: "10m",
    audioUrl:
      "https://desert-zenmeditations.com/wp-content/uploads/Guided-Meditation-for-Women-–-Embracing-Inner-Strength-and-Peace-10-min-.m4a",
    imageUrl:
      "https://desert-zenmeditations.com/wp-content/uploads/108-Embracing-Inner-Strength-10m-women-1x1-1-1024x1024.webp",
    featured: true,
    createdAt: "2024-05-08",
  },
  {
    id: "9",
    title: "You are Doing Enough",
    description: "A meditation for Busy Parents.",
    category: "body-scan",
    length: "30m",
    audioUrl:
      "https://desert-zenmeditations.com/wp-content/uploads/Meditation-for-Busy-Parents-You-Are-Doing-Enough-10min.m4a",
    imageUrl:
      "https://desert-zenmeditations.com/wp-content/uploads/109-You-Are-Doing-Enough-10m-parents-1x1-1-1024x1024.webp",
    featured: false,
    createdAt: "2024-05-09",
  },
  {
    id: "10",
    title: "Releasing Shame and Remembering Your Worth",
    description: "A meditation for Women.",
    category: "guided-imagery",
    length: "45m",
    audioUrl:
      "https://desert-zenmeditations.com/wp-content/uploads/Meditation-for-Women-Releasing-Shame-and-Remembering-Your-Worth.m4a",
    imageUrl:
      "https://desert-zenmeditations.com/wp-content/uploads/110-Releasing-Shame-and-Remembering-Your-Worth-10m-women-1x1-1-1024x1024.jpg",
    featured: false,
    createdAt: "2024-05-10",
  },
];