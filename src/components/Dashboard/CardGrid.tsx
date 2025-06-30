import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../types';
import { CardPreview } from '../Cards/CardPreview';

interface CardGridProps {
  cards: Card[];
  onToggleFavorite: (id: string) => void;
  onCardClick: (card: Card) => void;
  title?: string;
}

export const CardGrid: React.FC<CardGridProps> = ({
  cards,
  onToggleFavorite,
  onCardClick,
  title,
}) => {
  if (cards.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {title && (
        <h2 className="text-3xl font-bold text-white px-4">{title}</h2>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <CardPreview
              card={card}
              onToggleFavorite={onToggleFavorite}
              onClick={onCardClick}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};