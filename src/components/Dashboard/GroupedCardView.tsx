import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../types';
import { CardPreview } from '../Cards/CardPreview';
import { formatDateHeader } from '../../utils/date';
import { groupBy } from '../../utils/array';
import { format } from 'date-fns';

interface GroupedCardViewProps {
  cards: Card[];
  onToggleFavorite: (id: string) => void;
  onCardClick: (card: Card) => void;
}

export const GroupedCardView: React.FC<GroupedCardViewProps> = ({
  cards,
  onToggleFavorite,
  onCardClick,
}) => {
  const groupedCards = React.useMemo(() => {
    const groups = groupBy(cards, (card) => format(card.updatedAt, 'yyyy-MM-dd'));
    
    // Sort groups by date (newest first)
    return Object.entries(groups).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  }, [cards]);

  return (
    <motion.div
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
            {cardsForDate.map((card) => (
              <div key={card.id}>
                <CardPreview
                  card={card}
                  onToggleFavorite={onToggleFavorite}
                  onClick={onCardClick}
                />
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};