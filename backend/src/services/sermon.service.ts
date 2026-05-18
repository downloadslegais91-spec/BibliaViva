import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyD-HtcNGpQy3f6HSz_-tsHHTnx3Ku6abEA';
const CACHE_TTL_DAYS = 7;

// Blocklist for titles and channels (lowercased comparison)
const BLOCKLIST = [
  'debate',
  'falso profeta',
  'falsa',
  'seita',
  'polêmica',
  'polemica',
  ' vs ',
  'versus',
  'erro de',
  'heresia',
  'exposição',
  'denúncia',
  'denuncia',
  'crítica',
  'critica'
];

interface YouTubeVideoItem {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    channelId: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
    publishedAt: string;
  };
  contentDetails?: {
    duration: string;
  };
  statistics?: {
    viewCount: string;
  };
}

export class SermonService {
  /**
   * Main function to fetch sermons for a given Bible book.
   * Leverages 7-day DB caching before doing live YouTube queries.
   */
  static async getSermonsForBook(bookName: string): Promise<any[]> {
    // 1. Check DB Cache
    const cachedSermons = await prisma.bookSermon.findMany({
      where: { book: bookName },
      orderBy: { position: 'asc' }
    });

    if (cachedSermons.length > 0) {
      const firstCached = cachedSermons[0];
      const cacheAgeMs = Date.now() - new Date(firstCached.cachedAt).getTime();
      const maxAgeMs = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

      if (cacheAgeMs < maxAgeMs) {
        console.log(`[SermonService] Serving cached sermons for ${bookName} (Age: ${Math.round(cacheAgeMs / 3600000)}h)`);
        return this.formatSermonsList(cachedSermons);
      }
      console.log(`[SermonService] Cache expired for ${bookName}, refreshing...`);
    }

    // 2. Cache miss/expired: Fetch from YouTube API & Update Cache
    try {
      const freshSermons = await this.fetchAndFilterFromYouTube(bookName);
      if (freshSermons.length > 0) {
        await this.updateCache(bookName, freshSermons);
        return freshSermons;
      }
    } catch (error) {
      console.error(`[SermonService] Error fetching from YouTube for ${bookName}:`, error);
    }

    // Fallback to stale cache if YouTube fails
    if (cachedSermons.length > 0) {
      console.log(`[SermonService] Serving stale cached sermons for ${bookName} due to API error`);
      return this.formatSermonsList(cachedSermons);
    }

    return [];
  }

  /**
   * Force background refresh of sermons for a book
   */
  static async forceRefresh(bookName: string): Promise<any[]> {
    const freshSermons = await this.fetchAndFilterFromYouTube(bookName);
    if (freshSermons.length > 0) {
      await this.updateCache(bookName, freshSermons);
      return freshSermons;
    }
    return [];
  }

  /**
   * Helper to format BigInt view count correctly for API responses
   */
  private static formatSermonsList(sermons: any[]): any[] {
    return sermons.map(s => ({
      ...s,
      viewCount: Number(s.viewCount) // Convert BigInt to number for JSON safety
    }));
  }

  /**
   * Call YouTube API, filter based on criteria, and return top 6 matching videos
   */
  private static async fetchAndFilterFromYouTube(bookName: string): Promise<any[]> {
    console.log(`[SermonService] Querying YouTube Search API for book: ${bookName}`);
    
    // 1. YouTube Search query (pregação sobre o livro [Livro])
    const query = encodeURIComponent(`Pregação sobre o livro ${bookName}`);
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${query}&type=video&key=${YOUTUBE_API_KEY}`;
    
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      const errText = await searchRes.text();
      throw new Error(`YouTube Search failed: ${searchRes.statusText} - ${errText}`);
    }

    const searchData = await searchRes.json();
    const searchItems: any[] = searchData.items || [];
    if (searchItems.length === 0) return [];

    const videoIds = searchItems.map((item: any) => item.id.videoId).filter(Boolean).join(',');

    // 2. Fetch full Video Details (for duration and viewCount)
    console.log(`[SermonService] Querying YouTube Videos API for details on ${searchItems.length} videos`);
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
    
    const detailsRes = await fetch(detailsUrl);
    if (!detailsRes.ok) {
      throw new Error(`YouTube Videos Detail failed: ${detailsRes.statusText}`);
    }

    const detailsData = await detailsRes.json();
    const videoDetails: YouTubeVideoItem[] = detailsData.items || [];

    const filteredVideos: any[] = [];

    for (const item of videoDetails) {
      const title = item.snippet.title;
      const channelName = item.snippet.channelTitle;
      const durationStr = item.contentDetails?.duration || '';
      const viewCountStr = item.statistics?.viewCount || '0';

      const durationSeconds = this.parseISO8601Duration(durationStr);
      const viewCount = parseInt(viewCountStr, 10);

      // Criteria validation:
      // a. View Count >= 5,000
      if (viewCount < 5000) {
        console.log(`[SermonService] Excluded (viewCount ${viewCount} < 5000): "${title}"`);
        continue;
      }

      // b. Duration in range 8 min (480s) to 2 hours (7200s)
      if (durationSeconds < 480 || durationSeconds > 7200) {
        console.log(`[SermonService] Excluded (duration ${Math.round(durationSeconds/60)}m out of bounds): "${title}"`);
        continue;
      }

      // c. Strict blocklist filtering
      const lowerTitle = title.toLowerCase();
      const lowerChannel = channelName.toLowerCase();
      const containsBlocked = BLOCKLIST.some(word => lowerTitle.includes(word) || lowerChannel.includes(word));
      if (containsBlocked) {
        console.log(`[SermonService] Excluded (blocklist match): "${title}"`);
        continue;
      }

      const thumbnailUrl = item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url || '';

      filteredVideos.push({
        book: bookName,
        videoId: item.id,
        title: title,
        channelName: channelName,
        channelId: item.snippet.channelId,
        thumbnailUrl: thumbnailUrl,
        durationSeconds: durationSeconds,
        viewCount: viewCount,
        publishedAt: new Date(item.snippet.publishedAt)
      });
    }

    // 3. Sort by descending view count
    filteredVideos.sort((a, b) => b.viewCount - a.viewCount);

    // 4. Return top 6 items
    return filteredVideos.slice(0, 6);
  }

  /**
   * Helper to parse ISO 8601 duration format (e.g. PT1H15M30S) to seconds
   */
  private static parseISO8601Duration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Atomically refresh cache in database
   */
  private static async updateCache(bookName: string, sermons: any[]) {
    console.log(`[SermonService] Updating DB Cache for ${bookName} with ${sermons.length} sermons`);
    
    // We run this in a transaction to avoid partial cache or janky reading state
    await prisma.$transaction([
      prisma.bookSermon.deleteMany({ where: { book: bookName } }),
      prisma.bookSermon.createMany({
        data: sermons.map((s, index) => ({
          book: s.book,
          videoId: s.videoId,
          title: s.title,
          channelName: s.channelName,
          channelId: s.channelId,
          thumbnailUrl: s.thumbnailUrl,
          durationSeconds: s.durationSeconds,
          viewCount: BigInt(s.viewCount), // Cast to BigInt for DB schema parity
          publishedAt: s.publishedAt,
          position: index
        }))
      })
    ]);
  }
}
