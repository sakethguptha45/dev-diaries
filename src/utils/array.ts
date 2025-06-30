/**
 * Remove duplicates from an array
 */
export const removeDuplicates = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

/**
 * Remove duplicates from an array of objects by a specific key
 */
export const removeDuplicatesByKey = <T>(array: T[], key: keyof T): T[] => {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

/**
 * Chunk an array into smaller arrays of specified size
 */
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Shuffle an array randomly
 */
export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Group array items by a specific key
 */
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const value = String(item[key]);
    if (!groups[value]) {
      groups[value] = [];
    }
    groups[value].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

/**
 * Sort array by multiple criteria
 */
export const sortBy = <T>(array: T[], ...criteria: ((item: T) => any)[]): T[] => {
  return [...array].sort((a, b) => {
    for (const criterion of criteria) {
      const aValue = criterion(a);
      const bValue = criterion(b);
      
      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
    }
    return 0;
  });
};

/**
 * Find the intersection of two arrays
 */
export const intersection = <T>(array1: T[], array2: T[]): T[] => {
  return array1.filter(item => array2.includes(item));
};

/**
 * Find the difference between two arrays
 */
export const difference = <T>(array1: T[], array2: T[]): T[] => {
  return array1.filter(item => !array2.includes(item));
};

/**
 * Check if two arrays are equal
 */
export const arraysEqual = <T>(array1: T[], array2: T[]): boolean => {
  if (array1.length !== array2.length) return false;
  return array1.every((item, index) => item === array2[index]);
};

/**
 * Flatten a nested array
 */
export const flatten = <T>(array: (T | T[])[]): T[] => {
  return array.reduce<T[]>((flat, item) => {
    return flat.concat(Array.isArray(item) ? flatten(item) : item);
  }, []);
};

/**
 * Get the last n items from an array
 */
export const takeLast = <T>(array: T[], count: number): T[] => {
  return array.slice(-count);
};

/**
 * Get the first n items from an array
 */
export const takeFirst = <T>(array: T[], count: number): T[] => {
  return array.slice(0, count);
};

/**
 * Move an item from one index to another
 */
export const moveItem = <T>(array: T[], fromIndex: number, toIndex: number): T[] => {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
};

/**
 * Create an array of numbers in a range
 */
export const range = (start: number, end: number, step: number = 1): number[] => {
  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
};

/**
 * Get random items from an array
 */
export const sample = <T>(array: T[], count: number = 1): T[] => {
  const shuffled = shuffle(array);
  return shuffled.slice(0, count);
};

/**
 * Partition an array into two arrays based on a predicate
 */
export const partition = <T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] => {
  const truthy: T[] = [];
  const falsy: T[] = [];
  
  array.forEach(item => {
    if (predicate(item)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  });
  
  return [truthy, falsy];
};