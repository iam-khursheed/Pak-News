import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import NewsList from './components/NewsList';
import LoadingSpinner from './components/LoadingSpinner';
import ArticleModal from './components/ArticleModal';
import Pagination from './components/Pagination'; // Import Pagination component
import { fetchNews } from './services/newsService';
import { translateToUrdu } from './services/geminiService';
import { NewsArticle, NewsCategory } from './types';
import { CATEGORIES } from './constants';

const ARTICLES_PER_PAGE = 6;

const App: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [savedArticles, setSavedArticles] = useState<NewsArticle[]>([]);
  const [activeFilter, setActiveFilter] = useState<NewsCategory>('All');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isTranslatingAll, setIsTranslatingAll] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const loadNews = useCallback(async () => {
      try {
        const newsData = await fetchNews();
        setArticles(newsData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch news articles. Please try again later.');
        console.error(err);
      }
  }, []);

  useEffect(() => {
    const initialLoad = async () => {
        setIsLoading(true);
        await loadNews();
        setIsLoading(false);
    };
    initialLoad();

    try {
      const storedArticles = localStorage.getItem('savedNewsArticles');
      if (storedArticles) {
        setSavedArticles(JSON.parse(storedArticles));
      }
    } catch (e) {
      console.error("Failed to load saved articles from localStorage", e);
    }
  }, [loadNews]);

  useEffect(() => {
    let lastUserActivity = Date.now();
    let isUserActive = false;

    // Track user activity (mouse movement, scrolling, clicking, keyboard)
    const updateUserActivity = () => {
      lastUserActivity = Date.now();
      isUserActive = true;
    };

    const handleUserActivity = () => {
      updateUserActivity();
      // Reset activity flag after 2 minutes of inactivity
      setTimeout(() => {
        if (Date.now() - lastUserActivity > 120000) {
          isUserActive = false;
        }
      }, 120000);
    };

    // Add event listeners for user activity
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    const intervalId = setInterval(async () => {
      // Don't auto-refresh if:
      // 1. User is offline
      // 2. Filter is set to Offline
      // 3. Tab is hidden
      // 4. A modal/article is open (user is reading)
      // 5. User was active in the last 2 minutes (actively reading/interacting)
      const timeSinceActivity = Date.now() - lastUserActivity;
      const shouldRefresh = 
        navigator.onLine && 
        activeFilter !== 'Offline' && 
        !document.hidden && 
        !selectedArticle && // Don't refresh if modal is open
        timeSinceActivity > 120000; // Don't refresh if user was active in last 2 minutes

      if (shouldRefresh) {
        console.log("Auto-refreshing news...");
        await loadNews();
      }
    }, 60000); // Auto-refresh every 60 seconds (increased from 30)

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
    };
  }, [activeFilter, loadNews, selectedArticle]);
  
  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNews();
    setIsRefreshing(false);
  };

  const handleReadArticle = (article: NewsArticle) => {
    setSelectedArticle(article);
  };

  const handleCloseModal = () => {
    setSelectedArticle(null);
  };
  
  const handleTranslateAll = async () => {
    setIsTranslatingAll(true);
    try {
      const articlesToTranslate = articles.filter(a => a.summary && !a.translatedSummary);
      if (articlesToTranslate.length === 0) {
        const articlesWithoutSummary = articles.filter(a => !a.summary);
        if (articlesWithoutSummary.length > 0) {
            alert("Please wait for all summaries to be generated before translating all.");
        }
        return;
      }
      
      const translationPromises = articlesToTranslate.map(article => 
        translateToUrdu(article.id, article.summary as string).then(translation => ({
          id: article.id,
          translation
        }))
      );
      
      const translations = await Promise.all(translationPromises);
      
      const translationsMap = new Map(translations.map(t => [t.id, t.translation]));

      const updateArticlesAndSaved = (articleList: NewsArticle[]) => 
        articleList.map(article => 
          translationsMap.has(article.id)
            ? { ...article, translatedSummary: translationsMap.get(article.id) }
            : article
        );

      const updatedArticles = updateArticlesAndSaved(articles);
      const updatedSavedArticles = updateArticlesAndSaved(savedArticles);

      setArticles(updatedArticles);
      setSavedArticles(updatedSavedArticles);
      localStorage.setItem('savedNewsArticles', JSON.stringify(updatedSavedArticles));

    } catch (err) {
      console.error("Failed to translate all articles:", err);
      setError("An error occurred during bulk translation.");
    } finally {
      setIsTranslatingAll(false);
    }
  };

  const toggleSaveArticle = (article: NewsArticle, summary: string | null, translatedSummary: string | null) => {
    setSavedArticles(prevSavedArticles => {
      const existingIndex = prevSavedArticles.findIndex(a => a.id === article.id);
      let updatedSavedArticles;

      if (existingIndex > -1) {
        updatedSavedArticles = prevSavedArticles.filter(a => a.id !== article.id);
      } else {
        if (!summary) {
          console.error("Cannot save an article without a summary.");
          return prevSavedArticles; // Return original state
        }
        const articleToSave: NewsArticle = { ...article, summary, translatedSummary: translatedSummary || undefined };
        updatedSavedArticles = [...prevSavedArticles, articleToSave];
      }
      
      localStorage.setItem('savedNewsArticles', JSON.stringify(updatedSavedArticles));
      return updatedSavedArticles;
    });
  };

  const savedArticleIds = useMemo(() => new Set(savedArticles.map(a => a.id)), [savedArticles]);

  const filteredArticles = useMemo(() => {
    if (activeFilter === 'Offline') {
      return savedArticles;
    }
    if (activeFilter === 'All') {
      return articles;
    }
    return articles.filter(article => article.category === activeFilter);
  }, [articles, savedArticles, activeFilter]);
  
  const totalPages = useMemo(() => {
    return Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  }, [filteredArticles]);

  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
    return filteredArticles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);
  }, [filteredArticles, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const displayError = error && !navigator.onLine
    ? "You appear to be offline. Fresh news couldn't be loaded. Check your saved articles in the 'Offline' section."
    : error;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <FilterBar
          categories={CATEGORIES}
          activeCategory={activeFilter}
          onSelectCategory={setActiveFilter}
          onTranslateAll={handleTranslateAll}
          isTranslatingAll={isTranslatingAll}
          hasArticles={filteredArticles.length > 0}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : displayError ? (
          <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg">
            {displayError}
          </div>
        ) : (
          <>
            <NewsList 
              articles={paginatedArticles}
              onToggleSave={toggleSaveArticle}
              savedArticleIds={savedArticleIds}
              activeFilter={activeFilter}
              onReadArticle={handleReadArticle}
            />
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </main>
      {selectedArticle && <ArticleModal article={selectedArticle} onClose={handleCloseModal} />}
    </div>
  );
};

export default App;