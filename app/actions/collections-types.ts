// Shared types and constants for the Collections feature.
// Kept separate from the 'use server' actions file so they can be
// imported by both server and client components without restriction.

export const COLLECTION_CATEGORIES = [
  'Singles',
  'Booster Packs',
  'Sealed Products',
  'Graded Cards',
  'Vintage',
  'Modern',
  'Accessories',
] as const;

export type Collection = {
  id: string;
  vendor_id: string;
  user_id: string;
  title: string;
  description: string;
  image_urls: string[];
  price_min: number;
  price_max: number;
  categories: string[];
  created_at: string;
  updated_at: string;
  vendor?: {
    business_name: string;
    logo_url: string | null;
  };
};

export type CollectionActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: Collection;
};
