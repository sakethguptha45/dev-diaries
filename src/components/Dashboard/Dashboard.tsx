import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, isSameDay } from 'date-fns';
import { useCardStore } from '../../store/cardStore';
import { useAuthStore } from '../../store/authStore';
import { CardPreview } from '../Cards/CardPreview';
import { Card } from '../../types';

interface DashboardProps {
  searchQuery?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ searchQuery = '' }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    cards,
    toggleFavorite,
    getRecentCards,
    getFavoriteCards,
    getAllTags,
    searchQuery: globalSearchQuery,
    searchCards
  } = useCardStore();

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'dashboard' | 'all' | 'favorites' | 'recent'>('dashboard');
  const [favoritesCanScrollLeft, setFavoritesCanScrollLeft] = useState(false);
  const [favoritesCanScrollRight, setFavoritesCanScrollRight] = useState(false);
  const [recentCanScrollLeft, setRecentCanScrollLeft] = useState(false);
  const [recentCanScrollRight, setRecentCanScrollRight] = useState(false);
  const [visibleTagsCount, setVisibleTagsCount] = useState(9);
  
  const favoritesScrollRef = useRef<HTMLDivElement>(null);
  const recentScrollRef = useRef<HTMLDivElement>(null);
  const tagsContainerRef = useRef<HTMLDivElement>(null);

  // Get user-specific cards
  const userCards = useMemo(() => {
    if (!user) return [];
    return cards.filter(card => card.userId === user.id);
  }, [cards, user]);

  const recentCards = getRecentCards();
  const favoriteCards = getFavoriteCards();
  const allTags = getAllTags();

  // Helper function to ensure dates are Date objects
  const ensureDate = (date: string | Date): Date => {
    return typeof date === 'string' ? new Date(date) : date;
  };

  // Update search in store when local search changes
  useEffect(() => {
    searchCards(localSearchQuery);
  }, [localSearchQuery, searchCards]);


  // Calculate how many tags can fit in one row
  useEffect(() => {
    const calculateVisibleTags = () => {
      if (!tagsContainerRef.current || allTags.length === 0) return;

      const container = tagsContainerRef.current;
      const containerWidth = container.offsetWidth;
      
      // Approximate tag width (including margin) - adjust based on your styling
      const avgTagWidth = 120; // This includes padding, text, and margin
      const maxTags = Math.floor(containerWidth / avgTagWidth);
      
      // Ensure we show at least 6 tags and at most all available tags
      const calculatedCount = Math.max(6, Math.min(maxTags, allTags.length));
      setVisibleTagsCount(calculatedCount);
    };

    calculateVisibleTags();
    window.addEventListener('resize', calculateVisibleTags);
    
    return () => window.removeEventListener('resize', calculateVisibleTags);
  }, [allTags.length]);


  // Update scroll button states
  const updateScrollButtons = () => {
    if (favoritesScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = favoritesScrollRef.current;
      setFavoritesCanScrollLeft(scrollLeft > 0);
      setFavoritesCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
    
    if (recentScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = recentScrollRef.current;
      setRecentCanScrollLeft(scrollLeft > 0);
      setRecentCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Set up scroll listeners
  useEffect(() => {
    const favoritesEl = favoritesScrollRef.current;
    const recentEl = recentScrollRef.current;

    if (favoritesEl) {
      favoritesEl.addEventListener('scroll', updateScrollButtons);
    }
    if (recentEl) {
      recentEl.addEventListener('scroll', updateScrollButtons);
    }

    // Initial check
    updateScrollButtons();

    return () => {
      if (favoritesEl) {
        favoritesEl.removeEventListener('scroll', updateScrollButtons);
      }
      if (recentEl) {
        recentEl.removeEventListener('scroll', updateScrollButtons);
      }
    };
  }, [favoriteCards.length, recentCards.length]);

  // Update scroll buttons when content changes
  useEffect(() => {
    const timer = setTimeout(updateScrollButtons, 100);
    return () => clearTimeout(timer);
  }, [favoriteCards.length, recentCards.length]);

  // Filter cards based on search query and selected tags
  const filteredCards = useMemo(() => {
    let filtered = userCards.map(card => ({
      ...card,
      createdAt: ensureDate(card.createdAt),
      updatedAt: ensureDate(card.updatedAt)
    }));

    // Use the current search query (either from props, local state, or global state)
    const currentQuery = searchQuery || localSearchQuery || globalSearchQuery;

    // Apply search filter
    if (currentQuery && currentQuery.trim()) {
      const query = currentQuery.toLowerCase().trim();
      filtered = filtered.filter(card => {
        const titleMatch = card.title.toLowerCase().includes(query);
        const contentMatch = card.content.toLowerCase().includes(query);
        const tagMatch = card.tags.some(tag => tag.toLowerCase().includes(query));
        const explanationMatch = card.explanation.toLowerCase().includes(query);
        
        return titleMatch || contentMatch || tagMatch || explanationMatch;
      });
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(card =>
        selectedTags.every(tag => card.tags.includes(tag))
      );
    }

    return filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [userCards, searchQuery, localSearchQuery, globalSearchQuery, selectedTags]);

  // Group cards by date for All Cards view
  const groupedCards = useMemo(() => {
    const groups: { [key: string]: Card[] } = {};
    
    filteredCards.forEach(card => {
      const dateKey = format(ensureDate(card.updatedAt), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(card);
    });

    // Sort groups by date (newest first)
    const sortedGroups = Object.entries(groups).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    return sortedGroups;
  }, [filteredCards]);

  const handleNewCard = () => {
    navigate('/editor');
  };

  const handleCardClick = (card: Card) => {
    navigate(`/editor/${card.id}`);
  };

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const getDisplayCards = () => {
    const currentQuery = searchQuery || localSearchQuery || globalSearchQuery;
    
    switch (activeView) {
      case 'favorites':
        return favoriteCards.filter(card => {
          if (!currentQuery.trim() && selectedTags.length === 0) return true;
          
          const matchesSearch = !currentQuery.trim() || 
            card.title.toLowerCase().includes(currentQuery.toLowerCase()) ||
            card.content.toLowerCase().includes(currentQuery.toLowerCase()) ||
            card.explanation.toLowerCase().includes(currentQuery.toLowerCase()) ||
            card.tags.some(tag => tag.toLowerCase().includes(currentQuery.toLowerCase()));
          
          const matchesTags = selectedTags.length === 0 || 
            selectedTags.every(tag => card.tags.includes(tag));
          
          return matchesSearch && matchesTags;
        });
      case 'recent':
        return recentCards.filter(card => {
          if (!currentQuery.trim() && selectedTags.length === 0) return true;
          
          const matchesSearch = !currentQuery.trim() || 
            card.title.toLowerCase().includes(currentQuery.toLowerCase()) ||
            card.content.toLowerCase().includes(currentQuery.toLowerCase()) ||
            card.explanation.toLowerCase().includes(currentQuery.toLowerCase()) ||
            card.tags.some(tag => tag.toLowerCase().includes(currentQuery.toLowerCase()));
          
          const matchesTags = selectedTags.length === 0 || 
            selectedTags.every(tag => card.tags.includes(tag));
          
          return matchesSearch && matchesTags;
        });
      case 'all':
        return filteredCards;
      default:
        return [];
    }
  };

  // Show welcome section only if no cards exist at all
  const showWelcome = userCards.length === 0;

  // Get remaining cards (excluding favorites and recent) for dashboard view
  const remainingCards = useMemo(() => {
    if (activeView !== 'dashboard') return [];
    
    const favoriteIds = new Set(favoriteCards.map(card => card.id));
    const recentIds = new Set(recentCards.map(card => card.id));
    
    return filteredCards.filter(card => 
      !favoriteIds.has(card.id) && !recentIds.has(card.id)
    );
  }, [filteredCards, favoriteCards, recentCards, activeView]);

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) {
      return 'Today';
    } else if (isSameDay(date, yesterday)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  };

  // Netflix-style carousel scroll functions
  const scrollCarousel = (direction: 'left' | 'right', ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return;
    
    const scrollAmount = 320; // Card width + gap
    const currentScroll = ref.current.scrollLeft;
    const newScroll = direction === 'left' 
      ? Math.max(0, currentScroll - scrollAmount)
      : currentScroll + scrollAmount;
    
    ref.current.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    });
  };

  // Clear search and filters
  const clearSearch = () => {
    setLocalSearchQuery('');
    setSelectedTags([]);
    searchCards('');
  };

  // Check if we have search results to show
  const currentQuery = searchQuery || localSearchQuery || globalSearchQuery;
  const hasSearchQuery = currentQuery && currentQuery.trim();
  const hasFilters = selectedTags.length > 0;
  const showSearchResults = hasSearchQuery || hasFilters;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="space-y-8 pb-12">
        {/* Welcome Section - Only show when no cards exist */}
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden"
          >
            {/* Hero Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-3xl"></div>
            <div className="relative text-center py-24 px-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto h-24 w-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mb-8 shadow-2xl"
              >
                <Sparkles className="h-12 w-12 text-white" />
              </motion.div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-6">
                Welcome to Dev Diaries
              </h1>
              <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Your personal knowledge management system. Capture ideas, code snippets, and insights with our powerful rich-text editor.
              </p>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNewCard}
                className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-lg font-semibold rounded-2xl shadow-2xl hover:shadow-blue-500/25 focus:outline-none focus:ring-4 focus:ring-blue-500/25 transition-all duration-300"
              >
                <Plus className="h-6 w-6 mr-3" />
                Create Your First Card
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Search and Filter Section - Only show when cards exist */}
        {!showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative px-8 pt-8"
          >
            {/* Background blur effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 via-slate-700/30 to-slate-800/30 backdrop-blur-xl rounded-3xl mx-8"></div>
            
            <div className="relative space-y-6 p-6">
              {/* Centered Search Bar */}
              <div className="flex justify-center">
                <div className="relative w-full max-w-2xl">
                  <div className="absolute left-6 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                    <Search className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search your knowledge base..."
                    value={localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 transition-all duration-300 text-base"
                  />
                  {(localSearchQuery || selectedTags.length > 0) && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors duration-200 text-lg"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>


              {/* Tags - Dynamic count based on container width */}
              {allTags.length > 0 && (
                <div className="flex justify-center">
                  <div ref={tagsContainerRef} className="w-full max-w-6xl">
                    <div className="flex items-center justify-center space-x-3 overflow-hidden">
                      {allTags.slice(0, visibleTagsCount).map(tag => (

                        <motion.button
                          key={tag}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleTagClick(tag)}
                          className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 whitespace-nowrap ${
                            selectedTags.includes(tag)
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                              : 'bg-white/10 text-slate-300 hover:bg-white/20 border border-white/20 hover:border-white/40'
                          }`}
                        >
                          #{tag}
                        </motion.button>
                      ))}

                      {allTags.length > visibleTagsCount && (
                        <span className="flex-shrink-0 px-3 py-2 bg-white/5 text-slate-400 text-sm rounded-full border border-white/10">
                          +{allTags.length - visibleTagsCount} more

                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Bar - Only show when not searching */}
              {!showSearchResults && (
                <div className="flex justify-center pt-2">
                  <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl p-1.5 border border-white/20">
                    {[
                      { key: 'dashboard', label: 'Dashboard' },
                      { key: 'all', label: 'All Cards' },
                      { key: 'favorites', label: 'Favorites' },
                      { key: 'recent', label: 'Recent' }
                    ].map((view) => (
                      <motion.button
                        key={view.key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveView(view.key as any)}
                        className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                          activeView === view.key
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                            : 'text-slate-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {view.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Search Results View - Show when searching */}
        {!showWelcome && showSearchResults && (
          <div className="px-8">
            <AnimatePresence mode="wait">
              {filteredCards.length > 0 ? (
                <motion.div
                  key="search-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >

                  <h2 className="text-3xl font-bold text-white px-4">
                    🔍 Search Results
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCards.map((card, index) => (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <CardPreview
                          card={card}
                          onToggleFavorite={toggleFavorite}
                          onClick={handleCardClick}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="search-empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center py-16"
                >
                  <div className="mx-auto h-32 w-32 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center mb-6">
                    <Search className="h-16 w-16 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">No cards found</h3>
                  <p className="text-slate-400 mb-8 text-lg max-w-md mx-auto">
                    Try adjusting your search or filter criteria
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNewCard}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/25 transition-all duration-300"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create New Card
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Dashboard View - Only show when not searching */}
        {!showWelcome && !showSearchResults && activeView === 'dashboard' && (
          <div className="space-y-12 px-8">
            {/* Favorites Section with Netflix-style Carousel */}
            {favoriteCards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-white flex items-center">
                    ⭐ Favorites
                  </h2>
                </div>
                
                {/* Netflix-style carousel container */}
                <div className="relative group">
                  {/* Left arrow */}
                  {favoritesCanScrollLeft && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => scrollCarousel('left', favoritesScrollRef)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/70 hover:bg-black/90 text-white rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </motion.button>
                  )}
                  
                  {/* Right arrow */}
                  {favoritesCanScrollRight && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => scrollCarousel('right', favoritesScrollRef)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/70 hover:bg-black/90 text-white rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </motion.button>
                  )}
                  
                  {/* Carousel content */}
                  <div 
                    ref={favoritesScrollRef}
                    className="flex space-x-6 overflow-x-auto scrollbar-hide scroll-smooth px-4 py-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {favoriteCards.map((card, index) => (
                      <div
                        key={card.id}
                        className="flex-shrink-0 w-80"
                      >
                        <CardPreview
                          card={card}
                          onToggleFavorite={toggleFavorite}
                          onClick={handleCardClick}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Recent Cards Section with Netflix-style Carousel */}
            {recentCards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-white flex items-center">
                    🕒 Recently Updated
                  </h2>
                </div>
                
                {/* Netflix-style carousel container */}
                <div className="relative group">
                  {/* Left arrow */}
                  {recentCanScrollLeft && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => scrollCarousel('left', recentScrollRef)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/70 hover:bg-black/90 text-white rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </motion.button>
                  )}
                  
                  {/* Right arrow */}
                  {recentCanScrollRight && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => scrollCarousel('right', recentScrollRef)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/70 hover:bg-black/90 text-white rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </motion.button>
                  )}
                  
                  {/* Carousel content */}
                  <div 
                    ref={recentScrollRef}
                    className="flex space-x-6 overflow-x-auto scrollbar-hide scroll-smooth px-4 py-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {recentCards.map((card, index) => (
                      <div
                        key={card.id}
                        className="flex-shrink-0 w-80"
                      >
                        <CardPreview
                          card={card}
                          onToggleFavorite={toggleFavorite}
                          onClick={handleCardClick}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Remaining Cards */}
            {remainingCards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-bold text-white px-4">📚 More Cards</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4">
                  {remainingCards.slice(0, 8).map((card, index) => (
                    <div key={card.id}>
                      <CardPreview
                        card={card}
                        onToggleFavorite={toggleFavorite}
                        onClick={handleCardClick}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* All Cards View with Date Grouping - Only show when not searching */}
        {!showWelcome && !showSearchResults && activeView === 'all' && (
          <div className="px-8">
            <AnimatePresence mode="wait">
              {groupedCards.length > 0 ? (
                <motion.div
                  key="all-cards-grouped"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-12"
                >
                  {groupedCards.map(([dateKey, cardsForDate], groupIndex) => (
                    <motion.div
                      key={dateKey}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: groupIndex * 0.1 }}
                      className="space-y-6"
                    >
                      {/* Date Header */}
                      <div className="flex items-baseline space-x-4">
                        <h3 className="text-2xl font-bold text-white">
                          {formatDateHeader(dateKey)}
                        </h3>
                        <span className="text-sm text-slate-400">
                          {cardsForDate.length} {cardsForDate.length === 1 ? 'card' : 'cards'}
                        </span>
                      </div>
                      
                      {/* Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {cardsForDate.map((card, cardIndex) => (
                          <div key={card.id}>
                            <CardPreview
                              card={card}
                              onToggleFavorite={toggleFavorite}
                              onClick={handleCardClick}
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="all-cards-empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center py-16"
                >
                  <div className="mx-auto h-32 w-32 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center mb-6">
                    <Search className="h-16 w-16 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">No cards found</h3>
                  <p className="text-slate-400 mb-8 text-lg max-w-md mx-auto">
                    Try adjusting your search or filter criteria
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNewCard}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/25 transition-all duration-300"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create New Card
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Favorites and Recent Views - Only show when not searching */}
        {!showWelcome && !showSearchResults && (activeView === 'favorites' || activeView === 'recent') && (
          <div className="px-8">
            <AnimatePresence mode="wait">
              {getDisplayCards().length > 0 ? (
                <motion.div
                  key={`${activeView}-grid`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {getDisplayCards().map((card, index) => (
                      <div key={card.id}>
                        <CardPreview
                          card={card}
                          onToggleFavorite={toggleFavorite}
                          onClick={handleCardClick}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={`${activeView}-empty`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center py-16"
                >
                  <div className="mx-auto h-32 w-32 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center mb-6">
                    <Search className="h-16 w-16 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {activeView === 'favorites' && 'No favorite cards'}
                    {activeView === 'recent' && 'No recent cards'}
                  </h3>
                  <p className="text-slate-400 mb-8 text-lg max-w-md mx-auto">
                    {(localSearchQuery || selectedTags.length > 0) 
                      ? 'Try adjusting your search or filter criteria'
                      : activeView === 'favorites' 
                        ? 'Mark some cards as favorites to see them here'
                        : 'Create your first card to get started'
                    }
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNewCard}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/25 transition-all duration-300"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create New Card
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};