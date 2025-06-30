import React, { useState } from 'react';
import { format } from 'date-fns';
import { Heart, FileHeart as HeartFilled, ExternalLink, Calendar, Tag } from 'lucide-react';
import { Card } from '../../types';

interface CardPreviewProps {
  card: Card;
  onToggleFavorite: (id: string) => void;
  onClick: (card: Card) => void;
}

export const CardPreview: React.FC<CardPreviewProps> = ({
  card,
  onToggleFavorite,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getContentPreview = (content: string) => {
    // Strip HTML tags and get plain text preview
    const textContent = content.replace(/<[^>]*>/g, '');
    return textContent.substring(0, 120) + (textContent.length > 120 ? '...' : '');
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(card.id);
  };

  // Ensure we have a Date object
  const ensureDate = (date: Date | string): Date => {
    return date instanceof Date ? date : new Date(date);
  };

  return (
    <div
      onClick={() => onClick(card)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-sm rounded-2xl border border-white/30 shadow-xl cursor-pointer overflow-hidden h-80 flex flex-col transition-all duration-300 ${
        isHovered ? 'transform -translate-y-2 scale-105 shadow-2xl' : ''
      }`}
    >
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 transition-opacity duration-300 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`} />
      
      {/* Subtle glow effect */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 blur-xl transition-opacity duration-300 -z-10 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`} />
      
      <div className="relative p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg font-bold line-clamp-2 mb-2 transition-colors duration-200 ${
              isHovered ? 'text-blue-600' : 'text-gray-900'
            }`}>
              {card.title || 'Untitled'}
            </h3>
            <div className="flex items-center space-x-3 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{format(ensureDate(card.updatedAt), 'MMM d, yyyy')}</span>
              </div>
              {card.tags.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Tag className="h-3 w-3" />
                  <span>{card.tags.length} tags</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleFavoriteClick}
            className={`p-2 rounded-full transition-all duration-200 flex-shrink-0 hover:scale-110 ${
              card.favorite
                ? 'text-red-500 bg-red-50 hover:bg-red-100 shadow-lg shadow-red-500/25'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
          >
            {card.favorite ? (
              <HeartFilled className="h-4 w-4" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Content Preview - Fixed height */}
        <div className="flex-1 mb-4 overflow-hidden">
          {card.content && (
            <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
              {getContentPreview(card.content)}
            </p>
          )}
        </div>

        {/* Links Preview */}
        {card.links.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <ExternalLink className="h-3 w-3 text-purple-500" />
              <span className="text-xs text-purple-600 font-medium">
                {card.links.length} {card.links.length === 1 ? 'link' : 'links'}
              </span>
            </div>
          </div>
        )}

        {/* Tags - Fixed at bottom */}
        <div className="mt-auto">
          {card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {card.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200/50 hover:from-blue-100 hover:to-purple-100 transition-all duration-200"
                >
                  #{tag}
                </span>
              ))}
              {card.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full border border-gray-200">
                  +{card.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Hover indicator */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-transform duration-300 origin-left ${
          isHovered ? 'scale-x-100' : 'scale-x-0'
        }`} />
      </div>
    </div>
  );
};