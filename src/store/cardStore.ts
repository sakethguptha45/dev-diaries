import { create } from 'zustand';
import { Card, CardState } from '../types';
import { CardService } from '../services/card.service';
import { sortBy } from '../utils/array';

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  loading: false,
  searchQuery: '',
  selectedTags: [],
  
  addCard: async (cardData) => {
    try {
      set({ loading: true });
      
      const newCard = await CardService.createCard(cardData);
      
      if (newCard) {
        set((state) => ({
          cards: [newCard, ...state.cards],
          loading: false
        }));
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error adding card:', error);
      set({ loading: false });
    }
  },
  
  updateCard: async (id, updates) => {
    try {
      set({ loading: true });
      
      const updatedCard = await CardService.updateCard(id, updates);
      
      if (updatedCard) {
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id ? updatedCard : card
          ),
          loading: false
        }));
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error updating card:', error);
      set({ loading: false });
    }
  },
  
  deleteCard: async (id) => {
    try {
      set({ loading: true });
      
      const success = await CardService.deleteCard(id);
      
      if (success) {
        set((state) => ({
          cards: state.cards.filter((card) => card.id !== id),
          loading: false
        }));
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      set({ loading: false });
    }
  },
  
  toggleFavorite: async (id) => {
    try {
      const card = get().cards.find(c => c.id === id);
      if (!card) return;

      const success = await CardService.toggleFavorite(id, card.favorite);
      
      if (success) {
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id
              ? { ...card, favorite: !card.favorite }
              : card
          ),
        }));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  },

  loadUserCards: async (userId: string) => {
    try {
      set({ loading: true });
      
      const cards = await CardService.getUserCards(userId);
      
      set({ cards, loading: false });
    } catch (error) {
      console.error('Error loading cards:', error);
      set({ loading: false });
    }
  },

  searchCards: (query) => {
    set({ searchQuery: query });
  },

  filterByTags: (tags) => {
    set({ selectedTags: tags });
  },

  getRecentCards: () => {
    const { cards } = get();
    return sortBy(cards, (card) => card.updatedAt, 'desc').slice(0, 10);
  },

  getFavoriteCards: () => {
    const { cards } = get();
    return sortBy(
      cards.filter(card => card.favorite),
      (card) => card.updatedAt,
      'desc'
    );
  },

  getAllTags: () => {
    const { cards } = get();
    const tagSet = new Set<string>();
    cards.forEach(card => {
      card.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  },

  getUserCards: (userId) => {
    const { cards } = get();
    return cards.filter(card => card.userId === userId);
  },
  
  getCardById: (id) => {
    return get().cards.find((card) => card.id === id);
  },
}));