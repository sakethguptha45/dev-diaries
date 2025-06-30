import { supabase } from '../lib/supabase';
import { Card, CreateCardData, UpdateCardData } from '../types';

export const cardService = {
  async createCard(cardData: CreateCardData): Promise<Card | null> {
    try {
      const { data, error } = await supabase
        .from('cards')
        .insert([cardData])
        .select()
        .single();

      if (error) {
        console.error('Error creating card:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating card:', error);
      return null;
    }
  },

  async updateCard(id: string, updates: UpdateCardData): Promise<Card | null> {
    try {
      const { data, error } = await supabase
        .from('cards')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating card:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error updating card:', error);
      return null;
    }
  },

  async deleteCard(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting card:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting card:', error);
      return false;
    }
  },

  async toggleFavorite(id: string, currentFavorite: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cards')
        .update({ 
          favorite: !currentFavorite,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error toggling favorite:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  },

  async getUserCards(userId: string): Promise<Card[]> {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching user cards:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user cards:', error);
      return [];
    }
  },

  async getCardById(id: string): Promise<Card | null> {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching card:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching card:', error);
      return null;
    }
  }
};