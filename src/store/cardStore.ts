import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Card } from '../types';

interface CardState {
  cards: Card[];
  loading: boolean;
  searchQuery: string;
  selectedTags: string[];
  addCard: (card: Omit<Card, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  toggleFavorite: (id: string) => void;
  searchCards: (query: string) => void;
  filterByTags: (tags: string[]) => void;
  getRecentCards: () => Card[];
  getFavoriteCards: () => Card[];
  getAllTags: () => string[];
  getUserCards: (userId: string) => Card[];
  getCardById: (id: string) => Card | undefined;
}

export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      cards: [],
      loading: false,
      searchQuery: '',
      selectedTags: [],
      
      addCard: (cardData) => {
        const newCard: Card = {
          ...cardData,
          id: crypto.randomUUID(),
          userId: cardData.userId || '', // Ensure userId is set
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          cards: [...state.cards, newCard],
        }));
      },
      
      updateCard: (id, updates) => {
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id
              ? { ...card, ...updates, updatedAt: new Date() }
              : card
          ),
        }));
      },
      
      deleteCard: (id) => {
        set((state) => ({
          cards: state.cards.filter((card) => card.id !== id),
        }));
      },
      
      toggleFavorite: (id) => {
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id
              ? { ...card, favorite: !card.favorite, updatedAt: new Date() }
              : card
          ),
        }));
      },

      searchCards: (query) => {
        set({ searchQuery: query });
      },

      filterByTags: (tags) => {
        set({ selectedTags: tags });
      },

      getRecentCards: () => {
        const { cards } = get();
        return cards
          .filter(card => card.updatedAt)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 10);
      },

      getFavoriteCards: () => {
        const { cards } = get();
        return cards
          .filter(card => card.favorite)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
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
    }),
    {
      name: 'card-store',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle migration from version 0 to version 1
        if (version === 0) {
          return {
            ...persistedState,
            cards: persistedState.cards || [], // Ensure cards is always an array
            loading: persistedState.loading || false,
            searchQuery: persistedState.searchQuery || '',
            selectedTags: persistedState.selectedTags || [],
          };
        }
        return persistedState;
      },
      // Custom serialization to handle Date objects
      serialize: (state) => {
        return JSON.stringify({
          ...state,
          cards: (state.cards || []).map(card => ({
            ...card,
            createdAt: card.createdAt.toISOString(),
            updatedAt: card.updatedAt.toISOString()
          }))
        });
      },
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        return {
          ...parsed,
          cards: parsed.cards?.map((card: any) => ({
            ...card,
            createdAt: new Date(card.createdAt),
            updatedAt: new Date(card.updatedAt)
          })) || []
        };
      },
    }
  )
);