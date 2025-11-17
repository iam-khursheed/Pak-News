import React, { useState, useEffect } from 'react';
import { NewsCategory } from '../types';
import TranslateIcon from './icons/TranslateIcon';
import RefreshIcon from './icons/RefreshIcon';

interface FilterBarProps {
  categories: NewsCategory[];
  activeCategory: NewsCategory;
  onSelectCategory: (category: NewsCategory) => void;
  onTranslateAll: () => void;
  isTranslatingAll: boolean;
  hasArticles: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  categories, 
  activeCategory, 
  onSelectCategory, 
  onTranslateAll, 
  isTranslatingAll, 
  hasArticles,
  onRefresh,
  isRefreshing
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex flex-wrap justify-center items-center gap-2 mb-8">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-400
            ${
              activeCategory === category
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
        >
          {category}
        </button>
      ))}
       {activeCategory !== 'Offline' && (
         <button 
            onClick={onRefresh}
            disabled={isRefreshing || !isOnline}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-400 bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh news feed"
          >
            <RefreshIcon isSpinning={isRefreshing} />
        </button>
       )}
      {hasArticles && isOnline && activeCategory !== 'Offline' && (
        <button 
          onClick={onTranslateAll}
          disabled={isTranslatingAll}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-400 bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-wait"
        >
          {isTranslatingAll ? (
             <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : <TranslateIcon />}
          <span>{isTranslatingAll ? 'Translating...' : 'Translate All to Urdu'}</span>
        </button>
      )}
    </div>
  );
};

export default FilterBar;