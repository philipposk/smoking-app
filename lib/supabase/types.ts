export type PlaceType =
  | 'spot'
  | 'shop'
  | 'cafe'
  | 'dispensary'
  | 'kiosk'
  | 'convenience'
  | 'bench'
  | 'smoking_area';

export type PlaceSource = 'user' | 'osm' | 'google' | 'retailer' | 'seed';

export interface Place {
  id: string;
  external_id: string | null;
  source: PlaceSource;
  name: string;
  description: string | null;
  type: PlaceType;
  lat: number;
  lng: number;
  country: string | null;
  city: string | null;
  neighborhood: string | null;
  region: string | null;
  tags: string[];
  photo_url: string | null;
  accessible: boolean | null;
  notes: string | null;
  verified: boolean;
  merchant_claimed: boolean;
  merchant_user_id: string | null;
  contributed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'merchant' | 'admin';
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  email_verified?: boolean;
}

export interface PublicUser extends Omit<User, 'email'> {}

export interface ForumPost {
  id: string;
  user_id: string;
  title: string;
  body: string;
  category: string | null;
  created_at: string;
}

export interface ForumReply {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export interface Review {
  id: string;
  place_id: string;
  user_id: string;
  rating: number;
  body: string | null;
  created_at: string;
}
