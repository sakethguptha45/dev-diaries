import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../../types';
import { CardPreview } from '../Cards/CardPreview';

interface CarouselSectionProps {
  title: string;
  emoji: string;
  cards: Card[];
  onToggleFavorite: (id: string) => void;
  onCardClick: (card: Card) => void;
}

export const CarouselSection: React.FC<CarouselSectionProps> = ({
  title,
  emoji,
  cards,
  onToggleFavorite,
  onCardClick,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    const element = scrollRef.current;
    if (element) {
      element.addEventListener('scroll', updateScrollButtons);
      updateScrollButtons(); // Initial check
    }

    return () => {
      if (element) {
        element.removeEventListener('scroll', updateScrollButtons);
      }
    };
  }, [cards.length]);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const scrollAmount = 320; // Card width + gap
    const currentScroll = scrollRef.current.scrollLeft;
    const newScroll = direction === 'left' 
      ? Math.max(0, currentScroll - scrollAmount)
      : currentScroll + scrollAmount;
    
    scrollRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    });
  };

  if (cards.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white flex items-center">
          {emoji} {title}
        </h2>
      </div>
      
      {/* Carousel container */}
      <div className="relative group">
        {/* Left arrow */}
        {canScrollLeft && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => scrollCarousel('left')}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/70 hover:bg-black/90 text-white rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </motion.button>
        )}
        
        {/* Right arrow */}
        {canScrollRight && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => scrollCarousel('right')}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/70 hover:bg-black/90 text-white rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="h-6 w-6" />
          </motion.button>
        )}
        
        {/* Carousel content */}
        <div 
          ref={scrollRef}
          className="flex space-x-6 overflow-x-auto scrollbar-hide scroll-smooth px-4 py-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex-shrink-0 w-80"
            >
              <CardPreview
                card={card}
                onToggleFavorite={onToggleFavorite}
                onClick={onCardClick}
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};