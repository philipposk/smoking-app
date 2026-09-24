// Table names for the Smoking app in the shared 6x7 Supabase project.
// Prefixed so we never collide with other apps' schemas.

export const TABLES = {
  users: 'smoking_users',
  sessions: 'smoking_sessions',
  places: 'smoking_places',
  reviews: 'smoking_reviews',
  favorites: 'smoking_favorites',
  merchantClaims: 'smoking_merchant_claims',
  forumPosts: 'smoking_forum_posts',
  forumReplies: 'smoking_forum_replies',
  flags: 'smoking_flags',
} as const;

export const RPC = {
  placeStats: 'smoking_place_stats',
} as const;

/** Public-read bucket for avatars / place photos (not the generic `public` bucket). */
export const STORAGE_BUCKET = 'smoking';
