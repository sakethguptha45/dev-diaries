
// App Configuration
export const APP_CONFIG = {
  name: 'Dev Diaries',
  description: 'Your personal knowledge management system',
  version: '1.0.0',
  author: 'Dev Diaries Team'
} as const;

// API Configuration
export const API_CONFIG = {
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000
} as const;

// UI Constants
export const UI_CONFIG = {
  animations: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500
    },
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  }
} as const;

// Card Types

export const ROUTES = {
  HOME: '/',
  EDITOR: '/editor',
  EDITOR_WITH_ID: '/editor/:id',
  AUTH: '/auth'
} as const;


export const CARD_TYPES = {
  NOTE: 'note',
  CODE: 'code',
  LINK: 'link',
  FILE: 'file'
} as const;


// Validation Constants
export const VALIDATION = {
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  card: {
    titleMaxLength: 200,
    contentMaxLength: 50000,
    explanationMaxLength: 1000,
    maxTags: 20,
    maxLinks: 10
  }
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  theme: 'dev-diaries-theme',
  lastSearch: 'dev-diaries-last-search',
  userPreferences: 'dev-diaries-user-preferences'
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  network: 'Network error. Please check your connection and try again.',
  unauthorized: 'You are not authorized to perform this action.',
  notFound: 'The requested resource was not found.',
  serverError: 'Server error. Please try again later.',
  validation: 'Please check your input and try again.',
  sessionExpired: 'Your session has expired. Please sign in again.'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  cardCreated: 'Card created successfully!',
  cardUpdated: 'Card updated successfully!',
  cardDeleted: 'Card deleted successfully!',
  passwordUpdated: 'Password updated successfully!',
  emailVerified: 'Email verified successfully!'
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  AUTH: '/',
  DASHBOARD: '/',
  EDITOR: '/editor',
  EDITOR_WITH_ID: '/editor/:id',
  EMAIL_VERIFICATION: '/verify-email',
  RESET_PASSWORD: '/reset-password'

export const CARD_TYPE_LABELS = {
  [CARD_TYPES.NOTE]: 'Note',
  [CARD_TYPES.CODE]: 'Code',
  [CARD_TYPES.LINK]: 'Link',
  [CARD_TYPES.FILE]: 'File'
} as const;

export const APP_CONFIG = {
  name: 'Dev Diaries',
  description: 'Your personal knowledge management system',
  version: '1.0.0'

} as const;