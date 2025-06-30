import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useDashboard } from '../../hooks/useDashboard';
import { WelcomeSection } from './WelcomeSection';
import { SearchSection } from './SearchSection';
import { NavigationBar } from './NavigationBar';
import { CarouselSection } from './CarouselSection';
import { CardGrid } from './CardGrid';
import { GroupedCardView } from './GroupedCardView';
import { EmptyState } from './EmptyState';

interface DashboardProps {
  searchQuery?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ searchQuery = '' }) => {
  const {
    // State
    recentCards,
    favoriteCards,
    remainingCards,
    allTags,
    selectedTags,
    localSearchQuery,
    activeView,
    visibleTagsCount,
    showSearchResults,
    showWelcome,
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
  } = useDashboard(searchQuery);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="space-y-8 pb-12">
        {/* Welcome Section - Only show when no cards exist */}
        {showWelcome && (
          <WelcomeSection onCreateCard={handleNewCard} />
        )}

        {/* Search and Filter Section - Only show when cards exist */}
        {!showWelcome && (
          <SearchSection
            searchQuery={localSearchQuery}
            onSearchChange={setLocalSearchQuery}
            selectedTags={selectedTags}
            onTagClick={handleTagClick}
            allTags={allTags}
            onClearSearch={clearSearch}
            visibleTagsCount={visibleTagsCount}
            tagsContainerRef={tagsContainerRef}
          />
        )}

        {/* Navigation Bar - Only show when not searching */}
        {!showWelcome && !showSearchResults && (
          <div className="px-8">
            <NavigationBar
              activeView={activeView}
              onViewChange={setActiveView}
            />
          </div>
        )}

        {/* Search Results View - Show when searching */}
        {!showWelcome && showSearchResults && (
          <div className="px-8">
            <AnimatePresence mode="wait">
              {getDisplayCards().length > 0 ? (
                <CardGrid
                  key="search-results"
                  cards={getDisplayCards()}
                  onToggleFavorite={toggleFavorite}
                  onCardClick={handleCardClick}
                  title="🔍 Search Results"
                />
              ) : (
                <EmptyState
                  key="search-empty"
                  type="search"
                  onCreateCard={handleNewCard}
                />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Dashboard View - Only show when not searching */}
        {!showWelcome && !showSearchResults && activeView === 'dashboard' && (
          <div className="space-y-12 px-8">
            {/* Recently Updated Section */}
            <CarouselSection
              title="Recently Updated"
              emoji="🕒"
              cards={recentCards}
              onToggleFavorite={toggleFavorite}
              onCardClick={handleCardClick}
            />

            {/* Favorites Section */}
            <CarouselSection
              title="Favorites"
              emoji="⭐"
              cards={favoriteCards}
              onToggleFavorite={toggleFavorite}
              onCardClick={handleCardClick}
            />

            {/* Remaining Cards */}
            <CardGrid
              cards={remainingCards.slice(0, 8)}
              onToggleFavorite={toggleFavorite}
              onCardClick={handleCardClick}
              title="📚 More Cards"
            />
          </div>
        )}

        {/* All Cards View with Date Grouping - Only show when not searching */}
        {!showWelcome && !showSearchResults && activeView === 'all' && (
          <div className="px-8">
            <AnimatePresence mode="wait">
              {getDisplayCards().length > 0 ? (
                <GroupedCardView
                  key="all-cards-grouped"
                  cards={getDisplayCards()}
                  onToggleFavorite={toggleFavorite}
                  onCardClick={handleCardClick}
                />
              ) : (
                <EmptyState
                  key="all-cards-empty"
                  type="general"
                  onCreateCard={handleNewCard}
                />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Favorites and Recent Views - Only show when not searching */}
        {!showWelcome && !showSearchResults && (activeView === 'favorites' || activeView === 'recent') && (
          <div className="px-8">
            <AnimatePresence mode="wait">
              {getDisplayCards().length > 0 ? (
                <CardGrid
                  key={`${activeView}-grid`}
                  cards={getDisplayCards()}
                  onToggleFavorite={toggleFavorite}
                  onCardClick={handleCardClick}
                />
              ) : (
                <EmptyState
                  key={`${activeView}-empty`}
                  type={activeView}
                  onCreateCard={handleNewCard}
                  hasFilters={hasFilters}
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};