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
