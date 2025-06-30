
import { VALIDATION } from '../constants';

export interface ValidationResult {

  isValid: boolean;
  errors: string[];
}


export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

/**
 * Validate email address
 */
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];

  if (!email) {
    errors.push('Email is required');
  } else if (!VALIDATION.email.pattern.test(email)) {
    errors.push('Please enter a valid email address');
  }


  return {
    isValid: errors.length === 0,
    errors
  };

};

/**
 * Validate password
 */
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < VALIDATION.password.minLength) {
      errors.push(`Password must be at least ${VALIDATION.password.minLength} characters long`);
    }

    if (VALIDATION.password.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (VALIDATION.password.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (VALIDATION.password.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (VALIDATION.password.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get password strength score and details
 */
export const getPasswordStrength = (password: string): PasswordStrength => {
  if (!password) {
    return {
      score: 0,
      label: '',
      color: '',
      requirements: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
      }
    };
  }

  const requirements = {
    length: password.length >= VALIDATION.password.minLength,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const score = Object.values(requirements).filter(Boolean).length;

  const strengthLevels = [
    { label: 'Very Weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-500' },
    { label: 'Fair', color: 'bg-yellow-500' },
    { label: 'Good', color: 'bg-blue-500' },
    { label: 'Strong', color: 'bg-green-500' }
  ];

  return {
    score,
    requirements,
    ...strengthLevels[Math.min(score, 4)]
  };
};

/**
 * Validate card title
 */
export const validateCardTitle = (title: string): ValidationResult => {
  const errors: string[] = [];

  if (!title || !title.trim()) {
    errors.push('Title is required');
  } else if (title.length > VALIDATION.card.titleMaxLength) {
    errors.push(`Title must be less than ${VALIDATION.card.titleMaxLength} characters`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate card content
 */
export const validateCardContent = (content: string): ValidationResult => {
  const errors: string[] = [];

  if (content && content.length > VALIDATION.card.contentMaxLength) {
    errors.push(`Content must be less than ${VALIDATION.card.contentMaxLength} characters`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate card explanation
 */
export const validateCardExplanation = (explanation: string): ValidationResult => {
  const errors: string[] = [];

  if (explanation && explanation.length > VALIDATION.card.explanationMaxLength) {
    errors.push(`Explanation must be less than ${VALIDATION.card.explanationMaxLength} characters`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate card tags
 */
export const validateCardTags = (tags: string[]): ValidationResult => {
  const errors: string[] = [];

  if (tags.length > VALIDATION.card.maxTags) {
    errors.push(`Maximum ${VALIDATION.card.maxTags} tags allowed`);
  }

  // Check for empty tags
  const emptyTags = tags.filter(tag => !tag.trim());
  if (emptyTags.length > 0) {
    errors.push('Tags cannot be empty');
  }

  // Check for duplicate tags
  const uniqueTags = new Set(tags.map(tag => tag.toLowerCase().trim()));
  if (uniqueTags.size !== tags.length) {
    errors.push('Duplicate tags are not allowed');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate card links
 */
export const validateCardLinks = (links: string[]): ValidationResult => {
  const errors: string[] = [];

  if (links.length > VALIDATION.card.maxLinks) {
    errors.push(`Maximum ${VALIDATION.card.maxLinks} links allowed`);
  }

  // Validate URL format
  const urlPattern = /^https?:\/\/.+/;
  const invalidLinks = links.filter(link => link.trim() && !urlPattern.test(link.trim()));
  if (invalidLinks.length > 0) {
    errors.push('All links must be valid URLs starting with http:// or https://');
  }


  return {
    isValid: errors.length === 0,
    errors
  };

};

/**
 * Validate name (for user registration)
 */
export const validateName = (name: string): ValidationResult => {
  const errors: string[] = [];

  if (!name || !name.trim()) {
    errors.push('Name is required');
  } else if (name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  } else if (name.trim().length > 50) {
    errors.push('Name must be less than 50 characters long');
  }


  return {
    isValid: errors.length === 0,
    errors
  };

};

/**
 * Validate confirmation code (OTP)
 */
export const validateConfirmationCode = (code: string): ValidationResult => {
  const errors: string[] = [];

  if (!code || !code.trim()) {
    errors.push('Verification code is required');
  } else if (!/^\d{6}$/.test(code.trim())) {
    errors.push('Verification code must be 6 digits');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize HTML content (basic sanitization)
 */
export const sanitizeHtml = (html: string): string => {
  // This is a basic sanitization - in production, use a proper HTML sanitizer like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

/**
 * Validate and sanitize card data
 */
export const validateCardData = (cardData: {
  title: string;
  content: string;
  explanation: string;
  tags: string[];
  links: string[];
}) => {
  const titleValidation = validateCardTitle(cardData.title);
  const contentValidation = validateCardContent(cardData.content);
  const explanationValidation = validateCardExplanation(cardData.explanation);
  const tagsValidation = validateCardTags(cardData.tags);
  const linksValidation = validateCardLinks(cardData.links);

  const allErrors = [
    ...titleValidation.errors,
    ...contentValidation.errors,
    ...explanationValidation.errors,
    ...tagsValidation.errors,
    ...linksValidation.errors
  ];

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    sanitizedData: {
      title: cardData.title.trim(),
      content: sanitizeHtml(cardData.content),
      explanation: cardData.explanation.trim(),
      tags: cardData.tags.map(tag => tag.trim()).filter(Boolean),
      links: cardData.links.map(link => link.trim()).filter(Boolean)
    }
  };
};

