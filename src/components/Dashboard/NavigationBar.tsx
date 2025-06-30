import React from 'react';
import { motion } from 'framer-motion';

export type ViewType = 'dashboard' | 'all' | 'favorites' | 'recent';

interface NavigationBarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const views = [
  { key: 'dashboard' as const, label: 'Dashboard' },
  { key: 'all' as const, label: 'All Cards' },
  { key: 'favorites' as const, label: 'Favorites' },
  { key: 'recent' as const, label: 'Recent' }
];

export const NavigationBar: React.FC<NavigationBarProps> = ({
  activeView,
  onViewChange,
}) => {
  return (
    <div className="flex justify-center pt-2">
      <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl p-1.5 border border-white/20">
        {views.map((view) => (
          <motion.button
            key={view.key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewChange(view.key)}
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
  );
};