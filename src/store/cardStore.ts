import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Card, CardState } from '../types';

// Mock data for demonstration - now user-specific
const mockCards: Card[] = [
  {
    id: '1',
    userId: '1', // Demo user
    title: 'React Hooks Best Practices',
    type: 'code',
    content: `import { useState, useEffect, useCallback } from 'react';

// Custom hook for API calls
export const useApi = (url: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(url);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('API Error:', error);
    } finally {
      setLoading(false);
    }
  }, [url]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, refetch: fetchData };
};`,
    explanation: 'A reusable custom hook pattern for handling API calls with loading states and error handling. This pattern helps keep components clean and promotes code reuse.',
    links: ['https://react.dev/reference/react/hooks'],
    files: [],
    tags: ['react', 'hooks', 'javascript', 'api'],
    favorite: true,
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:30:00')
  },
  {
    id: '2',
    userId: '1', // Demo user
    title: 'CSS Grid Layout Guide',
    type: 'note',
    content: `# CSS Grid Layout Fundamentals

CSS Grid Layout is a two-dimensional layout method that allows you to create complex layouts with ease.

## Basic Grid Container
\`\`\`css
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto;
  gap: 1rem;
}
\`\`\`

## Grid Areas
You can define named grid areas for better semantic layout:

\`\`\`css
.layout {
  display: grid;
  grid-template-areas: 
    "header header header"
    "sidebar main aside"
    "footer footer footer";
}
\`\`\``,
    explanation: 'Comprehensive guide to CSS Grid Layout covering the fundamentals, grid areas, and practical examples for modern web layouts.',
    links: ['https://css-tricks.com/snippets/css/complete-guide-grid/'],
    files: [],
    tags: ['css', 'grid', 'layout', 'frontend'],
    favorite: false,
    createdAt: new Date('2024-01-14T14:20:00'),
    updatedAt: new Date('2024-01-14T16:45:00')
  },
  {
    id: '3',
    userId: '1', // Demo user
    title: 'TypeScript Utility Types',
    type: 'code',
    content: `// Utility types for better TypeScript development

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  isActive: boolean;
}

// Pick specific properties
type UserSummary = Pick<User, 'id' | 'name' | 'email'>;

// Omit properties
type CreateUserInput = Omit<User, 'id'>;

// Make all properties optional
type PartialUser = Partial<User>;

// Make all properties required
type RequiredUser = Required<Partial<User>>;

// Extract keys as union type
type UserKeys = keyof User; // 'id' | 'name' | 'email' | 'age' | 'isActive'`,
    explanation: 'Essential TypeScript utility types that help create more maintainable and type-safe code. These utilities reduce code duplication and improve type inference.',
    links: ['https://www.typescriptlang.org/docs/handbook/utility-types.html'],
    files: [],
    tags: ['typescript', 'types', 'utilities', 'development'],
    favorite: true,
    createdAt: new Date('2024-01-13T09:15:00'),
    updatedAt: new Date('2024-01-13T09:15:00')
  }
];

// Helper function to ensure dates are Date objects
const ensureDate = (date: string | Date): Date => {
  return typeof date === 'string' ? new Date(date) : date;
};

// Helper function to convert cards with proper date objects
const normalizeCards = (cards: Card[]): Card[] => {
  return cards.map(card => ({
    ...card,
    createdAt: ensureDate(card.createdAt),
    updatedAt: ensureDate(card.updatedAt)
  }));
};

export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      cards: mockCards,
      loading: false,
      searchQuery: '',
      selectedTags: [],

      addCard: (cardData) => {
        const newCard: Card = {
          ...cardData,
          id: Math.random().toString(36).substring(7),
          userId: '1', // For now, use demo user ID - in real app, get from auth
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set((state) => ({
          cards: [newCard, ...normalizeCards(state.cards)]
        }));
      },

      updateCard: (id, updates) => {
        set((state) => ({
          cards: normalizeCards(state.cards).map((card) =>
            card.id === id
              ? { ...card, ...updates, updatedAt: new Date() }
              : card
          )
        }));
      },

      deleteCard: (id) => {
        set((state) => ({
          cards: normalizeCards(state.cards).filter((card) => card.id !== id)
        }));
      },

      toggleFavorite: (id) => {
        set((state) => ({
          cards: normalizeCards(state.cards).map((card) =>
            card.id === id
              ? { ...card, favorite: !card.favorite, updatedAt: new Date() }
              : card
          )
        }));
      },

      searchCards: (query) => {
        set({ searchQuery: query });
      },

      filterByTags: (tags) => {
        set({ selectedTags: tags });
      },

      getUserCards: (userId) => {
        const { cards } = get();
        const normalizedCards = normalizeCards(cards);
        return normalizedCards.filter(card => card.userId === userId);
      },

      getRecentCards: () => {
        const { cards } = get();
        const normalizedCards = normalizeCards(cards);
        // Filter by current user (demo user for now)
        const userCards = normalizedCards.filter(card => card.userId === '1');
        return userCards
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .slice(0, 5);
      },

      getFavoriteCards: () => {
        const { cards } = get();
        const normalizedCards = normalizeCards(cards);
        // Filter by current user (demo user for now)
        const userCards = normalizedCards.filter(card => card.userId === '1');
        return userCards
          .filter((card) => card.favorite)
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .slice(0, 5);
      },

      getAllTags: () => {
        const { cards } = get();
        const normalizedCards = normalizeCards(cards);
        // Filter by current user (demo user for now)
        const userCards = normalizedCards.filter(card => card.userId === '1');
        const allTags = userCards.flatMap((card) => card.tags);
        return Array.from(new Set(allTags)).sort().slice(0, 8); // Limit to 8 tags
      }
    }),
    {
      name: 'card-store',
      // Custom serialization to handle dates properly
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
          cards: normalizeCards(parsed.cards || [])
        };
      }
    }
  )
);