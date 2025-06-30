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
        return { success: false, error: error.message };
      }

      if (data) {
        const card: Card = this.transformDatabaseCard(data);
        return { success: true, card };
      }

      return { success: false, error: 'Failed to create card' };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Update an existing card
   */
  static async updateCard(id: string, updates: CardUpdateData): Promise<CardResponse> {
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
        return { success: false, error: error.message };
      }

      if (data) {
        const card: Card = this.transformDatabaseCard(data);
        return { success: true, card };
      }

      return { success: false, error: 'Failed to update card' };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Delete a card
   */
  static async deleteCard(id: string): Promise<CardResponse> {
    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Get all cards for a user
   */
  static async getUserCards(userId: string): Promise<CardResponse> {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      const cards: Card[] = data.map(item => this.transformDatabaseCard(item));
      return { success: true, cards };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Get a single card by ID
   */
  static async getCard(id: string): Promise<CardResponse> {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      if (data) {
        const card: Card = this.transformDatabaseCard(data);
        return { success: true, card };
      }

      return { success: false, error: 'Card not found' };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Toggle favorite status of a card
   */
  static async toggleFavorite(id: string): Promise<CardResponse> {
    try {
      // First get the current card to know its favorite status
      const { data: currentCard, error: fetchError } = await supabase
        .from('cards')
        .select('favorite')
        .eq('id', id)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      // Toggle the favorite status
      const { data, error } = await supabase
        .from('cards')
        .update({ 
          favorite: !currentCard.favorite,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      if (data) {
        const card: Card = this.transformDatabaseCard(data);
        return { success: true, card };
      }

      return { success: false, error: 'Failed to toggle favorite' };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Search cards for a user
   */
  static async searchCards(userId: string, query: string): Promise<CardResponse> {
    try {
      const { data, error } = await supabase
        .rpc('search_cards', {
          search_query: query,
          user_uuid: userId
        });

      if (error) {
        return { success: false, error: error.message };
      }

      const cards: Card[] = data.map((item: any) => this.transformDatabaseCard(item));
      return { success: true, cards };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Get favorite cards for a user
   */
  static async getFavoriteCards(userId: string): Promise<CardResponse> {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userId)
        .eq('favorite', true)
        .order('updated_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      const cards: Card[] = data.map(item => this.transformDatabaseCard(item));
      return { success: true, cards };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Get recent cards for a user
   */
  static async getRecentCards(userId: string, limit: number = 10): Promise<CardResponse> {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      const cards: Card[] = data.map(item => this.transformDatabaseCard(item));
      return { success: true, cards };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Get cards by tags for a user
   */
  static async getCardsByTags(userId: string, tags: string[]): Promise<CardResponse> {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userId)
        .overlaps('tags', tags)
        .order('updated_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      const cards: Card[] = data.map(item => this.transformDatabaseCard(item));
      return { success: true, cards };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Get all unique tags for a user
   */
  static async getUserTags(userId: string): Promise<{ success: boolean; tags?: string[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('tags')
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Extract and flatten all tags
      const allTags = data.flatMap(card => card.tags || []);
      const uniqueTags = Array.from(new Set(allTags)).sort();

      return { success: true, tags: uniqueTags };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Transform database card to application Card type
   */
  private static transformDatabaseCard(dbCard: any): Card {
    return {
      id: dbCard.id,
      userId: dbCard.user_id,
      title: dbCard.title,
      type: dbCard.type,
      content: dbCard.content,
      explanation: dbCard.explanation,
      links: dbCard.links || [],
      files: dbCard.files || [],
      tags: dbCard.tags || [],
      favorite: dbCard.favorite,
      createdAt: new Date(dbCard.created_at),
      updatedAt: new Date(dbCard.updated_at)
    };
  }
}