import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCardStore } from '../store/cardStore';
import { useAuthStore } from '../store/authStore';
import { useDebounce } from './useDebounce';
import { Card } from '../types';
import { ROUTES, UI_CONSTANTS } from '../constants';
import { normalizeDate } from '../utils/date';

export type ViewType = 'dashboard' | 'all' | 'favorites' | 'recent';

export const useDashboard = (searchQuery?: string) => {
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
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [visibleTagsCount, setVisibleTagsCount] = useState(UI_CONSTANTS.MAX_TAGS_VISIBLE);
  
  const tagsContainerRef = useRef<HTMLDivElement>(null);
  
  // Debounce search query for performance
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);

  // Get user-specific cards
  const userCards = useMemo(() => {
    if (!user) return [];
    return cards
      .filter(card => card.userId === user.id)
      .map(card => ({
        ...card,
        createdAt: normalizeDate(card.createdAt),
        updatedAt: normalizeDate(card.updatedAt)
      }));
  }, [cards, user]);

  const recentCards = getRecentCards();
  const favoriteCards = getFavoriteCards();
  const allTags = getAllTags();

  // Update search in store when debounced search changes
  useEffect(() => {
    searchCards(debouncedSearchQuery);
  }, [debouncedSearchQuery, searchCards]);

  // Calculate visible tags based on container width
  useEffect(() => {
    const calculateVisibleTags = () => {
      if (!tagsContainerRef.current || allTags.length === 0) return;

      const container = tagsContainerRef.current;
      const containerWidth = container.offsetWidth;
      const avgTagWidth = 120;
      const maxTags = Math.floor(containerWidth / avgTagWidth);
      const calculatedCount = Math.max(6, Math.min(maxTags, allTags.length));
      
      setVisibleTagsCount(calculatedCount);
    };

    calculateVisibleTags();
    window.addEventListener('resize', calculateVisibleTags);
    
    return () => window.removeEventListener('resize', calculateVisibleTags);
  }, [allTags.length]);

  // Filter cards based on search query and selected tags
  const filteredCards = useMemo(() => {
    let filtered = [...userCards];
    const currentQuery = searchQuery || debouncedSearchQuery || globalSearchQuery;

    // Apply search filter
    if (currentQuery?.trim()) {
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
  }, [userCards, searchQuery, debouncedSearchQuery, globalSearchQuery, selectedTags]);

  // Get remaining cards (excluding favorites and recent) for dashboard view
  const remainingCards = useMemo(() => {
    if (activeView !== 'dashboard') return [];
    
    const favoriteIds = new Set(favoriteCards.map(card => card.id));
    const recentIds = new Set(recentCards.map(card => card.id));
    
    return filteredCards.filter(card => 
      !favoriteIds.has(card.id) && !recentIds.has(card.id)
    );
  }, [filteredCards, favoriteCards, recentCards, activeView]);

  const handleNewCard = () => {
    navigate(ROUTES.EDITOR);
  };

  const handleCardClick = (card: Card) => {
    navigate(`${ROUTES.EDITOR}/${card.id}`);
  };

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearSearch = () => {
    setLocalSearchQuery('');
    setSelectedTags([]);
    searchCards('');
  };

  const getDisplayCards = () => {
    const currentQuery = searchQuery || debouncedSearchQuery || globalSearchQuery;
    
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

  // Check if we have search results to show
  const currentQuery = searchQuery || debouncedSearchQuery || globalSearchQuery;
  const hasSearchQuery = currentQuery && currentQuery.trim();
  const hasFilters = selectedTags.length > 0;
  const showSearchResults = hasSearchQuery || hasFilters;

  return {
    // State
    userCards,
    recentCards,
    favoriteCards,
    remainingCards,
    filteredCards,
    allTags,
    selectedTags,
    localSearchQuery,
    activeView,
    visibleTagsCount,
    showSearchResults,
    hasFilters,
    
    // Refs
    tagsContainerRef,
    
    // Handlers
    handleNewCard,
    handleCardClick,
    handleTagClick,
    clearSearch,
    toggleFavorite,
    setLocalSearchQuery,
    setActiveView,
    getDisplayCards,
    
    // Computed
    showWelcome: userCards.length === 0,
  };
};