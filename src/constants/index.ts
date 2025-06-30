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

export const CARD_TYPE_LABELS = {
  [CARD_TYPES.NOTE]: 'Note',
  [CARD_TYPES.CODE]: 'Code',
  [CARD_TYPES.LINK]: 'Link',
  [CARD_TYPES.FILE]: 'File'
} as const;