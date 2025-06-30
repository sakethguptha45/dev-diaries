export interface User {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
  createdAt: Date;
}

export interface Card {
  id: string;
  userId: string;
  title: string;
  type: 'note' | 'code' | 'link' | 'file';
  content: string;
  explanation: string;
  links: string[];
  files: AttachmentFile[];
  tags: string[];
  favorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface SearchResult {
  cards: Card[];
  total: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; needsVerification?: boolean }>;
  logout: () => void;
  initialize: () => Promise<void>;
}

export interface CardState {
  cards: Card[];
  loading: boolean;
  searchQuery: string;
  selectedTags: string[];
  addCard: (card: Omit<Card, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCard: (id: string, updates: Partial<Card>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  searchCards: (query: string) => void;
  filterByTags: (tags: string[]) => void;
  getRecentCards: () => Card[];
  getFavoriteCards: () => Card[];
  getAllTags: () => string[];
  getUserCards: (userId: string) => Card[];
  getCardById: (id: string) => Card | undefined;
  loadUserCards: (userId: string) => Promise<void>;
}