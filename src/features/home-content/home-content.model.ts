export type HomeTileLayout = 'HALF' | 'FULL';
export type HomeCategoryAction = 'POPUP' | 'OPTIONS' | 'COMING_SOON';

export interface HomeHighlight {
  text: string;
  /** Image URL / data URL, or an Ionicons name rendered by the customer app. */
  icon: string | null;
}

/** A bookable choice: a duration (Express Service) or a shift (monthly plans). */
export interface HomePricingTier {
  label: string;
  subtitle: string | null;
  minutes: number | null;
  /** 'HH:MM' */
  startTime: string | null;
  price: number;
}

export interface HomeCategoryOption {
  id: string;
  categoryId: string;
  title: string;
  subtitle: string | null;
  priceLabel: string | null;
  badge: string | null;
  imageUrl: string | null;
  popupTitle: string | null;
  highlights: HomeHighlight[];
  /** What the option doesn't cover; the customer app shows it in the popup and at checkout. */
  exclusions?: string[];
  pricing: HomePricingTier[];
  sortOrder: number;
  isActive: boolean;
}

export interface HomeCategory {
  id: string;
  title: string;
  subtitle: string | null;
  badge: string | null;
  imageUrl: string | null;
  tileColor: string | null;
  layout: HomeTileLayout;
  actionType: HomeCategoryAction;
  popupTitle: string | null;
  highlights: HomeHighlight[];
  /** What the category doesn't cover; the customer app shows it in the popup and at checkout. */
  exclusions?: string[];
  pricing: HomePricingTier[];
  sortOrder: number;
  isActive: boolean;
  options: HomeCategoryOption[];
}

export interface HomePopularItem {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  priceLabel: string | null;
  badge: string | null;
  rating: string | number | null;
  categoryId: string | null;
  optionId: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface HomeScreenBanner {
  id: string;
  kicker: string;
  headline: string;
  title: string;
  sub: string;
  color: string;
  opens: 'express' | 'cook';
}

export interface HomeScreenTrust {
  icon: string;
  label: string;
}

export interface HomeScreenStep {
  n: string;
  title: string;
  body: string;
}

export interface HomeScreenConfig {
  searchPlaceholder: string;
  gridTitle: string;
  banners: HomeScreenBanner[];
  trust: HomeScreenTrust[];
  howTitle: string;
  howSteps: HomeScreenStep[];
  bottomTitle: string;
  bottomSub: string;
  bottomButton: string;
}

export const DEFAULT_HOME_SCREEN: HomeScreenConfig = {
  searchPlaceholder: 'Search kitchen, bathroom, laundry…',
  gridTitle: 'What are you looking for?',
  banners: [
    {
      id: 'b1',
      kicker: 'LIMITED OFFER',
      headline: '30% OFF',
      title: "Today's Special!",
      sub: 'Get discount for every order, only valid for today.',
      color: '#6B21A8',
      opens: 'express',
    },
    {
      id: 'b-cook',
      kicker: 'FREE TRIAL',
      headline: '3 days',
      title: 'Healthy Cook, on us',
      sub: 'Healthy home-style meals. Try 3 days free, then pick a plan.',
      color: '#059669',
      opens: 'cook',
    },
  ],
  trust: [
    { icon: 'shield-checkmark', label: 'Verified pros' },
    { icon: 'leaf', label: 'Healthy meals' },
    { icon: 'flash', label: '15-min arrival' },
  ],
  howTitle: 'How Oseedy works',
  howSteps: [
    { n: '1', title: 'Pick a service', body: 'Cleaning, cook, diet meals…' },
    { n: '2', title: 'Choose time & duration', body: 'Right now or any slot you like' },
    { n: '3', title: 'Relax & track', body: 'Expert arrives with OTP' },
  ],
  bottomTitle: 'Need help right now?',
  bottomSub: 'An expert at your door in about 15 minutes.',
  bottomButton: 'Book',
};

export type HomeCategoryPayload = Omit<HomeCategory, 'id' | 'options'>;
export type HomeCategoryOptionPayload = Omit<HomeCategoryOption, 'id' | 'categoryId'>;
export type HomePopularPayload = Omit<HomePopularItem, 'id' | 'rating'> & {
  rating: number | null;
};

export const LAYOUT_LABELS: Record<HomeTileLayout, string> = {
  HALF: 'Half width (50%)',
  FULL: 'Full row',
};

export const ACTION_LABELS: Record<HomeCategoryAction, string> = {
  POPUP: 'Show "what agent does" popup',
  OPTIONS: 'Open a page of options',
  COMING_SOON: 'Coming soon teaser',
};

/** Suggestions for the icon field; any Ionicons name works in the customer app. */
export const ICON_SUGGESTIONS = [
  'home',
  'sparkles',
  'water',
  'restaurant',
  'shirt',
  'leaf',
  'nutrition',
  'calendar',
  'time',
  'person',
  'people',
  'shield-checkmark',
  'star',
  'swap-horizontal',
  'flash',
  'bed',
  'car',
  'paw',
  'heart',
];
