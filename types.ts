export type NewsCategory = 'All' | 'Politics' | 'World' | 'Technology' | 'Business' | 'Sports' | 'Offline';

export interface NewsArticle {
  id: string;
  title: string;
  link: string;
  content: string; // The full content to be summarized
  category: NewsCategory;
  source: string;
  pubDate: string;
  summary?: string; // Optional field for pre-computed summaries in offline mode
  translatedSummary?: string; // Optional field for Urdu translation
}
