import { supabase } from '../lib/supabase';
import { Card } from '../types';

export interface CardCreateData {
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

export interface CardUpdateData {
  title?: string;
  type?: 'note' | 'code' | 'link' | 'file';
  content?: string;
  explanation?: string;
  links?: string[];
  files?: any[];
  tags?: string[];
  favorite?: boolean;
}

export interface CardResponse {
  success: boolean;
  card?: Card;
  cards?: Card[];
  error?: string;
}

export class CardService {
  /**
   * Create a new card
   */
  static async createCard(cardData: CardCreateData): Promise<CardResponse> {
    try {
      const { data, error } = await supabase
        .from('cards')
        .insert({
          user_id: cardData.userId,
          title: cardData.title,
          type: cardData.type,
          content: cardData.content,
          explanation: cardData.explanation,
          links: cardData.links,
          files: cardData.files,
          tags: cardData.tags,
          favorite: cardData.favorite
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating card:', error);
        return { success: false, error: error.message };
      }

      if (data) {
        const card: Card = {
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
        return { success: true, card };
      }

      return { success: false, error: 'No data returned' };
    } catch (error) {
      console.error('Error creating card:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  static async updateCard(id: string, updates: CardUpdateData): Promise<Card | null> {
    try {
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
        return null;
      }

      if (data) {
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
          updatedAt: new Date(data.updated_at)
        };
      }

      return null;
    } catch (error) {
      console.error('Error updating card:', error);
      return null;
    }
  }

  static async deleteCard(id: string): Promise<boolean> {
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

  static async toggleFavorite(id: string, currentFavorite: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cards')
        .update({ 
          favorite: !currentFavorite
          // Don't update updated_at for favorite toggle to preserve original order
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
  }

  static async getUserCards(userId: string): Promise<Card[]> {
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

      if (!data) return [];

      return data.map(item => ({
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
    } catch (error) {
      console.error('Error fetching user cards:', error);
      return [];
    }
  }

  static async getCardById(id: string): Promise<Card | null> {
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

      if (data) {
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
          updatedAt: new Date(data.updated_at)
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching card:', error);
      return null;
    }
  }
}