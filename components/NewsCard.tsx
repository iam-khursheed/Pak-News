import React, { useState, useEffect } from 'react';
import { NewsArticle } from '../types';
import { summarizeText, translateToUrdu } from '../services/geminiService';
import SkeletonLoader from './SkeletonLoader';
import BookOpenIcon from './icons/BookOpenIcon';
import TranslateIcon from './icons/TranslateIcon';

interface NewsCardProps {
  article: NewsArticle;
  isSaved: boolean;
  onToggleSave: (article: NewsArticle, summary: string | null, translatedSummary: string | null) => void;
  onReadArticle: (article: NewsArticle) => void;
}

const formatTimeAgo = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  return `${days}d ago`;
};


const NewsCard: React.FC<NewsCardProps> = ({ article, isSaved, onToggleSave, onReadArticle }) => {
  const [summary, setSummary] = useState<string | null>(article.summary || null);
  const [translatedSummary, setTranslatedSummary] = useState<string | null>(article.translatedSummary || null);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(!article.summary);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [showUrdu, setShowUrdu] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This effect ensures that when viewing saved articles, we immediately show the Urdu version if it exists.
    if (article.translatedSummary) {
      setTranslatedSummary(article.translatedSummary);
       // Check if we are switching from no translation to having one
      if (!translatedSummary) {
        setShowUrdu(true);
      }
    }
    
    if (article.summary) {
       setSummary(article.summary);
       setIsSummarizing(false);
      return; // Don't re-fetch summary if it's already provided (e.g., from offline storage)
    }

    const generateSummary = async () => {
      if (!navigator.onLine) {
        setSummary("Cannot generate summary while offline.");
        setIsSummarizing(false);
        return;
      }
      try {
        setIsSummarizing(true);
        setError(null);
        const generatedSummary = await summarizeText(article.id, article.content);
        setSummary(generatedSummary);
      } catch (err) {
        console.error("Failed to summarize article:", article.id, err);
        setError("Could not generate summary.");
        setSummary(null);
      } finally {
        setIsSummarizing(false);
      }
    };

    generateSummary();
  }, [article.id, article.content, article.summary, article.translatedSummary, translatedSummary]);
  
  const handleTranslate = async () => {
    if (!summary || !navigator.onLine) return;
    try {
      setIsTranslating(true);
      setError(null);
      const urduSummary = await translateToUrdu(article.id, summary);
      setTranslatedSummary(urduSummary);
      setShowUrdu(true);
    } catch (err) {
      console.error("Failed to translate article:", article.id, err);
      setError("Translation failed.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleToggleSave = () => {
    onToggleSave(article, summary, translatedSummary);
  };
  
  const currentSummary = showUrdu && translatedSummary ? translatedSummary : summary;
  const isTranslationAvailable = translatedSummary !== null;

  return (
    <div className="bg-slate-800 rounded-lg shadow-xl overflow-hidden flex flex-col h-full transform hover:-translate-y-2 transition-transform duration-300 ease-in-out">
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-900/50 px-2 py-1 rounded">
              {article.category}
            </span>
            <span className="text-xs text-slate-400">{article.source}</span>
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-3">{article.title}</h3>
          
          <div className={`text-slate-400 text-sm prose prose-invert prose-p:my-2 ${showUrdu && 'text-right'}`} style={{fontFamily: showUrdu ? 'Noto Nastaliq Urdu, sans-serif' : 'inherit'}}>
            {isSummarizing || isTranslating ? (
              <SkeletonLoader />
            ) : error ? (
                <p className="text-red-400">{error}</p>
            ) : (
              <p>{currentSummary}</p>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {!isSummarizing && summary && !isTranslationAvailable && (
                 <button onClick={handleTranslate} disabled={isTranslating || !navigator.onLine} className="text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Translate to Urdu">
                  <TranslateIcon />
                  {isTranslating ? 'Translating...' : 'Urdu'}
                </button>
              )}
              {isTranslationAvailable && (
                <button onClick={() => setShowUrdu(!showUrdu)} className="text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600">
                  <TranslateIcon />
                  {showUrdu ? 'English' : 'Urdu'}
                </button>
              )}
            </div>
            <span className="text-xs text-slate-500" title={new Date(article.pubDate).toLocaleString()}>
                {formatTimeAgo(article.pubDate)}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <button onClick={() => onReadArticle(article)} className="text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600" aria-label="Read full article">
              <BookOpenIcon />
              Read
            </button>
            <div className="flex items-center gap-4">
              <button onClick={handleToggleSave} disabled={isSummarizing} className={`text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 px-3 py-1 rounded-md ${isSaved ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'} disabled:opacity-50 disabled:cursor-not-allowed`} aria-label={isSaved ? 'Remove from offline' : 'Save for offline'}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={isSaved ? "M5 13l4 4L19 7" : "M5 17v-5h14v5a2 2 0 01-2 2H7a2 2 0 01-2-2zM5 7h14v5H5z"} />
                </svg>
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors duration-200">
                Source &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;