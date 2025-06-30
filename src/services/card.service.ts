import { supabase } from '../lib/supabase';
import { Card } from '../types';

export interface CreateCardData {
  title: string;
  type: 'note' | 'code' | 'link' | 'file';
  content: string;
  explanation: string;
  links: string[];
  files: any[];
  tags: string[];
  favorite: boolean;
  userId: string;
}

export interface UpdateCardData {
  title?: string;
  type?: 'note' | 'code' | 'link' | 'file';
  content?: string;
  explanation?: string;
  links?: string[];
  files?: any[];
  tags?: string[];
  favorite?: boolean;
}

class CardService {
  async getUserCards(userId: string): Promise<Card[]> {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading cards:', error);
        return [];
      }

      return data.map(this.mapDatabaseCardToCard);
    } catch (error) {
      console.error('Error loading cards:', error);
      return [];
    }
  }

  async createCard(cardData: CreateCardData): Promise<Card | null> {
    try {
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
          user_id: cardData.userId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating card:', error);
        return null;
      }

      return this.mapDatabaseCardToCard(data);
    } catch (error) {
      console.error('Error creating card:', error);
      return null;
    }
  }

  async updateCard(id: string, updates: UpdateCardData): Promise<Card | null> {
    try {
      const updateData: any = { ...updates };
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('cards')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating card:', error);
        return null;
      }

      return this.mapDatabaseCardToCard(data);
    } catch (error) {
      console.error('Error updating card:', error);
      return null;
    }
  }

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
  }

  async toggleFavorite(id: string, currentFavorite: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cards')
        .update({ favorite: !currentFavorite })
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
  }

  private mapDatabaseCardToCard(data: any): Card {
    return {
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
      updatedAt: new Date(data.updated_at),
    };
  }
}

export const cardService = new CardService();