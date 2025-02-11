import _ from 'lodash';

/**
 * Checks if a string is a valid UUID
 * Supports UUIDs with or without dashes
 * 
 * @param {string} stringToCheck - The string to validate
 * 
 * @returns {boolean} True if the string is a valid UUID, false otherwise
 */
export const isValidUUID = (stringToCheck) => {
  const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  return regex.test(stringToCheck);
};


/**
 * Checks if a user ID should be excluded based on the exclude list
 * Supports exact matches and pattern matching with wildcards
 * 
 * @param {string} userId - The user ID to check
 * @param {string[]} excludeList - The list of user IDs to exclude
 * 
 * @returns {boolean} True if the user ID should be excluded, false otherwise
 */
export const shouldExcludeUser = (userId, excludeList = []) => {
  if (!userId || !isValidUUID(userId)) return false;
  
  return excludeList.some(pattern => {
    if (pattern === '*') return true;
    if (pattern.includes('*')) {
      const safePattern = _.escapeRegExp(pattern).replace(/\\\*/g, '.*');
      const regex = new RegExp('^' + safePattern + '$');
      return regex.test(userId);
    }
    return pattern === userId;
  });
};