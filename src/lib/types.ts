export type UserStatus = 'pending' | 'active' | 'disabled';
export type AccessLevel = 'free' | 'vip';
export type Category = 'ALL' | 'NEWS' | 'SPORTS' | 'BEIN' | 'MOVIES' | 'KIDS' | 'KURDISH' | 'ENTERTAINMENT';
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

export type MediaItem = {
  id: string;
  title: string;
  type: 'film' | 'drama';
  year: number;
  genre: string;
  description: string;
  poster: string;
  streamUrl?: string;
  playerType?: PlayerType;
  enabled?: boolean;
  accessLevel?: AccessLevel;
};

export type FilmPart = {
  id: string;
  mediaId: string;
  partNumber: number;
  title?: string;
  durationMinutes?: number;
  description?: string;
  streamUrl?: string;
  playerType?: PlayerType;
  enabled: boolean;
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

export type AdBanner = {
  id: string;
  title: string;
  image: string;
  mobileImage?: string;
  link: string;
  placement?: 'banner' | 'popup' | 'inline';
  enabled: boolean;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};
