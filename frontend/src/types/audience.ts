export interface Demographic {
  ageRange: {
    min: number;
    max: number;
  };
  gender: 'male' | 'female' | 'all';
  locations: {
    id: string;
    name: string;
    type: 'country' | 'region' | 'city';
  }[];
  languages: string[];
  education: string[];
  workStatus: string[];
  relationshipStatus: string[];
  income: {
    min: number;
    max: number;
    currency: string;
  } | null;
}

export interface BehavioralTarget {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface InterestTarget {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface LifeEventTarget {
  id: string;
  name: string;
  timeframe: 'recent' | 'upcoming' | 'any';
}

export interface DeviceTarget {
  deviceTypes: ('mobile' | 'desktop' | 'tablet')[];
  operatingSystems: string[];
  browsers: string[];
}

export interface LookalikeAudienceSettings {
  sourceAudienceId: string;
  sourceAudienceName: string;
  similarityLevel: number; // 1-10 scale (1 being broader, 10 being closer to source)
  size: number;
  countries: string[];
}

export interface AudienceOverlapData {
  audienceA: {
    id: string;
    name: string;
    size: number;
  };
  audienceB: {
    id: string;
    name: string;
    size: number;
  };
  overlapPercentage: number;
  overlapSize: number;
}

export interface AudienceTarget {
  id: string;
  name: string;
  description?: string;
  demographic: Demographic;
  behaviors: BehavioralTarget[];
  interests: InterestTarget[];
  lifeEvents: LifeEventTarget[];
  devices: DeviceTarget;
  connections?: {
    include: string[];
    exclude: string[];
  };
  customAudiences?: string[];
  lookalikeAudiences?: string[];
  estimatedReach: number;
  estimatedDailyResults: number;
}
