export type UserStatus = 'pending' | 'active' | 'disabled';

export type AccessLevel = 'free' | 'vip';

export type Category =
  | 'ALL'
  | 'NEWS'
  | 'SPORTS'
  | 'BEIN'
  | 'MOVIES'
  | 'KIDS'
  | 'KURDISH'
  | 'ENTERTAINMENT';

export type PlayerType = 'video' | 'hls' | 'iframe';

export type Channel = {
  id: string;
  name: string;
  category: Category;
  description?: string;
  logo?: string;
  streamUrl?: string;
  playerType?: PlayerType;
  enabled: boolean;
  accessLevel?: AccessLevel;
};

export type MediaPart = {
  id: string;
  title: string;
  streamUrl: string;
  playerType?: PlayerType;
  durationMinutes?: number;
  enabled?: boolean;
};

export type MediaItem = {
  id: string;
  title: string;
  type: 'film' | 'drama';
  year: number;
  genre: string;
  description: string;
  poster: string;

  // Old one-part films remain supported.
  streamUrl?: string;
  playerType?: PlayerType;

  // New: Part 1, Part 2, Part 3...
  parts?: MediaPart[];

  enabled?: boolean;
  accessLevel?: AccessLevel;
};

export type DramaEpisode = {
  id: string;
  dramaId: string;
  title: string;
  seasonNumber: number;
  episodeNumber: number;
  durationMinutes?: number;
  description?: string;
  streamUrl?: string;
  playerType?: PlayerType;
  enabled: boolean;
  accessLevel?: AccessLevel;
};

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  status: UserStatus;
  plan?: AccessLevel;
  vipUntil?: unknown;
  createdAt?: unknown;
};

export type Favorite = {
  id: string;
  type: 'channel' | 'media';
  title: string;
  image?: string;
  createdAt?: unknown;
};

export type AdAudience = 'free' | 'vip' | 'both';

export type AdBanner = {
  id: string;
  title: string;
  image: string;
  mobileImage?: string;
  link: string;

  placement?: 'banner' | 'popup' | 'inline';

  // Who can see this advertisement.
  audience?: AdAudience;

  // Repeat interval in seconds.
  repeatSeconds?: number;

  enabled: boolean;
  order: number;

  createdAt?: unknown;
  updatedAt?: unknown;
};
