import axios from 'axios';
import * as cheerio from 'cheerio';
import { SocialAdapter, BaseRequest, Command1 } from '../types';

export class InstagramAdapter implements SocialAdapter {
  async fetch(req: BaseRequest): Promise<{ data: Command1 }> {
    try {
      const { data: html } = await axios.get(req.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });

      const $ = cheerio.load(html);
      const title = $('meta[property="og:title"]').attr('content');
      const thumbnail = $('meta[property="og:image"]').attr('content');
      const author = $('meta[property="og:site_name"]').attr('content');

      return {
        data: {
          publisher: { title: author || 'Instagram User' },
          video: {
            id: req.url,
            title: title || '',
            thumbnails: {
              default: { url: thumbnail || '', width: 480, height: 360 },
            },
          },
          engagement: {},
        },
      };
    } catch (err: any) {
      throw new Error(`Instagram fetch failed: ${err.message}`);
    }
  }
}
