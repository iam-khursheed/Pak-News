import React from 'react';
import { NewsArticle, NewsCategory } from '../types';
import NewsCard from './NewsCard';

interface NewsListProps {
  articles: NewsArticle[];
  savedArticleIds: Set<string>;
  onToggleSave: (article: NewsArticle, summary: string | null, translatedSummary: string | null) => void;
  activeFilter: NewsCategory;
  onReadArticle: (article: NewsArticle) => void;
}

const NewsList: React.FC<NewsListProps> = ({ articles, savedArticleIds, onToggleSave, activeFilter, onReadArticle }) => {
    if (articles.length === 0) {
        const message = activeFilter === 'Offline'
            ? "You haven't saved any articles for offline reading yet."
            : "No articles found for this category.";
        return <div className="text-center text-slate-400 mt-16">{message}</div>;
    }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {articles.map((article) => (
        <NewsCard 
            key={article.id} 
            article={article} 
            isSaved={savedArticleIds.has(article.id)}
            onToggleSave={onToggleSave}
            onReadArticle={onReadArticle}
        />
      ))}
    </div>
  );
};

export default NewsList;