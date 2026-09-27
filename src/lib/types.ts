export type UserStatus = 'unverified' | 'active' | 'disabled';
export type AccessLevel = 'free' | 'vip';
export type Category = 'ALL' | 'NEWS' | 'SPORTS' | 'BEIN' | 'MOVIES' | 'KIDS' | 'KURDISH' | 'ENTERTAINMENT';
export type PlayerType = 'video' | 'hls' | 'iframe';

export type SubtitleTrack = { id?: string; src: string; label: string; language: string; default?: boolean };
export type MediaServer = { id: string; name: string; url: string; playerType?: PlayerType; quality?: string; enabled?: boolean; accessLevel?: AccessLevel };
export type MediaImage = { url: string; type?: 'backdrop' | 'poster' | 'logo' | 'screenshot'; caption?: string; order?: number };
export type CastMember = { name: string; character?: string; photo?: string; order?: number };

export type Channel = { id: string; name: string; category: Category; description?: string; logo?: string; streamUrl?: string; playerType?: PlayerType; enabled: boolean; accessLevel?: AccessLevel };

export type MediaItem = {
  id: string; title: string; slug?: string; type: 'film' | 'drama'; year: number; genre: string; description: string; poster: string;
  streamUrl?: string; playerType?: PlayerType; enabled?: boolean; accessLevel?: AccessLevel;
  backdrop?: string; logo?: string; trailerUrl?: string; trailerPlayerType?: PlayerType;
  seoTitle?: string; seoDescription?: string; keywords?: string[]; ageRating?: string; imdbId?: string;
  rating?: number; ratingCount?: number; runtimeMinutes?: number; country?: string; originalLanguage?: string;
  quality?: string[]; tags?: string[]; genres?: string[]; status?: 'released' | 'ongoing' | 'upcoming' | 'completed';
  cast?: CastMember[]; director?: string; images?: MediaImage[]; subtitles?: SubtitleTrack[]; servers?: MediaServer[];
  releaseDate?: string; views?: number; createdAt?: unknown; updatedAt?: unknown; skipIntroSeconds?: number;
};

export type FilmPart = { id: string; mediaId: string; partNumber: number; title?: string; durationMinutes?: number; description?: string; streamUrl?: string; playerType?: PlayerType; enabled: boolean; accessLevel?: AccessLevel; subtitles?: SubtitleTrack[]; servers?: MediaServer[]; quality?: string[]; skipIntroSeconds?: number };
export type DramaEpisode = { id: string; dramaId: string; title: string; seasonNumber: number; episodeNumber: number; durationMinutes?: number; description?: string; thumbnail?: string; streamUrl?: string; playerType?: PlayerType; enabled: boolean; accessLevel?: AccessLevel; subtitles?: SubtitleTrack[]; servers?: MediaServer[]; quality?: string[]; airDate?: string; skipIntroSeconds?: number };
export type UserProfile = { uid: string; name: string; email: string; status: UserStatus; plan?: AccessLevel; vipUntil?: unknown; createdAt?: unknown };
export type Favorite = { id: string; type: 'channel' | 'media'; title: string; image?: string; createdAt?: unknown };
export type AdAudience = 'all' | 'free' | 'vip';
export type AdPlacement = 'banner' | 'popup' | 'inline';

export type WatchProgress = { id: string; mediaId?: string; episodeId?: string; partId?: string; positionSeconds: number; durationSeconds?: number; updatedAt?: unknown };
export type AdEvent = { id: string; adId: string; type: 'impression'|'click'; uid?: string; createdAt?: unknown };
export type AdBanner = {
  id: string;
  title: string;
  image: string;
  mobileImage?: string;
  link: string;
  placement?: AdPlacement;
  audience?: AdAudience;
  enabled: boolean;
  order: number;
  priority?: number;
  startAt?: unknown;
  endAt?: unknown;
  frequencySeconds?: number;
  skipAfterSeconds?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};
