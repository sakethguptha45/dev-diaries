import React from 'react';
import { format } from 'date-fns';
import { Heart, FileHeart as HeartFilled, Code, FileText, Link as LinkIcon, File, Edit, Trash2, ExternalLink } from 'lucide-react';
import { Card } from '../../types';

interface CardItemProps {
  card: Card;
  onToggleFavorite: (id: string) => void;
  onEdit: (card: Card) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

const cardTypeIcons = {
  note: FileText,
  code: Code,
  link: LinkIcon,
  file: File
};

const cardTypeColors = {
  note: 'bg-blue-50 text-blue-600 border-blue-200',
  code: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  link: 'bg-purple-50 text-purple-600 border-purple-200',
  file: 'bg-orange-50 text-orange-600 border-orange-200'
};

export const CardItem: React.FC<CardItemProps> = ({
  card,
  onToggleFavorite,
  onEdit,
  onDelete,
  compact = false
}) => {
  const IconComponent = cardTypeIcons[card.type];
  const colorClass = cardTypeColors[card.type];

  const getContentPreview = (content: string) => {
    if (card.type === 'code') {
      return content.split('\n').slice(0, 3).join('\n');
    }
    return content.substring(0, 200) + (content.length > 200 ? '...' : '');
  };

  return (
    <div className={`group bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg border ${colorClass}`}>
            <IconComponent className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
              {card.title}
            </h3>
            <p className="text-sm text-gray-500">
              {format(card.updatedAt, 'MMM d, yyyy')} • {card.type}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onToggleFavorite(card.id)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              card.favorite
                ? 'text-red-500 hover:bg-red-50'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
          >
            {card.favorite ? (
              <HeartFilled className="h-4 w-4" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => onEdit(card)}
            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(card.id)}
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content Preview */}
      {!compact && card.content && (
        <div className="mb-4">
          {card.type === 'code' ? (
            <pre className="bg-gray-50 rounded-lg p-3 text-sm font-mono text-gray-800 overflow-x-auto border">
              <code>{getContentPreview(card.content)}</code>
            </pre>
          ) : (
            <p className="text-gray-700 text-sm leading-relaxed">
              {getContentPreview(card.content)}
            </p>
          )}
        </div>
      )}

      {/* Explanation */}
      {!compact && card.explanation && (
        <div className="mb-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-800 italic">
            {card.explanation.substring(0, 150) + (card.explanation.length > 150 ? '...' : '')}
          </p>
        </div>
      )}

      {/* Links */}
      {!compact && card.links.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {card.links.slice(0, 2).map((link, index) => (
              <a
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full hover:bg-purple-100 transition-colors duration-200 border border-purple-200"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Link {index + 1}
              </a>
            ))}
            {card.links.length > 2 && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full border">
                +{card.links.length - 2} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {card.tags.slice(0, compact ? 3 : 5).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200 transition-colors duration-200 cursor-pointer border"
            >
              #{tag}
            </span>
          ))}
          {card.tags.length > (compact ? 3 : 5) && (
            <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded-md border">
              +{card.tags.length - (compact ? 3 : 5)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};