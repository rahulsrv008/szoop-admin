export type AiraSegment = 'women' | 'men' | 'bridal' | 'spa';
export type AiraItemKind = 'package' | 'service';

export interface AiraGroup {
  id: string;
  title: string;
  blurb: string | null;
  icon: string;
  segment: AiraSegment;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  itemCount: number;
}

export interface AiraItem {
  id: string;
  kind: AiraItemKind;
  title: string;
  group: string;
  section: string;
  minutes: number;
  price: number;
  originalPrice: number | null;
  rating: number | null;
  reviewsCount: number | null;
  badge: string | null;
  segment: AiraSegment | null;
  includes: string[];
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface AiraMenu {
  groups: AiraGroup[];
  items: AiraItem[];
}

export type AiraGroupPayload = Omit<AiraGroup, 'itemCount'>;

export interface AiraItemPayload {
  id: string;
  groupId: string;
  kind: AiraItemKind;
  title: string;
  section: string;
  minutes: number;
  price: number;
  originalPrice: number | null;
  rating: number | null;
  reviewsCount: number | null;
  badge: string | null;
  segment: AiraSegment | null;
  includes: string[];
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export const AIRA_SEGMENTS: { value: AiraSegment; label: string }[] = [
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' },
  { value: 'bridal', label: 'Bridal' },
  { value: 'spa', label: 'Spa' },
];

/** Ionicons the Aira app draws on its group tiles. */
export const AIRA_ICONS = ['sparkles', 'leaf', 'calendar', 'cut', 'flower', 'heart', 'diamond', 'flash', 'man', 'hand-left', 'color-palette', 'star'];

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
