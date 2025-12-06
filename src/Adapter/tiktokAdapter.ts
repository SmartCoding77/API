import { SocialAdapter, BaseRequest, Command1 } from '../types';
import axios from 'axios';

/**
 * TikTok Adapter
 * Currently uses TikTok’s public oEmbed endpoint (no official API key needed).
 * You can later replace this with your own private API logic or scraper.
 */
export class TikTokAdapter implements SocialAdapter {
  async fetch(req: BaseRequest): Promise<{ data: Command1 }> {
    try {
      // Example: https://www.tiktok.com/oembed?url=<video_url>
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(req.url)}`;
      const { data } = await axios.get(oembedUrl);

      return {
        data: {
          publisher: {
            title: data.author_name,
            channelId: data.author_unique_id,
            thumbnails: {
              default: { url: data.author_url || '', width: 100, height: 100 },
            },
          },
          video: {
            id: data.embed_product_id || req.url,
            title: data.title,
            thumbnails: {
              default: { url: data.thumbnail_url, width: 480, height: 360 },
            },
            duration: undefined, // TikTok doesn’t expose easily
          },
          engagement: {
            // oEmbed doesn’t include counts — can be extended via scraping later
          },
        },
      };
    } catch (err: any) {
      throw new Error(`TikTok fetch failed: ${err.message}`);
    }
  }
}
