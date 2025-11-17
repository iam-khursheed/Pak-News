import { NewsArticle, NewsCategory } from '../types';

// Fisher-Yates shuffle algorithm
const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const RSS_FEEDS: { category: NewsCategory; url: string }[] = [
    { category: 'Politics', url: 'https://www.geo.tv/rss/2/2' }, // Was 'Pakistan'
    { category: 'World', url: 'https://www.geo.tv/rss/3/3' }, // Was 'International'
    { category: 'Business', url: 'https://www.geo.tv/rss/6/6' },
    { category: 'Technology', url: 'https://www.geo.tv/rss/7/7' }, // Was 'Science & Technology'
    { category: 'Sports', url: 'https://www.geo.tv/rss/4/4' },
    { category: 'Politics', url: 'https://www.dawn.com/feeds/pakistan' }, // Was 'Pakistan'
    { category: 'World', url: 'https://www.dawn.com/feeds/world' }, // Was 'International'
    { category: 'Business', url: 'https://www.dawn.com/feeds/business' },
    { category: 'Technology', url: 'https://www.dawn.com/feeds/tech' }, // Was 'Science & Technology'
    { category: 'Sports', url: 'https://www.dawn.com/feeds/sport' }, // Add Dawn Sports feed
];

const stripHtml = (html: string): string => {
    try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    } catch (e) {
        console.error("Failed to parse HTML", e);
        return html; // fallback to original string
    }
};

export const fetchNews = async (): Promise<NewsArticle[]> => {
  const feedPromises = RSS_FEEDS.map(async (feed) => {
    try {
      // Use a proxy to avoid CORS issues if necessary, but rss2json should handle it.
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
      }
      const data = await response.json();
      
      if (data.status === 'ok' && data.items) {
        return data.items.map((item: any): NewsArticle => ({
          id: item.guid || item.link,
          title: item.title,
          link: item.link,
          content: stripHtml(item.description || item.content || ''),
          category: feed.category,
          source: data.feed.title || new URL(feed.url).hostname,
          pubDate: item.pubDate,
          summary: undefined,
          translatedSummary: undefined,
        })).filter((article: NewsArticle) => article.content.length > 50); // Filter out empty or very short articles
      }
    } catch (error) {
      console.error(`Failed to fetch or process feed from ${feed.url}`, error);
    }
    return []; // Return empty array on failure
  });

  const results = await Promise.all(feedPromises);
  const flattenedArticles = results.flat();
  
  // Deduplicate articles based on ID (link/guid)
  const uniqueArticles = Array.from(new Map(flattenedArticles.map(item => [item.id, item])).values());
  
  return shuffleArray(uniqueArticles);
};
