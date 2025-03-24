import {
  BehavioralTarget,
  InterestTarget,
  LifeEventTarget,
  AudienceTarget,
} from '../types/audience';

export const behaviors: BehavioralTarget[] = [
  {
    id: 'b1',
    name: 'Frequent Travellers',
    category: 'Travel',
    description: 'People who travel frequently',
  },
  {
    id: 'b2',
    name: 'Online Shoppers',
    category: 'Shopping',
    description: 'People who frequently shop online',
  },
  {
    id: 'b3',
    name: 'Mobile Game Players',
    category: 'Gaming',
    description: 'People who play mobile games',
  },
  {
    id: 'b4',
    name: 'Video Streamers',
    category: 'Entertainment',
    description: 'People who use video streaming services',
  },
  {
    id: 'b5',
    name: 'Fitness App Users',
    category: 'Health & Fitness',
    description: 'People who use fitness tracking apps',
  },
  {
    id: 'b6',
    name: 'Food Delivery Users',
    category: 'Food & Drink',
    description: 'People who use food delivery services',
  },
  {
    id: 'b7',
    name: 'Business Travellers',
    category: 'Travel',
    description: 'People who travel for business',
  },
  {
    id: 'b8',
    name: 'Luxury Shoppers',
    category: 'Shopping',
    description: 'People who shop for luxury items',
  },
  {
    id: 'b9',
    name: 'Tech Early Adopters',
    category: 'Technology',
    description: 'People who adopt new technology early',
  },
  {
    id: 'b10',
    name: 'Charity Donors',
    category: 'Charity',
    description: 'People who donate to charity',
  },
];

export const interests: InterestTarget[] = [
  {
    id: 'i1',
    name: 'Photography',
    category: 'Arts & Entertainment',
    description: 'People interested in photography',
  },
  {
    id: 'i2',
    name: 'Cooking',
    category: 'Food & Drink',
    description: 'People interested in cooking',
  },
  {
    id: 'i3',
    name: 'Running',
    category: 'Sports & Fitness',
    description: 'People interested in running',
  },
  {
    id: 'i4',
    name: 'Fashion',
    category: 'Shopping',
    description: 'People interested in fashion',
  },
  {
    id: 'i5',
    name: 'Reading',
    category: 'Books',
    description: 'People interested in reading',
  },
  {
    id: 'i6',
    name: 'Gardening',
    category: 'Hobbies',
    description: 'People interested in gardening',
  },
  {
    id: 'i7',
    name: 'Technology',
    category: 'Technology',
    description: 'People interested in technology',
  },
  {
    id: 'i8',
    name: 'Travel',
    category: 'Travel',
    description: 'People interested in travel',
  },
  {
    id: 'i9',
    name: 'Music',
    category: 'Arts & Entertainment',
    description: 'People interested in music',
  },
  {
    id: 'i10',
    name: 'Hiking',
    category: 'Sports & Fitness',
    description: 'People interested in hiking',
  },
];

export const lifeEvents: LifeEventTarget[] = [
  {
    id: 'le1',
    name: 'New Job',
    timeframe: 'recent',
  },
  {
    id: 'le2',
    name: 'Engagement',
    timeframe: 'recent',
  },
  {
    id: 'le3',
    name: 'Marriage',
    timeframe: 'recent',
  },
  {
    id: 'le4',
    name: 'Moving Home',
    timeframe: 'recent',
  },
  {
    id: 'le5',
    name: 'New Baby',
    timeframe: 'recent',
  },
  {
    id: 'le6',
    name: 'Anniversary',
    timeframe: 'upcoming',
  },
  {
    id: 'le7',
    name: 'Birthday',
    timeframe: 'upcoming',
  },
  {
    id: 'le8',
    name: 'Graduation',
    timeframe: 'upcoming',
  },
  {
    id: 'le9',
    name: 'Retirement',
    timeframe: 'upcoming',
  },
  {
    id: 'le10',
    name: 'New Business',
    timeframe: 'recent',
  },
];

export const customAudiences = [
  {
    id: 'ca1',
    name: 'Website Visitors',
    description: 'People who visited our website in the last 30 days',
    size: 250000,
  },
  {
    id: 'ca2',
    name: 'Email Subscribers',
    description: 'People who subscribed to our email list',
    size: 120000,
  },
  {
    id: 'ca3',
    name: 'App Users',
    description: 'People who used our app in the last 30 days',
    size: 80000,
  },
  {
    id: 'ca4',
    name: 'Product Purchasers',
    description: 'People who purchased our products',
    size: 35000,
  },
  {
    id: 'ca5',
    name: 'Cart Abandoners',
    description: 'People who added items to cart but did not purchase',
    size: 62000,
  },
];

export const sampleAudience: AudienceTarget = {
  id: 'a1',
  name: 'Health-conscious Young Adults',
  description: 'Young adults interested in fitness and health',
  demographic: {
    ageRange: {
      min: 25,
      max: 34,
    },
    gender: 'all',
    locations: [
      {
        id: 'uk',
        name: 'United Kingdom',
        type: 'country',
      },
    ],
    languages: ['English'],
    education: ['College', 'Graduate School'],
    workStatus: ['Employed'],
    relationshipStatus: [],
    income: {
      min: 30000,
      max: 60000,
      currency: 'GBP',
    },
  },
  behaviors: [
    {
      id: 'b5',
      name: 'Fitness App Users',
      category: 'Health & Fitness',
      description: 'People who use fitness tracking apps',
    },
  ],
  interests: [
    {
      id: 'i3',
      name: 'Running',
      category: 'Sports & Fitness',
      description: 'People interested in running',
    },
  ],
  lifeEvents: [],
  devices: {
    deviceTypes: ['mobile', 'desktop'],
    operatingSystems: ['iOS', 'Android', 'Windows', 'MacOS'],
    browsers: ['Chrome', 'Safari', 'Firefox'],
  },
  connections: {
    include: [],
    exclude: [],
  },
  customAudiences: [],
  lookalikeAudiences: [],
  estimatedReach: 1250000,
  estimatedDailyResults: 8500,
};

export const audienceOverlap = [
  {
    audienceA: {
      id: 'a1',
      name: 'Health-conscious Young Adults',
      size: 1250000,
    },
    audienceB: {
      id: 'ca1',
      name: 'Website Visitors',
      size: 250000,
    },
    overlapPercentage: 35,
    overlapSize: 87500,
  },
  {
    audienceA: {
      id: 'a1',
      name: 'Health-conscious Young Adults',
      size: 1250000,
    },
    audienceB: {
      id: 'ca2',
      name: 'Email Subscribers',
      size: 120000,
    },
    overlapPercentage: 28,
    overlapSize: 33600,
  },
];
