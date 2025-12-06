import { google } from 'googleapis';
import { Command1, Command2, BaseRequest } from '../types';

const youtube = google.youtube('v3');

export class YouTubeAdapter {
  apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  extractVideoId(url: string): string | null {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
      if (u.searchParams.has('v')) return u.searchParams.get('v');
      const parts = u.pathname.split('/');
      const embedIdx = parts.indexOf('embed');
      if (embedIdx >= 0 && parts[embedIdx+1]) return parts[embedIdx+1];
      return null;
    } catch (err) {
      return null;
    }
  }

  async fetchCommand1(req: BaseRequest): Promise<Command1> {
    const videoId = this.extractVideoId(req.url);
    if (!videoId) throw new Error('Invalid YouTube video URL or id not found');

    const resp = await youtube.videos.list({
      key: this.apiKey,
      part: ['snippet','contentDetails','statistics'],
      id: [videoId],
      maxResults: 1,
    });

    const item = resp.data.items?.[0];
    if (!item) throw new Error('Video not found');

    const publisher = {
      channelId: item.snippet?.channelId,
      title: item.snippet?.channelTitle,
      thumbnails: item.snippet?.thumbnails as any,
    };

    const video = {
      id: item.id!,
      title: item.snippet?.title,
      thumbnails: item.snippet?.thumbnails as any,
      duration: item.contentDetails?.duration,
    };

    const engagement = {
      viewCount: item.statistics?.viewCount ? Number(item.statistics.viewCount) : undefined,
      likeCount: item.statistics?.likeCount ? Number(item.statistics.likeCount) : undefined,
      commentCount: item.statistics?.commentCount ? Number(item.statistics.commentCount) : undefined,
    };

    return { publisher, video, engagement };
  }

  // Pagination-aware comments fetch
  // options: maxResultsTotal = total comments to retrieve across pages (capped by API limits)
  async fetchCommand2(req: BaseRequest, maxResultsTotal = 100): Promise<Command2> {
    const videoId = this.extractVideoId(req.url);
    if (!videoId) throw new Error('Invalid YouTube video URL or id not found');

    const perPage = Math.min(100, Math.max(1, Math.floor(maxResultsTotal))); // API max 100
    let nextPageToken: string | undefined = undefined;
    const collected: any[] = [];
    let remaining = maxResultsTotal;

    // loop pages until collected enough or no more pages
    while (remaining > 0) {
      const pageSize = Math.min(perPage, remaining);
      const resp = await youtube.commentThreads.list({
        key: this.apiKey,
        part: ['snippet'],
        videoId,
        maxResults: pageSize,
        pageToken: nextPageToken,
        order: 'relevance',
        textFormat: 'plainText',
      });

      const items = resp.data.items || [];
      for (const it of items) {
        const s = it.snippet?.topLevelComment?.snippet;
        collected.push({
          id: it.id!,
          authorDisplayName: s?.authorDisplayName,
          textDisplay: s?.textDisplay,
          likeCount: s?.likeCount,
          publishedAt: s?.publishedAt,
        });
      }

      remaining -= items.length;
      nextPageToken = resp.data.nextPageToken as string | undefined;
      if (!nextPageToken) break;
    }

    return { comments: collected };
  }

  async fetch(req: BaseRequest) {
    if (req.command === 1) return { data: await this.fetchCommand1(req) };
    if (req.command === 2) {
      // allow clients to pass query params for comments via req['maxResults'] (optional)
      const max = (req as any).maxResultsTotal ?? 100;
      return { data: await this.fetchCommand2(req, max) };
    }
    if (req.command === 3) {
      const max = (req as any).maxResultsTotal ?? 100;
      const [c1, c2] = await Promise.all([this.fetchCommand1(req), this.fetchCommand2(req, max)]);
      return { data: { ...c1, ...c2 } };
    }
    throw new Error('Unsupported command');
  }
}
