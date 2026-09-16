export type UserStatus = 'pending' | 'active' | 'disabled';
export type Category = 'ALL' | 'NEWS' | 'SPORTS' | 'BEIN' | 'MOVIES' | 'KIDS' | 'KURDISH' | 'ENTERTAINMENT';
export type PlayerType = 'video' | 'iframe';

export type Channel = {
  id: string;
  name: string;
  category: Category;
  description?: string;
  logo?: string;
  streamUrl?: string;
  playerType?: PlayerType;
  enabled: boolean;
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
};

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  status: UserStatus;
  createdAt?: unknown;
};
