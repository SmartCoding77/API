import { SocialAdapter, BaseRequest, Command1 } from '../types';

/**
 * Simple Snapchat Adapter
 * Currently mock data — replace later with scraping or private API
 */
export class SnapchatAdapter implements SocialAdapter {
  async fetch(req: BaseRequest): Promise<{ data: Command1 }> {
    // Return mock data for now
    return {
      data: {
        publisher: {
          title: 'Snapchat User',
          channelId: 'snap123',
          thumbnails: { default: { url: 'https://example.com/profile.jpg', width: 100, height: 100 } },
        },
        video: {
          id: 'snap_video_' + Date.now(),
          title: 'Snapchat Clip',
          thumbnails: { default: { url: 'https://example.com/video.jpg', width: 480, height: 360 } },
          duration: 'PT10S',
        },
        engagement: {
          viewCount: 123,
          likeCount: 45,
          commentCount: 2,
        },
      },
    };
  }
}
