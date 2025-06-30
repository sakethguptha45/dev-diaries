export interface User {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
  verificationCode?: string;
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
  pendingVerification: boolean;
  verificationEmail: string;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; needsVerification?: boolean }>;
  verifyEmail: (code: string) => Promise<boolean>;
  resendVerification: () => Promise<boolean>;
  logout: () => void;
}

export interface CardState {
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
}