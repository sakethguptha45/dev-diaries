export const APP_CONFIG = {
  name: 'Dev Diaries',
  description: 'Knowledge Management Made Simple',
  version: '1.0.0',
} as const;

export const ROUTES = {
  HOME: '/',
  EDITOR: '/editor',
  EDITOR_WITH_ID: '/editor/:id',
} as const;

export const CARD_TYPES = {
  NOTE: 'note',
  CODE: 'code',
  LINK: 'link',
  FILE: 'file',
} as const;

export const STORAGE_KEYS = {
  THEME: 'dev-diaries-theme',
  LAST_SEARCH: 'dev-diaries-last-search',
} as const;

export const UI_CONSTANTS = {
  HEADER_HEIGHT: 64,
  SIDEBAR_WIDTH: 280,
  CARD_PREVIEW_HEIGHT: 320,
  MAX_TAGS_VISIBLE: 9,
  CARDS_PER_PAGE: 12,
} as const;

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MIN_NAME_LENGTH: 2,
  MAX_TITLE_LENGTH: 200,
  MAX_CONTENT_LENGTH: 50000,
  MAX_TAG_LENGTH: 50,
  MAX_TAGS_COUNT: 20,
} as const;