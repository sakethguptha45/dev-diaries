import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { UI_CONSTANTS } from '../../constants';

interface SearchSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  onTagClick: (tag: string) => void;
  allTags: string[];
  onClearSearch: () => void;
  visibleTagsCount: number;
  onTagsContainerRef: (ref: HTMLDivElement | null) => void;
}

export const SearchSection: React.FC<SearchSectionProps> = ({
  searchQuery,
  onSearchChange,
  selectedTags,
  onTagClick,
  allTags,
  onClearSearch,
  visibleTagsCount,
  onTagsContainerRef,
}) => {
  const hasFilters = searchQuery.trim() || selectedTags.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative px-8 pt-8"
    >
      {/* Background blur effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 via-slate-700/30 to-slate-800/30 backdrop-blur-xl rounded-3xl mx-8"></div>
      
      <div className="relative space-y-6 p-6">
        {/* Search Bar */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-2xl">
            <div className="absolute left-6 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search your knowledge base..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-14 pr-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 transition-all duration-300 text-base"
            />
            {hasFilters && (
              <button
                onClick={onClearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors duration-200 text-lg z-10"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex justify-center">
            <div ref={onTagsContainerRef} className="w-full max-w-6xl">
              <div className="flex items-center justify-center space-x-3 overflow-hidden">
                {allTags.slice(0, visibleTagsCount).map(tag => (
                  <motion.button
                    key={tag}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onTagClick(tag)}
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
      </div>
    </motion.div>
  );
};