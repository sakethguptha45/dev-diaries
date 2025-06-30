import { VALIDATION } from '../constants';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email.trim()) {
    errors.push('Email is required');
  } else if (!/^\S+@\S+\.\S+$/i.test(email)) {
    errors.push('Invalid email format');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
  } else if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateName = (name: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!name.trim()) {
    errors.push('Name is required');
  } else if (name.trim().length < VALIDATION.MIN_NAME_LENGTH) {
    errors.push(`Name must be at least ${VALIDATION.MIN_NAME_LENGTH} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateCardTitle = (title: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!title.trim()) {
    errors.push('Title is required');
  } else if (title.length > VALIDATION.MAX_TITLE_LENGTH) {
    errors.push(`Title must be less than ${VALIDATION.MAX_TITLE_LENGTH} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateCardContent = (content: string): ValidationResult => {
  const errors: string[] = [];
  
  if (content.length > VALIDATION.MAX_CONTENT_LENGTH) {
    errors.push(`Content must be less than ${VALIDATION.MAX_CONTENT_LENGTH} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateTags = (tags: string[]): ValidationResult => {
  const errors: string[] = [];
  
  if (tags.length > VALIDATION.MAX_TAGS_COUNT) {
    errors.push(`Maximum ${VALIDATION.MAX_TAGS_COUNT} tags allowed`);
  }
  
  tags.forEach((tag, index) => {
    if (tag.length > VALIDATION.MAX_TAG_LENGTH) {
      errors.push(`Tag ${index + 1} is too long (max ${VALIDATION.MAX_TAG_LENGTH} characters)`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};