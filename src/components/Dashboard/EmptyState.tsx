import React from 'react';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { Button } from '../UI/Button';

interface EmptyStateProps {
  type: 'search' | 'favorites' | 'recent' | 'general';
  onCreateCard: () => void;
  hasFilters?: boolean;
}

const emptyStateConfig = {
  search: {
    title: 'No cards found',
    description: 'Try adjusting your search or filter criteria',
    icon: Search,
  },
  favorites: {
    title: 'No favorite cards',
    description: 'Mark some cards as favorites to see them here',
    icon: Search,
  },
  recent: {
    title: 'No recent cards',
    description: 'Create your first card to get started',
    icon: Search,
  },
  general: {
    title: 'No cards found',
    description: 'Try adjusting your search or filter criteria',
    icon: Search,
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  onCreateCard,
  hasFilters = false,
}) => {
  const config = emptyStateConfig[type];
  const IconComponent = config.icon;

  const getDescription = () => {
    if (hasFilters && (type === 'favorites' || type === 'recent')) {
      return 'Try adjusting your search or filter criteria';
    }
    return config.description;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="text-center py-16"
    >
      <div className="mx-auto h-32 w-32 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center mb-6">
        <IconComponent className="h-16 w-16 text-slate-400" />
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-3">{config.title}</h3>
      
      <p className="text-slate-400 mb-8 text-lg max-w-md mx-auto">
        {getDescription()}
      </p>
      
      <Button
        onClick={onCreateCard}
        icon={Plus}
        size="lg"
        className="shadow-xl"
      >
        Create New Card
      </Button>
    </motion.div>
  );
};