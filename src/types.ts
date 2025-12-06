export type Command = 1 | 2 | 3;

export interface BaseRequest {
  url: string;
  command: Command;
  mode?: 'sync' | 'async';
  ttl?: number;
  maxResultsTotal?: number;
}

export interface PublisherInfo {
  channelId?: string | null;
  title?: string | null;
  description?: string | null;
  thumbnails?: Record<string, { url: string; width?: number; height?: number }>;
}

export interface Engagement {
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
}

export interface MediaItem {
  id: string;
  title?: string | null;
  thumbnails: any;
  duration?: string | null;
  url?: string;
}

export interface Command1 {
  publisher?: PublisherInfo;
  video?: MediaItem;
  engagement?: Engagement;
}

export interface Comment {
  id: string;
  authorDisplayName?: string;
  textDisplay?: string;
  likeCount?: number;
  publishedAt?: string;
}

export interface Command2 {
  comments: Comment[];
}

export interface ApiResponse {
  data: Command1 | Command2 | (Command1 & Command2);
  cached: boolean;
  fetchedAt: string;
}

/**
 * Common interface for all social media adapters
 * (YouTube, TikTok, Facebook, etc.)
 */
export interface SocialAdapter {
  fetch(req: BaseRequest): Promise<{ data: Command1 | Command2 | (Command1 & Command2) }>;
}



// export type Command = 1 | 2 | 3;

// export interface BaseRequest {
//   url: string;
//   command: Command;
//   mode?: 'sync' | 'async';
// }

// export interface PublisherInfo {
//  channelId?: string | null;
//   title?: string | null;
//   description?: | null;
//   thumbnails?: Record<string, { url: string; width?: number; height?: number }>;
// }

// export interface Engagement {
//   viewCount?: number;
//   likeCount?: number;
//   commentCount?: number;
// }

// export interface MediaItem {
//   id: string;
//   title?: string | null;
//   thumbnails: any;
//   duration?: string | null;
// }


// export interface Command1 {
//   publisher?: PublisherInfo;
//   video?: MediaItem;
//   engagement?: Engagement;
// }

// export interface Comment {
//   id: string;
//   authorDisplayName?: string;
//   textDisplay?: string;
//   likeCount?: number;
//   publishedAt?: string;
// }

// export interface Command2 {
//   comments: Comment[];
// }

// export interface ApiResponse {
//   data: Command1 | Command2 | (Command1 & Command2);
//   cached: boolean;
//   fetchedAt: string;
// }
