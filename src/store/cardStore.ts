import { create } from 'zustand';
import { Card, CardState } from '../types';
import { supabase } from '../lib/supabase';

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  loading: false,
  searchQuery: '',
  selectedTags: [],
  
  addCard: async (cardData) => {
    try {
      set({ loading: true });
      
      const { data, error } = await supabase
        .from('cards')
        .insert({
          title: cardData.title,
          type: cardData.type,
          content: cardData.content,
          explanation: cardData.explanation,
          links: cardData.links,
          files: cardData.files,
          tags: cardData.tags,
          favorite: cardData.favorite,
          user_id: cardData.userId
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding card:', error);
        return;
      }

      if (data) {
        const newCard: Card = {
          id: data.id,
          userId: data.user_id,
          title: data.title,
          type: data.type,
          content: data.content,
          explanation: data.explanation,
          links: data.links,
          files: data.files,
          tags: data.tags,
          favorite: data.favorite,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };

        set((state) => ({
          cards: [...state.cards, newCard],
          loading: false
        }));
      }
    } catch (error) {
      console.error('Error adding card:', error);
      set({ loading: false });
    }
  },
  
  updateCard: async (id, updates) => {
    try {
      set({ loading: true });
      
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.explanation !== undefined) updateData.explanation = updates.explanation;
      if (updates.links !== undefined) updateData.links = updates.links;
      if (updates.files !== undefined) updateData.files = updates.files;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.favorite !== undefined) updateData.favorite = updates.favorite;
      
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('cards')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating card:', error);
        return;
      }

      if (data) {
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id
              ? {
                  ...card,
                  title: data.title,
                  type: data.type,
                  content: data.content,
                  explanation: data.explanation,
                  links: data.links,
                  files: data.files,
                  tags: data.tags,
                  favorite: data.favorite,
                  updatedAt: new Date(data.updated_at)
                }
              : card
          ),
          loading: false
        }));
      }
    } catch (error) {
      console.error('Error updating card:', error);
      set({ loading: false });
    }
  },
  
  deleteCard: async (id) => {
    try {
      set({ loading: true });
      
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting card:', error);
        return;
      }

      set((state) => ({
        cards: state.cards.filter((card) => card.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting card:', error);
      set({ loading: false });
    }
  },
  
  toggleFavorite: async (id) => {
    try {
      const card = get().cards.find(c => c.id === id);
      if (!card) return;

      const { data, error } = await supabase
        .from('cards')
        .update({ 
          favorite: !card.favorite,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error toggling favorite:', error);
        return;
      }

      if (data) {
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id
              ? { 
                  ...card, 
                  favorite: data.favorite, 
                  updatedAt: new Date(data.updated_at) 
                }
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
      
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading cards:', error);
        set({ loading: false });
        return;
      }

      const cards: Card[] = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        title: item.title,
        type: item.type,
        content: item.content,
        explanation: item.explanation,
        links: item.links,
        files: item.files,
        tags: item.tags,
        favorite: item.favorite,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));

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
}));